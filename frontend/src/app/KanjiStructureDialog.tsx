import { useEffect, useState } from "react";
import { ComponentBreakdown } from "./ComponentBreakdown";
import { TraditionalRadical } from "./TraditionalRadical";
import { getRadicalInfo, type RadicalInfo, type VisualStructureInfo } from "./engine";
import { t, type Language } from "./i18n";
import { useModalDialog } from "./useModalDialog";

export function KanjiStructureDialog({
  open,
  onClose,
  character,
  info,
  language,
}: {
  open: boolean;
  onClose: () => void;
  character: string;
  info: VisualStructureInfo | null;
  language: Language;
}) {
  const dialogRef = useModalDialog(open, onClose);
  const [radicalInfo, setRadicalInfo] = useState<RadicalInfo | null>(null);
  const [radicalResolved, setRadicalResolved] = useState(false);

  useEffect(() => {
    let active = true;
    setRadicalInfo(null);
    setRadicalResolved(false);
    if (!open || !character) return () => { active = false; };
    void getRadicalInfo(character).then((result) => {
      if (active) setRadicalInfo(result);
    }).catch(() => {
      if (active) setRadicalInfo(null);
    }).finally(() => {
      if (active) setRadicalResolved(true);
    });
    return () => { active = false; };
  }, [character, open]);

  const title = language === "fa" ? "ساختار کانجی" : "Kanji structure";
  const structureUnavailable = language === "fa"
    ? "اطلاعات ساختار دیداری برای این کانجی در دسترس نیست."
    : "Visual structure data is unavailable for this kanji.";
  const structureAtomic = language === "fa"
    ? "در دادهٔ منبع، جزء دیداریِ ریزتری برای این کانجی ثبت نشده است."
    : "The source records no finer visual component for this kanji.";
  const sourceNote = language === "fa"
    ? "تجزیهٔ دیداری بر اساس KanjiVG است و ادعایی دربارهٔ ریشه‌شناسی تاریخی ندارد."
    : "KanjiVG visual decomposition; it does not claim historical etymology.";

  return (
    <dialog
      ref={dialogRef}
      className="dialog secondary-page-dialog kanji-structure-dialog"
      aria-labelledby="kanji-structure-dialog-title"
      aria-describedby="kanji-structure-dialog-description"
    >
      <header className="kanji-structure-dialog-header">
        <div>
          <h2 id="kanji-structure-dialog-title">{title}</h2>
          <p id="kanji-structure-dialog-description" className="secondary-surface-dialog-hint">{sourceNote}</p>
        </div>
        <button className="dialog-close" type="button" aria-label={t("close", language)} title={t("close", language)} onClick={onClose}>×</button>
      </header>
      <div className="kanji-structure-dialog-body">
        {!radicalResolved ? (
          <div className="kanji-structure-radical-loading" role="status">
            {language === "fa" ? "در حال بارگذاری اطلاعات رادیکال…" : "Loading traditional radical…"}
          </div>
        ) : radicalInfo?.available && radicalInfo.radical ? (
          <TraditionalRadical info={radicalInfo} language={language} />
        ) : null}
        {info?.available && info.components.length ? (
          <ComponentBreakdown
            info={info}
            title={t("kanjiStructure", language)}
            note={t("visualComponents", language)}
            ariaLabel={t("visualKanjiStructure", language)}
          />
        ) : (
          <p className="kanji-structure-dialog-empty" role="status">
            {info?.available ? structureAtomic : structureUnavailable}
          </p>
        )}
      </div>
      <footer className="kanji-structure-dialog-footer">
        <span>KanjiVG · CC BY-SA 3.0</span>
        <span>{language === "fa" ? "رادیکال سنتی و اجزای دیداری دو مفهوم جدا هستند." : "Traditional radical and visual components are distinct concepts."}</span>
      </footer>
    </dialog>
  );
}
