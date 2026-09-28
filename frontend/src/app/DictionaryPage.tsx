import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { getComponentInfo, getMnemonic, listKanji, saveMnemonic, type KanjiCatalogItem } from "./engine";
import { buildPreparedMnemonic } from "./prepared-mnemonic-core";
import type { PreparedMnemonic } from "./mnemonic-library";
import { DictionaryKanjiCard } from "./DictionaryKanjiCard";

type LevelFilter = "all" | "N5" | "N4" | "N3" | "N2" | "N1";
type MasteryFilter = "all" | "unseen" | "learning" | "attention" | "mastered";
type ViewMode = "matrix" | "detailed";
type SortMode = "level-asc" | "level-desc" | "mastery-desc" | "mastery-asc" | "order";
const levelRank: Record<string, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };

const normalize = (value: string) => value.trim().toLocaleLowerCase();


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
      const current = await getMnemonic(item.character);
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
          <h3>{suggestion.source === "curated" ? t("preparedMnemonics", language) : t("memoryAid", language)}</h3>
          <p>{t("preparedMnemonicsHint", language)}</p>
        </div>
      </div>
      {suggestions.length ? (
        <div className="prepared-mnemonic-list">
          {suggestions.map((suggestion, index) => {
            const text = language === "fa" ? suggestion.fa : suggestion.en;
            return (
              <div className="prepared-mnemonic-item" key={item.character + "-" + index}>
                <p>{text}</p>
                {suggestion.source === "curated" ? (
                  <button
                    className="button secondary prepared-mnemonic-use"
                    type="button"
                    disabled={busyIndex !== null}
                    onClick={() => void applySuggestion(suggestion, index)}
                  >
                    {busyIndex === index ? "…" : t("useMnemonic", language)}
                  </button>
                ) : (
                  <span className="prepared-mnemonic-scaffold-label">{t("preparedMnemonicScaffold", language)}</span>
                )}
              </div>
            );
          })}
        </div>
      ) : <p className="prepared-mnemonic-empty">{t("preparedMnemonicNone", language)}</p>}
      {status ? <p className="prepared-mnemonic-status" role="status">{status}</p> : null}
    </section>
  );
}


