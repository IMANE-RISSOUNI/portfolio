export type ThemeMode = "light" | "dark" | "system";
export const themeQuery = "(prefers-color-scheme: dark)";

export function themeMode(value: string | null): ThemeMode {
  return value === "light" || value === "dark" ? value : "system";
}

export function nextTheme(mode: ThemeMode): ThemeMode {
  const next: Record<ThemeMode, ThemeMode> = {
    light: "dark",
    dark: "system",
    system: "light",
  };
  return next[mode];
}

export function resolveTheme(mode: ThemeMode, dark: boolean): "light" | "dark" {
  return mode === "system" ? (dark ? "dark" : "light") : mode;
}

export const themeScript = `(()=>{let mode;try{mode=localStorage.getItem("theme")}catch{}document.documentElement.dataset.theme=mode==="light"||mode==="dark"?mode:matchMedia("${themeQuery}").matches?"dark":"light"})()`;
