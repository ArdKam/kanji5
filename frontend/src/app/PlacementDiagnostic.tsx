import { useMemo, useState, useEffect } from "react";
import { formatNumber, t, type Language } from "./i18n";
import type { CustomStudyFilter, KanjiCatalogItem } from "./engine";

const diagnosticLevels = ["N5", "N4", "N3", "N2"] as const;

export function PlacementDiagnostic({ catalog, language, onStartCustomStudy }: { catalog: KanjiCatalogItem[]; language: Language; onStartCustomStudy: (filter: CustomStudyFilter) => Promise<boolean> }) {
  const questions = useMemo(() => {
    const byLevel = new Map<string, KanjiCatalogItem[]>();
    catalog.filter(item => item.meanings.length && diagnosticLevels.includes(item.jlpt as typeof diagnosticLevels[number])).forEach(item => {
      const list = byLevel.get(item.jlpt ?? "") ?? [];
      list.push(item);
      byLevel.set(item.jlpt ?? "", list);
    });
    const selected: KanjiCatalogItem[] = [];
    for (const level of diagnosticLevels) {
      const pool = (byLevel.get(level) ?? []).slice().sort((a, b) => Number(a.order ?? Infinity) - Number(b.order ?? Infinity));
      selected.push(...pool.slice(0, 3));
    }
    if (selected.length < 8) {
      const fallback = catalog.filter(item => item.meanings.length).slice().sort((a, b) => Number(a.order ?? Infinity) - Number(b.order ?? Infinity));
      for (const item of fallback) {
        if (selected.includes(item)) continue;
        selected.push(item);
        if (selected.length >= 12) break;
      }
    }
    return selected.slice(0, 12).map((item, questionIndex) => {
      const correct = item.meanings[0];
      const distractors = catalog
        .filter(candidate => candidate.character !== item.character && candidate.meanings[0] && candidate.meanings[0] !== correct)
        .slice()
        .sort((a, b) => Number(a.order ?? Infinity) - Number(b.order ?? Infinity))
        .map(candidate => candidate.meanings[0])
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(questionIndex % 5, questionIndex % 5 + 3);
      return { item, answer: correct, options: [correct, ...distractors].slice(0, 4) };
    }).filter(question => question.options.length >= 2);
  }, [catalog]);

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
    const correct = option === current.answer;
    setSelected(option);
    setScore(value => value + (correct ? 1 : 0));
    setLevelScores(previous => {
      const level = current.item.jlpt ?? "unknown";
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
    <details className="placement-panel">
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
            {diagnosticLevels.map(level => {
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
          <div className="placement-progress"><span>{t("diagnosticQuestion", language)} {formatNumber(index + 1, language)} / {formatNumber(questions.length, language)}</span><strong>{current.item.jlpt ?? "—"}</strong></div>
          <div className="placement-stimulus" lang="ja">{current.item.character}</div>
          <p className="placement-prompt">{t("diagnosticMeaningPrompt", language)}</p>
          <div className="placement-options">
            {current.options.map(option => {
              const isCorrect = option === current.answer;
              const isSelected = option === selected;
              return <button key={option} className={"placement-option " + (selected ? (isCorrect ? "correct" : isSelected ? "wrong" : "") : "")} type="button" disabled={Boolean(selected)} onClick={() => choose(option)}>
                <span>{option}</span>{selected && isCorrect ? <b aria-label={t("correct", language)}>✓</b> : null}
              </button>;
            })}
          </div>
          {selected ? <div className="placement-feedback" role="status">{selected === current.answer ? t("diagnosticCorrect", language) : t("diagnosticIncorrect", language)}</div> : null}
          {selected ? <button className="button primary" type="button" onClick={next}>{index + 1 >= questions.length ? t("finishDiagnostic", language) : t("nextDiagnostic", language)}</button> : null}
        </div>
      ) : null}
    </details>
  );
}
