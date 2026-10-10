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
  const actionLabel = language === "fa" ? "جزئیات ساختار" : "Structure details";
  const actionAriaLabel = language === "fa"
    ? "مشاهدهٔ ساختار کامل کانجی " + character
    : "View full structure for " + character;

  return (
    <section className="kanji-structure-preview" aria-label={previewLabel} aria-busy={!ready}>
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
          <span className="kanji-structure-preview-atomic" lang="ja">{info?.available ? character : "…"}</span>
        )}
      </div>
      {ready ? (
        <button
          className="kanji-structure-preview-action"
          type="button"
          onClick={onOpen}
          aria-label={actionAriaLabel}
          title={actionAriaLabel}
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
