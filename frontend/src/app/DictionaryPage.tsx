import { useEffect, useMemo, useRef, useState } from "react";
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
const DETAILED_PAGE_SIZE = 160;

const normalize = (value: string) => value.trim().toLocaleLowerCase();


function PreparedMnemonicPanel({
  item,
  language,
  mnemonicDraft,
  onMnemonicDraftChange,
}: {
  item: KanjiCatalogItem;
  language: Language;
  mnemonicDraft: string | undefined;
  onMnemonicDraftChange: (value: string) => void;
}) {
  const [suggestion, setSuggestion] = useState<PreparedMnemonic>(() => buildPreparedMnemonic(item));
  const [personalMnemonic, setPersonalMnemonic] = useState("");
  const [mnemonicBusy, setMnemonicBusy] = useState(false);
  const [status, setStatus] = useState("");
  const mnemonicDraftEditedRef = useRef(false);

  useEffect(() => {
    let active = true;
    mnemonicDraftEditedRef.current = false;
    setSuggestion(buildPreparedMnemonic(item));
    setPersonalMnemonic("");
    setStatus("");
    void Promise.all([
      getComponentInfo(item.character).then(info => buildPreparedMnemonic(item, info.components)).catch(() => buildPreparedMnemonic(item)),
      getMnemonic(item.character),
    ]).then(([prepared, saved]) => {
      if (!active) return;
      setSuggestion(prepared);
      const text = String(saved?.text ?? "");
      setPersonalMnemonic(text);
      if (mnemonicDraft === undefined && !mnemonicDraftEditedRef.current) onMnemonicDraftChange(text);
    });
    return () => { active = false; };
  }, [item.character]);

  const suggestions = suggestion.fa || suggestion.en ? [suggestion] : [];
  const curatedText = suggestion.source === "curated" ? (language === "fa" ? suggestion.fa : suggestion.en) : "";

  const savePersonalMnemonic = async () => {
    if (mnemonicBusy) return;
    const next = (mnemonicDraft ?? "").trim();
    if (!personalMnemonic && !next) return;
    setMnemonicBusy(true);
    setStatus("");
    try {
      await saveMnemonic(item.character, next);
      setPersonalMnemonic(next);
      onMnemonicDraftChange(next);
      setStatus(t("mnemonicApplied", language));
    } catch {
      setStatus(t("mnemonicSaveError", language));
    } finally {
      setMnemonicBusy(false);
    }
  };

  return (
    <section className="prepared-mnemonic-panel dictionary-mnemonic-panel" aria-label={t("preparedMnemonics", language)}>
      <div className="prepared-mnemonic-header">
        <div>
          <h3>{suggestion.source === "curated" ? t("preparedMnemonics", language) : t("memoryAid", language)}</h3>
          <p>{t("preparedMnemonicsHint", language)}</p>
        </div>
      </div>
      {suggestions.length ? (
        <div className="prepared-mnemonic-list">
          {suggestions.map((prepared, index) => {
            const text = language === "fa" ? prepared.fa : prepared.en;
            return (
              <article className="prepared-mnemonic-item" key={item.character + "-" + index}>
                <p>{text}</p>
                <span className="prepared-mnemonic-scaffold-label">{prepared.source === "curated" ? (language === "fa" ? "منتخب" : "Curated") : t("preparedMnemonicScaffold", language)}</span>
              </article>
            );
          })}
        </div>
      ) : <p className="prepared-mnemonic-empty">{t("preparedMnemonicNone", language)}</p>}
      <section className="dictionary-personal-mnemonic" aria-label={t("personalMnemonic", language)}>
        <div className="dictionary-personal-mnemonic-heading">
          <div>
            <h3>{t("personalMnemonic", language)}</h3>
            <p>{language === "fa" ? "یادسپار شخصی خودت را همین‌جا بنویس." : "Write your own memory hook here."}</p>
          </div>
          <span>{formatNumber(mnemonicDraft.length, language)}/600</span>
        </div>
        <textarea
          className="dictionary-personal-mnemonic-input"
          value={mnemonicDraft ?? ""}
          maxLength={600}
          onChange={event => {
            mnemonicDraftEditedRef.current = true;
            onMnemonicDraftChange(event.target.value);
          }}
          placeholder={language === "fa" ? "یک تداعی شخصی بنویس…" : "Write a personal memory cue…"}
          aria-label={t("personalMnemonic", language)}
        />
        <div className="dictionary-personal-mnemonic-actions">
          {curatedText ? (
            <button className="button secondary" type="button" onClick={() => { setMnemonicDraft(curatedText); setStatus(""); }} disabled={mnemonicBusy}>
              {language === "fa" ? "کپی داستان منتخب" : "Copy curated story"}
            </button>
          ) : <span />}
          <button className="button primary" type="button" onClick={() => void savePersonalMnemonic()} disabled={mnemonicBusy || (!personalMnemonic && (mnemonicDraft ?? "").trim().length === 0)}>
            {mnemonicBusy ? t("saving", language) : t("saveMnemonic", language)}
          </button>
        </div>
        {status ? <p className="prepared-mnemonic-status" role="status">{status}</p> : null}
      </section>
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
  const [detailedVisibleCount, setDetailedVisibleCount] = useState(DETAILED_PAGE_SIZE);
  const [selected, setSelected] = useState<KanjiCatalogItem | null>(null);
  const [mnemonicDrafts, setMnemonicDrafts] = useState<Record<string, string | undefined>>({});

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
    setDetailedVisibleCount(DETAILED_PAGE_SIZE);
  }, [query, level, masteryFilter, grade, sort]);

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
            <button
              className={"dictionary-view-button" + (viewMode === "matrix" ? " active" : "")}
              type="button"
              aria-pressed={viewMode === "matrix"}
              aria-label={language === "fa" ? "نمای شبکه" : "Matrix view"}
              title={language === "fa" ? "نمای شبکه" : "Matrix view"}
              onClick={() => setViewMode("matrix")}
            >
              <span className="dictionary-view-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" focusable="false"><rect x="2.5" y="2.5" width="6" height="6" rx="1"/><rect x="11.5" y="2.5" width="6" height="6" rx="1"/><rect x="2.5" y="11.5" width="6" height="6" rx="1"/><rect x="11.5" y="11.5" width="6" height="6" rx="1"/></svg>
              </span>
              <span className="sr-only">{language === "fa" ? "شبکه" : "Matrix"}</span>
            </button>
            <button
              className={"dictionary-view-button" + (viewMode === "detailed" ? " active" : "")}
              type="button"
              aria-pressed={viewMode === "detailed"}
              aria-label={language === "fa" ? "نمای جزئیات" : "Detailed view"}
              title={language === "fa" ? "نمای جزئیات" : "Detailed view"}
              onClick={() => {
                setDetailedVisibleCount(DETAILED_PAGE_SIZE);
                setViewMode("detailed");
              }}
            >
              <span className="dictionary-view-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" focusable="false"><path d="M3 4.5h14M3 10h14M3 15.5h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/></svg>
              </span>
              <span className="sr-only">{language === "fa" ? "جزئیات" : "Detailed"}</span>
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
          {visible.slice(0, viewMode === "detailed" ? detailedVisibleCount : visible.length).map((item) => {
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
          {viewMode === "detailed" && detailedVisibleCount < visible.length ? (
            <div className="dictionary-load-more">
              <p>{language === "fa"
                ? formatNumber(Math.min(detailedVisibleCount, visible.length), language) + " از " + formatNumber(visible.length, language) + " نتیجه نمایش داده شده"
                : formatNumber(Math.min(detailedVisibleCount, visible.length), language) + " of " + formatNumber(visible.length, language) + " results shown"}</p>
              <button
                className="button secondary dictionary-load-more-button"
                type="button"
                onClick={() => setDetailedVisibleCount(count => Math.min(count + DETAILED_PAGE_SIZE, visible.length))}
              >
                {language === "fa" ? "نمایش بیشتر" : "Show more"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {selected ? (
        <DictionaryKanjiCard
          item={selected}
          catalog={catalog}
          language={language}
          onClose={() => setSelected(null)}
          onSelectKanji={setSelected}
          mnemonicContent={
            <PreparedMnemonicPanel
              item={selected}
              language={language}
              mnemonicDraft={mnemonicDrafts[selected.character]}
              onMnemonicDraftChange={value => setMnemonicDrafts(previous => ({ ...previous, [selected.character]: value }))}
            />
          }
        />
      ) : null}
    </section>
  );
}
