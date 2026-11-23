import { revalidatePath } from "next/cache";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function request(secret?: string) {
  return new Request("https://portfolio.test/api/revalidate", {
    method: "POST",
    headers: secret === undefined ? {} : { "x-revalidate-secret": secret },
    body: "ignored webhook payload",
  });
}

beforeEach(() => {
  vi.stubEnv("REVALIDATE_SECRET", "configured-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it.each([undefined, "wrong-secret"])(
  "rejects missing or wrong request credentials (%s)",
  (secret) => {
    expect(POST(request(secret)).status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  },
);

it("fails closed when the secret is unconfigured", () => {
  vi.stubEnv("REVALIDATE_SECRET", undefined);
  expect(POST(request()).status).toBe(500);
  expect(revalidatePath).not.toHaveBeenCalled();
});

it("revalidates the homepage with the configured secret and ignores the body", async () => {
  const webhook = request("configured-secret");
  const response = POST(webhook);
  expect(response.status).toBe(200);
  expect(vi.mocked(revalidatePath).mock.calls).toEqual([["/en"], ["/fr"]]);
  expect(webhook.bodyUsed).toBe(false);
  const result: { revalidated: boolean; at: string } = await response.json();
  expect(result).toEqual({
    revalidated: true,
    at: new Date(result.at).toISOString(),
  });
});
