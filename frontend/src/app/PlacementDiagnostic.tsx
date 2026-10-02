import { useMemo, useState, useEffect } from "react";
import { formatNumber, t, type Language } from "./i18n";
import type { CustomStudyFilter, KanjiCatalogItem } from "./engine";
import { buildPlacementQuestions, DIAGNOSTIC_LEVELS } from "./placement-logic";

export function PlacementDiagnostic({ catalog, language, onStartCustomStudy, autoOpen = false }: { catalog: KanjiCatalogItem[]; language: Language; onStartCustomStudy: (filter: CustomStudyFilter) => Promise<boolean>; autoOpen?: boolean }) {
  const questions = useMemo(() => buildPlacementQuestions(catalog, t("diagnosticMeaningPrompt", language)), [catalog, language]);

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [levelScores, setLevelScores] = useState<Record<string, { correct: number; total: number }>>({});
  const [finished, setFinished] = useState(false);
  const [starting, setStarting] = useState(false);
  const current = questions[index];

  useEffect(() => {
    if (!questions.length) {
      setActive(false);
      setFinished(false);
    }
  }, [questions.length]);

  const start = () => {
    setIndex(0);
    setSelected("");
    setScore(0);
    setLevelScores({});
    setFinished(false);
    setActive(true);
  };

  const choose = (option: string) => {
    if (!current || selected) return;
    const correct = option === current.options.find(item => item.correct)?.label;
    setSelected(option);
    setScore(value => value + (correct ? 1 : 0));
    setLevelScores(previous => {
      const level = current.level ?? "unknown";
      const existing = previous[level] ?? { correct: 0, total: 0 };
      return { ...previous, [level]: { correct: existing.correct + (correct ? 1 : 0), total: existing.total + 1 } };
    });
  };

  const next = () => {
    if (!current) return;
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex(value => value + 1);
    setSelected("");
  };

  const suggestedLevel = useMemo(() => {
    const order = ["N2", "N3", "N4", "N5"];
    for (const level of order) {
      const result = levelScores[level];
      if (result && result.total >= 2 && result.correct / result.total >= 0.67) return level;
    }
    return "N5";
  }, [levelScores]);

  if (!questions.length) return null;

  return (
    <details className="placement-panel" open={autoOpen || active || finished}>
      <summary>{t("placementDiagnostic", language)}</summary>
      {!active ? (
        <div className="placement-intro">
          <p>{t("placementDiagnosticHint", language)}</p>
          <button className="button primary" type="button" onClick={start}>{t("startDiagnostic", language)}</button>
        </div>
      ) : finished ? (
        <div className="placement-result" aria-live="polite">
          <div className="placement-result-score">
            <span>{t("diagnosticResult", language)}</span>
            <strong>{formatNumber(score, language)} / {formatNumber(questions.length, language)}</strong>
          </div>
          <div className="placement-levels">
            {DIAGNOSTIC_LEVELS.map(level => {
              const result = levelScores[level] ?? { correct: 0, total: 0 };
              return <div className="placement-level" key={level}><span>{level}</span><strong>{formatNumber(result.correct, language)} / {formatNumber(result.total, language)}</strong></div>;
            })}
          </div>
          <p className="placement-suggestion">{t("diagnosticSuggestedLevel", language)} <strong>{suggestedLevel}</strong></p>
          <div className="placement-actions">
            <button className="button secondary" type="button" onClick={start}>{t("retakeDiagnostic", language)}</button>
            <button className="button primary" type="button" disabled={starting} onClick={async () => {
              setStarting(true);
              try {
                const started = await onStartCustomStudy({ level: suggestedLevel as CustomStudyFilter["level"], focus: "available", limit: 20 });
                if (started) setActive(false);
              } finally {
                setStarting(false);
              }
            }}>{starting ? "…" : t("startSuggestedStudy", language)}</button>
          </div>
        </div>
      ) : current ? (
        <div className="placement-question">
          <div className="placement-progress"><span>{t("diagnosticQuestion", language)} {formatNumber(index + 1, language)} / {formatNumber(questions.length, language)}</span><strong>{current.level ?? "—"}</strong></div>
          <div className="placement-stimulus" lang="ja">{current.item.character}</div>
          <p className="placement-prompt">{t("diagnosticMeaningPrompt", language)}</p>
          <div className="placement-options">
            {current.options.map(option => {
              const isCorrect = option.correct;
              const isSelected = option.label === selected;
              return <button key={option.id} className={"placement-option " + (selected ? (isCorrect ? "correct" : isSelected ? "wrong" : "") : "")} type="button" disabled={Boolean(selected)} onClick={() => choose(option.label)}>
                <span>{option.label}</span>{selected && isCorrect ? <b aria-label={t("correct", language)}>✓</b> : null}
              </button>;
            })}
          </div>
          {selected ? <div className="placement-feedback" role="status">{selected === current.options.find(option => option.correct)?.label ? t("diagnosticCorrect", language) : t("diagnosticIncorrect", language)}</div> : null}
          {selected ? <button className="button primary" type="button" onClick={next}>{index + 1 >= questions.length ? t("finishDiagnostic", language) : t("nextDiagnostic", language)}</button> : null}
        </div>
      ) : null}
    </details>
  );
}
