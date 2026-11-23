"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import {
  nextTheme,
  resolveTheme,
  themeMode,
  themeQuery,
  type ThemeMode,
} from "../../lib/theme";

let selectedMode: ThemeMode | undefined;
const eventName = "portfolio:theme";

function getMode(): ThemeMode {
  if (selectedMode) return selectedMode;
  try {
    return themeMode(localStorage.getItem("theme"));
  } catch {
    return "system";
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("storage", callback);
  };
}

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {mode === "light" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" />
        </>
      )}
      {mode === "dark" && (
        <path d="M20.8 14.5A9 9 0 0 1 9.5 3.2 9 9 0 1 0 20.8 14.5Z" />
      )}
      {mode === "system" && (
        <>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M12 17v4m-4 0h8" />
        </>
      )}
    </svg>
  );
}

export function ThemeToggle({ text }: { text: Dictionary["theme"] }) {
  const mode = useSyncExternalStore(
    subscribe,
    getMode,
    () => "system" as const,
  );
  const next = nextTheme(mode);

  useEffect(() => {
    const media = window.matchMedia(themeQuery);
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(
        getMode(),
        media.matches,
      );
    };
    apply();
    if (mode !== "system") return;

    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);

  return (
    <button
      type="button"
      className="nav-icon"
      aria-label={`${text.label}: ${text[mode]}. ${text.next} ${text[next]}.`}
      onClick={() => {
        try {
          localStorage.setItem("theme", next);
          selectedMode = undefined;
        } catch {
          selectedMode = next;
        }
        document.documentElement.dataset.theme = resolveTheme(
          next,
          window.matchMedia(themeQuery).matches,
        );
        window.dispatchEvent(new Event(eventName));
      }}
    >
      <ThemeIcon mode={mode} />
    </button>
  );
}
