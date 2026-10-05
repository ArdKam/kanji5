import { useEffect, useState } from "react";
import { t, type Language } from "./i18n";
import { listKanji, type KanjiCatalogItem } from "./engine";
import { ReadingLab, type ReadingWordSelection } from "./ReadingLab";
import { ReadingLabWordCard } from "./ReadingLabWordCard";
import { DictionaryKanjiCard } from "./DictionaryKanjiCard";
import { usePageDialog } from "./usePageDialog";

export function ReadingLabDialog({ open, language, onClose }: {
  open: boolean;
  language: Language;
  onClose: () => void;
}) {
  const [catalog, setCatalog] = useState<KanjiCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [selectedKanji, setSelectedKanji] = useState<KanjiCatalogItem | null>(null);
  const [selectedWord, setSelectedWord] = useState<ReadingWordSelection | null>(null);

  useEffect(() => {
    if (!open || catalog.length || loading || attempted) return;
    let active = true;
    setAttempted(true);
    setCatalogError(false);
    setLoading(true);
    void listKanji().then(result => {
      if (!active) return;
      setCatalog(result.results);
      setCatalogError(false);
    }).catch(() => {
      if (!active) return;
      setCatalog([]);
      setCatalogError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [open, catalog.length, loading, attempted]);

  const dialogRef = usePageDialog(open, onClose);

  if (!open) return null;

  return (
    <dialog ref={dialogRef} className="dialog secondary-page-dialog secondary-surface-dialog reading-lab-dialog" aria-labelledby="reading-lab-dialog-title">
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <h2 id="reading-lab-dialog-title">{t("readingLab", language)}</h2>
      {loading && !catalog.length ? <p className="empty-text" role="status">{t("dictionaryLoading", language)}</p> : null}
      {!loading && !catalog.length ? (
        <div className="empty-state reading-lab-catalog-error" role={catalogError ? "alert" : "status"}>
          <p>{language === "fa" ? "دادهٔ فرهنگ لغت در دسترس نیست." : "Dictionary data is unavailable."}</p>
          {catalogError ? <button className="button secondary" type="button" onClick={() => { setAttempted(false); setCatalogError(false); }}>{t("tryAgain", language)}</button> : null}
        </div>
      ) : null}
      {catalog.length ? <ReadingLab catalog={catalog} language={language} onSelectKanji={setSelectedKanji} onSelectWord={setSelectedWord} /> : null}
      {selectedWord ? (
        <ReadingLabWordCard selection={selectedWord} catalog={catalog} language={language} onClose={() => setSelectedWord(null)} onSelectKanji={item => { setSelectedWord(null); setSelectedKanji(item); }} />
      ) : null}
      {selectedKanji ? (
        <DictionaryKanjiCard
          item={selectedKanji}
          catalog={catalog}
          language={language}
          onClose={() => setSelectedKanji(null)}
          onSelectKanji={setSelectedKanji}
        />
      ) : null}
    </dialog>
  );
}
