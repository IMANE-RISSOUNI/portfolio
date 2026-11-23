import { expect, it } from "vitest";
import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import { detectLocale, localizedPath } from "./locales";

it("prefers a supported cookie to Accept-Language", () => {
  expect(detectLocale("en", "fr-FR,fr;q=0.9,en;q=0.8")).toBe("en");
  expect(detectLocale("fr", "en-US")).toBe("fr");
});

it("negotiates regional tags and weights, and defaults to English", () => {
  expect(detectLocale(undefined, "fr-FR,fr;q=0.9,en;q=0.8")).toBe("fr");
  expect(detectLocale("de", "fr;q=0.5,en;q=0.8")).toBe("en");
  expect(detectLocale(undefined, "fr;q=0,en;q=0.5")).toBe("en");
  expect(detectLocale(undefined, "es-MX,de;q=0.8")).toBe("en");
});

it("replaces just the locale prefix while preserving the query and hash", () => {
  expect(localizedPath("/en", "fr", "?ref=nav", "#about")).toBe(
    "/fr?ref=nav#about",
  );
  expect(localizedPath("/fr/details", "en", "", "#projects")).toBe(
    "/en/details#projects",
  );
  expect(localizedPath("/", "fr")).toBe("/fr");
});

function keys(dictionary: Record<string, unknown>): string[] {
  return Object.entries(dictionary)
    .flatMap(([key, value]) =>
      typeof value === "object" && value !== null
        ? keys(value as Record<string, unknown>).map(
            (child) => `${key}.${child}`,
          )
        : [key],
    )
    .sort();
}

it("keeps identical dictionary keys in both languages", () => {
  expect(keys(fr)).toEqual(keys(en));
});
