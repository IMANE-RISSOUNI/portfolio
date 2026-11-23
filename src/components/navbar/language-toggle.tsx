"use client";

import { type Locale, localeCookie, localizedPath } from "../../i18n/locales";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function LanguageToggle({
  locale,
  text,
}: {
  locale: Locale;
  text: Dictionary["language"];
}) {
  function switchLanguage() {
    const target = locale === "en" ? "fr" : "en";
    const { pathname, search, hash, protocol } = window.location;
    document.cookie = `${localeCookie}=${target}; Max-Age=31536000; Path=/; SameSite=Lax${protocol === "https:" ? "; Secure" : ""}`;
    window.location.assign(localizedPath(pathname, target, search, hash));
  }

  return (
    <button
      type="button"
      className="nav-icon"
      aria-label={text.switchTo}
      onClick={switchLanguage}
    >
      {text.code}
    </button>
  );
}
