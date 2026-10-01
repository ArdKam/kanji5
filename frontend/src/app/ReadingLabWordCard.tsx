import { DictionaryAudio } from "./DictionaryPrimitives";
import { useModalDialog } from "./useModalDialog";
import { formatNumber, t, type Language } from "./i18n";
import type { KanjiCatalogItem, VocabularyItem } from "./engine";

export function ReadingLabWordCard({
  selection, catalog, language, onClose, onSelectKanji,
}: {
  selection: { item: VocabularyItem; context: string; start: number; end: number; sentenceIndex: number };
  catalog: KanjiCatalogItem[];
  language: Language;
  onClose: () => void;
  onSelectKanji: (item: KanjiCatalogItem) => void;
}) {
  const dialogRef = useModalDialog(true, onClose);
  const catalogByCharacter = new Map(catalog.map(item => [item.character, item]));
  const relatedKanji = [...new Set(Array.from(selection.item.word).filter(char => /\p{Script=Han}/u.test(char) && catalogByCharacter.has(char)))];

  return (
    <dialog ref={dialogRef} className="dialog reading-word-dialog" aria-labelledby="reading-word-title">
      <article className="reading-word-card">
        <header className="reading-word-card-header">
          <div>
            <p className="eyebrow">{t("readingLabWordTitle", language)}</p>
            <h2 id="reading-word-title" lang="ja">{selection.item.word}</h2>
            <p className="reading-word-card-reading" lang="ja">{selection.item.reading}</p>
          </div>
          <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
        </header>
        <section className="reading-word-card-section">
          <span>{t("readingLabWordMeaning", language)}</span>
          <strong dir="auto">{selection.item.meaning}</strong>
          <DictionaryAudio value={selection.item.reading} label={t("playWordPronunciation", language) + " " + selection.item.word} />
        </section>
        <section className="reading-word-card-section reading-word-context">
          <span>{t("readingLabWordContext", language)}</span>
          <p lang="ja">{Array.from(selection.context).map((char, index) => (
            <span key={char + "-" + index} className={index >= selection.start && index < selection.end ? "is-word" : undefined}>{char}</span>
          ))}</p>
        </section>
        {relatedKanji.length ? (
          <section className="reading-word-card-section">
            <span>{t("readingLabWordKanji", language)}</span>
            <div className="reading-word-kanji-list">
              {relatedKanji.map(character => {
                const item = catalogByCharacter.get(character);
                return item ? (
                  <button key={character} type="button" className="reading-word-kanji" lang="ja" onClick={() => {
                    onClose();
                    onSelectKanji(item);
                  }} aria-label={character + " — " + t("readingLabOpenKanji", language)}>
                    <span>{character}</span>
                    <small>{formatNumber(Math.round(Math.max(0, Math.min(1, item.mastery)) * 100), language)}%</small>
                  </button>
                ) : null;
              })}
            </div>
          </section>
        ) : null}
        <p className="reading-word-card-hint">{t("readingLabWordLookupHint", language)}</p>
      </article>
    </dialog>
  );
}
