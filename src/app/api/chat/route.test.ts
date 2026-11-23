import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readContentFile } from "../../../lib/content-file";
import { checkChatLimit } from "../../../lib/rate-limit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("../../../lib/content", () => ({
  getContent: () => readContentFile(),
}));
vi.mock("../../../lib/rate-limit", () => ({
  checkChatLimit: vi.fn(),
  requestIp: () => "192.0.2.1",
}));

const user = { role: "user", content: "  What are your skills?  " };

function request(
  body: unknown,
  origin: string | null = "https://portfolio.test",
  hostHeaders: Record<string, string> = {},
) {
  const headers = new Headers(hostHeaders);
  if (origin !== null) headers.set("origin", origin);
  return new Request("https://portfolio.test/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("SITE_URL", "https://portfolio.test");
  vi.stubEnv("ALLOWED_ORIGINS", undefined);
  vi.stubEnv("LLM_BASE_URL", "https://provider.test/v1");
  vi.stubEnv("LLM_API_KEY", "test-key");
  vi.stubEnv("LLM_MODEL", "test-model");
  vi.mocked(checkChatLimit).mockResolvedValue({ allowed: true, retryAfter: 0 });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it.each([
  { messages: [] },
  { messages: Array.from({ length: 11 }, () => user) },
  { messages: [{ ...user, content: "a".repeat(501) }] },
  { messages: [{ ...user, content: "  " }] },
  { messages: [{ ...user, role: "assistant" }] },
  { messages: [{ ...user, role: "system" }] },
  { messages: [{ ...user, extra: true }] },
  { messages: [user], extra: true },
])("rejects invalid request bodies (%#)", async (body) => {
  expect((await POST(request(body))).status).toBe(400);
  expect(checkChatLimit).not.toHaveBeenCalled();
});

it.each([
  [
    "alternate host",
    "https://alternate.test",
    { host: "alternate.test", "x-forwarded-host": "proxy.test" },
  ],
  [
    "network host and port",
    "http://172.18.96.1:3000",
    { host: "172.18.96.1:3000" },
  ],
  [
    "forwarded host when Host is absent",
    "https://alternate.test",
    { "x-forwarded-host": "alternate.test" },
  ],
  ["allow-listed origin", "https://extra.test", { host: "portfolio.test" }],
  [
    "configured site origin",
    "https://portfolio.test",
    { host: "alternate.test" },
  ],
  ["missing Origin", null, { host: "portfolio.test" }],
] satisfies [string, string | null, Record<string, string>][])(
  "allows %s through the origin check",
  async (_scenario, origin, hostHeaders) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOWED_ORIGINS", " , https://extra.test/ , ");
    vi.stubEnv("LLM_API_KEY", undefined);
    const response = await POST(
      request({ messages: [user] }, origin, hostHeaders),
    );
    expect(response.status).toBe(503);
    expect(checkChatLimit).toHaveBeenCalledOnce();
  },
);

it.each([
  ["unrelated origin", "https://evil.example", { host: "alternate.test" }],
  [
    "spoofed forwarded host",
    "https://evil.example",
    { host: "alternate.test", "x-forwarded-host": "evil.example" },
  ],
  [
    "wrong port",
    "https://alternate.test:9040",
    { host: "alternate.test:9030" },
  ],
  ["malformed origin", "not-a-url", { host: "alternate.test" }],
  [
    "URL with a path",
    "https://alternate.test/path",
    { host: "alternate.test" },
  ],
] satisfies [string, string, Record<string, string>][])(
  "rejects %s before rate limiting",
  async (_scenario, origin, hostHeaders) => {
    const response = await POST(
      request({ messages: [user] }, origin, hostHeaders),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(checkChatLimit).not.toHaveBeenCalled();
  },
);

it.each(["http://localhost:3000", "http://127.0.0.1:3000"])(
  "allows %s as an unrelated origin only outside production",
  async (origin) => {
    vi.stubEnv("LLM_API_KEY", undefined);
    const incoming = () =>
      request({ messages: [user] }, origin, { host: "portfolio.test" });
    vi.stubEnv("NODE_ENV", "development");
    expect((await POST(incoming())).status).toBe(503);
    vi.stubEnv("NODE_ENV", "production");
    expect((await POST(incoming())).status).toBe(403);
  },
);

it("bounds the streamed request body even without a Content-Length header", async () => {
  expect(
    (
      await POST(
        request({ messages: [{ ...user, content: "a".repeat(11_000) }] }),
      )
    ).status,
  ).toBe(413);
});

it("responds with a retry delay when rate limited", async () => {
  vi.mocked(checkChatLimit).mockResolvedValue({
    allowed: false,
    retryAfter: 34,
  });
  const response = await POST(request({ messages: [user] }));
  expect(response.status).toBe(429);
  expect(response.headers.get("Retry-After")).toBe("34");
});

it("returns a generic failure when credentials are missing", async () => {
  vi.stubEnv("LLM_API_KEY", undefined);
  const response = await POST(request({ messages: [user] }));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "unavailable" });
});

it("returns a generic failure when the provider fails before streaming", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () => new Response("private upstream information", { status: 502 }),
    ),
  );
  const response = await POST(request({ messages: [user] }));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "unavailable" });
});

it("streams plain text, forwarding only the system prompt and validated messages", async () => {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: {"choices":[{"delta":{"content":" there"}}]}\n\ndata: [DONE]\n\n',
      ),
  );
  vi.stubGlobal("fetch", fetchMock);
  const response = await POST(request({ messages: [user] }));
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toContain("text/plain");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.text()).toBe("Hello there");
  const body: unknown = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
  expect(body).toMatchObject({
    messages: [
      { role: "system", content: expect.stringContaining("Portfolio data:") },
      { role: "user", content: "What are your skills?" },
    ],
    stream: true,
    temperature: 0.3,
    max_tokens: 400,
  });
});
