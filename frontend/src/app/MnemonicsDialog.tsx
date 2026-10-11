import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { getMnemonic, saveMnemonic, type KanjiCatalogItem } from "./engine";
import type { PreparedMnemonic } from "./mnemonic-library";
import { usePageDialog } from "./usePageDialog";

const normalize = (value: string) => value.trim().toLocaleLowerCase();

type LibraryMode = "curated" | "generated";
type GradeFilter = "all" | "1" | "2" | "3" | "4" | "5" | "6";
type JLPTFilter = "all" | "N5" | "N4" | "N3" | "N2" | "N1";

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
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [jlptFilter, setJlptFilter] = useState<JLPTFilter>("all");
  const [visibleLimit, setVisibleLimit] = useState(60);
  const [visualComponentMap, setVisualComponentMap] = useState<Record<string, string[]>>({});
  const [visualComponentLoadFailed, setVisualComponentLoadFailed] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
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
    setVisualComponentLoadFailed(false);
    void fetch("./kanji-visual-structure.json", { cache: "force-cache" })
      .then(response => {
        if (!response.ok) throw new Error("Visual structure data unavailable");
        return response.json();
      })
      .then(data => {
        if (!active) return;
        if (!data || typeof data.structures !== "object") throw new Error("Visual structure data malformed");
        const raw = data.structures;
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
        setVisualComponentLoadFailed(false);
      })
      .catch(() => { if (active) setVisualComponentLoadFailed(true); });
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
  const withoutCuratedCount = Math.max(0, entries.length - curatedCount);

  const filteredEntries = useMemo(() => {
    const q = normalize(query);
    return entries.filter(entry => {
      const isCurated = entry.suggestion.source === "curated";
      if (mode === "curated" && !isCurated) return false;
      if (mode === "generated" && isCurated) return false;

      const item = catalogByCharacter.get(entry.character);
      if (gradeFilter !== "all" && Number(item?.grade) !== Number(gradeFilter)) return false;
      if (jlptFilter !== "all" && item?.jlpt !== jlptFilter) return false;

      if (!q) return true;
      const searchable = [
        entry.character,
        ...(item?.meanings ?? []),
        ...(item?.on ?? []),
        ...(item?.kun ?? []),
        ...(isCurated ? [entry.suggestion.fa, entry.suggestion.en] : []),
        ...(visualComponentMap[entry.character] ?? [])
      ].join(" ");
      return normalize(searchable).includes(q);
    });
  }, [entries, language, query, mode, gradeFilter, jlptFilter, catalogByCharacter, visualComponentMap]);

  useEffect(() => {
    setVisibleLimit(60);
    setAppliedKey("");
    setErrorKey("");
    setErrorMessage("");
    setEditingKey("");
  }, [language, query, mode, gradeFilter, jlptFilter]);

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
    modeLabel: "نوع یادسپار",
    curatedMode: "یادسپارهای آماده",
    generatedMode: "ساخت یادسپار شخصی",
    curatedBadge: "منتخب",
    generatedBadge: "بدون یادسپار آماده",
    generatedModeNote: "برای این کانجی یادسپار آماده‌ای نداریم. می‌توانی همین‌جا تداعی شخصی خودت را بنویسی؛ متن الگوییِ تکراری به‌عنوان محتوای آماده نمایش داده نمی‌شود.",
    gradeLabel: "پایهٔ مدرسه",
    jlptLabel: "سطح JLPT",
    allGrades: "همهٔ پایه‌ها",
    allJlpt: "همهٔ سطوح",
    searchResults: "نتیجه",
    searchResultsPlural: "نتیجه",
    readyResults: "یادسپار آماده",
    readyResultsPlural: "یادسپار آماده",
    scaffoldResults: "کانجی برای ساخت یادسپار",
    scaffoldResultsPlural: "کانجی برای ساخت یادسپار",
    save: "ذخیره در یادسپار شخصی",
    saving: "در حال ذخیره…",
    saved: "✓ ذخیره شد",
    build: "ساخت یادسپار شخصی",
    openKanji: "مشاهدهٔ کانجی",
    components: "اجزای شکل",
    personalLabel: "یادسپار شخصی",
    replaceHint: "ذخیرهٔ تغییرات، یادسپار فعلی این کانجی را جایگزین می‌کند.",
    usePrepared: "قرار دادن یادسپار منتخب",
    saveChanges: "ذخیرهٔ تغییرات",
    cancel: "انصراف",
    delete: "حذف یادسپار",
    deleteConfirm: "یادسپار شخصی این کانجی حذف شود؟",
    edit: "ویرایش یادسپار شخصی",
    emptyTitle: "چیزی پیدا نشد",
    emptyHint: "عبارت جست‌وجو یا فیلترهای سطح را تغییر بده.",
    emptyCuratedHint: "برای این جست‌وجو یادسپار آماده‌ای نداریم. تب «ساخت یادسپار شخصی» را برای نوشتن یادسپار خودت امتحان کن.",
    emptyGeneratedHint: "کانجی‌ای با این جست‌وجو و فیلترها پیدا نشد."
  } : {
    modeLabel: "Mnemonic type",
    curatedMode: "Ready-made mnemonics",
    generatedMode: "Create a personal mnemonic",
    curatedBadge: "Curated",
    generatedBadge: "No prepared mnemonic",
    generatedModeNote: "There is no ready-made mnemonic for these kanji. Write a personal association here instead of browsing a repeated template.",
    gradeLabel: "School grade",
    jlptLabel: "JLPT level",
    allGrades: "All grades",
    allJlpt: "All levels",
    searchResults: "match",
    searchResultsPlural: "matches",
    readyResults: "ready-made mnemonic",
    readyResultsPlural: "ready-made mnemonics",
    scaffoldResults: "kanji to make a mnemonic for",
    scaffoldResultsPlural: "kanji to make a mnemonic for",
    save: "Save to personal mnemonics",
    saving: "Saving…",
    saved: "✓ Saved",
    build: "Write personal mnemonic",
    openKanji: "Open kanji",
    components: "Shape components",
    personalLabel: "Personal mnemonic",
    replaceHint: "Saving changes will replace this kanji's current personal mnemonic.",
    usePrepared: "Use selected mnemonic",
    saveChanges: "Save changes",
    cancel: "Cancel",
    delete: "Delete mnemonic",
    deleteConfirm: "Delete this personal mnemonic?",
    edit: "Edit personal mnemonic",
    emptyTitle: "Nothing found",
    emptyHint: "Try a different search term or level filter.",
    emptyCuratedHint: "There is no ready-made mnemonic for this search. Use Create a personal mnemonic to write your own.",
    emptyGeneratedHint: "No kanji matched this search and level filter."
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
      <div className="prepared-mnemonic-toolbar" role="group" aria-label={language === "fa" ? "ابزارهای جست‌وجو و فیلتر" : "Search and filter tools"}>
        <label className="prepared-mnemonic-search-shell">
          <span aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg></span>
          <input
            className="prepared-mnemonic-library-search"
            type="search"
            autoFocus
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
            <strong>{formatNumber(withoutCuratedCount, language)}</strong>
          </button>
        </div>

        <div className="prepared-mnemonic-level-filters">
          <label className="prepared-mnemonic-filter-select">
            <span>{copy.gradeLabel}</span>
            <select value={gradeFilter} onChange={event => setGradeFilter(event.target.value as GradeFilter)}>
              <option value="all">{copy.allGrades}</option>
              {(["1", "2", "3", "4", "5", "6"] as const).map(grade => (
                <option key={grade} value={grade}>{language === "fa" ? "پایهٔ " + grade : "Grade " + grade}</option>
              ))}
            </select>
          </label>
          <label className="prepared-mnemonic-filter-select">
            <span>{copy.jlptLabel}</span>
            <select value={jlptFilter} onChange={event => setJlptFilter(event.target.value as JLPTFilter)}>
              <option value="all">{copy.allJlpt}</option>
              {(["N5", "N4", "N3", "N2", "N1"] as const).map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {mode === "generated" ? (
        <div className="prepared-mnemonic-mode-note">
          <p>{copy.generatedModeNote}</p>
          {visualComponentLoadFailed ? (
            <p className="prepared-mnemonic-components-warning" role="status">
              {language === "fa" ? "اطلاعات اجزای شکل بارگذاری نشد؛ می‌توانی بدون آن هم یادسپار خودت را بنویسی." : "Shape-component data did not load. You can still write a mnemonic without it."}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="prepared-mnemonic-results-header">
        <strong>{resultLabel}</strong>
        <span aria-live="polite" aria-atomic="true">{formatNumber(visible.length, language)} / {formatNumber(filteredEntries.length, language)}</span>
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
              data-grade={item?.grade ?? "unknown"}
              data-jlpt={item?.jlpt ?? "unknown"}
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

                {isCurated ? <p className="prepared-mnemonic-library-mnemonic">{mnemonic}</p> : null}

                {!isCurated && components.length ? (
                  <div className="prepared-mnemonic-components" aria-label={copy.components}>
                    <span>{copy.components}</span>
                    <div>
                      {components.map(component => <bdi key={component} lang="ja">{component}</bdi>)}
                    </div>
                  </div>
                ) : null}

                {editingKey === key ? (
                  <div className="prepared-mnemonic-inline-editor">
                    <label className="prepared-mnemonic-inline-editor-field">
                      <span>{copy.personalLabel}</span>
                      <textarea
                        autoFocus
                        maxLength={600}
                        value={drafts[entry.character] ?? ""}
                        onChange={event => setDrafts(current => ({ ...current, [entry.character]: event.target.value }))}
                        aria-label={copy.personalLabel}
                      />
                      <small>{formatNumber((drafts[entry.character] ?? "").length, language)}/600</small>
                    </label>
                    {hasPersonalMnemonic ? <p className="prepared-mnemonic-inline-editor-hint">{copy.replaceHint}</p> : null}
                    <div className="prepared-mnemonic-inline-editor-actions">
                      {isCurated ? (
                        <button className="button secondary" type="button" disabled={busyKey !== ""}
                          onClick={() => setDrafts(current => ({ ...current, [entry.character]: mnemonic }))}>{copy.usePrepared}</button>
                      ) : null}
                      <button className="button primary" type="button"
                        disabled={busyKey !== "" || !(drafts[entry.character] ?? "").trim()}
                        onClick={() => void savePersonalDraft(entry.character, key)}>{busyKey === key ? copy.saving : copy.saveChanges}</button>
                      {hasPersonalMnemonic ? (
                        <button className="button secondary" type="button" disabled={busyKey !== ""}
                          onClick={() => void deletePersonalDraft(entry.character, key)}>{copy.delete}</button>
                      ) : null}
                      <button className="button secondary" type="button" disabled={busyKey === key}
                        onClick={() => { setEditingKey(""); setErrorKey(""); setErrorMessage(""); }}>{copy.cancel}</button>
                    </div>
                    {hasError ? <p className="prepared-mnemonic-inline-editor-error" role="alert">{errorMessage}</p> : null}
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
                          setDrafts(current => ({ ...current, [entry.character]: localPersonalMnemonics[entry.character] ?? "" }));
                          setEditingKey(key);
                          setErrorKey("");
                          setErrorMessage("");
                          return;
                        }
                        void apply(entry.character, entry.suggestion, key);
                      }}
                    >
                      {isBusy ? copy.saving : isApplied ? copy.saved : hasPersonalMnemonic ? copy.edit : copy.save}
                    </button>
                    {hasError && editingKey !== key ? <span className="prepared-mnemonic-row-error" role="alert">{errorMessage}</span> : null}
                  </>
                ) : (
                  <button
                    className="button secondary prepared-mnemonic-library-build"
                    type="button"
                    onClick={() => {
                      setDrafts(current => ({ ...current, [entry.character]: localPersonalMnemonics[entry.character] ?? "" }));
                      setEditingKey(key);
                      setErrorKey("");
                      setErrorMessage("");
                    }}
                  >
                    {hasPersonalMnemonic ? copy.edit : copy.build}
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
        setLocalPersonalMnemonics(currentMap => ({ ...currentMap, [character]: existing }));
        setDrafts(currentMap => ({ ...currentMap, [character]: existing }));
        setEditingKey(key);
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

  async function savePersonalDraft(character: string, key: string) {
    if (busyKey) return;
    const next = String(drafts[character] ?? "").trim();
    if (!next) return;
    setBusyKey(key);
    setAppliedKey("");
    setErrorKey("");
    setErrorMessage("");
    try {
      await saveMnemonic(character, next);
      setLocalPersonalMnemonics(currentMap => ({ ...currentMap, [character]: next }));
      setEditingKey("");
      setAppliedKey(key);
    } catch {
      setErrorKey(key);
      setErrorMessage(t("mnemonicSaveError", language));
    } finally {
      setBusyKey("");
    }
  }

  async function deletePersonalDraft(character: string, key: string) {
    if (busyKey || !localPersonalMnemonics[character]) return;
    if (!window.confirm(copy.deleteConfirm)) return;
    setBusyKey(key);
    setErrorKey("");
    setErrorMessage("");
    try {
      await saveMnemonic(character, "");
      setLocalPersonalMnemonics(currentMap => {
        const next = { ...currentMap };
        delete next[character];
        return next;
      });
      setDrafts(currentMap => ({ ...currentMap, [character]: "" }));
      setEditingKey("");
      setAppliedKey("");
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
          <span><strong>{formatNumber(generatedCount, language)}</strong>{language === "fa" ? " کانجی بدون یادسپار آماده" : " kanji without a prepared mnemonic"}</span>
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
