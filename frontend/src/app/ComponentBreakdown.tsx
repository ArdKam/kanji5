import type { ComponentInfo } from "./engine";
import { getComponentLabel } from "./mnemonic-support";
import { getLanguage } from "./i18n";
import "./component-breakdown.css";

export type ComponentBreakdownProps = {
  info: ComponentInfo;
  title: string;
  note?: string;
  ariaLabel: string;
};

export function ComponentBreakdown({ info, title, note, ariaLabel }: ComponentBreakdownProps) {
  if (!info.available || !info.components.length) return null;

  return (
    <section className="component-breakdown" aria-label={ariaLabel}>
      <div className="component-breakdown-header">
        <h3 className="component-breakdown-title">{title}</h3>
        {note ? <span className="component-breakdown-note">{note}</span> : null}
      </div>
      <div className="component-breakdown-visual" role="list" aria-label={ariaLabel}>
        <div className="component-breakdown-target-wrap">
          <strong className="component-breakdown-target" lang="ja">{info.character}</strong>
          <span className="component-breakdown-target-caption">{getLanguage() === "fa" ? "کانجی هدف" : "Target kanji"}</span>
        </div>
        <span className="component-breakdown-connector" aria-hidden="true">↳</span>
        <div className="component-breakdown-parts" role="group" aria-label={getLanguage() === "fa" ? "اجزای دیداری" : "Visual components"}>
          {info.components.map((component, index) => (
            <span className="component-breakdown-part-wrap" role="listitem" key={component + "-" + index}>
              <span className="component-breakdown-part-wrap-inner">
                <span className="component-breakdown-part" lang="ja">{component}</span>
                {getComponentLabel(component, getLanguage()) ? <span className="component-breakdown-label">{getComponentLabel(component, getLanguage())}</span> : null}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
