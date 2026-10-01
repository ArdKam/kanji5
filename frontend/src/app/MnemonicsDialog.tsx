import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { getMnemonic, saveMnemonic, type KanjiCatalogItem } from "./engine";
import { buildPreparedMnemonicEntries } from "./prepared-mnemonic-core";
import type { PreparedMnemonic } from "./mnemonic-library";
import { usePageDialog } from "./usePageDialog";

const normalize = (value: string) => value.trim().toLocaleLowerCase();

function PreparedMnemonicLibrary({
  language,
  catalog,
  onSelectKanji
}: {
  language: Language;
  catalog: KanjiCatalogItem[];
  onSelectKanji: (item: KanjiCatalogItem) => void;
}) {
  const catalogByCharacter = useMemo(() => new Map(catalog.map(item => [item.character, item])), [catalog]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "curated" | "generated" | "grade1" | "n5">("all");
  const [visibleLimit, setVisibleLimit] = useState(60);
  const [componentMap, setComponentMap] = useState<Record<string, string[]>>({});
  const [busyKey, setBusyKey] = useState("");
  const [appliedKey, setAppliedKey] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("./kanji-components.json", { cache: "force-cache" })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!active) return;
        const raw = data && typeof data.components === "object" ? data.components : {};
        const next: Record<string, string[]> = {};
        for (const [character, values] of Object.entries(raw as Record<string, unknown>)) {
          if (Array.isArray(values)) next[character] = values.map(String).filter(Boolean).slice(0, 8);
        }
        setComponentMap(next);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const entries = useMemo(
    () => buildPreparedMnemonicEntries(catalog, character => componentMap[character] ?? [])
      .sort((a, b) => Number(b.suggestion.source === "curated") - Number(a.suggestion.source === "curated"))
      .map((entry, index) => ({ ...entry, index })),
    [catalog, componentMap]
  );

  const curatedCount = useMemo(
    () => entries.reduce((count, entry) => count + Number(entry.suggestion.source === "curated"), 0),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const q = normalize(query);
    return entries.filter(entry => {
      if (filter === "curated" && entry.suggestion.source !== "curated") return false;
      if (filter === "generated" && entry.suggestion.source !== "generated") return false;
      if (filter === "grade1" && Number(catalogByCharacter.get(entry.character)?.grade) !== 1) return false;
      if (filter === "n5" && catalogByCharacter.get(entry.character)?.jlpt !== "N5") return false;
      if (!q) return true;
      const mnemonic = language === "fa" ? entry.suggestion.fa : entry.suggestion.en;
      const item = catalogByCharacter.get(entry.character);
      const searchable = [
        entry.character,
        ...(item?.meanings ?? []),
        ...(item?.on ?? []),
        ...(item?.kun ?? []),
        mnemonic
      ].join(" ");
      return normalize(searchable).includes(q);
    });
  }, [entries, language, query, filter, catalogByCharacter]);

  useEffect(() => {
    setVisibleLimit(60);
    setAppliedKey("");
    setErrorKey("");
    setErrorMessage("");
  }, [language, query, filter]);

  const visible = filteredEntries.slice(0, visibleLimit);

  useEffect(() => {
    if (!appliedKey) return;
    const timer = window.setTimeout(() => setAppliedKey(""), 2200);
    return () => window.clearTimeout(timer);
  }, [appliedKey]);

  const copy = language === "fa" ? {
    filters: "نوع یادسپار",
    all: "همه",
    curated: "دست‌چین‌شده",
    generated: "راهنمای ساخت",
    levels: "سطح",
    allLevels: "همه",
    grade1: "پایه ۱",
    n5: "JLPT N5",
    searchResults: "نتیجه",
    searchResultsPlural: "نتیجه",
    allResults: "یادسپار",
    allResultsPlural: "یادسپار",
    coverage: "کانجی پوشش‌داده‌شده",
    use: "استفاده به‌عنوان یادسپار شخصی",
    saving: "در حال ذخیره…",
    saved: "✓ ذخیره شد",
    scaffold: "راهنمای ساخت",
    openKanji: "مشاهده در واژه‌نامه",
    personalExists: "این کانجی یک یادسپار شخصی دارد. برای جایگزینی، از کارت کانجی آن را ویرایش کنید."
  } : {
    filters: "Mnemonic type",
    all: "All",
    curated: "Curated",
    generated: "Build-your-own",
    levels: "Level",
    allLevels: "All",
    grade1: "Grade 1",
    n5: "JLPT N5",
    searchResults: "result",
    searchResultsPlural: "results",
    allResults: "memory cue",
    allResultsPlural: "memory cues",
    use: "Use as personal mnemonic",
    saving: "Saving…",
    saved: "✓ Saved",
    scaffold: "Build your own",
    openKanji: "Open in dictionary",
    personalExists: "This kanji already has a personal mnemonic. Edit it from the kanji card before replacing it."
  };

  const resultLabel = query.trim()
    ? `${formatNumber(filteredEntries.length, language)} ${filteredEntries.length === 1 ? copy.searchResults : copy.searchResultsPlural}`
    : `${formatNumber(filteredEntries.length, language)} ${filteredEntries.length === 1 ? copy.allResults : copy.allResultsPlural}`;

  const activeFilterLabel =
    filter === "curated" ? copy.curated :
    filter === "generated" ? copy.generated :
    filter === "grade1" ? copy.grade1 :
    filter === "n5" ? copy.n5 :
    "";

  const chips: Array<[typeof filter, string]> = [
    ["all", copy.all],
    ["curated", copy.curated],
    ["generated", copy.generated]
  ];

  return (
    <section className="prepared-mnemonic-library">
      <div className="prepared-mnemonic-toolbar" aria-label={language === "fa" ? "ابزارهای جست‌وجو و فیلتر" : "Search and filter tools"}>
        <label className="prepared-mnemonic-search-shell">
          <span aria-hidden="true">⌕</span>
          <input
            className="prepared-mnemonic-library-search"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t("preparedMnemonicLibrarySearch", language)}
            aria-label={t("preparedMnemonicLibrarySearch", language)}
          />
        </label>

        <div className="prepared-mnemonic-filter-groups">
          <div className="prepared-mnemonic-filter-group" role="group" aria-label={copy.filters}>
            <span className="prepared-mnemonic-filter-label">{copy.filters}</span>
            <div className="prepared-mnemonic-filter-chips">
              {chips.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={"prepared-mnemonic-filter-chip" + (filter === key ? " active" : "")}
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="prepared-mnemonic-filter-group" role="group" aria-label={copy.levels}>
            <span className="prepared-mnemonic-filter-label">{copy.levels}</span>
            <div className="prepared-mnemonic-filter-chips">
              {([
                ["all", copy.allLevels],
                ["grade1", copy.grade1],
                ["n5", copy.n5]
              ] as Array<[typeof filter, string]>).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={"prepared-mnemonic-filter-chip" + (filter === key ? " active" : "")}
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="prepared-mnemonic-results-header">
        <div>
          <strong>{resultLabel}</strong>
          {activeFilterLabel ? <span> · {activeFilterLabel}</span> : null}
        </div>
        {visible.length < filteredEntries.length ? (
          <span>{formatNumber(visible.length, language)} / {formatNumber(filteredEntries.length, language)}</span>
        ) : null}
      </div>

      <div className="prepared-mnemonic-library-list" role="list">
        {visible.map(entry => {
          const key = entry.character + "-" + entry.index;
          const item = catalogByCharacter.get(entry.character);
          const mnemonic = language === "fa" ? entry.suggestion.fa : entry.suggestion.en;
          const meaning = (item?.meanings ?? []).slice(0, 2).join(" · ");
          const reading = item?.on?.[0] ?? item?.kun?.[0] ?? "";
          const isCurated = entry.suggestion.source === "curated";
          const isBusy = busyKey === key;
          const isApplied = appliedKey === key;
          const hasError = errorKey === key;

          return (
            <article
              className={"prepared-mnemonic-library-row " + (isCurated ? "is-curated" : "is-generated")}
              key={key}
              role="listitem"
            >
              <button
                className="prepared-mnemonic-library-kanji"
                type="button"
                onClick={() => {
                  if (item) onSelectKanji(item);
                }}
                lang="ja"
                title={copy.openKanji}
                aria-label={language === "fa" ? `مشاهده ${entry.character} در واژه‌نامه` : `Open ${entry.character} in dictionary`}
              >
                {entry.character}
              </button>

              <div className="prepared-mnemonic-library-content">
                <div className="prepared-mnemonic-library-meta">
                  <span className={"prepared-mnemonic-source " + (isCurated ? "curated" : "generated")}>
                    <span aria-hidden="true">{isCurated ? "✦" : "↗"}</span>
                    {isCurated ? copy.curated : copy.scaffold}
                  </span>
                  {meaning ? <span className="prepared-mnemonic-library-meaning">{meaning}</span> : null}
                  {reading ? <span className="prepared-mnemonic-library-reading" lang="ja">{reading}</span> : null}
                </div>
                <p className="prepared-mnemonic-library-mnemonic">{mnemonic}</p>
              </div>

              <div className="prepared-mnemonic-library-action">
                {isCurated ? (
                  <>
                    <button
                      className="button secondary prepared-mnemonic-library-use"
                      type="button"
                      disabled={busyKey !== "" || isApplied}
                      onClick={() => void apply(entry.character, entry.suggestion, key)}
                    >
                      {isBusy ? copy.saving : isApplied ? copy.saved : copy.use}
                    </button>
                    {hasError ? <span className="prepared-mnemonic-row-error" role="status">{errorMessage}</span> : null}
                  </>
                ) : (
                  <span className="prepared-mnemonic-library-scaffold-label">{copy.scaffold}</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!filteredEntries.length ? (
        <div className="prepared-mnemonic-empty" role="status">
          <strong>{language === "fa" ? "یادسپاری پیدا نشد" : "No memory cues found"}</strong>
          <span>{language === "fa" ? "عبارت جست‌وجو یا فیلتر فعلی را تغییر دهید." : "Try a different search term or filter."}</span>
        </div>
      ) : null}

      {visible.length < filteredEntries.length ? (
        <button
          className="button secondary prepared-mnemonic-library-more"
          type="button"
          onClick={() => setVisibleLimit(value => Math.min(value + 60, filteredEntries.length))}
        >
          {language === "fa" ? "نمایش ۶۰ مورد دیگر" : "Show 60 more"}
        </button>
      ) : null}
    </section>
  );

  async function apply(character: string, suggestion: PreparedMnemonic, key: string) {
    if (busyKey) return;
    setBusyKey(key);
    setAppliedKey("");
    setErrorKey("");
    setErrorMessage("");
    try {
      const current = await getMnemonic(character);
      const existing = String(current.text ?? "").trim();
      const next = language === "fa" ? suggestion.fa : suggestion.en;

      if (existing && existing !== next) {
        setErrorKey(key);
        setErrorMessage(copy.personalExists);
        return;
      }

      await saveMnemonic(character, next);
      setAppliedKey(key);
    } catch {
      setErrorKey(key);
      setErrorMessage(t("mnemonicSaveError", language));
    } finally {
      setBusyKey("");
    }
  }
}

export function MnemonicsDialog({
  open,
  language,
  catalog,
  onClose,
  onSelectKanji
}: {
  open: boolean;
  language: Language;
  catalog: KanjiCatalogItem[];
  onClose: () => void;
  onSelectKanji: (item: KanjiCatalogItem) => void;
}) {
  const dialogRef = usePageDialog(open, onClose);
  const intro = language === "fa"
    ? "یادسپار کوتاه و آماده را پیدا کن، مرورش کن و در صورت مناسب بودن به یادسپار شخصی خودت تبدیلش کن."
    : "Find a short prepared cue, review it, and make it your own when it fits.";

  if (!open) return null;

  const curatedCount = catalog.reduce((count, item) => count + Number(buildPreparedMnemonicEntries([item])[0]?.suggestion?.source === "curated"), 0);
  return (
    <dialog
      ref={dialogRef}
      className="dialog secondary-page-dialog secondary-surface-dialog mnemonics-dialog"
      aria-labelledby="mnemonics-dialog-title"
    >
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <div className="prepared-mnemonics-dialog-heading">
        <div>
          <p className="eyebrow red">{language === "fa" ? "کتابخانه حافظه" : "Memory library"}</p>
          <h2 id="mnemonics-dialog-title">{t("preparedMnemonicLibrary", language)}</h2>
          <p className="secondary-surface-dialog-hint">{intro}</p>
        </div>
        <div className="prepared-mnemonics-dialog-metrics">
          <span><strong>{formatNumber(catalog.length, language)}</strong>{language === "fa" ? " کانجی پوشش‌داده‌شده" : " kanji covered"}</span>
          <span><strong>{formatNumber(curatedCount, language)}</strong>{language === "fa" ? " دست‌چین‌شده" : " curated"}</span>
        </div>
      </div>
      <PreparedMnemonicLibrary
        language={language}
        catalog={catalog}
        onSelectKanji={item => {
          onSelectKanji(item);
          onClose();
        }}
      />
    </dialog>
  );
}
