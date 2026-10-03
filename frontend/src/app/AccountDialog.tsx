import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { getAccountApi, type AccountState } from "./account";
import { t, type Language } from "./i18n";
import { UiIcon } from "./UiIcon";
import { useModalDialog } from "./useModalDialog";

type AuthMode = "email" | "magic" | "reset";
type EmailIntent = "sign-in" | "sign-up";

function AccountMark({ user }: { user: AccountState["user"] }) {
  if (user?.avatarUrl) {
    return <img className="account-avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />;
  }
  if (user?.name || user?.email) {
    const label = String(user.name ?? user.email ?? "?").trim();
    return <span className="account-avatar account-avatar-fallback" aria-hidden="true">{Array.from(label)[0]?.toUpperCase() || "?"}</span>;
  }
  return <span className="account-avatar account-avatar-guest" aria-hidden="true"><UiIcon name="user" size={18} /></span>;
}

function PasswordField({
  name, label, value, onChange, autoComplete, disabled, placeholder, showLabel, hideLabel
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled: boolean;
  placeholder?: string;
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  return <label className="account-password-label">
    <span>{label}</span>
    <span className="account-password-field">
      <input
        dir="ltr"
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={event => onChange(event.target.value)}
        autoComplete={autoComplete}
        minLength={6}
        required
        disabled={disabled}
        placeholder={placeholder}
      />
      <button
        className="account-password-toggle"
        type="button"
        aria-label={visible ? hideLabel : showLabel}
        title={visible ? hideLabel : showLabel}
        onClick={() => setVisible(next => !next)}
        disabled={disabled}
      >
        <UiIcon name={visible ? "eyeOff" : "eye"} size={17} />
      </button>
    </span>
  </label>;
}

function formatSyncedAt(value: string | null, language: Language) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(language === "fa" ? "fa-IR" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return value;
  }
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

export function AccountDialog({ open, language, onClose, onAuthenticated, initialEmailIntent = "sign-in" }: { open: boolean; language: Language; onClose: () => void; onAuthenticated?: () => void; initialEmailIntent?: "sign-in" | "sign-up" }) {
  const initialSummary = { activeCards: 0, reviews: 0, personalMnemonics: 0, lastSyncedAt: null };
  const [state, setState] = useState<AccountState>({ status: "loading", user: null, syncStatus: "idle", error: null, recoveryPending: false, syncSummary: initialSummary });
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("email");
  const [emailIntent, setEmailIntent] = useState<EmailIntent>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setPasswordOnly, setSetPasswordOnly] = useState(false);
  const [securityEditing, setSecurityEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    void getAccountApi().then(api => {
      if (!active) return;
      setState(api.getState());
      unsubscribe = api.subscribe(next => { if (active) setState(next); });
    }).catch(() => {
      if (active) setState({ status: "unavailable", user: null, syncStatus: "error", error: null, recoveryPending: false, syncSummary: initialSummary });
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    setBusy(false);
    setEmail("");
    setPassword("");
    setAuthMessage(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSetPasswordOnly(false);
    setSecurityEditing(false);
    setDeleteConfirm(false);
    if (state.user) {
      setDisplayName(state.user.name && state.user.name !== state.user.email ? state.user.name : "");
    } else {
      setDisplayName("");
      setAuthMode(state.recoveryPending ? "reset" : "email");
      setEmailIntent(initialEmailIntent);
    }
  }, [open, state.user?.id, initialEmailIntent]);

  useEffect(() => {
    if (!open || !state.recoveryPending) return;
    setNewPassword("");
    setConfirmPassword("");
    setSetPasswordOnly(true);
    setAuthMessage(null);
  }, [open, state.recoveryPending]);

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
        : code === "AUTH_PASSWORD_MISMATCH" ? t("passwordMismatch", language)
        : code === "AUTH_CURRENT_PASSWORD_INVALID" ? t("passwordChangeError", language)
        : code === "AUTH_PROFILE_NAME_REQUIRED" ? t("nameRequired", language)
        : code === "AUTH_PROFILE_NAME_TOO_LONG" ? t("nameTooLong", language)
        : code === "AUTH_RESET_EMAIL_REQUIRED" ? t("emailRequired", language)
        : code === "AUTH_RESET_FAILED" ? t("passwordResetError", language)
        : code === "AUTH_SET_PASSWORD_FAILED" ? t("passwordChangeError", language)
        : code === "AUTH_ACCOUNT_DELETE_FAILED" ? t("accountDeleteError", language)
        : code === "Password should be at least 6 characters." ? t("passwordTooShort", language)
        : t("authError", language);
      setAuthMessage(message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open || !onAuthenticated || state.status !== "signed-in") return;
    onAuthenticated();
  }, [open, onAuthenticated, state.status]);

  const dialogRef = useModalDialog(open, onClose);

  if (!open) return null;

  const statusLabel = state.syncStatus === "syncing"
    ? t("syncing", language)
    : state.syncStatus === "synced"
      ? t("synced", language)
      : state.syncStatus === "error"
        ? t("syncError", language)
        : t("syncIdle", language);

  const handleModeKeyDown = (event: ReactKeyboardEvent<HTMLElement>, count: number, index: number, activate: (next: number) => void) => {
    const key = event.key;
    if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "Home" && key !== "End") return;
    event.preventDefault();
    const next = key === "Home" ? 0 : key === "End" ? count - 1 : (index + (key === "ArrowRight" ? 1 : -1) + count) % count;
    const tabList = event.currentTarget.parentElement;
    activate(next);
    requestAnimationFrame(() => {
      const tabs = Array.from(tabList?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []);
      tabs[next]?.focus({ preventScroll: true });
    });
  };

  const submitEmailAuth = () => void run(async () => {
    const api = await getAccountApi();
    if (authMode === "reset") {
      await api.sendPasswordReset(email);
      setAuthMessage(t("passwordResetSent", language));
      return;
    }
    if (authMode === "magic") {
      await api.sendMagicLink(email);
      setAuthMessage(t("magicLinkSent", language));
      return;
    }
    if (emailIntent === "sign-in") {
      await api.signInWithPassword(email, password);
      setPassword("");
      onClose();
      onAuthenticated?.();
      return;
    }
    const result = await api.signUpWithPassword(email, password);
    setPassword("");
    setAuthMessage(result.needsEmailConfirmation ? t("accountCheckEmail", language) : t("signedIn", language));
    if (!result.needsEmailConfirmation) { onClose(); onAuthenticated?.(); }
  });

  const submitPassword = () => void run(async () => {
    if (!newPassword) throw new Error("AUTH_PASSWORD_REQUIRED");
    if (newPassword !== confirmPassword) throw new Error("AUTH_PASSWORD_MISMATCH");
    const api = await getAccountApi();
    if (state.recoveryPending || setPasswordOnly) {
      await api.setPassword(newPassword);
    } else {
      if (!currentPassword) throw new Error("AUTH_PASSWORD_REQUIRED");
      await api.updatePassword(currentPassword, newPassword);
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSetPasswordOnly(false);
    setSecurityEditing(false);
    setAuthMessage(t("passwordChanged", language));
  });

  const lastSynced = formatSyncedAt(state.syncSummary.lastSyncedAt, language);
  const summary = state.syncSummary;

  return <dialog ref={dialogRef} className="dialog account-dialog" aria-labelledby="account-title">
    <button className="dialog-close account-dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>
      <UiIcon name="close" size={19} />
    </button>

    <header className="account-page-header">
      <div className="account-page-brand">
        <span className="account-hanko" aria-hidden="true">印</span>
        <div>
          <p className="eyebrow">{t("account", language)}</p>
          <h2 id="account-title">{t("accountHubTitle", language)}</h2>
        </div>
      </div>
    </header>

    {state.status === "loading" ? <p className="account-copy">{t("accountLoading", language)}</p> : null}

    {state.status === "unavailable" ? <section className="account-notice account-notice-warning">
      <strong>{t("accountUnavailable", language)}</strong>
      <p>{t("accountUnavailableHint", language)}</p>
    </section> : null}

    {state.status === "signed-out" ? <section className="account-auth-surface" aria-label={t("account", language)}>
      {authMode === "reset" ? <>
        <div className="account-auth-intro">
          <h3>{t("forgotPassword", language)}</h3>
          <p>{t("passwordResetHint", language)}</p>
        </div>
        <form className="account-auth-form" onSubmit={event => { event.preventDefault(); submitEmailAuth(); }}>
          <label><span>{t("email", language)}</span><input dir="ltr" name="email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required disabled={busy} placeholder="name@example.com" /></label>
          <button className="button primary account-email-button" type="submit" disabled={busy}>{busy ? t("sending", language) : t("sendResetLink", language)}</button>
        </form>
        <button className="account-link-button" type="button" disabled={busy} onClick={() => { setAuthMode("email"); setAuthMessage(null); }}>{t("backToSignIn", language)}</button>
      </> : authMode === "magic" ? <>
        <div className="account-auth-intro">
          <h3>{t("magicLink", language)}</h3>
          <p>{t("magicLinkHint", language)}</p>
        </div>
        <form className="account-auth-form" onSubmit={event => { event.preventDefault(); submitEmailAuth(); }}>
          <label><span>{t("email", language)}</span><input dir="ltr" name="magic-email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required placeholder="name@example.com" disabled={busy} /></label>
          <button className="button primary account-email-button" type="submit" disabled={busy}>{busy ? t("sending", language) : t("sendMagicLink", language)}</button>
        </form>
        <button className="account-link-button" type="button" disabled={busy} onClick={() => { setAuthMode("email"); setAuthMessage(null); }}>{t("backToSignIn", language)}</button>
      </> : <>
        <div className="account-auth-intro">
          <h3>{t("accountWelcomeTitle", language)}</h3>
          <p>{t("accountIntro", language)}</p>
        </div>

        <div className="account-auth-intent" role="tablist" aria-label={t("accountAuthAction", language)}>
          <button id="account-intent-signin" className={emailIntent === "sign-in" ? "is-active" : ""} type="button" role="tab" aria-selected={emailIntent === "sign-in"} tabIndex={emailIntent === "sign-in" ? 0 : -1} onKeyDown={e => handleModeKeyDown(e, 2, 0, next => setEmailIntent(next === 0 ? "sign-in" : "sign-up"))} onClick={() => { setEmailIntent("sign-in"); setAuthMessage(null); }}>{t("signIn", language)}</button>
          <button id="account-intent-signup" className={emailIntent === "sign-up" ? "is-active" : ""} type="button" role="tab" aria-selected={emailIntent === "sign-up"} tabIndex={emailIntent === "sign-up" ? 0 : -1} onKeyDown={e => handleModeKeyDown(e, 2, 1, next => setEmailIntent(next === 0 ? "sign-in" : "sign-up"))} onClick={() => { setEmailIntent("sign-up"); setAuthMessage(null); }}>{t("createAccountAction", language)}</button>
        </div>

        <form className="account-auth-form" onSubmit={event => { event.preventDefault(); submitEmailAuth(); }}>
          <label><span>{t("email", language)}</span><input dir="ltr" name="email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required placeholder="name@example.com" disabled={busy} /></label>
          <PasswordField
            name="password"
            label={t("password", language)}
            value={password}
            onChange={setPassword}
            autoComplete={emailIntent === "sign-in" ? "current-password" : "new-password"}
            disabled={busy}
            placeholder={t("passwordPlaceholder", language)}
            showLabel={t("showPassword", language)}
            hideLabel={t("hidePassword", language)}
          />
          <p className="account-field-hint">{t("passwordMinimumHint", language)}</p>
          {emailIntent === "sign-in" ? <button className="account-link-button account-forgot-link" type="button" disabled={busy} onClick={() => { setAuthMode("reset"); setAuthMessage(null); }}>{t("forgotPassword", language)}</button> : null}
          <button className="button primary account-email-button" type="submit" disabled={busy}>{busy ? t("signingIn", language) : emailIntent === "sign-in" ? t("signInWithEmail", language) : t("createAccountAction", language)}</button>
        </form>

        <div className="account-divider"><span>{t("or", language)}</span></div>
        <button className="button account-google-button" type="button" disabled={busy} onClick={() => void run(async () => {
          const api = await getAccountApi();
          await api.signInWithGoogle();
        })}>
          <span className="google-glyph" aria-hidden="true">G</span>
          <span>{busy ? t("signingIn", language) : t("continueWithGoogle", language)}</span>
        </button>
        <button className="account-link-button account-magic-link" type="button" disabled={busy} onClick={() => { setAuthMode("magic"); setAuthMessage(null); }}>{t("useMagicLink", language)}</button>
      </>}
      {authMessage ? <p className="account-message" role="status">{authMessage}</p> : null}
      <p className="account-hint">{t("guestModeHint", language)}</p>
    </section> : null}

    {state.status === "signed-in" ? <div className="account-hub">
      <section className="account-identity-card" aria-label={t("profile", language)}>
        <AccountMark user={state.user} />
        <div className="account-identity-copy">
          <strong>{state.user?.name || state.user?.email || t("googleAccount", language)}</strong>
          {state.user?.email ? <span dir="ltr">{state.user.email}</span> : null}
        </div>
        <span className={"account-sync-badge sync-"+state.syncStatus}><span className="account-sync-dot" aria-hidden="true" />{statusLabel}</span>
      </section>

      {state.recoveryPending ? <section className="account-section account-section-emphasis">
        <div className="account-section-heading">
          <div><h3>{t("setNewPassword", language)}</h3><p>{t("setNewPasswordHint", language)}</p></div>
        </div>
        <form className="account-profile-form" onSubmit={event => { event.preventDefault(); submitPassword(); }}>
          <PasswordField name="newPassword" label={t("newPassword", language)} value={newPassword} onChange={setNewPassword} autoComplete="new-password" disabled={busy} placeholder={t("passwordPlaceholder", language)} showLabel={t("showPassword", language)} hideLabel={t("hidePassword", language)} />
          <PasswordField name="confirmPassword" label={t("confirmPassword", language)} value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" disabled={busy} placeholder={t("passwordPlaceholder", language)} showLabel={t("showPassword", language)} hideLabel={t("hidePassword", language)} />
          <button className="button primary" type="submit" disabled={busy}>{busy ? t("saving", language) : t("setPassword", language)}</button>
        </form>
        {authMessage ? <p className="account-message" role="status">{authMessage}</p> : null}
      </section> : null}

      {!state.recoveryPending ? <div className="account-hub-sections">
        <section className="account-section">
          <div className="account-section-heading">
            <div><h3>{t("profile", language)}</h3><p>{t("displayNameHint", language)}</p></div>
          </div>
          <form className="account-profile-form" onSubmit={event => { event.preventDefault(); void run(async () => {
            const api = await getAccountApi();
            await api.updateProfile(displayName);
            setAuthMessage(t("profileSaved", language));
          }); }}>
            <label><span>{t("displayName", language)}</span><input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={40} required disabled={busy} /></label>
            <label><span>{t("emailReadonly", language)}</span><input dir="ltr" value={state.user?.email || ""} readOnly disabled /></label>
            <button className="button primary" type="submit" disabled={busy}>{busy ? t("saving", language) : t("saveProfile", language)}</button>
          </form>
        </section>

        <section className="account-section">
          <div className="account-section-heading">
            <div><h3>{t("security", language)}</h3><p>{t("passwordHint", language)}</p></div>
          </div>
{securityEditing ? <form className="account-profile-form" onSubmit={event => { event.preventDefault(); submitPassword(); }}>
            <PasswordField name="currentPassword" label={t("currentPassword", language)} value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" disabled={busy} placeholder={t("passwordPlaceholder", language)} showLabel={t("showPassword", language)} hideLabel={t("hidePassword", language)} />
            <PasswordField name="newPassword" label={t("newPassword", language)} value={newPassword} onChange={setNewPassword} autoComplete="new-password" disabled={busy} placeholder={t("passwordPlaceholder", language)} showLabel={t("showPassword", language)} hideLabel={t("hidePassword", language)} />
            <PasswordField name="confirmPassword" label={t("confirmPassword", language)} value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" disabled={busy} placeholder={t("passwordPlaceholder", language)} showLabel={t("showPassword", language)} hideLabel={t("hidePassword", language)} />
            <div className="account-inline-actions"><button className="button primary" type="submit" disabled={busy}>{busy ? t("saving", language) : t("changePassword", language)}</button><button className="account-link-button" type="button" disabled={busy} onClick={() => { setSecurityEditing(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setAuthMessage(null); }}>{t("cancel", language)}</button></div>
          </form> : <div className="account-security-row">
            <div><strong>{t("password", language)}</strong><span>{t("passwordSetHint", language)}</span></div>
            <button className="button secondary" type="button" disabled={busy} onClick={() => { setSecurityEditing(true); setAuthMessage(null); }}>{t("changePassword", language)}</button>
          </div>}
        </section>

        <section className="account-section">
          <div className="account-section-heading">
            <div><h3>{t("accountSync", language)}</h3><p>{t("accountSyncHint", language)}</p></div>
            <span className={"account-sync-badge sync-"+state.syncStatus}><span className="account-sync-dot" aria-hidden="true" />{statusLabel}</span>
          </div>
          <div className="account-sync-snapshot">
            <div><strong>{fa(summary.activeCards, language)}</strong><span>{t("accountCardsInSrs", language)}</span></div>
            <div><strong>{fa(summary.reviews, language)}</strong><span>{t("accountReviewsStored", language)}</span></div>
            <div><strong>{fa(summary.personalMnemonics, language)}</strong><span>{t("accountPersonalMnemonics", language)}</span></div>
          </div>
          {lastSynced ? <p className="account-sync-time">{t("lastSynced", language)} · <span dir="ltr">{lastSynced}</span></p> : null}
          <button className="button primary wide" type="button" disabled={busy || state.syncStatus === "syncing"} onClick={() => void run(async () => { const api = await getAccountApi(); await api.syncNow(); })}>{t("syncNow", language)}</button>
        </section>

        <section className="account-section account-section-actions">
          <div>
            <h3>{t("accountActions", language)}</h3>
            <p>{t("deleteAccountHint", language)}</p>
          </div>
          {deleteConfirm ? <div className="account-inline-actions">
            <p className="account-message" role="alert">{t("deleteAccountConfirm", language)}</p>
            <button className="account-signout-button" type="button" disabled={busy} onClick={() => void run(async () => {
              const api = await getAccountApi();
              await api.deleteAccount();
              setDeleteConfirm(false);
              setAuthMessage(t("accountDeleted", language));
              onClose();
            })}>{t("deleteAccountProceed", language)}</button>
            <button className="account-link-button" type="button" disabled={busy} onClick={() => setDeleteConfirm(false)}>{t("cancel", language)}</button>
          </div> : <button className="account-link-button" type="button" disabled={busy} onClick={() => setDeleteConfirm(true)}>{t("deleteAccount", language)}</button>}
          <button className="account-signout-button" type="button" disabled={busy} onClick={() => void run(async () => { const api = await getAccountApi(); await api.signOut(); onClose(); })}>{t("signOut", language)}</button>
        </section>

        {authMessage ? <p className="account-message" role="status">{authMessage}</p> : null}
      </div> : null}
    </div> : null}

    <footer className="account-footer"><span>{t("localFirst", language)}</span><span aria-hidden="true">•</span><span>{t("cloudSync", language)}</span></footer>
  </dialog>;
}

function fa(value: number, language: Language) {
  return formatAccountNumber(value, language);
}

function formatAccountNumber(value: number, language: Language) {
  const locale = language === "fa" ? "fa-IR" : "en";
  try {
    return new Intl.NumberFormat(locale).format(Math.max(0, Number(value) || 0));
  } catch {
    return String(Math.max(0, Number(value) || 0));
  }
}
