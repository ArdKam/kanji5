import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { getMnemonic, saveMnemonic, type KanjiCatalogItem } from "./engine";
import type { PreparedMnemonic } from "./mnemonic-library";
import { usePageDialog } from "./usePageDialog";

const normalize = (value: string) => value.trim().toLocaleLowerCase();

type LibraryMode = "curated" | "generated";
type LevelFilter = "all" | "grade1" | "n5";

function PreparedMnemonicLibrary({
  language,
  catalog,
  personalMnemonics,
  loading,
  error,
  onRetry,
  onSelectKanji
}: {
  language: Language;
  catalog: KanjiCatalogItem[];
  personalMnemonics: Record<string, string>;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onSelectKanji: (item: KanjiCatalogItem) => void;
}) {
  const catalogByCharacter = useMemo(() => new Map(catalog.map(item => [item.character, item])), [catalog]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<LibraryMode>("curated");
  const [localPersonalMnemonics, setLocalPersonalMnemonics] = useState(personalMnemonics);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [visibleLimit, setVisibleLimit] = useState(60);
  const [visualComponentMap, setVisualComponentMap] = useState<Record<string, string[]>>({});
  const [busyKey, setBusyKey] = useState("");
  const [appliedKey, setAppliedKey] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [preparedCore, setPreparedCore] = useState<typeof import("./prepared-mnemonic-core") | null>(null);
  const [preparedCoreFailed, setPreparedCoreFailed] = useState(false);
  const [preparedCoreLoadAttempt, setPreparedCoreLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setPreparedCoreFailed(false);
    void import("./prepared-mnemonic-core").then(module => {
      if (active) {
        setPreparedCore(module);
        setPreparedCoreFailed(false);
      }
    }).catch(() => {
      if (active) {
        setPreparedCore(null);
        setPreparedCoreFailed(true);
      }
    });
    return () => { active = false; };
  }, [preparedCoreLoadAttempt]);

  const retryPreparedCore = () => {
    setPreparedCore(null);
    setPreparedCoreFailed(false);
    setPreparedCoreLoadAttempt(attempt => attempt + 1);
  };

  useEffect(() => {
    let active = true;
    void fetch("./kanji-visual-structure.json", { cache: "force-cache" })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!active) return;
        const raw = data && typeof data.structures === "object" ? data.structures : {};
        const next: Record<string, string[]> = {};
        for (const [character, value] of Object.entries(raw as Record<string, unknown>)) {
          if (!value || typeof value !== "object") continue;
          const entry = value as { character?: unknown; components?: unknown };
          if (entry.character !== character || !Array.isArray(entry.components)) continue;
          next[character] = entry.components
            .map(component => component && typeof component === "object" ? String((component as { character?: unknown }).character ?? "") : "")
            .filter(Boolean)
            .slice(0, 8);
        }
        setVisualComponentMap(next);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const entries = useMemo(
    () => preparedCore
      ? preparedCore.buildPreparedMnemonicEntries(catalog, character => visualComponentMap[character] ?? [])
        .sort((a, b) => Number(b.suggestion.source === "curated") - Number(a.suggestion.source === "curated"))
        .map((entry, index) => ({ ...entry, index }))
      : [],
    [catalog, visualComponentMap, preparedCore]
  );

  const curatedCount = useMemo(
    () => entries.reduce((count, entry) => count + Number(entry.suggestion.source === "curated"), 0),
    [entries]
  );
  const generatedCount = Math.max(0, entries.length - curatedCount);

  const filteredEntries = useMemo(() => {
    const q = normalize(query);
    return entries.filter(entry => {
      const isCurated = entry.suggestion.source === "curated";
      if (mode === "curated" && !isCurated) return false;
      if (mode === "generated" && isCurated) return false;

      const item = catalogByCharacter.get(entry.character);
      if (levelFilter === "grade1" && Number(item?.grade) !== 1) return false;
      if (levelFilter === "n5" && item?.jlpt !== "N5") return false;

      if (!q) return true;
      const mnemonic = language === "fa" ? entry.suggestion.fa : entry.suggestion.en;
      const searchable = [
        entry.character,
        ...(item?.meanings ?? []),
        ...(item?.on ?? []),
        ...(item?.kun ?? []),
        entry.suggestion.fa,
        entry.suggestion.en,
        mnemonic,
        ...(visualComponentMap[entry.character] ?? [])
      ].join(" ");
      return normalize(searchable).includes(q);
    });
  }, [entries, language, query, mode, levelFilter, catalogByCharacter, visualComponentMap]);

  useEffect(() => {
    setVisibleLimit(60);
    setAppliedKey("");
    setErrorKey("");
    setErrorMessage("");
  }, [language, query, mode, levelFilter]);

  const visible = filteredEntries.slice(0, visibleLimit);

  useEffect(() => {
    setLocalPersonalMnemonics(personalMnemonics);
  }, [personalMnemonics]);

  useEffect(() => {
    if (!appliedKey) return;
    const timer = window.setTimeout(() => setAppliedKey(""), 2200);
    return () => window.clearTimeout(timer);
  }, [appliedKey]);

  const copy = language === "fa" ? {
    modeLabel: "نوع کمک حافظه",
    curatedMode: "یادسپارهای آماده",
    generatedMode: "سرنخ‌های ساخت",
    curatedBadge: "منتخب",
    generatedBadge: "سرنخ ساخت",
    generatedModeNote: "این‌ها یادسپارهای نهایی نیستند؛ از سرنخ‌ها برای ساختن ارتباطی استفاده کن که برای خودت معنادار باشد.",
    level: "رده‌بندی",
    allLevels: "همه",
    grade1: "پایهٔ مدرسه ۱",
    n5: "سطح JLPT N5",
    searchResults: "نتیجه",
    searchResultsPlural: "نتیجه",
    readyResults: "یادسپار آماده",
    readyResultsPlural: "یادسپار آماده",
    scaffoldResults: "سرنخ ساخت",
    scaffoldResultsPlural: "سرنخ ساخت",
    save: "ذخیره در یادسپار شخصی",
    saving: "در حال ذخیره…",
    saved: "✓ در یادسپار شخصی ذخیره شد",
    build: "باز کردن کارت برای ساخت",
    openKanji: "مشاهدهٔ کانجی",
    components: "اجزای شکل",
    personalExists: "این کانجی از قبل یادسپار شخصی دارد؛ برای جایگزینی، آن را از کارت کانجی ویرایش کن.",
    edit: "ویرایش یادسپار شخصی",
    emptyTitle: "چیزی پیدا نشد",
    emptyHint: "عبارت جست‌وجو یا سطح فعلی را تغییر بده.",
    emptyCuratedHint: "برای این کانجی هنوز یادسپار دست‌چین‌شده‌ای در این کتابخانه وجود ندارد؛ سرنخ ساخت را امتحان کن.",
    emptyGeneratedHint: "برای این جست‌وجو سرنخ ساختی پیدا نشد."
  } : {
    modeLabel: "Memory aid type",
    curatedMode: "Ready-made mnemonics",
    generatedMode: "Build clues",
    curatedBadge: "Curated",
    generatedBadge: "Build clue",
    generatedModeNote: "These are prompts, not finished mnemonics. Use them to create a connection that makes sense to you.",
    level: "Classification",
    allLevels: "All",
    grade1: "School grade 1",
    n5: "JLPT N5",
    searchResults: "match",
    searchResultsPlural: "matches",
    readyResults: "ready-made mnemonic",
    readyResultsPlural: "ready-made mnemonics",
    scaffoldResults: "build clue",
    scaffoldResultsPlural: "build clues",
    save: "Save to personal mnemonics",
    saving: "Saving…",
    saved: "✓ Saved to personal mnemonics",
    build: "Open card to build",
    openKanji: "Open kanji",
    components: "Shape components",
    personalExists: "This kanji already has a personal mnemonic. Edit it from the kanji card before replacing it.",
    edit: "Edit personal mnemonic",
    emptyTitle: "Nothing found",
    emptyHint: "Try a different search term or level.",
    emptyCuratedHint: "There is no curated mnemonic for this result yet; try Build clues for a starting point.",
    emptyGeneratedHint: "No build clue matched this search."
  };

  const resultLabel = query.trim()
    ? `${formatNumber(filteredEntries.length, language)} ${filteredEntries.length === 1 ? copy.searchResults : copy.searchResultsPlural}`
    : mode === "curated"
      ? `${formatNumber(filteredEntries.length, language)} ${filteredEntries.length === 1 ? copy.readyResults : copy.readyResultsPlural}`
      : `${formatNumber(filteredEntries.length, language)} ${filteredEntries.length === 1 ? copy.scaffoldResults : copy.scaffoldResultsPlural}`;

  if (loading || (!preparedCore && !preparedCoreFailed)) {
    return (
      <section className="prepared-mnemonic-library" aria-busy="true" aria-live="polite">
        <div className="prepared-mnemonic-library-loading">
          <strong>{language === "fa" ? "در حال آماده‌سازی یادسپارها…" : "Loading memory aids…"}</strong>
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }

  if (error || preparedCoreFailed) {
    const libraryLoadError = preparedCoreFailed;
    return (
      <section className="prepared-mnemonic-library">
        <div className="prepared-mnemonic-library-error" role="alert">
          <strong>{libraryLoadError
            ? (language === "fa" ? "کتابخانهٔ یادسپارها بارگذاری نشد." : "The mnemonic library could not be loaded.")
            : error}</strong>
          <p>{libraryLoadError
            ? (language === "fa" ? "اتصال یا فایل برنامه ممکن است موقتاً در دسترس نباشد. دوباره تلاش کن." : "The app resource may be temporarily unavailable. Try loading the library again.")
            : (language === "fa" ? "دادهٔ کانجی آماده نشد. دوباره تلاش کن." : "The kanji catalog is not ready yet. Try again.")}</p>
          <button className="button secondary" type="button" onClick={libraryLoadError ? retryPreparedCore : onRetry}>{t("tryAgain", language)}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="prepared-mnemonic-library">
      <div className="prepared-mnemonic-toolbar" aria-label={language === "fa" ? "ابزارهای جست‌وجو و فیلتر" : "Search and filter tools"}>
        <label className="prepared-mnemonic-search-shell">
          <span aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg></span>
          <input
            className="prepared-mnemonic-library-search"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t("preparedMnemonicLibrarySearch", language)}
            aria-label={t("preparedMnemonicLibrarySearch", language)}
          />
        </label>

        <div className="prepared-mnemonic-mode-row" role="group" aria-label={copy.modeLabel}>
          <button
            className={"prepared-mnemonic-mode-tab" + (mode === "curated" ? " active" : "")}
            type="button"
            aria-pressed={mode === "curated"}
            onClick={() => setMode("curated")}
          >
            <span>{copy.curatedMode}</span>
            <strong>{formatNumber(curatedCount, language)}</strong>
          </button>
          <button
            className={"prepared-mnemonic-mode-tab is-secondary" + (mode === "generated" ? " active" : "")}
            type="button"
            aria-pressed={mode === "generated"}
            onClick={() => setMode("generated")}
          >
            <span>{copy.generatedMode}</span>
            <strong>{formatNumber(generatedCount, language)}</strong>
          </button>
        </div>

        <div className="prepared-mnemonic-level-row">
          <span className="prepared-mnemonic-filter-label">{copy.level}</span>
          <div className="prepared-mnemonic-filter-chips">
            {([
              ["all", copy.allLevels],
              ["grade1", copy.grade1],
              ["n5", copy.n5]
            ] as Array<[LevelFilter, string]>).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={"prepared-mnemonic-filter-chip" + (levelFilter === key ? " active" : "")}
                aria-pressed={levelFilter === key}
                onClick={() => setLevelFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === "generated" ? <p className="prepared-mnemonic-mode-note">{copy.generatedModeNote}</p> : null}

      <div className="prepared-mnemonic-results-header">
        <strong>{resultLabel}</strong>
        <span>{formatNumber(visible.length, language)} / {formatNumber(filteredEntries.length, language)}</span>
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
          const hasPersonalMnemonic = Boolean(localPersonalMnemonics[entry.character]);
          const components = (visualComponentMap[entry.character] ?? []).filter(value => value && value !== entry.character).slice(0, 4);

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
                aria-label={language === "fa" ? `مشاهدهٔ ${entry.character} در فرهنگ کانجی` : `Open ${entry.character} in the kanji dictionary`}
              >
                {entry.character}
              </button>

              <div className="prepared-mnemonic-library-content">
                <div className="prepared-mnemonic-library-meta">
                  <span className={"prepared-mnemonic-source " + (isCurated ? "curated" : "generated")}>
                    {isCurated ? copy.curatedBadge : copy.generatedBadge}
                  </span>
                  {meaning ? <span className="prepared-mnemonic-library-meaning">{meaning}</span> : null}
                  {reading ? <span className="prepared-mnemonic-library-reading" lang="ja">{reading}</span> : null}
                </div>

                <p className="prepared-mnemonic-library-mnemonic">{mnemonic}</p>

                {!isCurated && components.length ? (
                  <div className="prepared-mnemonic-components" aria-label={copy.components}>
                    <span>{copy.components}</span>
                    <div>
                      {components.map(component => <bdi key={component} lang="ja">{component}</bdi>)}
                    </div>
                  </div>
                ) : null}

              </div>

              <div className="prepared-mnemonic-library-action">
                {isCurated ? (
                  <>
                    <button
                      className="button secondary prepared-mnemonic-library-use"
                      type="button"
                      disabled={busyKey !== "" || isApplied}
                      onClick={() => {
                        if (hasPersonalMnemonic) {
                          if (item) onSelectKanji(item);
                          return;
                        }
                        void apply(entry.character, entry.suggestion, key);
                      }}
                    >
                      {isBusy ? copy.saving : isApplied ? copy.saved : hasPersonalMnemonic ? copy.edit : copy.save}
                    </button>
                    {hasError ? <span className="prepared-mnemonic-row-error" role="status">{errorMessage}</span> : null}
                  </>
                ) : (
                  <button
                    className="button secondary prepared-mnemonic-library-build"
                    type="button"
                    onClick={() => {
                      if (item) onSelectKanji(item);
                    }}
                  >
                    {copy.build}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!filteredEntries.length ? (
        <div className="prepared-mnemonic-empty" role="status">
          <strong>{copy.emptyTitle}</strong>
          <span>{query.trim() ? copy.emptyHint : mode === "curated" ? copy.emptyCuratedHint : copy.emptyGeneratedHint}</span>
        </div>
      ) : null}

      {visible.length < filteredEntries.length ? (
        <button
          className="button secondary prepared-mnemonic-library-more"
          type="button"
          onClick={() => setVisibleLimit(value => Math.min(value + 60, filteredEntries.length))}
        >
          {language === "fa"
            ? `نمایش ${formatNumber(Math.min(60, filteredEntries.length - visible.length), language)} مورد دیگر`
            : `Show ${Math.min(60, filteredEntries.length - visible.length)} more`}
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
      setLocalPersonalMnemonics(currentMap => ({ ...currentMap, [character]: next }));
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
  personalMnemonics,
  loading,
  error,
  onRetry,
  onClose,
  onSelectKanji
}: {
  open: boolean;
  language: Language;
  catalog: KanjiCatalogItem[];
  personalMnemonics: Record<string, string>;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
  onSelectKanji: (item: KanjiCatalogItem) => void;
}) {
  const dialogRef = usePageDialog(open, onClose);
  const [curatedCount, setCuratedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setCuratedCount(null);
    void import("./prepared-mnemonic-core").then(module => {
      if (active) setCuratedCount(Object.keys(module.CURATED_PREPARED_MNEMONICS).length);
    }).catch(() => {
      if (active) setCuratedCount(null);
    });
    return () => { active = false; };
  }, [open]);

  if (!open) return null;

  const generatedCount = Math.max(0, catalog.length - (curatedCount ?? 0));

  return (
    <dialog
      ref={dialogRef}
      className="dialog secondary-page-dialog secondary-surface-dialog mnemonics-dialog"
      aria-labelledby="mnemonics-dialog-title"
    >
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <div className="prepared-mnemonics-dialog-heading">
        <div>
          <p className="eyebrow red">{language === "fa" ? "کمک حافظه" : "MEMORY AIDS"}</p>
          <h2 id="mnemonics-dialog-title">{t("preparedMnemonicLibrary", language)}</h2>
          <p className="secondary-surface-dialog-hint">
            {language === "fa"
              ? "برای هر کانجی یک ارتباط به‌یادماندنی پیدا کن و فقط چیزی را نگه دار که یادآوری را برایت آسان‌تر می‌کند؛ این کتابخانه جای مرور زمان‌بندی‌شده را نمی‌گیرد."
              : "Find a memory cue for each kanji and keep what genuinely helps you remember it; this library is separate from scheduled reviews."}
          </p>
        </div>
        <div className="prepared-mnemonics-dialog-metrics" aria-label={language === "fa" ? "پوشش یادسپارها" : "Mnemonic coverage"}>
          <span><strong>{curatedCount == null ? "…" : formatNumber(curatedCount, language)}</strong>{language === "fa" ? " یادسپار آماده" : " ready-made"}</span>
          <span><strong>{formatNumber(generatedCount, language)}</strong>{language === "fa" ? " سرنخ ساخت" : " build clues"}</span>
        </div>
      </div>

      <PreparedMnemonicLibrary
        language={language}
        catalog={catalog}
        personalMnemonics={personalMnemonics}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onSelectKanji={item => {
          onSelectKanji(item);
        }}
      />
    </dialog>
  );
}
