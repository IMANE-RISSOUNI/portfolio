function parseOrigin(value: string): URL | null {
  if (!/^https?:\/\/[^/?#\\\s]+$/i.test(value)) return null;

  try {
    const url = new URL(value);
    return url.username || url.password || value.includes("@") ? null : url;
  } catch {
    return null;
  }
}

export function originAllowed(headers: Headers): boolean {
  const value = headers.get("origin");
  if (value === null) return true;

  const origin = parseOrigin(value);
  if (!origin) return false;

  // A forwarded host is only a fallback when the platform omits Host.
  const host = headers.get("host") ?? headers.get("x-forwarded-host");
  if (
    host &&
    parseOrigin(`${origin.protocol}//${host}`)?.host === origin.host
  ) {
    return true;
  }

  const allowed = [
    process.env.SITE_URL ?? "",
    ...(process.env.ALLOWED_ORIGINS ?? "").split(","),
  ];
  return (
    allowed.some(
      (entry) =>
        parseOrigin(entry.trim().replace(/\/+$/, ""))?.origin === origin.origin,
    ) ||
    (process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname))
  );
}
