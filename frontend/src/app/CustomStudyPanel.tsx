import { useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import type { CustomStudyFilter, CustomStudyFocus } from "./engine";

type LevelFilter = "all" | "N5" | "N4" | "N3" | "N2" | "N1";
type StudyTopicScope = { id: string; label: string; characters: string[] };

export function CustomStudyPanel({ language, selectedTopic = null, onStartCustomStudy }: {
  language: Language;
  selectedTopic?: StudyTopicScope | null;
  onStartCustomStudy: (filter: CustomStudyFilter) => Promise<boolean>;
}) {
  const [customFocus, setCustomFocus] = useState<CustomStudyFocus>("available");
  const [customLimit, setCustomLimit] = useState(20);
  const [level, setLevel] = useState<LevelFilter>("all");
  const [customMessage, setCustomMessage] = useState("");
  const [starting, setStarting] = useState(false);
  const focusOptions: Array<[CustomStudyFocus, string]> = [
    ["available", t("customAvailable", language)],
    ["due", t("customDue", language)],
    ["new", t("customNew", language)],
    ["weak", t("customWeak", language)],
    ["mistakes", t("customRecentMistakes", language)],
  ];

  const start = async () => {
    if (starting) return;
    setCustomMessage("");
    setStarting(true);
    try {
      const filter: CustomStudyFilter = {
        level,
        focus: customFocus,
        limit: customLimit,
        ...(selectedTopic ? { topicId: selectedTopic.id, topicCharacters: selectedTopic.characters } : {}),
      };
      const started = await onStartCustomStudy(filter);
      if (!started) setCustomMessage(t("customNoCards", language));
    } catch {
      setCustomMessage(t("actionFailed", language));
    } finally {
      setStarting(false);
    }
  };

  return (
    <section className="practice-custom-panel" aria-labelledby="custom-study-title">
      <div className="practice-custom-panel-header">
        <div>
          <p className="eyebrow">{selectedTopic ? t("practiceTopicSessionLabel", language) : t("customStudy", language)}</p>
          <h3 id="custom-study-title">{selectedTopic ? selectedTopic.label : t("customStudy", language)}</h3>
          <p className="subtitle">{selectedTopic ? t("practiceTopicSelectedHint", language) : t("customStudyHint", language)}</p>
        </div>
      </div>
      <div className="practice-focus-fieldset" role="group" aria-label={t("customFocus", language)}>
        <p className="eyebrow">{t("customFocus", language)}</p>
        <div className="practice-focus-options">
          {focusOptions.map(([value, label]) => (
            <button key={value} className={"button " + (customFocus === value ? "primary is-active" : "secondary") + " practice-focus-option"} type="button" aria-pressed={customFocus === value} onClick={() => setCustomFocus(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="practice-custom-secondary-controls">
        <label className="practice-custom-field">
          <span>{language === "fa" ? "سطح" : "Level"}</span>
          <select value={level} onChange={event => setLevel(event.target.value as LevelFilter)}>
            <option value="all">{t("allLevels", language)}</option>
            {(["N5", "N4", "N3", "N2", "N1"] as const).map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="practice-custom-field">
          <span>{t("customLimit", language)}</span>
          <select value={customLimit} onChange={event => setCustomLimit(Number(event.target.value))}>
            {[5, 10, 20, 30, 50].map(value => <option key={value} value={value}>{formatNumber(value, language)}</option>)}
          </select>
        </label>
      </div>
      <div className="practice-custom-footer">
        <span>
          {selectedTopic ? selectedTopic.label + " · " : ""}
          {level === "all" ? t("allLevels", language) : level}
          {" · "}{focusOptions.find(([value]) => value === customFocus)?.[1]}
          {" · "}{formatNumber(customLimit, language)}
        </span>
        <button className="button primary" type="button" disabled={starting} onClick={() => void start()}>
          {starting ? t("practiceTopicStarting", language) : t("customStart", language)}
        </button>
      </div>
      {customMessage ? <p className="practice-custom-message" role="status">{customMessage}</p> : null}
    </section>
  );
}
