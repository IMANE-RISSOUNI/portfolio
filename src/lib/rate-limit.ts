import "server-only";
import { isIP } from "node:net";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Decision = { allowed: boolean; retryAfter: number };
type Check = (ip: string) => Promise<Decision>;
const minute = 60_000;
const day = 86_400_000;

export function requestIp(headers: Headers): string {
  const first = headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ?? "";
  return isIP(first) ? first.toLowerCase() : "unknown";
}

export function createMemoryLimiter(now = Date.now) {
  const requests = new Map<string, number[]>();
  let total: number[] = [];

  return (ip: string): Decision => {
    const time = now();
    total = total.filter((at) => at > time - day);
    if (total.length >= 300) return denied(total[0] + day, time);

    for (const [key, times] of requests) {
      if (times[times.length - 1] <= time - day) requests.delete(key);
    }
    const recent = (requests.get(ip) ?? []).filter((at) => at > time - day);
    const thisMinute = recent.filter((at) => at > time - minute);
    if (thisMinute.length >= 5) return denied(thisMinute[0] + minute, time);
    if (recent.length >= 40) return denied(recent[0] + day, time);

    requests.set(ip, [...recent, time]);
    total.push(time);
    return { allowed: true, retryAfter: 0 };
  };
}

function denied(reset: number, now = Date.now()): Decision {
  return {
    allowed: false,
    retryAfter: Math.max(1, Math.ceil((reset - now) / 1_000)),
  };
}

export function withMemoryFallback(
  makeCheck: () => Check | null,
  memory = createMemoryLimiter(),
): Check {
  let warned = false;
  let distributed: Check | null | undefined;
  return async (ip) => {
    try {
      distributed ??= makeCheck();
      if (distributed) return await distributed(ip);
    } catch {
      // A failed or timed-out Redis check is handled by the local limiter.
    }
    if (!warned) {
      console.warn(
        "[chat] Redis rate limiting unavailable. Using per-instance limits.",
      );
      warned = true;
    }
    return memory(ip);
  };
}

function createDistributedCheck(): Check | null {
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } =
    process.env;
  if (!url || !token) return null;
  const redis = new Redis({
    url,
    token,
    retry: false,
    signal: () => AbortSignal.timeout(2_000),
  });
  const perMinute = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(8, "1 m"),
    prefix: "portfolio:chat:minute",
    timeout: 0,
  });
  const perDay = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(40, "1 d"),
    prefix: "portfolio:chat:day",
    timeout: 0,
  });
  const global = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(300, "1 d"),
    prefix: "portfolio:chat:global",
    timeout: 0,
  });

  return async (ip) => {
    for (const [limiter, key] of [
      [perMinute, ip],
      [perDay, ip],
      [global, "site"],
    ] as const) {
      const result = await limiter.limit(key);
      if (!result.success) return denied(result.reset);
    }
    return { allowed: true, retryAfter: 0 };
  };
}

export const checkChatLimit = withMemoryFallback(createDistributedCheck);
