import { useEffect, useState } from "react";
import { usePageDialog } from "./usePageDialog";
import { t, type Language } from "./i18n";
import { MnemonicBackup } from "./MnemonicBackup";
import type { KanjiCatalogItem, Settings, Snapshot } from "./engine";

function Setting({label,value,min,max,onChange}:{label:string;value:number;min:number;max:number;onChange:(v:number)=>void}) {
  return <label className="setting-row"><span>{label}</span><input type="number" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
}

export function SettingsDialog({
  open,
  snapshot,
  busy,
  language,
  onClose,
  onSave,
  onReset,
  onRetakePlacement,
  mnemonicCatalog,
}: {
  open: boolean;
  snapshot: Snapshot;
  busy: boolean;
  language: Language;
  onClose: () => void;
  onSave: (s: Settings) => void;
  onReset: () => void;
  onRetakePlacement: () => void;
  mnemonicCatalog: KanjiCatalogItem[];
}) {
  const s: Settings = { dailyNew:5, retention:.9, dailyGoal:20, leechThreshold:8, production:true, vocabulary:true, context:true, ...(snapshot.settings ?? {}) };
  const [draft, setDraft] = useState<Settings>(s);
  const [resetArmed, setResetArmed] = useState(false);
  useEffect(() => { if (open) setDraft(s); }, [open, s.dailyNew, s.retention, s.dailyGoal, s.leechThreshold, s.production, s.vocabulary, s.context]);

  const dialogRef = usePageDialog(open, onClose);

  return open ? (
    <dialog ref={dialogRef} className="dialog secondary-page-dialog" aria-labelledby="settings-title">
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <h2 id="settings-title">{t("settingsTitle", language)}</h2>
      <form className="settings-form" onSubmit={e => { e.preventDefault(); onSave(draft); }}>
        <section className="settings-section settings-learning-section">
          <div className="settings-section-title">{language === "fa" ? "یادگیری" : "Learning"}</div>
          <Setting label={t("newKanjiPerDay")} value={draft.dailyNew} min={1} max={30} onChange={v => setDraft({...draft, dailyNew:v})}/>
          <p className="settings-help">{language==="fa"?"تعداد کانجی‌های جدیدی که هر روز وارد برنامهٔ یادگیری می‌شوند.":"How many new kanji enter your daily learning plan."}</p>
          <Setting label={t("dailyReviewGoal")} value={draft.dailyGoal} min={1} max={500} onChange={v => setDraft({...draft, dailyGoal:v})}/>
          <div className="settings-toggle-list">
            {([["production",t("productionKanji")],["vocabulary",t("completeVocabulary")],["context",t("contextRecall")]] as const).map(([k,l]) => (
              <label className="setting-row" key={k}><span>{l}</span><input type="checkbox" checked={draft[k]} onChange={e => setDraft({...draft,[k]:e.target.checked})}/></label>
            ))}
          </div>
        </section>

        <section className="settings-section settings-scheduling-section">
          <div className="settings-section-title">{language === "fa" ? "زمان‌بندی مرور" : "Review scheduling"}</div>
          <p className="settings-help">{language==="fa"?"این گزینه‌ها رفتار زمان‌بندی مرور را کنترل می‌کنند.":"These options control how review scheduling behaves."}</p>
          <label className="setting-row setting-range-row">
            <span>{t("fsrsRetention")}</span>
            <span className="setting-range-value">{Math.round(draft.retention * 100)}%</span>
            <input type="range" min={80} max={98} step={1} value={Math.round(draft.retention * 100)} onChange={e => setDraft({...draft, retention:Number(e.target.value)/100})}/>
          </label>
          <Setting label={t("leechThreshold")} value={draft.leechThreshold} min={2} max={30} onChange={v => setDraft({...draft, leechThreshold:v})}/>
        </section>

        <section className="settings-section settings-data-section">
          <div className="settings-section-title">{language === "fa" ? "داده و پشتیبان" : "Data & backup"}</div>
          <p className="settings-help">{t("contentBackupHint", language)}</p>
          <MnemonicBackup catalog={mnemonicCatalog} language={language} />
        </section>

        <section className="settings-section settings-advanced-section">
          <div className="settings-section-title">{t("placementDiagnostic", language)}</div>
          <p className="settings-help">{t("placementDiagnosticHint", language)}</p>
          <button className="button secondary" type="button" disabled={busy} onClick={onRetakePlacement}>{t("retakeDiagnostic", language)}</button>
        </section>

        <div className="actions settings-submit-actions">
          <button className="button primary" type="submit" disabled={busy}>{t("save", language)}</button>
          <button className="button secondary" type="button" onClick={onClose}>{t("close", language)}</button>
        </div>

        <section className="settings-danger-zone">
          <strong>{language==="fa"?"منطقهٔ خطر":"Danger zone"}</strong>
          <p>{language==="fa"?"پاک کردن پیشرفت برگشت‌پذیر نیست.":"Resetting progress cannot be undone."}</p>
          {resetArmed ? <div className="reset-confirmation">
            <p>{language==="fa"?"این کار همهٔ پیشرفت یادگیری را پاک می‌کند و قابل بازگشت نیست.":"This permanently removes learning progress and cannot be undone."}</p>
            <div className="actions">
              <button className="button danger" type="button" disabled={busy} onClick={() => { setResetArmed(false); onReset(); }}>{language==="fa"?"بله، پاک کن":"Yes, reset progress"}</button>
              <button className="button secondary" type="button" onClick={() => setResetArmed(false)}>{language==="fa"?"لغو":"Cancel"}</button>
            </div>
          </div> : <button className="button danger" type="button" disabled={busy} onClick={() => setResetArmed(true)}>{t("resetProgress", language)}</button>}
        </section>
      </form>
    </dialog>
  ) : null;
}
