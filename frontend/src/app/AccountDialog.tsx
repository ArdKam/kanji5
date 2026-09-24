import { useEffect, useState } from "react";
import { getAccountApi, type AccountState } from "./account";
import { t, type Language } from "./i18n";

type AuthMode = "email" | "magic";
type EmailIntent = "sign-in" | "sign-up";

function AccountMark({ user }: { user: AccountState["user"] }) {
  if (user?.avatarUrl) {
    return <img className="account-avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />;
  }
  if (user?.name || user?.email) {
    return <span className="account-avatar account-avatar-fallback" aria-hidden="true">{String(user.name ?? user.email ?? "?").trim().charAt(0).toUpperCase()}</span>;
  }
  return <span className="account-avatar account-avatar-guest" aria-hidden="true">◎</span>;
}

export function AccountButton({ language, onClick }: { language: Language; onClick: () => void }) {
  const [state, setState] = useState<AccountState>({ status: "loading", user: null, syncStatus: "idle", error: null });
  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    void getAccountApi().then(api => {
      if (!active) return;
      setState(api.getState());
      unsubscribe = api.subscribe(next => { if (active) setState(next); });
    }).catch(() => { if (active) setState({ status: "unavailable", user: null, syncStatus: "error", error: null }); });
    return () => { active = false; unsubscribe(); };
  }, []);
  const label = state.status === "signed-in"
    ? (state.user?.name || state.user?.email || (language === "fa" ? "حساب" : "Account"))
    : t("account", language);
  return <button className={"account-button "+(state.status === "signed-in" ? "is-signed-in" : "")} type="button" onClick={onClick} aria-label={label} title={label}>
    <AccountMark user={state.user} />
    <span className="account-button-label">{state.status === "signed-in" ? label : t("signIn", language)}</span>
  </button>;
}

