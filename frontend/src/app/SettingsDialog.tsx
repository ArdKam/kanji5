import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { usePageDialog } from "./usePageDialog";
import { t, type Language } from "./i18n";
import { DataBackup } from "./DataBackup";
import type { Settings, Snapshot } from "./engine";

type NumberSettingProps = {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

function NumberSetting({ label, description, value, min, max, onChange }: NumberSettingProps) {
  return (
    <div className="setting-control-row">
      <div className="setting-copy">
        <span className="setting-label">{label}</span>
        <span className="setting-description">{description}</span>
      </div>
      <input
        className="setting-number-input"
        type="number"
        min={min}
        max={max}
        inputMode="numeric"
        value={value}
        aria-label={label}
        onChange={event => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="setting-control-row setting-toggle-row">
      <span className="setting-copy">
        <span className="setting-label">{label}</span>
        <span className="setting-description">{description}</span>
      </span>
      <span className={"setting-toggle-visual " + (checked ? "is-on" : "")} aria-hidden="true">
        <span />
      </span>
      <input
        className="setting-toggle-input"
        type="checkbox"
        checked={checked}
        aria-label={label}
        onChange={event => onChange(event.target.checked)}
      />
    </label>
  );
}

function RetentionSetting({ language, value, onChange }: { language: Language; value: number; onChange: (value: number) => void }) {
  const percentage = Math.round(value * 100);
  return (
    <div className="setting-range-block">
      <div className="setting-range-header">
        <div className="setting-copy">
          <span className="setting-label">{t("targetRetention", language)}</span>
          <span className="setting-description">{t("targetRetentionHint", language)}</span>
        </div>
        <strong className="setting-range-value">{percentage}%</strong>
      </div>
      <input
        className="setting-range-input"
        type="range"
        min={80}
        max={98}
        step={1}
        value={percentage}
        aria-label={t("targetRetention", language)}
        aria-valuetext={percentage + "%"}
        onChange={event => onChange(Number(event.target.value) / 100)}
      />
      <div className="setting-range-scale" aria-hidden="true"><span>80%</span><span>98%</span></div>
      <p className="setting-range-helper">{t("targetRetentionHelper", language)}</p>
    </div>
  );
}

const normalizeSettings = (value: Settings): Settings => ({
  dailyNew: Math.max(1, Math.min(30, Math.round(Number(value.dailyNew) || 5))),
  retention: Math.max(.8, Math.min(.98, Number(value.retention) || .9)),
  dailyGoal: Math.max(1, Math.min(500, Math.round(Number(value.dailyGoal) || 20))),
  leechThreshold: Math.max(2, Math.min(30, Math.round(Number(value.leechThreshold) || 8))),
  production: Boolean(value.production),
  vocabulary: Boolean(value.vocabulary),
  context: Boolean(value.context),
});

const settingsKey = (value: Settings) => JSON.stringify(normalizeSettings(value));

export function SettingsDialog({
  open,
  snapshot,
  busy,
  language,
  onClose,
  onSave,
  onReset,
}: {
  open: boolean;
  snapshot: Snapshot;
  busy: boolean;
  language: Language;
  onClose: () => void;
  onSave: (settings: Settings) => void | Promise<unknown>;
  onReset: () => void | Promise<unknown>;
}) {
  const persisted = useMemo(() => normalizeSettings({
    dailyNew: 5,
    retention: .9,
    dailyGoal: 20,
    leechThreshold: 8,
    production: true,
    vocabulary: true,
    context: true,
    ...(snapshot.settings ?? {}),
  }), [snapshot.settings]);

  const [draft, setDraft] = useState<Settings>(persisted);
  const [savedKey, setSavedKey] = useState(() => settingsKey(persisted));
  const [discardOpen, setDiscardOpen] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const discardKeepEditingRef = useRef<HTMLButtonElement | null>(null);
  const discardConfirmRef = useRef<HTMLButtonElement | null>(null);
  const resetCancelRef = useRef<HTMLButtonElement | null>(null);
  const resetConfirmRef = useRef<HTMLButtonElement | null>(null);

  const handleConfirmationKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>, onEscape: () => void) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onEscape();
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
    if (!buttons.length) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (!discardOpen && !resetArmed) return;
    const target = discardOpen ? discardKeepEditingRef.current : resetCancelRef.current;
    if (!target) return;
    const frame = window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [discardOpen, resetArmed]);

  useEffect(() => {
    if (!open) return;
    setDraft(persisted);
    setSavedKey(settingsKey(persisted));
    setDiscardOpen(false);
    setResetArmed(false);
    setSaving(false);
  }, [open, persisted]);

  const dirty = settingsKey(draft) !== savedKey;
  const requestClose = () => {
    if (dirty) setDiscardOpen(true);
    else onClose();
  };
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;
  const stableClose = useCallback(() => requestCloseRef.current(), []);

  const handleSave = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    try {
      const result = await onSave(normalizeSettings(draft));
      if (result !== undefined) setSavedKey(settingsKey(draft));
    } finally {
      setSaving(false);
    }
  };

  const dialogRef = usePageDialog(open, stableClose);
  const effectiveBusy = busy || saving;

  return open ? (
    <dialog ref={dialogRef} className="dialog secondary-page-dialog settings-dialog" aria-labelledby="settings-title">
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={requestClose}>×</button>

      <header className="settings-page-header">
        <p className="eyebrow red">{t("settings", language)}</p>
        <h2 id="settings-title">{t("settingsTitle", language)}</h2>
        <p>{t("settingsIntro", language)}</p>
      </header>

      <form id="settings-form" className="settings-form" onSubmit={event => { event.preventDefault(); void handleSave(); }}>
        <div className="settings-form-scroll">
        <section className="settings-section settings-learning-section">
          <div className="settings-section-heading">
            <p className="eyebrow">{language === "fa" ? "یادگیری" : "Learning"}</p>
            <p>{t("learningSettingsHint", language)}</p>
          </div>

          <div className="settings-controls">
            <NumberSetting
              label={t("newKanjiPerDay", language)}
              description={language === "fa" ? "تعداد کانجی‌های جدیدی که هر روز وارد برنامهٔ مطالعه می‌شوند." : "How many new kanji enter your daily study plan."}
              value={draft.dailyNew}
              min={1}
              max={30}
              onChange={value => setDraft(current => ({ ...current, dailyNew: value }))}
            />
            <NumberSetting
              label={t("dailyReviewGoal", language)}
              description={language === "fa" ? "هدف روزانهٔ مرور برای پیگیری ریتم مطالعه." : "Your target number of reviews for each day."}
              value={draft.dailyGoal}
              min={1}
              max={500}
              onChange={value => setDraft(current => ({ ...current, dailyGoal: value }))}
            />
            <ToggleSetting
              label={t("productionKanji", language)}
              description={t("practiceSkillProductionHint", language)}
              checked={draft.production}
              onChange={value => setDraft(current => ({ ...current, production: value }))}
            />
            <ToggleSetting
              label={t("completeVocabulary", language)}
              description={t("practiceSkillVocabularyHint", language)}
              checked={draft.vocabulary}
              onChange={value => setDraft(current => ({ ...current, vocabulary: value }))}
            />
            <ToggleSetting
              label={t("contextRecall", language)}
              description={t("practiceSkillContextHint", language)}
              checked={draft.context}
              onChange={value => setDraft(current => ({ ...current, context: value }))}
            />
          </div>
        </section>

        <section className="settings-section settings-scheduling-section">
          <div className="settings-section-heading">
            <p className="eyebrow">{language === "fa" ? "زمان‌بندی مرور" : "Review scheduling"}</p>
            <p>{t("reviewSchedulingHint", language)}</p>
          </div>

          <div className="settings-controls">
            <RetentionSetting language={language} value={draft.retention} onChange={value => setDraft(current => ({ ...current, retention: value }))} />
            <NumberSetting
              label={t("difficultCardThreshold", language)}
              description={t("difficultCardThresholdHint", language)}
              value={draft.leechThreshold}
              min={2}
              max={30}
              onChange={value => setDraft(current => ({ ...current, leechThreshold: value }))}
            />
          </div>
        </section>

        <section className="settings-section settings-data-section">
          <div className="settings-section-heading">
            <p className="eyebrow">{language === "fa" ? "داده و پشتیبان" : "Data & backup"}</p>
            <p>{t("dataBackupHint", language)}</p>
          </div>
          <DataBackup language={language} />
        </section>


        <section className="settings-section settings-support-section" aria-labelledby="settings-support-title">
          <div className="settings-section-heading">
            <p className="eyebrow">{language === "fa" ? "راهنما و پشتیبانی" : "Help & support"}</p>
            <p id="settings-support-title">{language === "fa" ? "راهنمای استفاده، حریم خصوصی و مسیر گزارش مشکل را از اینجا پیدا کن." : "Find the product guide, privacy information, and the public feedback path here."}</p>
          </div>
          <div className="actions settings-support-links">
            <a className="button secondary" href="./docs/PUBLIC-PRODUCT.md" target="_blank" rel="noreferrer">{language === "fa" ? "راهنمای Kanji5" : "How Kanji5 works"}</a>
            <a className="button secondary" href="./docs/BROWSER-SUPPORT.md" target="_blank" rel="noreferrer">{language === "fa" ? "پشتیبانی مرورگرها" : "Browser support"}</a>
            <a className="button secondary" href="./docs/PRIVACY-AND-DATA.md" target="_blank" rel="noreferrer">{language === "fa" ? "حریم خصوصی و داده" : "Privacy & data"}</a>
            <a className="button secondary" href="https://github.com/ArdKam/kanji5/issues/new/choose" target="_blank" rel="noreferrer">{language === "fa" ? "گزارش مشکل / بازخورد" : "Report a problem / feedback"}</a>
          </div>
        </section>
        <section className="settings-danger-zone" aria-label={language === "fa" ? "پاک کردن پیشرفت" : "Reset learning progress"}>
          {resetArmed ? (
            <div className="settings-reset-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="settings-reset-title" aria-describedby="settings-reset-hint" onKeyDown={event => handleConfirmationKeyDown(event, () => setResetArmed(false))}>
              <strong id="settings-reset-title">{language === "fa" ? "مطمئنی می‌خواهی ادامه بدهی؟" : "Are you sure you want to continue?"}</strong>
              <p id="settings-reset-hint">{language === "fa" ? "همهٔ پیشرفت یادگیری و سابقهٔ مرور این دستگاه پاک می‌شود. این عمل قابل بازگشت نیست." : "All learning progress and review history on this device will be erased. This action cannot be undone."}</p>
              <div className="settings-danger-actions">
                <button ref={resetCancelRef} className="button secondary" type="button" onClick={() => setResetArmed(false)} disabled={effectiveBusy}>{t("cancel", language)}</button>
                <button ref={resetConfirmRef} className="button danger" type="button" onClick={() => { setResetArmed(false); void onReset(); }} disabled={effectiveBusy}>
                  {effectiveBusy ? "…" : (language === "fa" ? "بله، پیشرفت را پاک کن" : "Yes, reset progress")}
                </button>
              </div>
            </div>
          ) : (
            <button className="settings-reset-trigger" type="button" onClick={() => setResetArmed(true)} disabled={effectiveBusy}>
              <span>{language === "fa" ? "پاک کردن پیشرفت" : "Reset learning progress"}</span>
              <span aria-hidden="true">›</span>
            </button>
          )}
        </section>
        </div>

        <div className="settings-save-region">
          <div className={"settings-unsaved-state " + (dirty ? "is-dirty" : "")} aria-live="polite">
            {dirty ? t("settingsUnsaved", language) : t("settingsNoChanges", language)}
          </div>
          <div className="settings-save-actions">
            <button className="button secondary" type="button" onClick={requestClose}>{t("close", language)}</button>
            <button className="button primary" type="submit" disabled={!dirty || effectiveBusy}>
              {effectiveBusy ? "…" : t("settingsSaveChanges", language)}
            </button>
          </div>
        </div>
      </form>      {discardOpen ? (
        <div className="settings-discard-dialog" role="alertdialog" aria-modal="true" aria-labelledby="settings-discard-title" aria-describedby="settings-discard-hint" onKeyDown={event => handleConfirmationKeyDown(event, () => setDiscardOpen(false))}>
          <div className="settings-discard-dialog-card">
            <p className="eyebrow red">{language === "fa" ? "تغییر ذخیره‌نشده" : "Unsaved changes"}</p>
            <h3 id="settings-discard-title">{t("settingsDiscardTitle", language)}</h3>
            <p id="settings-discard-hint">{t("settingsDiscardHint", language)}</p>
            <div className="settings-discard-actions">
              <button ref={discardKeepEditingRef} className="button secondary" type="button" onClick={() => setDiscardOpen(false)}>{t("settingsKeepEditing", language)}</button>
              <button ref={discardConfirmRef} className="button danger" type="button" onClick={() => { setDiscardOpen(false); onClose(); }}>{t("settingsDiscardChanges", language)}</button>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  ) : null;
}
