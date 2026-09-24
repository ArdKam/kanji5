import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { listKanji, type KanjiCatalogItem } from "./engine";

type LevelFilter = "all" | "N5" | "N4" | "N3" | "N2" | "N1";
type SortMode = "level-asc" | "level-desc" | "mastery-desc" | "mastery-asc" | "order";
const levelRank: Record<string, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };

const normalize = (value: string) => value.trim().toLocaleLowerCase();

function DictionaryKanjiCard({ item, language, onClose }: { item: KanjiCatalogItem; language: Language; onClose: () => void }) {
  const mastery = Math.round(Math.max(0, Math.min(1, item.mastery)) * 100);
  return (
    <dialog open className="dialog dictionary-card-dialog" aria-labelledby="dictionary-card-title">
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <div className="dictionary-card">
        <div className="dictionary-card-top">
          <span className="badge badge-red">{item.jlpt || "—"}</span>
          <span className="dictionary-card-mastery">{t("dictionaryMastery", language)} {formatNumber(mastery, language)}%</span>
        </div>
        <div className="dictionary-card-character" lang="ja">{item.character}</div>
        <h2 id="dictionary-card-title">{t("dictionaryCardTitle", language)}</h2>
        {item.meanings.length ? <div className="dictionary-card-section"><span>{t("meaning", language)}</span><strong>{item.meanings.join(" · ")}</strong></div> : null}
        {item.on.length ? <div className="dictionary-card-section"><span>{t("dictionaryOn", language)}</span><strong lang="ja">{item.on.join(" · ")}</strong></div> : null}
        {item.kun.length ? <div className="dictionary-card-section"><span>{t("dictionaryKun", language)}</span><strong lang="ja">{item.kun.join(" · ")}</strong></div> : null}
        <div className="dictionary-card-meta">
          {item.strokes ? <span>{t("dictionaryStrokes", language)} {formatNumber(item.strokes, language)}</span> : null}
          {item.grade ? <span>{t("dictionaryGrade", language)} {formatNumber(item.grade, language)}</span> : null}
          {item.frequency ? <span>{t("dictionaryFrequency", language)} #{formatNumber(item.frequency, language)}</span> : null}
        </div>
      </div>
    </dialog>
  );
}

export function DictionaryPage({ language }: { language: Language }) {
  const [catalog, setCatalog] = useState<KanjiCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [sort, setSort] = useState<SortMode>("level-asc");
  const [selected, setSelected] = useState<KanjiCatalogItem | null>(null);

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
      if (sort === "level-desc") return (levelRank[b.jlpt || ""] ?? 99) - (levelRank[a.jlpt || ""] ?? 99) || a.order - b.order;
      if (sort === "order") return a.order - b.order;
      return (levelRank[a.jlpt || ""] ?? 99) - (levelRank[b.jlpt || ""] ?? 99) || a.order - b.order;
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

      {loading ? <div className="surface loading dictionary-loading">{t("dictionaryLoading", language)}</div> : null}
      {!loading && !visible.length ? <div className="surface dictionary-empty">{t("dictionaryNoResults", language)}</div> : null}
      {!loading && visible.length ? (
        <div className="kanji-catalog-grid" role="grid" aria-label={t("dictionaryGrid", language)}>
          {visible.map((item) => {
            const mastery = Math.max(0, Math.min(1, Number(item.mastery) || 0));
            const fillOpacity = mastery === 0 ? 0 : 0.2 + mastery * 0.8;
            return (
              <button
                key={item.character}
                className="kanji-catalog-tile"
                type="button"
                role="gridcell"
                data-jlpt={item.jlpt || "unknown"}
                data-mastery={mastery.toFixed(3)}
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
