import { useEffect, useState } from "react";
import { t, type Language } from "./i18n";
import type { Settings, Snapshot } from "./engine";

function Setting({label,value,min,max,onChange}:{label:string;value:number;min:number;max:number;onChange:(v:number)=>void}) {
  return <label className="setting-row"><span>{label}</span><input type="number" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
}

export function SettingsDialog({
  open,
  snapshot,
  busy,
  language,
  onLanguageChange,
  onClose,
  onSave,
  onReset,
  onRetakePlacement,
}: {
  open: boolean;
  snapshot: Snapshot;
  busy: boolean;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onClose: () => void;
  onSave: (s: Settings) => void;
  onReset: () => void;
  onRetakePlacement: () => void;
}) {
  const s: Settings = { dailyNew:5, retention:.9, dailyGoal:20, leechThreshold:8, production:true, vocabulary:true, context:true, ...(snapshot.settings ?? {}) };
  const [draft, setDraft] = useState<Settings>(s);
  useEffect(() => { if (open) setDraft(s); }, [open, s.dailyNew, s.retention, s.dailyGoal, s.leechThreshold, s.production, s.vocabulary, s.context]);

  return open ? (
    <dialog open className="dialog" aria-labelledby="settings-title">
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <h2 id="settings-title">{t("settingsTitle", language)}</h2>
      <form className="settings-form" onSubmit={e => { e.preventDefault(); onSave(draft); }}>
        <div className="settings-section">
          <div className="settings-section-title">{t("language", language)}</div>
          <div className="settings-language-switcher" role="group" aria-label={t("language", language)}>
            <button className={"settings-language-button " + (language === "fa" ? "active" : "")} type="button" aria-pressed={language === "fa"} onClick={() => onLanguageChange("fa")}>{t("persian", language)}</button>
            <button className={"settings-language-button " + (language === "en" ? "active" : "")} type="button" aria-pressed={language === "en"} onClick={() => onLanguageChange("en")}>{t("english", language)}</button>
          </div>
        </div>
        <Setting label={t("newKanjiPerDay")} value={draft.dailyNew} min={1} max={30} onChange={v => setDraft({...draft, dailyNew:v})}/>
        <label className="setting-row"><span>{t("fsrsRetention")}</span><span className="setting-range-value">{Math.round(draft.retention * 100)}%</span><input type="range" min={80} max={98} step={1} value={Math.round(draft.retention * 100)} onChange={e => setDraft({...draft, retention:Number(e.target.value)/100})}/></label>
        <Setting label={t("dailyReviewGoal")} value={draft.dailyGoal} min={1} max={500} onChange={v => setDraft({...draft, dailyGoal:v})}/>
        <Setting label={t("leechThreshold")} value={draft.leechThreshold} min={2} max={30} onChange={v => setDraft({...draft, leechThreshold:v})}/>
        {([["production",t("productionKanji")],["vocabulary",t("completeVocabulary")],["context",t("contextRecall")]] as const).map(([k,l]) => (
          <label className="setting-row" key={k}><span>{l}</span><input type="checkbox" checked={draft[k]} onChange={e => setDraft({...draft,[k]:e.target.checked})}/></label>
        ))}
        <div className="settings-section placement-settings-section">
          <div className="settings-section-title">{t("placementDiagnostic", language)}</div>
          <p>{t("placementDiagnosticHint", language)}</p>
          <button className="button secondary" type="button" disabled={busy} onClick={onRetakePlacement}>{t("retakeDiagnostic", language)}</button>
        </div>
        <div className="actions">
          <button className="button primary" type="submit" disabled={busy}>{t("save", language)}</button>
          <button className="button secondary" type="button" onClick={onClose}>{t("close", language)}</button>
          <button className="button secondary" type="button" disabled={busy} onClick={onReset}>{t("resetProgress", language)}</button>
        </div>
      </form>
    </dialog>
  ) : null;
}
