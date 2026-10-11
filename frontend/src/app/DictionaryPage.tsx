import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { getVisualStructureInfo, getMnemonic, listKanji, saveMnemonic, type KanjiCatalogItem } from "./engine";
import type { PreparedMnemonic } from "./mnemonic-library";
import { DictionaryKanjiCard } from "./DictionaryKanjiCard";
import topicData from "./kanji-topics.json";

type LevelFilter = "all" | "N5" | "N4" | "N3" | "N2" | "N1";
type MasteryFilter = "all" | "unseen" | "learning" | "attention" | "mastered";
type ViewMode = "matrix" | "detailed";
type SortMode = "level-asc" | "level-desc" | "mastery-desc" | "mastery-asc" | "order";
const levelRank: Record<string, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
const DETAILED_PAGE_SIZE = 160;

type DictionaryTopic = { id: string; label: { fa: string; en: string }; characters: string };
const KANJI_TOPICS = topicData.topics as DictionaryTopic[];
const TOPIC_IDS_BY_CHARACTER = new Map<string, Set<string>>();
for (const entry of KANJI_TOPICS) {
  for (const character of entry.characters.trim().split(" ").filter(Boolean)) {
    const ids = TOPIC_IDS_BY_CHARACTER.get(character) ?? new Set<string>();
    ids.add(entry.id);
    TOPIC_IDS_BY_CHARACTER.set(character, ids);
  }
}

const normalize = (value: string) => value.trim().toLocaleLowerCase();

const MASTERY_FILTER_LABELS: Record<MasteryFilter, { fa: string; en: string }> = {
  all: { fa: "همه", en: "All" },
  unseen: { fa: "دیده‌نشده", en: "Unseen" },
  learning: { fa: "در حال یادگیری", en: "Learning" },
  attention: { fa: "نیازمند توجه", en: "Needs attention" },
  mastered: { fa: "مسلط", en: "Mastered" },
};