export function DictionaryPage({ language, externalSelectedCharacter, onExternalSelectionConsumed }: { language: Language; externalSelectedCharacter?: string | null; onExternalSelectionConsumed?: () => void }) {
  const [catalog, setCatalog] = useState<KanjiCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>("all");
  const [grade, setGrade] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [sort, setSort] = useState<SortMode>("level-asc");
  const [selected, setSelected] = useState<KanjiCatalogItem | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    void listKanji().then((value) => {
      if (!active) return;
      setCatalog(value.results);
      setLoading(false);
    }).catch(() => {
      if (active) {
        setCatalog([]);
        setLoadError(true);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [loadAttempt]);

  useEffect(() => {
    if (!externalSelectedCharacter) return;
    const item = catalog.find(candidate => candidate.character === externalSelectedCharacter);
    if (!item) return;
    setSelected(item);
    onExternalSelectionConsumed?.();
  }, [catalog, externalSelectedCharacter, onExternalSelectionConsumed]);

  const visible = useMemo(() => {
    const q = normalize(query);
    const filtered = catalog.filter((item) => {
      if (level !== "all" && item.jlpt !== level) return false;
      if (grade !== "all") {
        if (grade === "secondary") {
          if (!item.grade || item.grade <= 6) return false;
        } else if (String(item.grade ?? "") !== grade) {
          return false;
        }
      }
      if (masteryFilter !== "all") {
        const state = item.state || "unseen";
        if (masteryFilter === "attention") {
          if (!["weak", "recovering"].includes(state)) return false;
        } else if (masteryFilter === "learning") {
          if (!["learning", "introduced"].includes(state)) return false;
        } else if (state !== masteryFilter) {
          return false;
        }
      }
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
  }, [catalog, grade, level, masteryFilter, query, sort]);

  useEffect(() => {
    if (viewMode === "detailed" && visible.length > 160) setViewMode("matrix");
  }, [viewMode, visible.length]);

  return (
    <section className="dictionary-page" aria-labelledby="dictionary-page-title">
      <div className="dictionary-page-header">
        <div>
          <p className="eyebrow red">{t("dictionary", language)}</p>
          <h2 id="dictionary-page-title">{t("dictionaryTitle", language)}</h2>
        </div>
        <span className="dictionary-count">{formatNumber(visible.length, language)} / {formatNumber(catalog.length, language)}</span>
      </div>

      <div className="dictionary-page-search">
        <label className="dictionary-search-field">
          <span className="sr-only">{t("dictionaryPlaceholder", language)}</span>
          <span className="dictionary-search-icon" aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("dictionaryPlaceholder", language)}
            aria-label={t("dictionaryPlaceholder", language)}
            dir="auto"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button
              className="dictionary-search-clear"
              type="button"
              aria-label={language === "fa" ? "پاک کردن جست‌وجو" : "Clear search"}
              onClick={() => setQuery("")}
            >×</button>
          ) : null}
        </label>
        <p className="dictionary-search-hint" aria-live="polite">
          {query ? (language === "fa" ? "جست‌وجو در کانجی، خوانش و معنی" : "Searching character, readings and meanings") : (language === "fa" ? "کانجی، خوانش یا معنی را جست‌وجو کن." : "Search by character, reading or meaning.")}
        </p>
      </div>

      <div className="dictionary-controls">
        <div className="dictionary-filter-row">
          <div className="dictionary-level-filter" role="group" aria-label={t("dictionaryLevel", language)}>
            {(["all", "N5", "N4", "N3", "N2", "N1"] as LevelFilter[]).map((value) => (
              <button key={value} className={"dictionary-filter-button " + (level === value ? "active" : "")} type="button" aria-pressed={level === value} onClick={() => setLevel(value)}>
                {value === "all" ? t("allLevels", language) : value}
              </button>
            ))}
          </div>
          <label className="dictionary-select-filter">
            <span>{language === "fa" ? "تسلط" : "Mastery"}</span>
            <select value={masteryFilter} onChange={(event) => setMasteryFilter(event.target.value as MasteryFilter)}>
              <option value="all">{language === "fa" ? "همه" : "All"}</option>
              <option value="unseen">{language === "fa" ? "دیده‌نشده" : "Unseen"}</option>
              <option value="learning">{language === "fa" ? "در حال یادگیری" : "Learning"}</option>
              <option value="attention">{language === "fa" ? "نیازمند توجه" : "Needs attention"}</option>
              <option value="mastered">{language === "fa" ? "مسلط" : "Mastered"}</option>
            </select>
          </label>
          <label className="dictionary-select-filter">
            <span>{language === "fa" ? "پایه" : "Grade"}</span>
            <select value={grade} onChange={(event) => setGrade(event.target.value)}>
              <option value="all">{language === "fa" ? "همه" : "All"}</option>
              {Array.from({length:6},(_,index)=>String(index+1)).map(value => <option key={value} value={value}>{language === "fa" ? "پایه " + value : "Grade " + value}</option>)}
              <option value="secondary">{language === "fa" ? "متوسطه" : "Secondary"}</option>
            </select>
          </label>
        </div>
        <div className="dictionary-display-row">
          <div className="dictionary-view-toggle" role="group" aria-label={language === "fa" ? "نمایش فرهنگ" : "Dictionary view"}>
            <button className={"dictionary-view-button" + (viewMode === "matrix" ? " active" : "")} type="button" aria-pressed={viewMode === "matrix"} onClick={() => setViewMode("matrix")}>
              <span aria-hidden="true">⊞</span>{language === "fa" ? "شبکه" : "Matrix"}
            </button>
            <button
              className={"dictionary-view-button" + (viewMode === "detailed" ? " active" : "")}
              type="button"
              aria-pressed={viewMode === "detailed"}
              disabled={visible.length > 160}
              title={visible.length > 160 ? (language === "fa" ? "برای نمای جزئی‌تر، جست‌وجو یا فیلتر را محدودتر کن." : "Narrow the search or filters before using detailed view.") : undefined}
              onClick={() => setViewMode("detailed")}
            >
              <span aria-hidden="true">≡</span>{language === "fa" ? "جزئیات" : "Detailed"}
            </button>
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
      </div>

      {loading ? <div className="surface loading dictionary-loading" role="status">{t("dictionaryLoading", language)}</div> : null}
      {!loading && loadError ? (
        <div className="surface dictionary-empty" role="alert">
          <p>{language === "fa" ? "واژه‌نامه در حال حاضر بارگذاری نشد." : "The dictionary could not be loaded."}</p>
          <button className="button secondary" type="button" onClick={() => setLoadAttempt(value => value + 1)}>{t("tryAgain", language)}</button>
        </div>
      ) : null}
      {!loading && !loadError && !visible.length ? <div className="surface dictionary-empty" role="status">{t("dictionaryNoResults", language)}</div> : null}
      {!loading && visible.length ? (
        <>
          <div className={"kanji-catalog-grid" + (viewMode === "detailed" ? " is-detailed" : "")}>
          {visible.map((item) => {
            const mastery = Math.max(0, Math.min(1, Number(item.mastery) || 0));
            const fillOpacity = mastery === 0 ? 0 : 0.2 + mastery * 0.8;
            return (
              <button
                key={item.character}
                className={"kanji-catalog-tile" + (viewMode === "detailed" ? " is-detailed" : "")}
                type="button"
                data-jlpt={item.jlpt || "unknown"}
                data-mastery={mastery.toFixed(3)}
                data-mastery-state={item.state || "unseen"}
                aria-label={item.character + " — " + (item.jlpt || "unknown") + " — " + formatNumber(Math.round(mastery * 100), language) + "%"}
                onClick={() => setSelected(item)}
              >
                <span className="kanji-catalog-fill" style={{ height: (mastery * 100) + "%", opacity: fillOpacity }} />
                <span className="kanji-catalog-character" lang="ja">{item.character}</span>
                {viewMode === "detailed" ? (
                  <span className="kanji-catalog-details">
                    <span className="kanji-catalog-details-meta">
                      {item.jlpt || "—"}{item.grade ? " · G" + formatNumber(item.grade, language) : ""}
                    </span>
                    <bdi className="kanji-catalog-details-readings" dir="auto" lang="ja">
                      {[...item.on.slice(0,2), ...item.kun.slice(0,2)].slice(0,3).join(" · ")}
                    </bdi>
                    <bdi className="kanji-catalog-details-meaning" dir="auto">{item.meanings.slice(0,2).join(" · ")}</bdi>
                  </span>
                ) : null}
              </button>
            );
          })}
          </div>
        </>
      ) : null}

      {selected ? (
        <DictionaryKanjiCard
          item={selected}
          catalog={catalog}
          language={language}
          onClose={() => setSelected(null)}
          onSelectKanji={setSelected}
          mnemonicContent={<PreparedMnemonicPanel item={selected} language={language} />}
        />
      ) : null}
    </section>
  );
}
