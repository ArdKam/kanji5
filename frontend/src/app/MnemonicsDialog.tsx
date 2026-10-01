import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { getMnemonic, saveMnemonic, type KanjiCatalogItem } from "./engine";
import { buildPreparedMnemonicEntries, CURATED_PREPARED_MNEMONICS } from "./prepared-mnemonic-core";
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
        ...(componentMap[entry.character] ?? [])
      ].join(" ");
      return normalize(searchable).includes(q);
    });
  }, [entries, language, query, mode, levelFilter, catalogByCharacter, componentMap]);

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
    curatedCountLabel: "منتخب و آمادهٔ استفاده",
    generatedCountLabel: "سرنخ برای ساختن یادسپار",
    level: "سطح",
    allLevels: "همه",
    grade1: "پایه ۱",
    n5: "JLPT N5",
    howItWorks: "چطور استفاده کنی",
    stepOne: "یک قلاب کوتاه را پیدا کن.",
    stepTwo: "اگر با ذهن تو جور بود، آن را ذخیره یا شخصی‌سازی کن.",
    stepThree: "بعداً همان یادسپار روی کارت کانجی به کمک یادآوری برمی‌گردد.",
    scopeNote: "این بخش خودش مرور نیست و امتیاز SRS نمی‌دهد؛ فقط ساختن یک مسیر حافظه برای کانجی را آسان‌تر می‌کند.",
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
    scaffoldTitle: "این متن یادسپار نهایی نیست",
    scaffoldHint: "از اجزای شکل و این سرنخ به‌عنوان نقطهٔ شروع استفاده کن؛ یادسپار را برای خودت قابل‌معنا کن.",
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
    curatedCountLabel: "selected and ready to use",
    generatedCountLabel: "clues for making a mnemonic",
    level: "Level",
    allLevels: "All",
    grade1: "Grade 1",
    n5: "JLPT N5",
    howItWorks: "How to use this",
    stepOne: "Find a short memory hook.",
    stepTwo: "Keep it only if it clicks; save it or make it your own.",
    stepThree: "That personal mnemonic can then appear with the kanji card later.",
    scopeNote: "This is not a review and does not give SRS credit; it simply makes a memory path easier to build.",
    searchResults: "result",
    searchResultsPlural: "results",
    readyResults: "ready-made mnemonic",
    readyResultsPlural: "ready-made mnemonics",
    scaffoldResults: "build clue",
    scaffoldResultsPlural: "build clues",
    save: "Save to personal mnemonics",
    saving: "Saving…",
    saved: "✓ Saved to personal mnemonics",
    build: "Open card to build",
    openKanji: "Open kanji",
    scaffoldTitle: "This is not a finished mnemonic",
    scaffoldHint: "Use the shape clues as a starting point, then make the connection meaningful to you.",
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

  if (loading) {
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

  if (error) {
    return (
      <section className="prepared-mnemonic-library">
        <div className="prepared-mnemonic-library-error" role="alert">
          <strong>{error}</strong>
          <p>{language === "fa" ? "دادهٔ کانجی آماده نشد. دوباره تلاش کنید." : "The kanji data is not ready yet. Try loading it again."}</p>
          <button className="button secondary" type="button" onClick={onRetry}>{t("tryAgain", language)}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="prepared-mnemonic-library">
      <div className="prepared-mnemonic-purpose">
        <div className="prepared-mnemonic-purpose-icon" aria-hidden="true">🧠</div>
        <div>
          <strong>{copy.howItWorks}</strong>
          <p>{copy.scopeNote}</p>
        </div>
      </div>

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

        <div className="prepared-mnemonic-mode-row" role="group" aria-label={copy.modeLabel}>
          <button
            className={"prepared-mnemonic-mode-tab" + (mode === "curated" ? " active" : "")}
            type="button"
            aria-pressed={mode === "curated"}
            onClick={() => { setMode("curated"); setQuery(""); }}
          >
            <span>{copy.curatedMode}</span>
            <strong>{formatNumber(curatedCount, language)}</strong>
          </button>
          <button
            className={"prepared-mnemonic-mode-tab is-secondary" + (mode === "generated" ? " active" : "")}
            type="button"
            aria-pressed={mode === "generated"}
            onClick={() => { setMode("generated"); setQuery(""); }}
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

      <div className="prepared-mnemonic-howto" aria-label={copy.howItWorks}>
        <span><b>1</b>{copy.stepOne}</span>
        <span><b>2</b>{copy.stepTwo}</span>
        <span><b>3</b>{copy.stepThree}</span>
      </div>

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
          const components = (componentMap[entry.character] ?? []).filter(value => value && value !== entry.character).slice(0, 4);

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
                    <span aria-hidden="true">{isCurated ? "✦" : "◇"}</span>
                    {isCurated ? copy.curatedMode : copy.generatedMode}
                  </span>
                  {meaning ? <span className="prepared-mnemonic-library-meaning">{meaning}</span> : null}
                  {reading ? <span className="prepared-mnemonic-library-reading" lang="ja">{reading}</span> : null}
                </div>

                {!isCurated ? (
                  <p className="prepared-mnemonic-library-scaffold-title">{copy.scaffoldTitle}</p>
                ) : null}

                <p className="prepared-mnemonic-library-mnemonic">{mnemonic}</p>

                {!isCurated && components.length ? (
                  <div className="prepared-mnemonic-components" aria-label={copy.components}>
                    <span>{copy.components}</span>
                    <div>
                      {components.map(component => <bdi key={component} lang="ja">{component}</bdi>)}
                    </div>
                  </div>
                ) : null}

                {!isCurated ? <p className="prepared-mnemonic-library-scaffold-hint">{copy.scaffoldHint}</p> : null}
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

  if (!open) return null;

  const curatedCount = Object.keys(CURATED_PREPARED_MNEMONICS).length;
  const generatedCount = Math.max(0, catalog.length - curatedCount);

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
              ? "اینجا برای یک کانجی، یک تصویر یا ارتباط به‌یادماندنی پیدا می‌کنی؛ سپس فقط چیزی را که برای ذهن خودت کار می‌کند نگه می‌داری."
              : "Find a memorable image or connection for a kanji, then keep only what works for your own memory."}
          </p>
        </div>
        <div className="prepared-mnemonics-dialog-metrics" aria-label={language === "fa" ? "پوشش یادسپارها" : "Mnemonic coverage"}>
          <span><strong>{formatNumber(curatedCount, language)}</strong>{language === "fa" ? " یادسپار آماده" : " ready-made"}</span>
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
