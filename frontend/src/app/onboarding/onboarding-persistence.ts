import type { OnboardingProgress } from "./onboarding-model";
import { sanitizeOnboardingProgress } from "./onboarding-model";

const COMPLETE_KEY = "kanji5-onboarding-v2";
const PROGRESS_KEY = "kanji5-onboarding-progress-v2";
const LEGACY_COMPLETE_KEY = "kanji5-public-onboarding-v1";
const ALT_COMPLETE_KEYS = ["kanji5-onboarding-complete", "kanji5-onboarding-seen"];

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function write(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, value); } catch {}
}

function remove(key: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(key); } catch {}
}

export function isOnboardingComplete(): boolean {
  return read(COMPLETE_KEY) === "complete" || read(LEGACY_COMPLETE_KEY) === "seen" || ALT_COMPLETE_KEYS.some(key => read(key) === "complete" || read(key) === "seen" || read(key) === "true");
}

export function readOnboardingProgress(): OnboardingProgress | null {
  const raw = read(PROGRESS_KEY);
  if (!raw) return null;
  try { return sanitizeOnboardingProgress(JSON.parse(raw)); }
  catch { remove(PROGRESS_KEY); return null; }
}

export function writeOnboardingProgress(progress: OnboardingProgress): void {
  write(PROGRESS_KEY, JSON.stringify(progress));
}

export function completeOnboarding(): void {
  write(COMPLETE_KEY, "complete");
  remove(PROGRESS_KEY);
}

export function resetOnboarding(): void {
  remove(COMPLETE_KEY);
  remove(PROGRESS_KEY);
}
