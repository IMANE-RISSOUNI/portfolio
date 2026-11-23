import { type NextRequest, NextResponse } from "next/server";
import {
  detectLocale,
  isLocale,
  localeCookie,
  localizedPath,
} from "./i18n/locales";

export function proxy(request: NextRequest) {
  const [, first] = request.nextUrl.pathname.split("/");
  if (isLocale(first) || /^[a-z]{2}(?:-[a-z]{2})?$/i.test(first)) return;

  const locale = detectLocale(
    request.cookies.get(localeCookie)?.value,
    request.headers.get("accept-language"),
  );
  const url = request.nextUrl.clone();
  url.pathname = localizedPath(url.pathname, locale);

  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}

export const config = {
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|.*\\.).*)"],
};
