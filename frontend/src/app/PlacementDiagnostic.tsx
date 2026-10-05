import { useMemo, useState, useEffect } from "react";
import { formatNumber, t, type Language } from "./i18n";
import type { CustomStudyFilter, KanjiCatalogItem } from "./engine";
import { buildPlacementQuestions, DIAGNOSTIC_LEVELS, scorePlacementAnswers } from "./placement-logic";

export function PlacementDiagnostic({ catalog, language, onStartCustomStudy, autoOpen = false }: { catalog: KanjiCatalogItem[]; language: Language; onStartCustomStudy: (filter: CustomStudyFilter) => Promise<boolean>; autoOpen?: boolean }) {
  const [diagnosticSeed, setDiagnosticSeed] = useState(0);
  const questions = useMemo(
    () => buildPlacementQuestions(catalog, t("diagnosticMeaningPrompt", language), diagnosticSeed),
    [catalog, language, diagnosticSeed],
  );

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
    const bytes = new Uint32Array(1);
    const nextSeed = typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function"
      ? (crypto.getRandomValues(bytes), bytes[0])
      : Date.now();
    setDiagnosticSeed(nextSeed);
    setIndex(0);
    setSelected("");
    setScore(0);
    setAnswers({});
    setFinished(false);
    setActive(true);
  };

  const choose = (option: string) => {
    if (!current || selected) return;
    const optionRecord = current.options.find(item => item.label === option);
    if (!optionRecord) return;
    setSelected(option);
    setAnswers(previous => ({ ...previous, [current.id]: optionRecord.id }));
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

  const placementScore = useMemo(
    () => scorePlacementAnswers(questions, answers),
    [questions, answers],
  );
  const suggestedLevel = placementScore.suggestedLevel;

  if (!questions.length) return null;

  return (
    <details className="placement-panel" open={autoOpen || active || finished} data-placement-confidence={placementScore.confidence} data-placement-upper-bound={placementScore.upperBoundReached ? "true" : "false"}>
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
            <strong>{formatNumber(placementScore.score, language)} / {formatNumber(placementScore.total, language)}</strong>
          </div>
          <div className="placement-levels">
            {DIAGNOSTIC_LEVELS.map(level => {
              const result = placementScore.levelScores[level] ?? { correct: 0, total: 0 };
              return <div className="placement-level" key={level}><span>{level}</span><strong>{formatNumber(result.correct, language)} / {formatNumber(result.total, language)}</strong></div>;
            })}
          </div>
          <p className="placement-suggestion">{t("diagnosticSuggestedLevel", language)} <strong>{suggestedLevel}</strong></p>
          {placementScore.confidence === "boundary" ? <p className="placement-uncertainty placement-boundary" role="note">{t("diagnosticPlacementBoundary", language)}</p> : null}
          {placementScore.confidence === "limited" ? <p className="placement-uncertainty placement-limited" role="note">{t("diagnosticPlacementLimited", language)}</p> : null}
          {placementScore.upperBoundReached ? <p className="placement-uncertainty placement-upper-bound" role="note">{t("diagnosticPlacementUpperBound", language)}</p> : null}
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
