export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const localeCookie = "NEXT_LOCALE";

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "fr";
}

export function detectLocale(
  cookie: string | undefined,
  acceptLanguage: string | null,
): Locale {
  if (isLocale(cookie)) return cookie;

  const preferences = (acceptLanguage ?? "").split(",").flatMap((entry) => {
    const [tag, ...parameters] = entry.trim().toLowerCase().split(";");
    const quality = parameters.find((part) => part.trim().startsWith("q="));
    const weight = quality === undefined ? 1 : Number(quality.trim().slice(2));
    const language = tag.split("-")[0];
    return isLocale(language) && weight > 0 && weight <= 1
      ? [{ language, weight }]
      : [];
  });
  return preferences.sort((a, b) => b.weight - a.weight)[0]?.language ?? "en";
}

export function localizedPath(
  pathname: string,
  locale: Locale,
  search = "",
  hash = "",
): string {
  const [, first] = pathname.split("/");
  const rest = isLocale(first) ? pathname.slice(first.length + 1) : pathname;
  return `/${locale}${rest === "/" ? "" : rest}${search}${hash}`;
}
