import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { AccountApi } from "./account";
import type { Language } from "./i18n";

const CONFIRMATION_PHRASE = "DELETE";

declare global {
  interface Window {
    __KANJI5_ACCOUNT__?: AccountApi;
    KANJI5_SUPABASE?: { url?: string; anonKey?: string };
  }
}

function currentSupabaseAuthStorageKeys(): Set<string> {
  try {
    const configuredUrl = window.KANJI5_SUPABASE?.url;
    if (!configuredUrl) return new Set();
    const hostname = new URL(configuredUrl).hostname.toLowerCase();
    if (!hostname.endsWith(".supabase.co")) return new Set();
    const projectRef = hostname.slice(0, -".supabase.co".length);
    if (!projectRef || !/^[a-z0-9-]+$/.test(projectRef)) return new Set();
    return new Set([
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-auth-token-code-verifier`,
    ]);
  } catch {
    return new Set();
  }
}

function removeMatchingStorageKeys(storage: Storage, shouldRemove: (key: string) => boolean): boolean {
  try {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && shouldRemove(key)) keys.push(key);
    }

    let failed = false;
    for (const key of keys) {
      try {
        storage.removeItem(key);
      } catch {
        failed = true;
      }
    }
    return failed;
  } catch {
    return true;
  }
}

export function LocalDataErasure({ language }: { language: Language }) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const isPersian = language === "fa";

  useEffect(() => {
    if (!confirmationOpen) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [confirmationOpen]);

  const dismissConfirmation = () => {
    setConfirmationOpen(false);
    setConfirmationText("");
    window.requestAnimationFrame(() => {
      if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true });
    });
  };

  const handleConfirmationKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (!busy) dismissConfirmation();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      "input:not(:disabled), button:not(:disabled)"
    ) ?? []);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const eraseLocalData = async () => {
    if (confirmationText !== CONFIRMATION_PHRASE || busy) return;
    setBusy(true);
    setError("");

    const authStorageKeys = currentSupabaseAuthStorageKeys();
    let hasLocalAuthSession = false;
    try {
      hasLocalAuthSession = Array.from(authStorageKeys).some(key => window.localStorage.getItem(key) !== null);
    } catch {
      // The guarded removal below will surface a storage error if the browser blocks storage access.
    }

    const accountApi = window.__KANJI5_ACCOUNT__;
    if (hasLocalAuthSession && accountApi?.signOutLocal) {
      try {
        // Explicitly sign out only this browser session; never invalidate other devices.
        await accountApi.signOutLocal();
      } catch {
        // Continue with removal of this browser's persisted auth keys as a local fallback.
      }
    }

    const failed = new Set<string>();
    try {
      if (removeMatchingStorageKeys(window.localStorage, key =>
        key.startsWith("kanji5-") || key === "v19RecoveryState" || authStorageKeys.has(key)
      )) {
        failed.add("local");
      }
    } catch {
      failed.add("local");
    }
    try {
      if (removeMatchingStorageKeys(window.sessionStorage, key =>
        key.startsWith("kanji5-") || key === "v19RecoveryState"
      )) {
        failed.add("session");
      }
    } catch {
      failed.add("session");
    }

    try {
      if (typeof window.caches !== "undefined") {
        const cacheNames = await window.caches.keys();
        const apiCaches = cacheNames.filter(name => name.startsWith("kanji5-api-"));
        for (const name of apiCaches) {
          try {
            await window.caches.delete(name);
            if ((await window.caches.keys()).includes(name)) failed.add("cache");
          } catch {
            failed.add("cache");
          }
        }
      }
    } catch {
      failed.add("cache");
    }

    if (failed.size) {
      setBusy(false);
      setError(isPersian
        ? "بخشی از داده‌های محلی پاک نشد. از تنظیمات مرورگر، داده‌های سایت را بررسی و پاک کن؛ حساب و داده‌های ابری تغییر نکرده‌اند."
        : "Some local data could not be removed. Use your browser's site-data settings to finish clearing this site's data. Your account and cloud data were not deleted.");
      return;
    }

    // Keep the public app shell and kanji datasets cached so guest learning can still work offline.
    window.location.replace(new URL("./", window.location.href).toString());
  };

  return (
    <section className="settings-danger-zone settings-local-data-erasure" aria-labelledby="settings-local-erasure-title">
      <div className="settings-local-data-heading">
        <strong id="settings-local-erasure-title">{isPersian ? "پاک‌کردن داده‌های این مرورگر" : "Clear data from this browser"}</strong>
        <p>
          {isPersian
            ? "پیشرفت، سابقهٔ مرور، یادسپارهای شخصی، متن و یادداشت‌های Reading Lab، تنظیمات و نشست ورود این مرورگر پاک می‌شوند. حساب و داده‌های همگام‌سازی‌شدهٔ ابری حذف نمی‌شوند و ممکن است با ورود دوباره بازگردند."
            : "Clears this browser's learning progress, review history, personal mnemonics, Reading Lab text and notes, settings, and local sign-in session. It does not delete your account or synced cloud data; those may return if you sign in again."}
        </p>
        <p>
          {isPersian
            ? "پیش از ادامه، از داده‌های قابل‌پشتیبان خروجی بگیر. پشتیبان فعلی متن و یادداشت‌های Reading Lab یا نشست ورود را شامل نمی‌شود."
            : "Export the supported backup first if you need it. The current backup does not include Reading Lab text/notes or your sign-in session."}
        </p>
      </div>

      {confirmationOpen ? (
        <div
          ref={dialogRef}
          className="settings-local-data-confirmation"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="settings-local-data-confirm-title"
          aria-describedby="settings-local-data-confirm-hint"
          onKeyDown={handleConfirmationKeyDown}
        >
          <strong id="settings-local-data-confirm-title">
            {isPersian ? "این کار قابل بازگشت نیست" : "This cannot be undone"}
          </strong>
          <p id="settings-local-data-confirm-hint">
            {isPersian
              ? "این کار فقط داده‌های همین مرورگر و نشست ورود همین دستگاه را پاک می‌کند؛ حساب و نسخهٔ ابری دست‌نخورده می‌مانند. برای تأیید، عبارت DELETE را دقیقاً وارد کن."
              : "This clears this browser only. Your account and cloud copy remain unchanged. Type DELETE exactly to confirm."}
          </p>
          <label className="settings-local-data-confirm-label" htmlFor="settings-local-data-confirm-input">
            {isPersian ? "عبارت تأیید" : "Confirmation phrase"}
          </label>
          <input
            ref={inputRef}
            id="settings-local-data-confirm-input"
            className="settings-local-data-confirm-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={confirmationText}
            onChange={event => setConfirmationText(event.target.value)}
            disabled={busy}
            aria-describedby="settings-local-data-confirm-hint"
          />
          <div className="settings-danger-actions">
            <button className="button secondary" type="button" onClick={dismissConfirmation} disabled={busy}>
              {isPersian ? "انصراف" : "Cancel"}
            </button>
            <button
              className="button danger"
              type="button"
              onClick={() => void eraseLocalData()}
              disabled={busy || confirmationText !== CONFIRMATION_PHRASE}
            >
              {busy ? "…" : (isPersian ? "پاک‌کردن داده‌های این مرورگر" : "Erase this browser's data")}
            </button>
          </div>
        </div>
      ) : (
        <button
          ref={triggerRef}
          className="settings-reset-trigger"
          type="button"
          onClick={() => {
            setError("");
            setConfirmationText("");
            setConfirmationOpen(true);
          }}
          disabled={busy}
        >
          <span>{isPersian ? "پاک‌کردن همهٔ داده‌های محلی" : "Erase local data"}</span>
          <span aria-hidden="true">›</span>
        </button>
      )}
      {error ? <p className="settings-local-data-error" role="alert">{error}</p> : null}
    </section>
  );
}
