import { t, type Language } from "./i18n";
import { GrammarGuide } from "./GrammarGuide";

export function GrammarDialog({ open, language, onClose }: { open: boolean; language: Language; onClose: () => void }) {
  if (!open) return null;
  return (
    <dialog open className="dialog secondary-surface-dialog grammar-dialog" aria-labelledby="grammar-dialog-title">
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <h2 id="grammar-dialog-title">{t("grammarGuide", language)}</h2>
      <GrammarGuide language={language} />
    </dialog>
  );
}
