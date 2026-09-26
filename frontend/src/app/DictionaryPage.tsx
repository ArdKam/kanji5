import { useEffect, useMemo, useState } from "react";
import { ComponentBreakdown } from "./ComponentBreakdown";
import { StrokeOrderViewer } from "./StrokeOrderViewer";
import { formatNumber, t, type Language } from "./i18n";
import { getComponentInfo, getMnemonic, getVocabulary, listKanji, saveMnemonic, type ComponentInfo, type CustomStudyFilter, type KanjiCatalogItem, type VocabularyItem } from "./engine";
import { buildPreparedMnemonic, buildPreparedMnemonicEntries } from "./prepared-mnemonic-core";
import type { PreparedMnemonic } from "./mnemonic-library";
import { HandwritingPractice } from "./HandwritingPractice";
import { ReadingLab } from "./ReadingLab";
import { GrammarGuide } from "./GrammarGuide";
import { MnemonicBackup } from "./MnemonicBackup";

type LevelFilter = "all" | "N5" | "N4" | "N3" | "N2" | "N1";
type SortMode = "level-asc" | "level-desc" | "mastery-desc" | "mastery-asc" | "order";
const diagnosticLevels = ["N5", "N4", "N3", "N2"] as const;
const levelRank: Record<string, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };

const normalize = (value: string) => value.trim().toLocaleLowerCase();

function DictionaryAudio({ value, label }: { value: string; label: string }) {
  const unsupported = typeof window.speechSynthesis?.speak !== "function" || typeof window.SpeechSynthesisUtterance !== "function";
  return (
    <button className="audio-button dictionary-audio-button" type="button" disabled={unsupported} aria-label={unsupported ? t("audioUnavailable") : label}
      onClick={() => {
        if (unsupported) return;
        const utterance = new SpeechSynthesisUtterance(value);
        utterance.lang = "ja-JP";
        utterance.rate = 0.85;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }}>
      🔊
    </button>
  );
}

function DictionaryReading({ title, values, language }: { title: string; values: string[]; language: Language }) {
  const first = values[0];
  return (
    <div className="reading dictionary-reading">
      <span>{title}</span>
      <strong lang="ja">{values.length ? values.join(" · ") : "—"}</strong>
      {first ? <DictionaryAudio value={first} label={t("playReading", language) + " " + title} /> : null}
    </div>
  );
}

function PreparedMnemonicLibrary({ language, catalog, onSelectKanji }: { language: Language; catalog: KanjiCatalogItem[]; onSelectKanji: (item: KanjiCatalogItem) => void }) {
  const catalogByCharacter = useMemo(() => new Map(catalog.map(item => [item.character, item])), [catalog]);
  const entries = useMemo(
    () => buildPreparedMnemonicEntries(catalog).map((entry, index) => ({ ...entry, index })),
    [catalog]
  );
  const [query, setQuery] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [status, setStatus] = useState("");
  const visible = useMemo(() => {
    const q = normalize(query);
    return entries.filter(entry => {
      if (!q) return true;
      const mnemonic = language === "fa" ? entry.suggestion.fa : entry.suggestion.en;
      return normalize(entry.character).includes(q) || normalize(mnemonic).includes(q);
    });
  }, [entries, language, query]);

  const apply = async (character: string, suggestion: PreparedMnemonic, key: string) => {
    if (busyKey) return;
    setBusyKey(key);
    setStatus("");
    try {
      const current = await getMnemonic(character);
      const existing = String(current.text ?? "").trim();
      const next = language === "fa" ? suggestion.fa : suggestion.en;
      if (existing && existing !== next && !window.confirm(t("mnemonicOverwriteConfirm", language))) return;
      await saveMnemonic(character, next);
      setStatus((language === "fa" ? "یادسپار «" : "Mnemonic for ") + character + (language === "fa" ? "» ذخیره شد." : " saved."));
    } catch {
      setStatus(t("mnemonicSaveError", language));
    } finally {
      setBusyKey("");
    }
  };

  return (
    <details className="prepared-mnemonic-library" open>
      <summary>{t("preparedMnemonicLibrary", language)}</summary>
      <p className="prepared-mnemonic-library-hint">{t("preparedMnemonicLibraryHint", language)}</p>
      <input
        className="prepared-mnemonic-library-search"
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder={t("preparedMnemonicLibrarySearch", language)}
        aria-label={t("preparedMnemonicLibrarySearch", language)}
      />
      <div className="prepared-mnemonic-library-count">
        {formatNumber(visible.length, language)} / {formatNumber(entries.length, language)}
      </div>
      <div className="prepared-mnemonic-library-list" role="list">
        {visible.map(entry => {
          const key = entry.character + "-" + entry.index;
          const mnemonic = language === "fa" ? entry.suggestion.fa : entry.suggestion.en;
          return (
            <div className="prepared-mnemonic-library-row" key={key} role="listitem">
              <button className="prepared-mnemonic-library-kanji" type="button" onClick={() => {
                const item = catalogByCharacter.get(entry.character);
                if (item) onSelectKanji(item);
              }} lang="ja" title={t("lookupKanji", language)}>{entry.character}</button>
              <p>{mnemonic}</p>
              <button className="button secondary prepared-mnemonic-library-use" type="button" disabled={busyKey !== ""} onClick={() => void apply(entry.character, entry.suggestion, key)}>
                {busyKey === key ? "…" : t("useMnemonic", language)}
              </button>
            </div>
          );
        })}
      </div>
      {status ? <p className="prepared-mnemonic-status" role="status">{status}</p> : null}
    </details>
  );
}

