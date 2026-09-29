import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { getMnemonic, saveMnemonic, type KanjiCatalogItem } from "./engine";
import { buildPreparedMnemonicEntries } from "./prepared-mnemonic-core";
import type { PreparedMnemonic } from "./mnemonic-library";
import { usePageDialog } from "./usePageDialog";

const normalize = (value: string) => value.trim().toLocaleLowerCase();

function PreparedMnemonicLibrary({ language, catalog, onSelectKanji }: { language: Language; catalog: KanjiCatalogItem[]; onSelectKanji: (item: KanjiCatalogItem) => void }) {
  const catalogByCharacter = useMemo(() => new Map(catalog.map(item => [item.character, item])), [catalog]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all"|"curated"|"grade1"|"n5">("all");
  const [visibleLimit, setVisibleLimit] = useState(60);
  const [componentMap, setComponentMap] = useState<Record<string, string[]>>({});
  const [busyKey, setBusyKey] = useState("");
  const [status, setStatus] = useState("");
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
  const filteredEntries = useMemo(() => {
    const q = normalize(query);
    return entries.filter(entry => {
      if (filter === "curated" && entry.suggestion.source !== "curated") return false;
      if (filter === "grade1" && Number(catalogByCharacter.get(entry.character)?.grade) !== 1) return false;
      if (filter === "n5" && catalogByCharacter.get(entry.character)?.jlpt !== "N5") return false;
      if (!q) return true;
      const mnemonic = language === "fa" ? entry.suggestion.fa : entry.suggestion.en;
      return normalize(entry.character).includes(q) || normalize(mnemonic).includes(q);
    });
  }, [entries, language, query, filter]);
  useEffect(() => { setVisibleLimit(60); }, [language, query, filter]);
  const visible = filteredEntries.slice(0, visibleLimit);

  const apply = async (character: string, suggestion: PreparedMnemonic, key: string) => {
    if (busyKey) return;
    setBusyKey(key);
    setStatus("");
    try {
      const current = await getMnemonic(character);
      const existing = String(current.text ?? "").trim();
      const next = language === "fa" ? suggestion.fa : suggestion.en;
      if (existing && existing !== next) { setStatus(language === "fa" ? "یادسپار شخصی فعلی وجود دارد؛ ابتدا آن را از کارت کانجی تغییر دهید." : "A personal mnemonic already exists. Change it from the kanji card first."); return; }
      await saveMnemonic(character, next);
      setStatus((language === "fa" ? "✓ یادسپار «" : "✓ Mnemonic for ") + character + (language === "fa" ? "» ذخیره شد." : " saved."));
    } catch {
      setStatus(t("mnemonicSaveError", language));
    } finally {
      setBusyKey("");
    }
  };

  return (
    <section className="prepared-mnemonic-library">
      <div className="prepared-mnemonic-filters" role="group" aria-label={language==="fa"?"فیلتر یادسپارها":"Mnemonic filters"}>{([["all",language==="fa"?"همه":"All"],["curated",language==="fa"?"دست‌چین":"Curated"],["grade1",language==="fa"?"پایه ۱":"Grade 1"],["n5","JLPT N5"]] as const).map(([key,label])=><button key={key} type="button" className={"grammar-chip "+(filter===key?"active":"")} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}</div>
      <p className="prepared-mnemonic-library-hint">{t("preparedMnemonicLibraryHint", language)}</p>
      <input
        className="prepared-mnemonic-library-search"
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder={t("preparedMnemonicLibrarySearch", language)}
        aria-label={t("preparedMnemonicLibrarySearch", language)}
      />
      <div className="prepared-mnemonic-library-count">
        {formatNumber(visible.length, language)} / {formatNumber(filteredEntries.length, language)}
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
              <div className="prepared-mnemonic-library-source">
                {entry.suggestion.source === "curated" ? t("preparedMnemonicCurated", language) : t("preparedMnemonicScaffold", language)}
              </div>
              <p>{mnemonic}</p>
              {entry.suggestion.source === "curated" ? (
                <button className="button secondary prepared-mnemonic-library-use" type="button" disabled={busyKey !== ""} onClick={() => void apply(entry.character, entry.suggestion, key)}>
                  {busyKey === key ? "…" : t("useMnemonic", language)}
                </button>
              ) : (
                <span className="prepared-mnemonic-library-scaffold-label">{t("preparedMnemonicScaffold", language)}</span>
              )}
            </div>
          );
        })}
      </div>
      {visible.length < filteredEntries.length ? (
        <button
          className="button secondary prepared-mnemonic-library-more"
          type="button"
          onClick={() => setVisibleLimit(value => Math.min(value + 60, filteredEntries.length))}
        >
          {t("preparedMnemonicLoadMore", language)}
        </button>
      ) : null}
      {status ? <p className="prepared-mnemonic-status" role="status">{status}</p> : null}
    </section>
  );
}


export function MnemonicsDialog({ open, language, catalog, onClose, onSelectKanji }: {
  open: boolean;
  language: Language;
  catalog: KanjiCatalogItem[];
  onClose: () => void;
  onSelectKanji: (item: KanjiCatalogItem) => void;
}) {
  const dialogRef = usePageDialog(open, onClose);

  if (!open) return null;
  return (
    <dialog ref={dialogRef} className="dialog secondary-page-dialog secondary-surface-dialog mnemonics-dialog" aria-labelledby="mnemonics-dialog-title">
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <h2 id="mnemonics-dialog-title">{t("preparedMnemonicLibrary", language)}</h2>
      <p className="secondary-surface-dialog-hint">{t("preparedMnemonicLibraryHint", language)}</p>
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
