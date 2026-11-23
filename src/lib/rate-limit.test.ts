import { afterEach, expect, it, vi } from "vitest";
import {
  createMemoryLimiter,
  requestIp,
  withMemoryFallback,
} from "./rate-limit";

vi.mock("server-only", () => ({}));

afterEach(() => vi.restoreAllMocks());

it("falls back to a strict IP limit when Redis throws and recovers after a minute", async () => {
  let now = 0;
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const limit = withMemoryFallback(
    () => async () => {
      throw new Error("private Redis detail");
    },
    createMemoryLimiter(() => now),
  );

  for (let i = 0; i < 5; i++)
    expect((await limit("192.0.2.1")).allowed).toBe(true);
  await expect(limit("192.0.2.1")).resolves.toEqual({
    allowed: false,
    retryAfter: 60,
  });
  expect((await limit("192.0.2.2")).allowed).toBe(true);
  now = 60_000;
  expect((await limit("192.0.2.1")).allowed).toBe(true);
  expect(warn).toHaveBeenCalledExactlyOnceWith(
    "[chat] Redis rate limiting unavailable. Using per-instance limits.",
  );
});

it("uses local limits when Redis is missing", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const limit = withMemoryFallback(() => null);
  for (let i = 0; i < 5; i++)
    expect((await limit("unknown")).allowed).toBe(true);
  expect((await limit("unknown")).allowed).toBe(false);
});

it("uses the first valid forwarded IP or a shared fallback", () => {
  expect(
    requestIp(new Headers({ "x-forwarded-for": "2001:db8::1, 192.0.2.2" })),
  ).toBe("2001:db8::1");
  expect(
    requestIp(new Headers({ "x-forwarded-for": "nonsense, 192.0.2.2" })),
  ).toBe("unknown");
  expect(requestIp(new Headers())).toBe("unknown");
});
