import type { MetadataRoute } from "next";
import { locales } from "@/i18n/locales";
import { localeAlternates } from "./site-url";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: localeAlternates[locale],
    alternates: { languages: localeAlternates },
  }));
}
