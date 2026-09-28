import { t, type Language } from "./i18n";
import { GrammarGuide } from "./GrammarGuide";
import { usePageDialog } from "./usePageDialog";

export function GrammarDialog({ open, language, onClose }: { open: boolean; language: Language; onClose: () => void }) {
  const dialogRef = useModalDialog(open, onClose);
  if (!open) return null;
  return (
    <dialog ref={dialogRef} className="dialog secondary-page-dialog secondary-surface-dialog grammar-dialog" aria-labelledby="grammar-dialog-title">
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <h2 id="grammar-dialog-title">{t("grammarGuide", language)}</h2>
      <GrammarGuide language={language} />
    </dialog>
  );
}