function VocabularyExamples({ character: kanjiCharacter, language }: { character: string; language: Language }) {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setItems([]);
    setLoading(true);
    void getVocabulary(kanjiCharacter).then(result => {
      if (active) setItems(result.items ?? []);
    }).catch(() => {
      if (active) setItems([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [kanjiCharacter]);

  return (
    <section className="dictionary-vocabulary" aria-label={t("dictionaryVocabulary", language)}>
      <div className="dictionary-vocabulary-header">
        <div>
          <h3>{t("dictionaryVocabulary", language)}</h3>
          <p>{t("dictionaryVocabularyHint", language)}</p>
        </div>
      </div>
      {loading ? <div className="dictionary-vocabulary-status" role="status">{t("dictionarySearching", language)}</div> : null}
      {!loading && items.length ? (
        <div className="dictionary-vocabulary-list">
          {items.map(item => (
            <div className="dictionary-vocabulary-item" key={item.word + "-" + item.reading}>
              <div className="dictionary-vocabulary-main">
                <strong lang="ja">{item.word}</strong>
                <span lang="ja">{item.reading}</span>
              </div>
              <p>{item.meaning}</p>
              <DictionaryAudio value={item.reading} label={t("playWordPronunciation", language) + " " + item.word} />
            </div>
          ))}
        </div>
      ) : null}
      {!loading && !items.length ? <p className="dictionary-vocabulary-empty">{t("dictionaryVocabularyEmpty", language)}</p> : null}
    </section>
  );
}

function PreparedMnemonicPanel({ item, language }: { item: KanjiCatalogItem; language: Language }) {
  const [suggestion, setSuggestion] = useState<PreparedMnemonic>(() => buildPreparedMnemonic(item));
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    setSuggestion(buildPreparedMnemonic(item));
    void getComponentInfo(item.character).then(info => {
      if (active) setSuggestion(buildPreparedMnemonic(item, info.components));
    }).catch(() => {});
    return () => { active = false; };
  }, [item.character]);

  const suggestions = suggestion.fa || suggestion.en ? [suggestion] : [];

  const applySuggestion = async (prepared: PreparedMnemonic, index: number) => {
    if (busyIndex !== null) return;
    setStatus("");
    setBusyIndex(index);
    try {
      const current = await getMnemonic(character);
      const existing = String(current.text ?? "").trim();
      if (existing && existing !== (language === "fa" ? prepared.fa : prepared.en)) {
        const message = t("mnemonicOverwriteConfirm", language);
        if (!window.confirm(message)) return;
      }
      await saveMnemonic(item.character, language === "fa" ? prepared.fa : prepared.en);
      setStatus(t("mnemonicApplied", language));
    } catch {
      setStatus(t("mnemonicSaveError", language));
    } finally {
      setBusyIndex(null);
    }
  };

  return (
    <section className="prepared-mnemonic-panel" aria-label={t("preparedMnemonics", language)}>
      <div className="prepared-mnemonic-header">
        <div>
          <h3>{t("preparedMnemonics", language)}</h3>
          <p>{t("preparedMnemonicsHint", language)}</p>
        </div>
      </div>
      {suggestions.length ? (
        <div className="prepared-mnemonic-list">
          {suggestions.map((suggestion, index) => {
            const text = language === "fa" ? suggestion.fa : suggestion.en;
            return (
              <div className="prepared-mnemonic-item" key={character + "-" + index}>
                <p>{text}</p>
                <button
                  className="button secondary prepared-mnemonic-use"
                  type="button"
                  disabled={busyIndex !== null}
                  onClick={() => void applySuggestion(suggestion, index)}
                >
                  {busyIndex === index ? "…" : t("useMnemonic", language)}
                </button>
              </div>
            );
          })}
        </div>
      ) : <p className="prepared-mnemonic-empty">{t("preparedMnemonicNone", language)}</p>}
      {status ? <p className="prepared-mnemonic-status" role="status">{status}</p> : null}
    </section>
  );
}


function ComponentLearningPath({
  character,
  components,
  catalog,
  language,
  onSelectKanji,
}: {
  character: string;
  components: string[];
  catalog: KanjiCatalogItem[];
  language: Language;
  onSelectKanji: (item: KanjiCatalogItem) => void;
}) {
  const catalogByCharacter = useMemo(() => new Map(catalog.map(item => [item.character, item])), [catalog]);
  const directComponents = useMemo(() => components.slice(0, 8), [components]);
  const [nested, setNested] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let active = true;
    setNested({});
    void Promise.all(directComponents.map(async component => {
      try {
        const info = await getComponentInfo(component);
        return [component, info.available ? info.components.slice(0, 5) : []] as const;
      } catch {
        return [component, []] as const;
      }
    })).then(entries => {
      if (!active) return;
      setNested(Object.fromEntries(entries));
    });
    return () => { active = false; };
  }, [directComponents]);

  if (!directComponents.length) return null;

  return (
    <section className="component-learning-path" aria-label={language === "fa" ? "مسیر یادگیری اجزای کانجی" : "Kanji component learning path"}>
      <div className="component-learning-path-header">
        <div>
          <h3>{t("componentLearningPath", language)}</h3>
          <p>{t("componentLearningPathHint", language)}</p>
        </div>
        <span className="component-learning-path-root" lang="ja">{character}</span>
      </div>
      <div className="component-learning-path-list" role="list">
        {directComponents.map(component => {
          const item = catalogByCharacter.get(component);
          const mastery = item ? Math.round(Math.max(0, Math.min(1, Number(item.mastery) || 0)) * 100) : null;
          const children = nested[component] ?? [];
          return (
            <div className="component-learning-path-item" key={component} role="listitem">
              <div className="component-learning-path-main">
                {item ? (
                  <button
                    className="component-learning-path-kanji"
                    type="button"
                    lang="ja"
                    onClick={() => onSelectKanji(item)}
                    title={t("lookupKanji", language)}
                  >
                    {component}
                  </button>
                ) : (
                  <span className="component-learning-path-kanji is-static" lang="ja">{component}</span>
                )}
                <div className="component-learning-path-copy">
                  <strong>{item ? (language === "fa" ? "کانجیِ جویو" : "Jōyō kanji") : (language === "fa" ? "جزء دیداری" : "Visual component")}</strong>
                  {children.length ? (
                    <span lang="ja">{children.join(" + ")}</span>
                  ) : (
                    <span>{t("componentLearningPathLeaf", language)}</span>
                  )}
                </div>
              </div>
              {mastery !== null ? (
                <span className="component-learning-path-mastery">{t("masteryShort", language)} {formatNumber(mastery, language)}%</span>
              ) : (
                <span className="component-learning-path-mastery is-unavailable">{t("notInCatalog", language)}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DictionaryKanjiCard({ item, language, onClose, catalog, onSelectKanji }: { item: KanjiCatalogItem; language: Language; onClose: () => void; catalog: KanjiCatalogItem[]; onSelectKanji: (item: KanjiCatalogItem) => void }) {
  const mastery = Math.round(Math.max(0, Math.min(1, item.mastery)) * 100);
  const [componentInfo, setComponentInfo] = useState<ComponentInfo | null>(null);

  useEffect(() => {
    let active = true;
    setComponentInfo(null);
    void getComponentInfo(item.character).then((info) => {
      if (active) setComponentInfo(info);
    }).catch(() => {
      if (active) setComponentInfo(null);
    });
    return () => { active = false; };
  }, [item.character]);

  return (
    <dialog open className="dialog dictionary-card-dialog" aria-label={t("dictionary", language)}>
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <div className="dictionary-card">
        <div className="dictionary-card-top">
          <span className="badge badge-red">{item.jlpt || "—"}</span>
          <span className="dictionary-card-mastery">{t("dictionaryMastery", language)} {formatNumber(mastery, language)}%</span>
        </div>
        <div className="dictionary-stroke-order-wrap">
          <StrokeOrderViewer character={item.character} language={language} mode="dictionary-loop" />
          <DictionaryAudio value={item.character} label={t("playKanjiPronunciation", language)} />
        </div>
        <HandwritingPractice character={item.character} language={language} />
        {item.meanings.length ? <div className="dictionary-card-section"><span>{t("meaning", language)}</span><strong>{item.meanings.join(" · ")}</strong></div> : null}
        {componentInfo?.available && componentInfo.components.length ? (
          <ComponentBreakdown
            info={componentInfo}
            title={language === "fa" ? "ساختار کانجی" : "Kanji structure"}
            note={language === "fa" ? "اجزای دیداری" : "Visual components"}
            ariaLabel={language === "fa" ? "ساختار دیداری کانجی" : "Kanji visual structure"}
          />
        ) : null}
        {componentInfo?.available && componentInfo.components.length ? (
          <ComponentLearningPath character={item.character} components={componentInfo.components} catalog={catalog} language={language} onSelectKanji={onSelectKanji} />
        ) : null}
        <div className="readings-header dictionary-readings-header">
          <span>{language === "fa" ? "خوانش‌ها" : "Readings"}</span>
        </div>
        <div className="readings learning-back-readings dictionary-readings">
          <DictionaryReading title="On’yomi" values={item.on} language={language} />
          <DictionaryReading title="Kun’yomi" values={item.kun} language={language} />
        </div>
        <VocabularyExamples character={item.character} language={language} />
        <PreparedMnemonicPanel item={item} language={language} />
        <div className="dictionary-card-meta">
          {item.strokes ? <span>{t("dictionaryStrokes", language)} {formatNumber(item.strokes, language)}</span> : null}
          {item.grade ? <span>{t("dictionaryGrade", language)} {formatNumber(item.grade, language)}</span> : null}
          {item.frequency ? <span>{t("dictionaryFrequency", language)} #{formatNumber(item.frequency, language)}</span> : null}
        </div>
      </div>
    </dialog>
  );
}

function PlacementDiagnostic({ catalog, language, onStartCustomStudy }: { catalog: KanjiCatalogItem[]; language: Language; onStartCustomStudy: (filter: CustomStudyFilter) => Promise<boolean> }) {
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

export function DictionaryPage({ language, onStartCustomStudy }: { language: Language; onStartCustomStudy: (filter: CustomStudyFilter) => Promise<boolean> }) {
  const [catalog, setCatalog] = useState<KanjiCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [sort, setSort] = useState<SortMode>("level-asc");
  const [selected, setSelected] = useState<KanjiCatalogItem | null>(null);
  const [customFocus, setCustomFocus] = useState<CustomStudyFilter["focus"]>("available");
  const [customLimit, setCustomLimit] = useState(20);
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    void listKanji().then((value) => {
      if (!active) return;
      setCatalog(value.results);
      setLoading(false);
    }).catch(() => {
      if (active) {
        setCatalog([]);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const masterySummary = useMemo(() => {
    const total = catalog.length || 1;
    const average = catalog.reduce((sum, item) => sum + Math.max(0, Math.min(1, Number(item.mastery) || 0)), 0) / total;
    const count = (name: string) => catalog.filter(item => item.state === name).length;
    return {
      average,
      mastered: count("mastered"),
      stable: count("stable"),
      learning: count("learning") + count("introduced"),
      attention: count("weak") + count("recovering"),
      unseen: count("unseen"),
    };
  }, [catalog]);

  const visible = useMemo(() => {
    const q = normalize(query);
    const filtered = catalog.filter((item) => {
      if (level !== "all" && item.jlpt !== level) return false;
      if (!q) return true;
      return [item.character, ...item.meanings, ...item.on, ...item.kun].some((value) => normalize(value).includes(q));
    });
    const rows = filtered.slice();
    rows.sort((a, b) => {
      if (sort === "mastery-desc") return b.mastery - a.mastery || (levelRank[a.jlpt || ""] ?? 99) - (levelRank[b.jlpt || ""] ?? 99) || Number(a.order ?? Infinity) - Number(b.order ?? Infinity);
      if (sort === "mastery-asc") return a.mastery - b.mastery || (levelRank[a.jlpt || ""] ?? 99) - (levelRank[b.jlpt || ""] ?? 99) || Number(a.order ?? Infinity) - Number(b.order ?? Infinity);
      if (sort === "level-desc") return (levelRank[b.jlpt || ""] ?? 99) - (levelRank[a.jlpt || ""] ?? 99) || Number(a.order ?? Infinity) - Number(b.order ?? Infinity);
      if (sort === "order") return Number(a.order ?? Infinity) - Number(b.order ?? Infinity);
      return (levelRank[a.jlpt || ""] ?? 99) - (levelRank[b.jlpt || ""] ?? 99) || Number(a.order ?? Infinity) - Number(b.order ?? Infinity);
    });
    return rows;
  }, [catalog, level, query, sort]);

  return (
    <section className="dictionary-page" aria-labelledby="dictionary-page-title">
      <div className="dictionary-page-header">
        <div>
          <p className="eyebrow red">{t("dictionary", language)}</p>
          <h2 id="dictionary-page-title">{t("dictionaryTitle", language)}</h2>
        </div>
        <span className="dictionary-count">{formatNumber(visible.length, language)} / {formatNumber(catalog.length || 2136, language)}</span>
      </div>

      <section className="mastery-map-summary" aria-labelledby="mastery-map-title">
        <div className="mastery-map-summary-head">
          <div>
            <p className="eyebrow">{t("masteryMap", language)}</p>
            <h3 id="mastery-map-title">{t("masteryMapHint", language)}</h3>
          </div>
          <div className="mastery-map-average">
            <span>{t("masteryAverage", language)}</span>
            <strong>{formatNumber(Math.round(masterySummary.average * 100), language)}%</strong>
          </div>
        </div>
        <div className="mastery-map-metrics">
          <div className="mastery-map-metric"><span className="mastery-swatch mastered" aria-hidden="true" /><strong>{formatNumber(masterySummary.mastered, language)}</strong><span>{t("masteryMastered", language)}</span></div>
          <div className="mastery-map-metric"><span className="mastery-swatch stable" aria-hidden="true" /><strong>{formatNumber(masterySummary.stable, language)}</strong><span>{t("masteryStable", language)}</span></div>
          <div className="mastery-map-metric"><span className="mastery-swatch learning" aria-hidden="true" /><strong>{formatNumber(masterySummary.learning, language)}</strong><span>{t("masteryLearning", language)}</span></div>
          <div className="mastery-map-metric"><span className="mastery-swatch attention" aria-hidden="true" /><strong>{formatNumber(masterySummary.attention, language)}</strong><span>{t("masteryNeedsAttention", language)}</span></div>
          <div className="mastery-map-metric"><span className="mastery-swatch unseen" aria-hidden="true" /><strong>{formatNumber(masterySummary.unseen, language)}</strong><span>{t("masteryUnseen", language)}</span></div>
        </div>
        {(() => {
          const buckets = [
            { key: "low", count: catalog.filter(item => item.mastery < 0.25).length, label: t("masteryRangeLow", language) },
            { key: "developing", count: catalog.filter(item => item.mastery >= 0.25 && item.mastery < 0.5).length, label: t("masteryRangeDeveloping", language) },
            { key: "strong", count: catalog.filter(item => item.mastery >= 0.5 && item.mastery < 0.75).length, label: t("masteryRangeStrong", language) },
            { key: "mastered", count: catalog.filter(item => item.mastery >= 0.75).length, label: t("masteryRangeMastered", language) },
          ];
          const totalBuckets = Math.max(1, catalog.length);
          return (
            <div className="mastery-distribution" aria-label={t("masteryDistribution", language)}>
              <div className="mastery-distribution-title">{t("masteryDistribution", language)}</div>
              <div className="mastery-distribution-bar" role="img" aria-label={buckets.map(bucket => bucket.label + " " + formatNumber(bucket.count, language)).join(" · ")}>
                {buckets.map(bucket => <span key={bucket.key} className={"mastery-distribution-segment " + bucket.key} style={{width:(bucket.count / totalBuckets * 100) + "%"}} />)}
              </div>
              <div className="mastery-distribution-legend">
                {buckets.map(bucket => <span key={bucket.key}><i className={"mastery-distribution-dot " + bucket.key} aria-hidden="true" />{bucket.label}<strong>{formatNumber(bucket.count, language)}</strong></span>)}
              </div>
            </div>
          );
        })()}
      </section>

      <label className="dictionary-page-search">
        <span className="sr-only">{t("dictionaryPlaceholder", language)}</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("dictionaryPlaceholder", language)} aria-label={t("dictionaryPlaceholder", language)} />
      </label>

      <div className="dictionary-controls">
        <div className="dictionary-level-filter" role="group" aria-label={t("dictionaryLevel", language)}>
          {(["all", "N5", "N4", "N3", "N2", "N1"] as LevelFilter[]).map((value) => (
            <button key={value} className={"dictionary-filter-button " + (level === value ? "active" : "")} type="button" aria-pressed={level === value} onClick={() => setLevel(value)}>
              {value === "all" ? t("allLevels", language) : value}
            </button>
          ))}
        </div>
        <label className="dictionary-sort">
          <span>{t("dictionarySort", language)}</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
            <option value="level-asc">{t("sortLevelAsc", language)}</option>
            <option value="level-desc">{t("sortLevelDesc", language)}</option>
            <option value="mastery-desc">{t("sortMasteryDesc", language)}</option>
            <option value="mastery-asc">{t("sortMasteryAsc", language)}</option>
            <option value="order">{t("sortOriginal", language)}</option>
          </select>
        </label>
      </div>

      <PlacementDiagnostic catalog={catalog} language={language} onStartCustomStudy={onStartCustomStudy} />

      <PreparedMnemonicLibrary language={language} catalog={catalog} onSelectKanji={setSelected} />

      <details className="custom-study-panel">
        <summary>{t("customStudy", language)}</summary>
        <p>{t("customStudyHint", language)}</p>
        <div className="custom-study-controls">
          <div className="custom-study-focus" role="group" aria-label={t("customFocus", language)}>
            {([
              ["available", t("customAvailable", language)],
              ["due", t("customDue", language)],
              ["new", t("customNew", language)],
              ["weak", t("customWeak", language)],
            ] as const).map(([value, label]) => (
              <button key={value} className={"dictionary-filter-button " + (customFocus === value ? "active" : "")} type="button" aria-pressed={customFocus === value} onClick={() => setCustomFocus(value)}>
                {label}
              </button>
            ))}
          </div>
          <label className="custom-study-limit">
            <span>{t("customLimit", language)}</span>
            <select value={customLimit} onChange={(event) => setCustomLimit(Number(event.target.value))}>
              {[5, 10, 20, 30, 50].map((value) => <option key={value} value={value}>{formatNumber(value, language)}</option>)}
            </select>
          </label>
        </div>
        <div className="custom-study-action">
          <span>{level === "all" ? t("allLevels", language) : level} · {t("customStudy", language)}</span>
          <button className="button primary" type="button" onClick={async () => {
            setCustomMessage("");
            const started = await onStartCustomStudy({ level, focus: customFocus, limit: customLimit });
            if (!started) setCustomMessage(t("customNoCards", language));
          }}>{t("customStart", language)}</button>
        </div>
        {customMessage ? <p className="custom-study-message" role="status">{customMessage}</p> : null}
      </details>

      {loading ? <div className="surface loading dictionary-loading">{t("dictionaryLoading", language)}</div> : null}
      {!loading && !visible.length ? <div className="surface dictionary-empty">{t("dictionaryNoResults", language)}</div> : null}
      {!loading && visible.length ? (
        <>
          <ReadingLab catalog={catalog} language={language} onSelectKanji={item => setSelected(item)} />

          <GrammarGuide language={language} />

          <MnemonicBackup catalog={catalog} language={language} />

          <div className="kanji-catalog-grid">
          {visible.map((item) => {
            const mastery = Math.max(0, Math.min(1, Number(item.mastery) || 0));
            const fillOpacity = mastery === 0 ? 0 : 0.2 + mastery * 0.8;
            return (
              <button
                key={item.character}
                className="kanji-catalog-tile"
                type="button"
                data-jlpt={item.jlpt || "unknown"}
                data-mastery={mastery.toFixed(3)}
                data-mastery-state={item.state || "unseen"}
                aria-label={item.character + " — " + (item.jlpt || "unknown") + " — " + formatNumber(Math.round(mastery * 100), language) + "%"}
                onClick={() => setSelected(item)}
              >
                <span className="kanji-catalog-fill" style={{ height: (mastery * 100) + "%", opacity: fillOpacity }} />
                <span className="kanji-catalog-character" lang="ja">{item.character}</span>
              </button>
            );
          })}
          </div>
        </>
      ) : null}

      {selected ? <DictionaryKanjiCard item={selected} catalog={catalog} language={language} onClose={() => setSelected(null)} onSelectKanji={setSelected} /> : null}
    </section>
  );
}
