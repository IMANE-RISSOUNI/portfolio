import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { locales } from "../../../i18n/locales";

function digest(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function POST(request: Request): Response {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Revalidation is not configured" },
      { status: 500 },
    );
  }

  const supplied = request.headers.get("x-revalidate-secret") ?? "";
  if (!timingSafeEqual(digest(supplied), digest(secret))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  for (const locale of locales) revalidatePath(`/${locale}`);
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
