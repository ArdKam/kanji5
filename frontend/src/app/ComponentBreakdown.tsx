import type { ComponentInfo } from "./engine";
import "./component-breakdown.css";

export type ComponentBreakdownProps = {
  info: ComponentInfo;
  title: string;
  note?: string;
  ariaLabel: string;
  onComponentClick?: (component: string) => void;
};

export function ComponentBreakdown({ info, title, note, ariaLabel, onComponentClick }: ComponentBreakdownProps) {
  if (!info.available || !info.components.length) return null;

  return (
    <section className="component-breakdown" aria-label={ariaLabel}>
      <div className="component-breakdown-header">
        <h3 className="component-breakdown-title">{title}</h3>
        {note ? <span className="component-breakdown-note">{note}</span> : null}
      </div>
      <div className="component-breakdown-visual" role="list" aria-label={ariaLabel}>
        <strong className="component-breakdown-target" lang="ja">{info.character}</strong>
        <span className="component-breakdown-plus" aria-hidden="true">=</span>
        {info.components.map((component, index) => (
          <span className="component-breakdown-part-wrap" role="listitem" key={component + "-" + index}>
            {index > 0 ? <span className="component-breakdown-plus" aria-hidden="true">+</span> : null}
            onComponentClick ? <button className="component-breakdown-part component-breakdown-part-button" type="button" lang="ja" onClick={() => onComponentClick?.(component)}>{component}</button> : <span className="component-breakdown-part" lang="ja">{component}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
