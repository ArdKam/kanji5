import { useEffect, useState } from "react";
import { t, type Language } from "./i18n";
import { listKanji, type KanjiCatalogItem } from "./engine";
import { ReadingLab } from "./ReadingLab";

export function ReadingLabDialog({ open, language, onClose, onSelectKanji }: {
  open: boolean;
  language: Language;
  onClose: () => void;
  onSelectKanji: (item: KanjiCatalogItem) => void;
}) {
  const [catalog, setCatalog] = useState<KanjiCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || catalog.length || loading) return;
    let active = true;
    setLoading(true);
    void listKanji().then(result => {
      if (active) setCatalog(result.results);
    }).catch(() => {
      if (active) setCatalog([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [open, catalog.length, loading]);

  if (!open) return null;

  return (
    <dialog open className="dialog secondary-surface-dialog reading-lab-dialog" aria-labelledby="reading-lab-dialog-title">
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <h2 id="reading-lab-dialog-title">{t("readingLab", language)}</h2>
      {loading && !catalog.length ? <p className="empty-text" role="status">{t("dictionaryLoading", language)}</p> : null}
      {!loading && !catalog.length ? <p className="empty-text" role="status">{language === "fa" ? "دادهٔ فرهنگ لغت در دسترس نیست." : "Dictionary data is unavailable."}</p> : null}
      {catalog.length ? <ReadingLab catalog={catalog} language={language} onSelectKanji={item => { onSelectKanji(item); onClose(); }} /> : null}
    </dialog>
  );
}
