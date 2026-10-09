import type { VisualStructureInfo, VisualStructureNode } from "./engine";
import { getComponentLabel } from "./mnemonic-support";
import { getLanguage } from "./i18n";
import "./component-breakdown.css";

export type ComponentBreakdownProps = {
  info: VisualStructureInfo;
  title: string;
  note?: string;
  ariaLabel: string;
};

function renderComponent(component: VisualStructureNode, index: number, language: "fa" | "en") {
  const label = getComponentLabel(component.character, language);
  return (
    <span className="component-breakdown-part-wrap" role="listitem" key={component.character + "-" + index}>
      <span className="component-breakdown-part-wrap-inner">
        <span className={component.variant ? "component-breakdown-part is-variant" : "component-breakdown-part"} lang="ja">{component.character}</span>
        {label ? <span className="component-breakdown-label">{label}</span> : null}
        {component.components.length ? (
          <span className="component-breakdown-label" aria-label={language === "fa" ? "اجزای این جزء" : "Subcomponents"}>
            {component.components.map(child => child.character).join(" + ")}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function ComponentBreakdown({ info, title, note, ariaLabel }: ComponentBreakdownProps) {
  if (!info.available || !info.root || !info.components.length) return null;
  const language = getLanguage();

  return (
    <section className="component-breakdown" aria-label={ariaLabel}>
      <div className="component-breakdown-header">
        <h3 className="component-breakdown-title">{title}</h3>
        {note ? <span className="component-breakdown-note">{note}</span> : null}
      </div>
      <div className="component-breakdown-visual" role="list" aria-label={ariaLabel}>
        <div className="component-breakdown-target-wrap">
          <strong className="component-breakdown-target" lang="ja">{info.character}</strong>
          <span className="component-breakdown-target-caption">{language === "fa" ? "کانجی هدف" : "Target kanji"}</span>
        </div>
        <span className="component-breakdown-connector" aria-hidden="true">↳</span>
        <div className="component-breakdown-parts" role="group" aria-label={language === "fa" ? "اجزای مستقیم دیداری" : "Direct visual components"}>
          {info.components.map((component, index) => renderComponent(component, index, language))}
        </div>
      </div>
    </section>
  );
}
