export type ThemePreference = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "kanji5-theme";

export function getThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
}

export function setThemePreference(theme: ThemePreference): void {
  if (typeof window !== "undefined") window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
      theme === "dark" ? "dark" : theme === "light" ? "light" : "light dark";
  }
}
