let learningCardCssPromise: Promise<string> | null = null;

function loadLearningCardCss(): Promise<string> {
  if (!learningCardCssPromise) {
    learningCardCssPromise = import("./learning-card-enhancements.css?inline").then(({ default: cssText }) => cssText);
  }
  return learningCardCssPromise;
}

/** Preload and attach card-only styles while the front face is shown. Reveal awaits this promise. */
export function ensureLearningCardStyles(): Promise<void> {
  if (typeof document === "undefined" || document.querySelector("style[data-rinemi-learning-card-styles]")) {
    return Promise.resolve();
  }
  return loadLearningCardCss().then((cssText) => {
    if (document.querySelector("style[data-rinemi-learning-card-styles]")) return;
    const style = document.createElement("style");
    style.dataset.rinemiLearningCardStyles = "true";
    style.textContent = cssText;
    document.head.append(style);
  });
}

// Start the local style-chunk request as soon as the Learning module is evaluated.
// The reveal path still awaits insertion, so no back-face content is shown unstyled.
void ensureLearningCardStyles().catch((error: unknown) => {
  console.error("Learning-card presentation styles could not be loaded.", error);
});

import type { VisualStructureInfo } from "./engine";
import type { Language } from "./i18n";

export function KanjiStructurePreview({
  character,
  info,
  ready,
  language,
  onOpen,
}: {
  character: string;
  info: VisualStructureInfo | null;
  ready: boolean;
  language: Language;
  onOpen: () => void;
}) {
  const components = info?.available ? info.components : [];
  const visibleComponents = components.slice(0, 4);
  const remaining = Math.max(0, components.length - visibleComponents.length);
  const previewLabel = language === "fa" ? "اجزای دیداری" : "Visual components";
  const actionLabel = language === "fa" ? "مشاهدهٔ ساختار کامل" : "View full structure";
  const actionAriaLabel = language === "fa"
    ? "مشاهدهٔ ساختار کامل کانجی " + character
    : "View full structure for " + character;
  const emptyStateLabel = info?.available
    ? (language === "fa" ? "جزء دیداری ریزتری ثبت نشده" : "No finer components recorded")
    : (language === "fa" ? "ساختار دیداری در دسترس نیست" : "Visual structure unavailable");

  return (
    <section className="kanji-structure-preview" aria-label={previewLabel} aria-busy={!ready}>
      <div className="kanji-structure-preview-copy">
        <span className="kanji-structure-preview-label">{previewLabel}</span>
        <div className="kanji-structure-preview-glyphs" aria-hidden="true">
          {!ready ? (
            <span className="kanji-structure-preview-skeleton" />
          ) : visibleComponents.length ? (
            <>
              {visibleComponents.map((component, index) => (
                <span className="kanji-structure-preview-glyph" lang="ja" key={component.character + "-" + index}>
                  {component.character}
                </span>
              ))}
              {remaining ? <span className="kanji-structure-preview-more">+{remaining}</span> : null}
            </>
          ) : (
            <span className="kanji-structure-preview-empty">{emptyStateLabel}</span>
          )}
        </div>
      </div>
      {ready ? (
        <button
          className="kanji-structure-preview-action"
          type="button"
          onClick={onOpen}
          aria-label={actionAriaLabel}
          title={actionAriaLabel}
          aria-haspopup="dialog"
        >
          <span>{actionLabel}</span>
          <span className="kanji-structure-preview-arrow" aria-hidden="true">↗</span>
        </button>
      ) : (
        <span className="kanji-structure-preview-action-placeholder" aria-hidden="true" />
      )}
    </section>
  );
}
