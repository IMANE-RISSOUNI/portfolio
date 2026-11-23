import "server-only";
import { z } from "zod";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export class LlmError extends Error {}

const providerEvent = z.object({
  error: z.unknown().optional(),
  choices: z
    .array(
      z.object({
        delta: z.object({ content: z.unknown() }).optional(),
      }),
    )
    .optional(),
});

export function getLlmConfig() {
  const { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } = process.env;
  return LLM_BASE_URL && LLM_API_KEY && LLM_MODEL
    ? { baseUrl: LLM_BASE_URL, apiKey: LLM_API_KEY, model: LLM_MODEL }
    : null;
}

function parseEvent(data: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(data);
    const event = providerEvent.safeParse(parsed);
    if (!event.success) return undefined;
    if (event.data.error) throw new LlmError("Provider sent a stream error");
    const content = event.data.choices?.[0]?.delta?.content;
    return typeof content === "string" ? content : undefined;
  } catch (error) {
    if (error instanceof LlmError) throw error;
    return undefined;
  }
}

async function* readEvents(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let data: string[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += done
        ? decoder.decode() + "\n\n"
        : decoder.decode(value, { stream: true });
      let newline = pending.indexOf("\n");
      while (newline !== -1) {
        const line = pending.slice(0, newline).replace(/\r$/, "");
        pending = pending.slice(newline + 1);
        if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
        if (line === "" && data.length) {
          const event = data.join("\n");
          data = [];
          if (event === "[DONE]") return;
          const content = parseEvent(event);
          if (content) yield content;
        }
        newline = pending.indexOf("\n");
      }
      if (done)
        throw new LlmError("Provider stream ended without a completion marker");
      if (pending.length + data.join("").length > 65_536) {
        throw new LlmError("Provider event exceeded the size limit");
      }
    }
  } finally {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function* streamCompletion(
  config: NonNullable<ReturnType<typeof getLlmConfig>>,
  systemPrompt: string,
  messages: ChatMessage[],
  requestSignal: AbortSignal,
): AsyncGenerator<string> {
  try {
    const response = await fetch(
      `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.any([requestSignal, AbortSignal.timeout(20_000)]),
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
          temperature: 0.3,
          max_tokens: 400,
        }),
      },
    );
    if (!response.ok || !response.body) {
      await response.body?.cancel().catch(() => {});
      throw new LlmError("Provider rejected the request");
    }
    yield* readEvents(response.body);
  } catch (error) {
    if (error instanceof LlmError) throw error;
    throw new LlmError("Provider connection failed or timed out");
  }
}
