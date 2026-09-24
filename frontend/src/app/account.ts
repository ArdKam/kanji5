export type AccountUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export type AccountStatus = "loading" | "signed-out" | "signed-in" | "unavailable";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export type AccountState = {
  status: AccountStatus;
  user: AccountUser | null;
  syncStatus: SyncStatus;
  error: string | null;
};

export type AccountApi = {
  getState: () => AccountState;
  subscribe: (listener: (state: AccountState) => void) => () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
};

declare global {
  interface Window {
    __KANJI5_ACCOUNT__?: AccountApi;
    KANJI5_SUPABASE?: {
      url?: string;
      anonKey?: string;
    };
  }
}

export function getAccountApi(timeoutMs = 12000): Promise<AccountApi> {
  const started = performance.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      const api = window.__KANJI5_ACCOUNT__;
      if (api) {
        resolve(api);
        return;
      }
      if (performance.now() - started >= timeoutMs) {
        reject(new Error("KANJI5_ACCOUNT_UNAVAILABLE"));
        return;
      }
      window.setTimeout(poll, 50);
    };
    poll();
  });
}
