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

const POSITION_LABELS: Record<string, { fa: string; en: string }> = {
  left: { fa: "چپ", en: "left" },
  right: { fa: "راست", en: "right" },
  top: { fa: "بالا", en: "top" },
  bottom: { fa: "پایین", en: "bottom" },
  middle: { fa: "میانه", en: "middle" },
  kamae: { fa: "قاب پیرامونی", en: "enclosure" },
};

function renderComponent(component: VisualStructureNode, path: string, language: "fa" | "en") {
  const label = getComponentLabel(component.character, language);
  const position = component.position ? POSITION_LABELS[component.position]?.[language] : "";
  const partialLabel = component.partial
    ? component.original
      ? (language === "fa" ? "بخشی از " : "Part of ") + component.original
      : (language === "fa" ? "شکل جزئی" : "Partial form")
    : "";
  const originalLabel = !component.partial && component.original && component.original !== component.character
    ? (language === "fa" ? "گونهٔ " : "Form of ") + component.original
    : "";
  const partLabel = component.part
    ? (language === "fa" ? "قطعهٔ " : "Fragment ") + component.part
    : "";
  const childrenLabel = language === "fa" ? "اجزای این جزء" : "Subcomponents";
  const classes = ["component-breakdown-part"];
  if (component.variant) classes.push("is-variant");
  if (component.partial || component.part) classes.push("is-partial");
  return (
    <span className="component-breakdown-part-wrap" role="listitem" key={path}>
      <span className="component-breakdown-part-wrap-inner">
        <span className={classes.join(" ")} lang="ja">{component.character}</span>
        {label ? <span className="component-breakdown-label">{label}</span> : null}
        {partialLabel ? <span className="component-breakdown-label component-breakdown-partial">{partialLabel}</span> : null}
        {originalLabel ? <span className="component-breakdown-label component-breakdown-partial">{originalLabel}</span> : null}
        {partLabel ? <span className="component-breakdown-label component-breakdown-partial">{partLabel}</span> : null}
        {position ? <span className="component-breakdown-label component-breakdown-position">{position}</span> : null}
        {component.components.length ? (
          <span className="component-breakdown-subparts" role="list" aria-label={childrenLabel}>
            {component.components.map((child, index) => renderComponent(child, path + "." + index, language))}
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
      <div className="component-breakdown-visual" role="group" aria-label={ariaLabel}>
        <div className="component-breakdown-target-wrap">
          <strong className="component-breakdown-target" lang="ja">{info.character}</strong>
          <span className="component-breakdown-target-caption">{language === "fa" ? "کانجی هدف" : "Target kanji"}</span>
        </div>
        <span className="component-breakdown-connector" aria-hidden="true">↳</span>
        <div className="component-breakdown-parts" role="list" aria-label={language === "fa" ? "اجزای مستقیم دیداری" : "Direct visual components"}>
          {info.components.map((component, index) => renderComponent(component, String(index), language))}
        </div>
      </div>
    </section>
  );
}
