import { useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import type { CustomStudyFilter } from "./engine";

type LevelFilter = "all" | "N5" | "N4" | "N3" | "N2" | "N1";

export function CustomStudyPanel({ language, onStartCustomStudy }: {
  language: Language;
  onStartCustomStudy: (filter: CustomStudyFilter) => Promise<boolean>;
}) {
  const [customFocus, setCustomFocus] = useState<CustomStudyFilter["focus"]>("available");
  const [customLimit, setCustomLimit] = useState(20);
  const [level, setLevel] = useState<LevelFilter>("all");
  const [customMessage, setCustomMessage] = useState("");

  return (
    <section className="surface card custom-study-panel practice-custom-study" aria-labelledby="custom-study-title">
      <div className="custom-study-panel-header">
        <div>
          <p className="eyebrow">{t("customStudy", language)}</p>
          <h3 id="custom-study-title">{t("customStudy", language)}</h3>
          <p>{t("customStudyHint", language)}</p>
        </div>
      </div>
      <div className="custom-study-controls">
        <div className="custom-study-focus" role="group" aria-label={t("customFocus", language)}>
          {([
            ["available", t("customAvailable", language)],
            ["due", t("customDue", language)],
            ["new", t("customNew", language)],
            ["weak", t("customWeak", language)],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              className={"dictionary-filter-button " + (customFocus === value ? "active" : "")}
              type="button"
              aria-pressed={customFocus === value}
              onClick={() => setCustomFocus(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="custom-study-secondary-controls">
          <label className="custom-study-limit">
            <span>{language === "fa" ? "سطح" : "Level"}</span>
            <select value={level} onChange={(event) => setLevel(event.target.value as LevelFilter)}>
              <option value="all">{t("allLevels", language)}</option>
              {(["N5", "N4", "N3", "N2", "N1"] as const).map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="custom-study-limit">
            <span>{t("customLimit", language)}</span>
            <select value={customLimit} onChange={(event) => setCustomLimit(Number(event.target.value))}>
              {[5, 10, 20, 30, 50].map((value) => <option key={value} value={value}>{formatNumber(value, language)}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="custom-study-action">
        <span>{level === "all" ? t("allLevels", language) : level} · {t("customStudy", language)}</span>
        <button className="button primary" type="button" onClick={async () => {
          setCustomMessage("");
          const started = await onStartCustomStudy({ level, focus: customFocus, limit: customLimit });
          if (!started) setCustomMessage(t("customNoCards", language));
        }}>
          {t("customStart", language)}
        </button>
      </div>
      {customMessage ? <p className="custom-study-message" role="status">{customMessage}</p> : null}
    </section>
  );
}
