import { useEffect, useMemo, useState } from "react";
import { getVocabulary, type KanjiCatalogItem, type VocabularyItem } from "./engine";
import { formatNumber, t, type Language } from "./i18n";
import { DictionaryAudio } from "./DictionaryPrimitives";

export function VocabularyExamples({ character: kanjiCharacter, language, catalog, onSelectKanji }: { character: string; language: Language; catalog: KanjiCatalogItem[]; onSelectKanji: (item: KanjiCatalogItem) => void }) {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setItems([]);
    setLoading(true);
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
            {items.map(item => (
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
          {vocabularyEdges.some(edge => edge.related.length) ? (
            <section className="vocabulary-learning-graph" aria-label={t("vocabularyLearningGraph", language)}>
              <div className="vocabulary-learning-graph-header">
                <div>
                  <h4>{t("vocabularyLearningGraph", language)}</h4>
                  <p>{t("vocabularyLearningGraphHint", language)}</p>
                </div>
                <span className="vocabulary-learning-graph-root" lang="ja">{kanjiCharacter}</span>
              </div>
              <div className="vocabulary-learning-graph-list" role="list">
                {vocabularyEdges.filter(edge => edge.related.length).slice(0, 6).map(edge => (
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
            </section>
          ) : null}
        </>
      ) : null}
      {!loading && !items.length ? <p className="dictionary-vocabulary-empty">{t("dictionaryVocabularyEmpty", language)}</p> : null}
    </section>
  );
}
