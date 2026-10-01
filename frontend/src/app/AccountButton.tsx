import { useEffect, useState } from "react";
import { getAccountApi, type AccountState } from "./account";
import { t, type Language } from "./i18n";
import { UiIcon } from "./UiIcon";

function AccountMark({ user }: { user: AccountState["user"] }) {
  if (user?.avatarUrl) return <img className="account-avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />;
  if (user?.name || user?.email) {
    const label = String(user.name ?? user.email ?? "?").trim();
    return <span className="account-avatar account-avatar-fallback" aria-hidden="true">{Array.from(label)[0]?.toUpperCase() || "?"}</span>;
  }
  return <span className="account-avatar account-avatar-guest" aria-hidden="true"><UiIcon name="user" size={18} /></span>;
}

export function AccountButton({ language, onClick }: { language: Language; onClick: () => void }) {
  const [state, setState] = useState<AccountState>({ status: "loading", user: null, syncStatus: "idle", error: null, recoveryPending: false, syncSummary: { activeCards: 0, reviews: 0, personalMnemonics: 0, lastSyncedAt: null } });
  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    void getAccountApi().then(api => {
      if (!active) return;
      setState(api.getState());
      unsubscribe = api.subscribe(next => { if (active) setState(next); });
    }).catch(() => {
      if (active) setState({ status: "unavailable", user: null, syncStatus: "error", error: null, recoveryPending: false, syncSummary: { activeCards: 0, reviews: 0, personalMnemonics: 0, lastSyncedAt: null } });
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  const label = state.status === "signed-in"
    ? (state.user?.name || state.user?.email || (language === "fa" ? "حساب" : "Account"))
    : t("account", language);

  return <button
    className={"account-button "+(state.status === "signed-in" ? "is-signed-in" : "")}
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
  >
    <AccountMark user={state.user} />
    <span className="account-button-label">{state.status === "signed-in" ? label : t("signIn", language)}</span>
  </button>;
}
