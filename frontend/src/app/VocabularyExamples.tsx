import { useEffect, useMemo, useState } from "react";
import { getVocabulary, type KanjiCatalogItem, type VocabularyItem } from "./engine";
import { formatNumber, t, type Language } from "./i18n";
import { DictionaryAudio } from "./DictionaryPrimitives";

export function VocabularyExamples({ character: kanjiCharacter, language, catalog, onSelectKanji }: { character: string; language: Language; catalog: KanjiCatalogItem[]; onSelectKanji: (item: KanjiCatalogItem) => void }) {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllExamples, setShowAllExamples] = useState(false);
  const [showAllGraph, setShowAllGraph] = useState(false);

  useEffect(() => {
    let active = true;
    setItems([]);
    setLoading(true);
    setShowAllExamples(false);
    setShowAllGraph(false);
    void getVocabulary(kanjiCharacter).then(result => {
      if (active) setItems((result.items ?? []).slice(0, 8));
    }).catch(() => {
      if (active) setItems([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [kanjiCharacter]);

  const catalogByCharacter = useMemo(() => new Map(catalog.map(item => [item.character, item])), [catalog]);
  const vocabularyEdges = useMemo(() => items.map(item => {
    const related = [...new Set(Array.from(item.word).filter(char => char !== kanjiCharacter && catalogByCharacter.has(char)))].slice(0, 5);
    return { ...item, related };
  }), [catalogByCharacter, items, kanjiCharacter]);
  const visibleItems = showAllExamples ? items : items.slice(0, 3);
  const graphEdges = vocabularyEdges.filter(edge => edge.related.length);
  const visibleGraphEdges = showAllGraph ? graphEdges : graphEdges.slice(0, 3);

  return (
    <section className="dictionary-vocabulary" aria-label={t("dictionaryVocabulary", language)}>
      <div className="dictionary-vocabulary-header">
        <div>
          <h3>{t("dictionaryVocabulary", language)}</h3>
          <p>{t("dictionaryVocabularyHint", language)}</p>
        </div>
      </div>
      {loading ? <div className="dictionary-vocabulary-status" role="status">{t("dictionarySearching", language)}</div> : null}
      {!loading && items.length ? (
        <>
          <div className="dictionary-vocabulary-list">
            {visibleItems.map(item => (
              <div className="dictionary-vocabulary-item" key={item.word + "-" + item.reading}>
                <div className="dictionary-vocabulary-main">
                  <strong lang="ja">{item.word}</strong>
                  <span lang="ja">{item.reading}</span>
                </div>
                <p>{item.meaning}</p>
                <DictionaryAudio value={item.reading} label={t("playWordPronunciation", language) + " " + item.word} />
              </div>
            ))}
          </div>
          {items.length > 3 ? (
            <button className="dictionary-vocabulary-more" type="button" onClick={() => setShowAllExamples(current => !current)} aria-expanded={showAllExamples}>
              {showAllExamples ? (language === "fa" ? "نمایش کمتر" : "Show less") : (language === "fa" ? `نمایش همهٔ نمونه‌ها (${items.length})` : `Show all examples (${items.length})`)}
            </button>
          ) : null}
          {graphEdges.length ? (
            <section className="vocabulary-learning-graph" aria-label={t("vocabularyLearningGraph", language)}>
              <div className="vocabulary-learning-graph-header">
                <div>
                  <h4>{t("vocabularyLearningGraph", language)}</h4>
                  <p>{t("vocabularyLearningGraphHint", language)}</p>
                </div>
                <span className="vocabulary-learning-graph-root" lang="ja">{kanjiCharacter}</span>
              </div>
              <div className="vocabulary-learning-graph-list" role="list">
                {visibleGraphEdges.map(edge => (
                  <div className="vocabulary-learning-graph-edge" key={edge.word + "-" + edge.reading} role="listitem">
                    <span className="vocabulary-learning-graph-word" lang="ja">{edge.word}</span>
                    <span className="vocabulary-learning-graph-arrow" aria-hidden="true">→</span>
                    <div className="vocabulary-learning-graph-related">
                      {edge.related.map(relatedCharacter => {
                        const relatedItem = catalogByCharacter.get(relatedCharacter);
                        return relatedItem ? (
                          <button
                            key={relatedCharacter}
                            className="vocabulary-learning-graph-kanji"
                            type="button"
                            lang="ja"
                            onClick={() => onSelectKanji(relatedItem)}
                            title={t("lookupKanji", language)}
                          >
                            {relatedCharacter}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {graphEdges.length > 3 ? (
                <button className="dictionary-vocabulary-more" type="button" onClick={() => setShowAllGraph(current => !current)} aria-expanded={showAllGraph}>
                  {showAllGraph ? (language === "fa" ? "نمایش کمتر" : "Show less") : (language === "fa" ? `نمایش شبکهٔ کامل (${graphEdges.length})` : `Show full vocabulary network (${graphEdges.length})`)}
                </button>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}
      {!loading && !items.length ? <p className="dictionary-vocabulary-empty">{t("dictionaryVocabularyEmpty", language)}</p> : null}
    </section>
  );
}
