import { expect, it } from "vitest";
import { nextTheme, resolveTheme, themeMode } from "./theme";

it("cycles light to dark to system to light", () => {
  expect(nextTheme("light")).toBe("dark");
  expect(nextTheme("dark")).toBe("system");
  expect(nextTheme("system")).toBe("light");
});

it("honors explicit modes and follows the OS in system mode", () => {
  expect(themeMode(null)).toBe("system");
  expect(themeMode("invalid")).toBe("system");
  expect(resolveTheme("light", true)).toBe("light");
  expect(resolveTheme("dark", false)).toBe("dark");
  expect(resolveTheme("system", true)).toBe("dark");
  expect(resolveTheme("system", false)).toBe("light");
});
