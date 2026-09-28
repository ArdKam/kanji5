import type { RadicalInfo } from "./engine";
import { formatNumber, type Language } from "./i18n";
import "./traditional-radical.css";

export function TraditionalRadical({ info, language }: { info: RadicalInfo; language: Language }) {
  if (!info.available || !info.radical || !info.radicalId) return null;
  const label = language === "fa" ? "رادیکال سنتی" : "Traditional radical";
  const meaning = info.radical.meanings.join(" · ");
  return (
    <section className="traditional-radical" aria-label={label}>
      <div className="traditional-radical-header">
        <div>
          <h3>{label}</h3>
          <p>{language === "fa" ? "بخش‌بندی سنتیِ Kangxi؛ جدا از اجزای دیداری" : "Kangxi classification · separate from visual components"}</p>
        </div>
        <span className="traditional-radical-seal" aria-hidden="true">部</span>
      </div>
      <div className="traditional-radical-body">
        <div className="traditional-radical-stamp">
          <span className="traditional-radical-glyph" lang="ja">{info.radical.glyph}</span>
          <span className="traditional-radical-id">#{formatNumber(info.radicalId, language)}</span>
        </div>
        <div className="traditional-radical-copy">
          <strong>{meaning || (language === "fa" ? "معنا ثبت نشده" : "Meaning not recorded")}</strong>
          <span>{language === "fa" ? formatNumber(info.radical.strokeCount, language) + " ضربه" : info.radical.strokeCount + " strokes"}</span>
        </div>
      </div>
    </section>
  );
}
