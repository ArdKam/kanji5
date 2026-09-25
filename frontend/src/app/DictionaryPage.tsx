import { useEffect, useMemo, useState } from "react";
import { ComponentBreakdown } from "./ComponentBreakdown";
import { StrokeOrderViewer } from "./StrokeOrderViewer";
import { formatNumber, t, type Language } from "./i18n";
import { getComponentInfo, getMnemonic, listKanji, saveMnemonic, type ComponentInfo, type CustomStudyFilter, type KanjiCatalogItem } from "./engine";
import { PREPARED_MNEMONICS, type PreparedMnemonic } from "./mnemonic-library";

type LevelFilter = "all" | "N5" | "N4" | "N3" | "N2" | "N1";
type SortMode = "level-asc" | "level-desc" | "mastery-desc" | "mastery-asc" | "order";
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

function PreparedMnemonicPanel({ character, language }: { character: string; language: Language }) {
  const suggestions = PREPARED_MNEMONICS[character] ?? [];
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [status, setStatus] = useState("");

  const applySuggestion = async (suggestion: PreparedMnemonic, index: number) => {
    if (busyIndex !== null) return;
    setStatus("");
    setBusyIndex(index);
    try {
      const current = await getMnemonic(character);
      const existing = String(current.text ?? "").trim();
      if (existing && existing !== (language === "fa" ? suggestion.fa : suggestion.en)) {
        const message = t("mnemonicOverwriteConfirm", language);
        if (!window.confirm(message)) return;
      }
      await saveMnemonic(character, language === "fa" ? suggestion.fa : suggestion.en);
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

function DictionaryKanjiCard({ item, language, onClose }: { item: KanjiCatalogItem; language: Language; onClose: () => void }) {
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
        {item.meanings.length ? <div className="dictionary-card-section"><span>{t("meaning", language)}</span><strong>{item.meanings.join(" · ")}</strong></div> : null}
        {componentInfo?.available && componentInfo.components.length ? (
          <ComponentBreakdown
            info={componentInfo}
            title={language === "fa" ? "ساختار کانجی" : "Kanji structure"}
            note={language === "fa" ? "اجزای دیداری" : "Visual components"}
            ariaLabel={language === "fa" ? "ساختار دیداری کانجی" : "Kanji visual structure"}
          />
        ) : null}
        <div className="readings-header dictionary-readings-header">
          <span>{language === "fa" ? "خوانش‌ها" : "Readings"}</span>
        </div>
        <div className="readings learning-back-readings dictionary-readings">
          <DictionaryReading title="On’yomi" values={item.on} language={language} />
          <DictionaryReading title="Kun’yomi" values={item.kun} language={language} />
        </div>
        <PreparedMnemonicPanel character={item.character} language={language} />
        <div className="dictionary-card-meta">
          {item.strokes ? <span>{t("dictionaryStrokes", language)} {formatNumber(item.strokes, language)}</span> : null}
          {item.grade ? <span>{t("dictionaryGrade", language)} {formatNumber(item.grade, language)}</span> : null}
          {item.frequency ? <span>{t("dictionaryFrequency", language)} #{formatNumber(item.frequency, language)}</span> : null}
        </div>
      </div>
    </dialog>
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
      ) : null}

      {selected ? <DictionaryKanjiCard item={selected} language={language} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
