import { z } from "zod";
import { getContent } from "../../../lib/content";
import { getLlmConfig, LlmError, streamCompletion } from "../../../lib/llm";
import { buildSystemPrompt } from "../../../lib/prompt";
import { checkChatLimit, requestIp } from "../../../lib/rate-limit";
import { siteUrl } from "../../site-url";

export const runtime = "nodejs";

const maxBytes = 10 * 1024;
const chatBody = z.strictObject({
  messages: z
    .array(
      z.strictObject({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(500),
      }),
    )
    .min(1)
    .max(10)
    .refine((messages) => messages.at(-1)?.role === "user"),
});

class BodyTooLarge extends Error {}

function originAllowed(origin: string | null): boolean {
  if (origin === null || (process.env.SITE_URL && origin === siteUrl))
    return true;
  if (process.env.NODE_ENV !== "development") return false;

  try {
    const url = new URL(origin);
    return (
      url.origin === origin &&
      ["http:", "https:"].includes(url.protocol) &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new BodyTooLarge();
  if (!request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return JSON.parse(text + decoder.decode());
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new BodyTooLarge();
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

const headers = { "Cache-Control": "no-store" };

function unavailable(reason: string) {
  console.warn(`[chat] ${reason}`);
  return Response.json({ error: "unavailable" }, { status: 503, headers });
}

export async function POST(request: Request): Promise<Response> {
  if (!originAllowed(request.headers.get("origin"))) {
    return Response.json({ error: "Forbidden" }, { status: 403, headers });
  }

  const body = await readBody(request).catch((error: unknown) =>
    error instanceof BodyTooLarge ? error : null,
  );
  if (body instanceof BodyTooLarge) {
    return Response.json(
      { error: "Chat request is too large" },
      { status: 413, headers },
    );
  }
  const parsed = chatBody.safeParse(body);
  // Read the body separately so an oversized stream can be distinguished from invalid JSON.
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid chat request" },
      { status: 400, headers },
    );
  }

  const limit = await checkChatLimit(requestIp(request.headers));
  if (!limit.allowed) {
    return Response.json(
      { error: "You're sending messages too fast. Try again in a minute." },
      {
        status: 429,
        headers: { ...headers, "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  const config = getLlmConfig();
  if (!config) return unavailable("LLM is not configured");

  try {
    const prompt = buildSystemPrompt(await getContent());
    const abort = new AbortController();
    const chunks = streamCompletion(
      config,
      prompt,
      parsed.data.messages,
      AbortSignal.any([request.signal, abort.signal]),
    );
    const first = await chunks.next();
    if (first.done) return unavailable("Provider produced no text");

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(first.value));
      },
      async pull(controller) {
        try {
          const next = await chunks.next();
          if (next.done) controller.close();
          else controller.enqueue(encoder.encode(next.value));
        } catch {
          console.warn("[chat] Provider stream interrupted");
          controller.error(new Error("Assistant unavailable"));
        }
      },
      async cancel() {
        abort.abort();
        await chunks.return(undefined).catch(() => {});
      },
    });

    return new Response(body, {
      headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    return unavailable(
      error instanceof LlmError
        ? error.message
        : "Could not prepare the chat response",
    );
  }
}
