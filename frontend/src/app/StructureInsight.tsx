import type { StructureInsights } from "./engine";
import { formatNumber, type Language } from "./i18n";
import "./structure-insight.css";

type Props = {
  info: StructureInsights;
  language: Language;
  meaning?: string;
  onRadicalClick?: (id: number) => void;
  onComponentClick?: (glyph: string) => void;
};

export function StructureInsight({ info, language, meaning, onRadicalClick, onComponentClick }: Props) {
  if (!info.available) return null;
  const familiarity = Math.round(Math.max(0, Math.min(1, info.familiarity.fraction)) * 100);
  const attention = info.directComponents.filter(item => item.isJoyoKanji && (item.mastery ?? 0) < 0.5);
  return (
    <section className="structure-insight" aria-label={language === "fa" ? "بینش ساختاری یادگیری" : "Structural learning insight"}>
      <div className="structure-insight-head">
        <div>
          <h3>{language === "fa" ? "بینش ساختاری" : "Structural insight"}</h3>
          <p>{language === "fa" ? "آشنایی ساختاری از دانش فعلی‌ات محاسبه می‌شود؛ رادیکال سنتی و جزء دیداری یک مفهوم نیستند." : "Structural familiarity is derived from current knowledge; traditional radicals and visual components are distinct concepts."}</p>
        </div>
        <div className="structure-insight-score" aria-label={(language === "fa" ? "آشنایی ساختاری " : "Structural familiarity ") + familiarity + "%"}>
          <strong>{formatNumber(familiarity, language)}%</strong>
          <span>{language === "fa" ? "آشنا" : "familiar"}</span>
        </div>
      </div>
      <div className="structure-insight-metrics">
        <div><span>{language === "fa" ? "اجزای مستقیم جویو" : "Direct Jōyō"}</span><strong>{formatNumber(info.familiarity.directJoyoCount, language)}</strong></div>
        <div><span>{language === "fa" ? "آشنا" : "Familiar"}</span><strong>{formatNumber(info.familiarity.familiarDirectCount, language)}</strong></div>
        <div><span>{language === "fa" ? "ضعیف" : "Weak"}</span><strong>{formatNumber(info.familiarity.weakDirectCount, language)}</strong></div>
        <div><span>{language === "fa" ? "جدید" : "New"}</span><strong>{formatNumber(info.familiarity.newDirectCount, language)}</strong></div>
      </div>
      {info.radical ? (
        <div className="structure-insight-line">
          <span>{language === "fa" ? "خانوادهٔ رادیکال" : "Radical family"}</span>
          {onRadicalClick ? (
            <button className="structure-insight-link" type="button" onClick={() => onRadicalClick(info.radical.id)}>
              <span className="structure-insight-glyph" lang="ja">{info.radical.glyph}</span>
              <span>#{formatNumber(info.radical.id, language)} · {formatNumber(info.radical.familySize, language)} {language === "fa" ? "کانجی" : "kanji"}</span>
            </button>
          ) : (
            <span className="structure-insight-value"><span className="structure-insight-glyph" lang="ja">{info.radical.glyph}</span> #{formatNumber(info.radical.id, language)}</span>
          )}
        </div>
      ) : null}
      {attention.length ? (
        <div className="structure-insight-prereqs">
          <div className="structure-insight-prereq-copy">
            <strong>{language === "fa" ? "اجزای نیازمند توجه" : "Components needing attention"}</strong>
            <span>{language === "fa" ? "اجزای جویویی که هنوز برایت تثبیت نشده‌اند." : "Jōyō components that are not yet firmly known."}</span>
          </div>
          <div className="structure-insight-chips">
            {attention.map(item => (
              <button key={item.glyph} className={"structure-insight-chip " + ((item.mastery ?? 0) === 0 ? "is-new" : "is-weak")} type="button" lang="ja" onClick={() => onComponentClick?.(item.glyph)}>
                <span>{item.glyph}</span>
                <small>{(item.mastery ?? 0) === 0 ? (language === "fa" ? "جدید" : "new") : formatNumber(Math.round((item.mastery ?? 0) * 100), language) + "%"}</small>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="structure-insight-stable">
          <strong>{language === "fa" ? "اجزای مستقیم جویو برایت آشنا هستند." : "The direct Jōyō structure is familiar."}</strong>
        </div>
      )}
      {meaning ? (
        <div className="structure-insight-scaffold">
          <span>{language === "fa" ? "قالب یادسپار ساختاری" : "Mnemonic scaffold"}</span>
          <strong lang="ja">{info.character} ← {info.directComponents.map(item => item.glyph).join(" + ")}</strong>
          <p>{language === "fa" ? "معنی «" + meaning + "» را به این ساختار در یک داستان یا تصویر شخصی وصل کن." : "Link “" + meaning + "” to this structure in a story or image of your own."}</p>
        </div>
      ) : null}
    </section>
  );
}