export function AccountDialog({ open, language, onClose }: { open: boolean; language: Language; onClose: () => void }) {
  const [state, setState] = useState<AccountState>({ status: "loading", user: null, syncStatus: "idle", error: null });
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("email");
  const [emailIntent, setEmailIntent] = useState<EmailIntent>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [accountView, setAccountView] = useState<"profile" | "security" | "sync">("profile");
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    void getAccountApi().then(api => {
      if (!active) return;
      setState(api.getState());
      unsubscribe = api.subscribe(next => { if (active) setState(next); });
    }).catch(() => { if (active) setState({ status: "unavailable", user: null, syncStatus: "error", error: null }); });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !state.user) return;
    setDisplayName(state.user.name && state.user.name !== state.user.email ? state.user.name : "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setAccountView("profile");
    setAuthMessage(null);
  }, [open, state.user?.id]);

  const run = async (task: () => Promise<void>) => {
    if (busy) return;
    setAuthMessage(null);
    setBusy(true);
    try {
      await task();
    } catch (error) {
      const code = String(error instanceof Error ? error.message : error ?? "");
      const message = code === "AUTH_PASSWORD_TOO_SHORT" ? t("passwordTooShort", language)
        : code === "AUTH_EMAIL_REQUIRED" ? t("emailRequired", language)
        : code === "AUTH_EMAIL_PASSWORD_REQUIRED" ? t("emailPasswordRequired", language)
        : code === "AUTH_PASSWORD_REQUIRED" ? t("passwordRequired", language)
        : code === "AUTH_CURRENT_PASSWORD_INVALID" ? t("passwordChangeError", language)
        : code === "AUTH_PASSWORD_MISMATCH" ? t("passwordMismatch", language)
        : code === "AUTH_PROFILE_NAME_REQUIRED" ? t("nameRequired", language)
        : code === "AUTH_PROFILE_NAME_TOO_LONG" ? t("nameTooLong", language)
        : code === "Password should be at least 6 characters." ? t("passwordTooShort", language)
        : code || t("authError", language);
      setAuthMessage(message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const statusLabel = state.syncStatus === "syncing"
    ? t("syncing", language)
    : state.syncStatus === "synced"
      ? t("synced", language)
      : state.syncStatus === "error"
        ? t("syncError", language)
        : "";

  const submitEmailAuth = () => void run(async () => {
    const api = await getAccountApi();
    if (authMode === "email") {
      if (emailIntent === "sign-in") {
        await api.signInWithPassword(email, password);
        setPassword("");
        onClose();
      } else {
        const result = await api.signUpWithPassword(email, password);
        setPassword("");
        setAuthMessage(result.needsEmailConfirmation ? t("accountCheckEmail", language) : t("signedIn", language));
        if (!result.needsEmailConfirmation) onClose();
      }
    } else {
      await api.sendMagicLink(email);
      setAuthMessage(t("magicLinkSent", language));
    }
  });

  return <dialog open className="dialog account-dialog" aria-labelledby="account-title">
    <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
    <div className="account-dialog-heading">
      <AccountMark user={state.user} />
      <div>
        <p className="eyebrow">{t("account", language)}</p>
        <h2 id="account-title">{state.status === "signed-in" ? (state.user?.name || t("googleAccount", language)) : t("accountTitle", language)}</h2>
      </div>
    </div>

    {state.status === "loading" ? <p className="account-copy">{t("accountLoading", language)}</p> : null}

    {state.status === "unavailable" ? <section className="account-notice account-notice-warning"><strong>{t("accountUnavailable", language)}</strong><p>{t("accountUnavailableHint", language)}</p></section> : null}

    {state.status === "signed-out" ? <>
      <p className="account-copy">{t("accountIntro", language)}</p>

      <div className="account-auth-tabs" role="tablist" aria-label={t("accountMethods", language)}>
        <button className={authMode === "email" ? "is-active" : ""} type="button" role="tab" aria-selected={authMode === "email"} onClick={() => { setAuthMode("email"); setAuthMessage(null); }}>{t("emailPassword", language)}</button>
        <button className={authMode === "magic" ? "is-active" : ""} type="button" role="tab" aria-selected={authMode === "magic"} onClick={() => { setAuthMode("magic"); setAuthMessage(null); }}>{t("magicLink", language)}</button>
      </div>

      <form className="account-auth-form" onSubmit={event => { event.preventDefault(); submitEmailAuth(); }}>
        <label>
          <span>{t("email", language)}</span>
          <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required placeholder="name@example.com" disabled={busy} />
        </label>
        {authMode === "email" ? <label>
          <span>{t("password", language)}</span>
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" minLength={6} required placeholder="••••••••" disabled={busy} />
        </label> : null}
                <button className="button primary account-email-button" type="submit" disabled={busy}>
          {busy ? t("signingIn", language) : authMode === "email" ? (emailIntent === "sign-in" ? t("signInWithEmail", language) : t("createAccountAction", language)) : t("sendMagicLink", language)}
        </button>
        {authMode === "email" ? <button className="account-text-action" type="button" disabled={busy} onClick={() => { setEmailIntent(emailIntent === "sign-in" ? "sign-up" : "sign-in"); setAuthMessage(null); }}>
          {emailIntent === "sign-in" ? <>{t("createAccount", language)} <strong>{t("createAccountAction", language)}</strong></> : <>{t("alreadyAccount", language)} <strong>{t("signIn", language)}</strong></>}
        </button> : null}
      </form>

      <div className="account-divider"><span>{t("or", language)}</span></div>
      <button className="button secondary account-google-button account-google-pending" type="button" disabled>
        <span className="google-glyph" aria-hidden="true">G</span>
        {t("googleComingSoon", language)}
      </button>
      {authMessage ? <p className="account-message" role="status">{authMessage}</p> : null}
      <p className="account-hint">{t("guestModeHint", language)}</p>
    </> : null}

    {state.status === "signed-in" ? <>
      <div className="account-profile-hero">
        <AccountMark user={state.user} />
        <div className="account-profile-identity">
          <span className="eyebrow">{t("account", language)}</span>
          <strong>{displayName || state.user?.email || t("googleAccount", language)}</strong>
          {state.user?.email ? <span>{state.user.email}</span> : null}
        </div>
        <span className={"sync-pill sync-"+state.syncStatus}>{statusLabel}</span>
      </div>

      <p className="account-copy account-overview-copy">{t("accountOverview", language)}</p>

      <div className="account-section-tabs" role="tablist" aria-label={t("account", language)}>
        <button className={accountView === "profile" ? "is-active" : ""} type="button" role="tab" aria-selected={accountView === "profile"} onClick={() => { setAccountView("profile"); setAuthMessage(null); }}>{t("profile", language)}</button>
        <button className={accountView === "security" ? "is-active" : ""} type="button" role="tab" aria-selected={accountView === "security"} onClick={() => { setAccountView("security"); setAuthMessage(null); }}>{t("security", language)}</button>
        <button className={accountView === "sync" ? "is-active" : ""} type="button" role="tab" aria-selected={accountView === "sync"} onClick={() => { setAccountView("sync"); setAuthMessage(null); }}>{t("accountSync", language)}</button>
      </div>

      {accountView === "profile" ? <section className="account-section" aria-labelledby="account-profile-heading">
        <div className="account-section-heading">
          <div><h3 id="account-profile-heading">{t("profile", language)}</h3><p>{t("displayNameHint", language)}</p></div>
        </div>
        <form className="account-profile-form" onSubmit={event => { event.preventDefault(); void run(async () => {
          const api = await getAccountApi();
          await api.updateProfile(displayName);
          setAuthMessage(t("profileSaved", language));
        }); }}>
          <label><span>{t("displayName", language)}</span><input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={40} required disabled={busy} /></label>
          <label><span>{t("emailReadonly", language)}</span><input value={state.user?.email || ""} readOnly disabled /></label>
          <button className="button primary" type="submit" disabled={busy}>{busy ? t("saving", language) : t("saveProfile", language)}</button>
        </form>
      </section> : null}

      {accountView === "security" ? <section className="account-section" aria-labelledby="account-security-heading">
        <div className="account-section-heading">
          <div><h3 id="account-security-heading">{t("security", language)}</h3><p>{t("passwordHint", language)}</p></div>
        </div>
        <form className="account-profile-form" onSubmit={event => { event.preventDefault(); void run(async () => {
          if (!currentPassword || !newPassword) throw new Error("AUTH_PASSWORD_REQUIRED");
          if (newPassword !== confirmPassword) throw new Error("AUTH_PASSWORD_MISMATCH");
          const api = await getAccountApi();
          await api.updatePassword(currentPassword, newPassword);
          setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
          setAuthMessage(t("passwordChanged", language));
        }); }}>
          <label><span>{t("currentPassword", language)}</span><input type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} autoComplete="current-password" minLength={6} required disabled={busy} /></label>
          <label><span>{t("newPassword", language)}</span><input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" minLength={6} required disabled={busy} /></label>
          <label><span>{t("confirmPassword", language)}</span><input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={6} required disabled={busy} /></label>
          <button className="button primary" type="submit" disabled={busy}>{busy ? t("signingIn", language) : t("changePassword", language)}</button>
        </form>
      </section> : null}

      {accountView === "sync" ? <section className="account-section" aria-labelledby="account-sync-heading">
        <div className="account-section-heading">
          <div><h3 id="account-sync-heading">{t("accountSync", language)}</h3><p>{t("accountSyncHint", language)}</p></div>
          <span className={"sync-pill sync-"+state.syncStatus}>{statusLabel || t("syncing", language)}</span>
        </div>
        <div className="account-sync-status-card">
          <div><span>{t("emailReadonly", language)}</span><strong>{state.user?.email || "—"}</strong></div>
          <div><span>{t("accountSync", language)}</span><strong>{statusLabel || t("syncing", language)}</strong></div>
        </div>
        <div className="account-actions">
          <button className="button primary" type="button" disabled={busy || state.syncStatus === "syncing"} onClick={() => void run(async () => { const api = await getAccountApi(); await api.syncNow(); })}>{t("syncNow", language)}</button>
          <button className="button secondary" type="button" disabled={busy} onClick={() => void run(async () => { const api = await getAccountApi(); await api.signOut(); onClose(); })}>{t("signOut", language)}</button>
        </div>
      </section> : null}

      {authMessage ? <p className="account-message" role="status">{authMessage}</p> : null}
    </> : null}

    <div className="account-footer">
      <span>{t("localFirst", language)}</span>
      <span aria-hidden="true">•</span>
      <span>{t("cloudSync", language)}</span>
    </div>
  </dialog>;
}
