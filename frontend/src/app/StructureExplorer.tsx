import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  getKanjiByComponent,
  getKanjiByComponents,
  getKanjiByRadical,
  listRadicals,
  type KanjiCatalogItem,
  type KanjiDictionaryResult,
  type RadicalCatalogResult,
} from "./engine";
import { formatNumber, type Language } from "./i18n";
import "./structure-explorer.css";

type ExplorerMode = "radical" | "component";
type ExplorerRequest = { mode: ExplorerMode; query: string; nonce: number; prefetchedResults?: KanjiDictionaryResult[] };

type Props = {
  language: Language;
  catalog: KanjiCatalogItem[];
  onSelectKanji: (item: KanjiCatalogItem) => void;
  request?: ExplorerRequest | null;
};

export function StructureExplorer({ language, catalog, onSelectKanji, request }: Props) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const catalogByCharacter = useMemo(() => new Map(catalog.map(item => [item.character, item])), [catalog]);
  const [mode, setMode] = useState<ExplorerMode>("radical");
  const [query, setQuery] = useState("");
  const [recursive, setRecursive] = useState(true);
  const [radicals, setRadicals] = useState<RadicalCatalogResult[]>([]);
  const [radicalMatches, setRadicalMatches] = useState<RadicalCatalogResult[]>([]);
  const [results, setResults] = useState<KanjiDictionaryResult[]>([]);
  const [selectedRadicalId, setSelectedRadicalId] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void listRadicals().then(value => {
      if (!active) return;
      setRadicals(value.results ?? []);
    }).catch(() => {
      if (active) setRadicals([]);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!request) return;
    setMode(request.mode);
    setQuery(request.query);
    setSearched(false);
    setSelectedRadicalId(null);
    setError("");
    if (detailsRef.current) detailsRef.current.open = true;
    if (Array.isArray(request.prefetchedResults)) {
      setMode(request.mode);
      setQuery(request.query);
      setSelectedRadicalId(request.mode === "radical" ? Number(request.query) : null);
      setRadicalMatches([]);
      setSearched(true);
      setResults(request.prefetchedResults);
      setBusy(false);
      return;
    }
    if (request.mode === "radical") {
      const normalized = request.query.trim().toLocaleLowerCase();
      const match = radicals.find(item =>
        String(item.id) === normalized ||
        item.canonicalGlyph.toLocaleLowerCase() === normalized ||
        item.variants.some(value => value.toLocaleLowerCase() === normalized)
      );
      if (match) void selectRadical(match);
      else setSearched(false);
    } else if (request.query.trim()) {
      void searchComponents(request.query, recursive);
    }
    // Request nonce makes repeated requests intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.nonce]);

  const filteredRadicals = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return radicals.slice(0, 18);
    return radicals.filter(item => {
      return String(item.id) === q ||
        item.canonicalGlyph.toLocaleLowerCase().includes(q) ||
        item.variants.some(value => value.toLocaleLowerCase().includes(q)) ||
        item.names?.ja?.toLocaleLowerCase().includes(q) ||
        item.readings?.ja?.some(value => value.toLocaleLowerCase().includes(q));
    }).slice(0, 24);
  }, [query, radicals]);

  async function selectRadical(radical: RadicalCatalogResult) {
    setMode("radical");
    setQuery(String(radical.id));
    setSelectedRadicalId(radical.id);
    setSearched(true);
    setBusy(true);
    setError("");
    try {
      const value = await getKanjiByRadical(radical.id, 80);
      setResults(value.results ?? []);
      setRadicalMatches([radical]);
    } catch {
      setResults([]);
      setError(language === "fa" ? "اطلاعات این رادیکال بارگذاری نشد." : "This radical could not be loaded.");
    } finally {
      setBusy(false);
    }
  }

  async function searchComponents(raw: string, useRecursive: boolean) {
    const glyphs = [...new Set(raw.split(/[+,\s،]+/).map(value => value.trim()).filter(Boolean))].slice(0, 6);
    if (!glyphs.length) {
      setResults([]);
      setSearched(false);
      return;
    }
    setMode("component");
    setQuery(glyphs.join(" + "));
    setSelectedRadicalId(null);
    setSearched(true);
    setBusy(true);
    setError("");
    try {
      const value = glyphs.length === 1
        ? await getKanjiByComponent(glyphs[0], useRecursive, 80)
        : await getKanjiByComponents(glyphs, useRecursive, 80);
      setResults(value.results ?? []);
    } catch {
      setResults([]);
      setError(language === "fa" ? "اطلاعات اجزا بارگذاری نشد." : "Component lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "radical") {
      const q = query.trim();
      const numeric = Number(q);
      const match = radicals.find(item =>
        (Number.isInteger(numeric) && item.id === numeric) ||
        item.canonicalGlyph === q ||
        item.variants.includes(q)
      );
      if (match) {
        await selectRadical(match);
        return;
      }
      setRadicalMatches(filteredRadicals);
      setResults([]);
      setSelectedRadicalId(null);
      setSearched(Boolean(q));
      return;
    }
    await searchComponents(query, recursive);
  }

  const displayResults = results.slice(0, 48);

  return (
    <details className="structure-explorer" ref={detailsRef}>
      <summary>
        <span>{language === "fa" ? "کاوش ساختار کانجی" : "Kanji structure explorer"}</span>
        <span className="structure-explorer-summary-note">
          {language === "fa" ? "رادیکال و اجزای دیداری" : "Radicals & visual components"}
        </span>
      </summary>

      <div className="structure-explorer-body">
        <div className="structure-explorer-tabs" role="tablist" aria-label={language === "fa" ? "نوع ساختار" : "Structure type"}>
          <button
            className={mode === "radical" ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={mode === "radical"}
            onClick={() => { setMode("radical"); setResults([]); setSearched(false); setSelectedRadicalId(null); }}
          >
            {language === "fa" ? "رادیکال سنتی" : "Traditional radical"}
          </button>
          <button
            className={mode === "component" ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={mode === "component"}
            onClick={() => { setMode("component"); setResults([]); setSearched(false); setSelectedRadicalId(null); }}
          >
            {language === "fa" ? "جزء دیداری" : "Visual component"}
          </button>
        </div>

        <form className="structure-explorer-search" onSubmit={submit}>
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={mode === "radical"
              ? (language === "fa" ? "شمارهٔ ۱–۲۱۴ یا خود رادیکال، مثل 水" : "Radical 1–214 or glyph, e.g. 水")
              : (language === "fa" ? "جزء یا چند جزء، مثل 氵 یا 氵 + 胡" : "One or more components, e.g. 氵 or 氵 + 胡")}
            aria-label={mode === "radical"
              ? (language === "fa" ? "جست‌وجوی رادیکال" : "Search radical")
              : (language === "fa" ? "جست‌وجوی جزء دیداری" : "Search visual component")}
          />
          <button className="button primary" type="submit" disabled={busy}>
            {language === "fa" ? "جست‌وجو" : "Search"}
          </button>
        </form>

        {mode === "component" ? (
          <label className="structure-explorer-toggle">
            <input type="checkbox" checked={recursive} onChange={event => setRecursive(event.target.checked)} />
            <span>{language === "fa" ? "شامل اجزای تو‌در‌تو" : "Include recursive components"}</span>
          </label>
        ) : null}

        {mode === "radical" && !searched ? (
          <div className="structure-radical-grid" role="list" aria-label={language === "fa" ? "رادیکال‌ها" : "Radicals"}>
            {filteredRadicals.map(radical => (
              <button key={radical.id} type="button" className="structure-radical-chip" onClick={() => void selectRadical(radical)}>
                <span className="structure-radical-chip-glyph" lang="ja">{radical.canonicalGlyph}</span>
                <span className="structure-radical-chip-meta">#{formatNumber(radical.id, language)}</span>
              </button>
            ))}
          </div>
        ) : null}

        {mode === "radical" && searched && radicalMatches.length === 0 && !selectedRadicalId ? (
          <div className="structure-explorer-empty">{language === "fa" ? "رادیکالی با این جست‌وجو پیدا نشد." : "No radical matched this search."}</div>
        ) : null}

        {mode === "radical" && selectedRadicalId ? (
          <div className="structure-selection">
            <strong>{language === "fa" ? "رادیکال" : "Radical"} {selectedRadicalId}</strong>
            {radicalMatches[0]?.canonicalGlyph ? <span lang="ja">{radicalMatches[0].canonicalGlyph}</span> : null}
            <span>{language === "fa" ? "نتایج کانجی" : "Kanji using this radical"}</span>
          </div>
        ) : null}

        {error ? <p className="structure-explorer-error" role="alert">{error}</p> : null}
        {busy ? <div className="structure-explorer-status" role="status">…</div> : null}

        {!busy && searched && results.length ? (
          <div className="structure-result-list" role="list">
            {displayResults.map(item => {
              const catalogItem = catalogByCharacter.get(item.character);
              return (
                <button
                  key={item.character}
                  type="button"
                  className="structure-result"
                  onClick={() => catalogItem && onSelectKanji(catalogItem)}
                  disabled={!catalogItem}
                >
                  <span className="structure-result-kanji" lang="ja">{item.character}</span>
                  <span className="structure-result-copy">
                    <strong>{item.meanings.slice(0, 2).join(" · ") || "—"}</strong>
                    <span>{item.jlpt || "—"} · {formatNumber(item.strokes ?? 0, language)} {language === "fa" ? "استروک" : "strokes"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {!busy && searched && !results.length && (mode === "component" || selectedRadicalId) ? (
          <div className="structure-explorer-empty">
            {language === "fa" ? "کانجی مطابق این ساختار پیدا نشد." : "No kanji matched this structure."}
          </div>
        ) : null}

        {mode === "component" && searched && results.length && query.includes("+") ? (
          <p className="structure-explorer-footnote">
            {language === "fa" ? "این نتایج اشتراک اجزای واردشده را نشان می‌دهند." : "These results are the intersection of the selected components."}
          </p>
        ) : null}
      </div>
    </details>
  );
}
