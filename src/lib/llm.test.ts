import { afterEach, expect, it, vi } from "vitest";
import { streamCompletion } from "./llm";

vi.mock("server-only", () => ({}));

const config = {
  baseUrl: "https://provider.test/v1/",
  apiKey: "test-key",
  model: "test-model",
};

async function collect() {
  const chunks: string[] = [];
  for await (const chunk of streamCompletion(
    config,
    "system rules",
    [{ role: "user", content: "question" }],
    new AbortController().signal,
  )) {
    chunks.push(chunk);
  }
  return chunks;
}

afterEach(() => vi.unstubAllGlobals());

it("parses split SSE events and ignores malformed data and metadata", async () => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(
    ': keep-alive\r\n\r\ndata: {"choices":[{"delta":{"content":"Café"}}]}\r\n\r\ndata: broken\n\ndata: {"choices":[{"delta":{}}]}\n\ndata: {"choices":[{"delta":{"content":" au lait"}}]}\n\ndata: [DONE]\n\n',
  );
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
            controller.close();
          },
        }),
      ),
  );
  vi.stubGlobal("fetch", fetchMock);
  await expect(collect()).resolves.toEqual(["Café", " au lait"]);
  expect(fetchMock).toHaveBeenCalledWith(
    "https://provider.test/v1/chat/completions",
    expect.objectContaining({
      method: "POST",
      signal: expect.any(AbortSignal),
    }),
  );
});

it.each([
  [502, "private downstream response", "Provider rejected the request"],
  [
    200,
    'data: {"error":{"message":"private downstream response"}}\n\n',
    "Provider sent a stream error",
  ],
  [200, "", "Provider stream ended without a completion marker"],
])("surfaces a safe failure for HTTP %d", async (status, body, reason) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body, { status })),
  );
  await expect(collect()).rejects.toThrow(new Error(reason));
});