function FilterChip({ label, removeLabel, onRemove }: { label: string; removeLabel: string; onRemove: () => void }) {
  return (
    <button
      className="badge"
      style={{ minHeight: 44, maxWidth: "100%", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--paper)", borderColor: "var(--line)", cursor: "pointer", fontSize: 12 }}
      type="button"
      onClick={onRemove}
      aria-label={removeLabel}
    >
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
        <path d="m4 4 8 8M12 4 4 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function PreparedMnemonicPanel({ item, language, draft, onDraftChange }: { item: KanjiCatalogItem; language: Language; draft?: string; onDraftChange: (value: string) => void }) {
  const [suggestion, setSuggestion] = useState<PreparedMnemonic | null>(null);
  const [personalMnemonic, setPersonalMnemonic] = useState("");
  const [mnemonicBusy, setMnemonicBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    setSuggestion(null);
    setPersonalMnemonic("");
    setStatus("");
    void import("./prepared-mnemonic-core").then(({ buildPreparedMnemonic }) => {
      if (!active) return;
      setSuggestion(buildPreparedMnemonic(item));
      return Promise.all([
        getVisualStructureInfo(item.character).then(info => buildPreparedMnemonic(item, info.available ? info.components.map(component => component.character) : [])).catch(() => buildPreparedMnemonic(item)),
        getMnemonic(item.character).catch(() => ({ text: "" })),
      ]);
    }).then(result => {
      if (!active || !result) return;
      const [prepared, saved] = result;
      setSuggestion(prepared);
      const text = String(saved?.text ?? "");
      setPersonalMnemonic(text);
      if (draft === undefined) onDraftChange(text);
    }).catch(() => {
      if (!active) return;
      setSuggestion(null);
    });
    return () => { active = false; };
  }, [item.character]);

  const suggestions = suggestion && (suggestion.fa || suggestion.en) ? [suggestion] : [];
  const curatedText = suggestion?.source === "curated" ? (language === "fa" ? suggestion.fa : suggestion.en) : "";

  const savePersonalMnemonic = async () => {
    if (mnemonicBusy) return;
    const next = (draft ?? "").trim();
    if (!personalMnemonic && !next) return;
    setMnemonicBusy(true);
    setStatus("");
    try {
      await saveMnemonic(item.character, next);
      setPersonalMnemonic(next);
      onDraftChange(next);
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
          <h3>{suggestion?.source === "curated" ? t("preparedMnemonics", language) : t("memoryAid", language)}</h3>
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
          <span>{formatNumber((draft ?? "").length, language)}/600</span>
        </div>
        <textarea
          className="dictionary-personal-mnemonic-input"
          value={draft ?? ""}
          maxLength={600}
          onChange={event => onDraftChange(event.target.value)}
          placeholder={language === "fa" ? "یک تداعی شخصی بنویس…" : "Write a personal memory cue…"}
          aria-label={t("personalMnemonic", language)}
        />
        <div className="dictionary-personal-mnemonic-actions">
          {curatedText ? (
            <button className="button secondary" type="button" onClick={() => { onDraftChange(curatedText); setStatus(""); }} disabled={mnemonicBusy}>
              {language === "fa" ? "کپی داستان منتخب" : "Copy curated story"}
            </button>
          ) : <span />}
          <button className="button primary" type="button" onClick={() => void savePersonalMnemonic()} disabled={mnemonicBusy || (!personalMnemonic && (draft ?? "").trim().length === 0)}>
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
  const [topic, setTopic] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [sort, setSort] = useState<SortMode>("level-asc");
  const [detailedVisibleCount, setDetailedVisibleCount] = useState(DETAILED_PAGE_SIZE);
  const [selected, setSelected] = useState<KanjiCatalogItem | null>(null);
  const [mnemonicDrafts, setMnemonicDrafts] = useState<Record<string, string>>({});
  const activeAdvancedFilterCount = (masteryFilter === "all" ? 0 : 1) + (grade === "all" ? 0 : 1) + (topic === "all" ? 0 : 1);
  const activeTopic = topic === "all" ? null : KANJI_TOPICS.find(entry => entry.id === topic) ?? null;
  const hasActiveDictionaryFilters = level !== "all" || activeAdvancedFilterCount > 0 || Boolean(query.trim());

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
      if (topic !== "all" && !(TOPIC_IDS_BY_CHARACTER.get(item.character)?.has(topic) ?? false)) return false;
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
  }, [catalog, grade, level, masteryFilter, query, sort, topic]);

  useEffect(() => {
    setDetailedVisibleCount(DETAILED_PAGE_SIZE);
  }, [query, level, masteryFilter, grade, sort, topic]);

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
          <span className="dictionary-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.3 4.3" />
            </svg>
          </span>
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
            ><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="m5 5 10 10M15 5 5 15" /></svg></button>
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
          <details className={"dictionary-advanced-filters" + (activeAdvancedFilterCount ? " has-active-filters" : "")}>
            <summary className="button secondary dictionary-advanced-filter-trigger">
              <span>{t("dictionaryMoreFilters", language)}</span>
              <span className="actions">
                {activeAdvancedFilterCount > 0 ? <span className="badge dictionary-filter-count" aria-label={t("dictionaryActiveFiltersCount", language)}>{formatNumber(activeAdvancedFilterCount, language)}</span> : null}
                <span className="dictionary-advanced-chevron" aria-hidden="true"><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="m5 7.5 5 5 5-5" /></svg></span>
              </span>
            </summary>
            <div className="dictionary-filter-row dictionary-advanced-filter-controls">
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
              <label className="dictionary-select-filter">
                <span>{language === "fa" ? "موضوع" : "Topic"}</span>
                <select aria-label={language === "fa" ? "موضوع" : "Topic"} value={topic} onChange={(event) => setTopic(event.target.value)}>
                  <option value="all">{language === "fa" ? "همهٔ موضوع‌ها" : "All topics"}</option>
                  {KANJI_TOPICS.map(entry => <option key={entry.id} value={entry.id}>{language === "fa" ? entry.label.fa : entry.label.en}</option>)}
                </select>
              </label>
              {activeAdvancedFilterCount > 0 ? (
                <button className="button secondary wide" type="button" onClick={() => { setMasteryFilter("all"); setGrade("all"); setTopic("all"); }}>
                    {t("dictionaryClearExtraFilters", language)}
                </button>
              ) : null}
            </div>
          </details>
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

      {hasActiveDictionaryFilters ? (
        <div
          className="dictionary-active-filters"
          aria-label={language === "fa" ? "فیلترهای فعال" : "Active filters"}
          style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "7px 10px", margin: "4px 0 13px", padding: "9px 10px", border: "1px solid var(--line-soft)", borderRadius: 13, background: "var(--washi)" }}
        >
          <span style={{ flex: "0 0 auto", color: "var(--mute)", fontSize: 12, fontWeight: 800 }}>{language === "fa" ? "فیلترهای فعال" : "Active filters"}</span>
          <div className="dictionary-active-filter-chips" style={{ display: "flex", flex: "1 1 180px", flexWrap: "wrap", alignItems: "center", gap: 6, minWidth: 0 }}>
            {query.trim() ? (
              <FilterChip
                label={(language === "fa" ? "جست‌وجو: " : "Search: ") + query.trim()}
                removeLabel={language === "fa" ? "حذف جست‌وجو" : "Remove search"}
                onRemove={() => setQuery("")}
              />
            ) : null}
            {level !== "all" ? (
              <FilterChip
                label={(language === "fa" ? "سطح: " : "Level: ") + level}
                removeLabel={(language === "fa" ? "حذف سطح " : "Remove level ") + level}
                onRemove={() => setLevel("all")}
              />
            ) : null}
            {masteryFilter !== "all" ? (
              <FilterChip
                label={MASTERY_FILTER_LABELS[masteryFilter][language]}
                removeLabel={(language === "fa" ? "حذف فیلتر تسلط" : "Remove mastery filter")}
                onRemove={() => setMasteryFilter("all")}
              />
            ) : null}
            {grade !== "all" ? (
              <FilterChip
                label={grade === "secondary"
                  ? (language === "fa" ? "متوسطه" : "Secondary")
                  : (language === "fa" ? "پایه " : "Grade ") + formatNumber(Number(grade), language)}
                removeLabel={language === "fa" ? "حذف فیلتر پایه" : "Remove grade filter"}
                onRemove={() => setGrade("all")}
              />
            ) : null}
            {topic !== "all" ? (
              <FilterChip
                label={(language === "fa" ? "موضوع: " : "Topic: ") + (activeTopic ? (language === "fa" ? activeTopic.label.fa : activeTopic.label.en) : topic)}
                removeLabel={language === "fa" ? "حذف فیلتر موضوع" : "Remove topic filter"}
                onRemove={() => setTopic("all")}
              />
            ) : null}
          </div>
          <button
            className="dictionary-clear-all-filters"
            style={{ flex: "0 0 auto", minHeight: 44, padding: "5px 4px", marginInlineStart: "auto", border: 0, background: "transparent", color: "var(--shu)", font: "inherit", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
            type="button"
            onClick={() => { setQuery(""); setLevel("all"); setMasteryFilter("all"); setGrade("all"); setTopic("all"); }}
          >
            {language === "fa" ? "پاک کردن همه" : "Clear all"}
          </button>
        </div>
      ) : null}

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
          <div
            className={"dictionary-mastery-legend" + (viewMode === "detailed" ? " is-detailed" : "")}
            aria-label={language === "fa" ? "راهنمای رنگ وضعیت یادگیری" : "Learning status colour key"}
            style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 12px", margin: "0 0 10px", padding: "8px 1px 2px", color: "var(--mute)" }}
          >
            {([
              ["unseen", language === "fa" ? "دیده‌نشده" : "Unseen", "var(--line-interactive)"],
              ["learning", language === "fa" ? "در حال یادگیری" : "Learning", "var(--shu)"],
              ["stable", language === "fa" ? "پایدار" : "Stable", "var(--ai)"],
              ["attention", language === "fa" ? "نیازمند توجه" : "Needs attention", "var(--sakura)"],
              ["mastered", language === "fa" ? "مسلط" : "Mastered", "var(--matcha)"],
            ] as const).map(([key, label, color]) => (
              <span key={key} className={"dictionary-mastery-key is-" + key} style={{ display: "inline-flex", flex: "0 0 auto", alignItems: "center", gap: 6, minWidth: 0, fontSize: 12, lineHeight: 1.35 }}>
                <i aria-hidden="true" style={{ display: "block", flex: "0 0 auto", width: 7, height: 7, borderRadius: "50%", background: color }} />
                {label}
              </span>
            ))}
          </div>
          <div className={"kanji-catalog-grid" + (viewMode === "detailed" ? " is-detailed" : "")}>
          {visible.slice(0, viewMode === "detailed" ? detailedVisibleCount : visible.length).map((item) => {
            const mastery = Math.max(0, Math.min(1, Number(item.mastery) || 0));
            const masteryColor = item.state === "mastered" ? "var(--matcha)"
              : item.state === "stable" ? "var(--ai)"
              : ["weak", "recovering"].includes(item.state || "") ? "var(--sakura)"
              : ["learning", "introduced"].includes(item.state || "") ? "var(--shu)"
              : "var(--line-interactive)";
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
                <span className="kanji-catalog-fill" style={{ height: "2px", opacity: 0.95, backgroundColor: masteryColor }} />
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
          navigationItems={visible}
          mnemonicContent={<PreparedMnemonicPanel item={selected} language={language} draft={mnemonicDrafts[selected.character]} onDraftChange={value => setMnemonicDrafts(previous => ({ ...previous, [selected.character]: value }))} />}
        />
      ) : null}
    </section>
  );
}
