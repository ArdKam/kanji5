import { useEffect, useRef, useState, type ReactNode } from "react";
import { ComponentBreakdown } from "./ComponentBreakdown";
import { ComponentLearningPath } from "./ComponentLearningPath";
import { HandwritingPractice } from "./HandwritingPractice";
import { StrokeOrderViewer } from "./StrokeOrderViewer";
import { DictionaryAudio, DictionaryReading } from "./DictionaryPrimitives";
import { VocabularyExamples } from "./VocabularyExamples";
import { formatNumber, t, type Language } from "./i18n";
import { getComponentInfo, getHandwritingSkill, recordHandwritingGrade, type ComponentInfo, type HandwritingSkill, type KanjiCatalogItem } from "./engine";

type SectionKey = "structure" | "writing" | "vocabulary" | "mnemonic" | null;

export function DictionaryKanjiCard({
  item,
  language,
  onClose,
  catalog,
  onSelectKanji,
  mnemonicContent,
}: {
  item: KanjiCatalogItem;
  language: Language;
  onClose: () => void;
  catalog: KanjiCatalogItem[];
  onSelectKanji: (item: KanjiCatalogItem) => void;
  mnemonicContent?: ReactNode;
}) {
  const mastery = Math.round(Math.max(0, Math.min(1, item.mastery)) * 100);
  const [componentInfo, setComponentInfo] = useState<ComponentInfo | null>(null);
  const [handwritingSkill, setHandwritingSkill] = useState<HandwritingSkill | null>(null);
  const [openSection, setOpenSection] = useState<SectionKey>(null);
  const sectionRefs = useRef<Partial<Record<Exclude<SectionKey, null>, HTMLElement>>>({});

  useEffect(() => {
    setOpenSection(null);
    setComponentInfo(null);
    setHandwritingSkill(null);
  }, [item.character]);

  useEffect(() => {
    if (openSection !== "structure") return;
    let active = true;
    void getComponentInfo(item.character).then(info => {
      if (active) setComponentInfo(info);
    }).catch(() => {
      if (active) setComponentInfo(null);
    });
    return () => { active = false; };
  }, [item.character, openSection]);

  useEffect(() => {
    if (openSection !== "writing") return;
    let active = true;
    void getHandwritingSkill(item.character).then(skill => {
      if (active) setHandwritingSkill(skill);
    }).catch(() => {
      if (active) setHandwritingSkill(null);
    });
    return () => { active = false; };
  }, [item.character, openSection]);

  const scrollOpenSectionIntoView = (section: Exclude<SectionKey, null>) => {
    const target = sectionRefs.current[section];
    const scrollContainer = target?.closest<HTMLElement>(".dictionary-card");
    if (!target || !scrollContainer) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const edgePadding = 10;
    const targetTop = scrollContainer.scrollTop + (targetRect.top - containerRect.top) - edgePadding;
    const maxScrollTop = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
    const nextScrollTop = Math.max(0, Math.min(maxScrollTop, targetTop));
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    scrollContainer.scrollTo({
      top: nextScrollTop,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    if (!openSection) return;
    let frame = 0;
    let nextFrame = 0;
    frame = window.requestAnimationFrame(() => {
      nextFrame = window.requestAnimationFrame(() => {
        scrollOpenSectionIntoView(openSection);
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(nextFrame);
    };
  }, [openSection, item.character]);

  const toggle = (section: Exclude<SectionKey, null>) => {
    setOpenSection(current => current === section ? null : section);
  };

  const sectionButton = (key: Exclude<SectionKey, null>, label: string) => (
    <button
      className="dictionary-accordion-trigger"
      type="button"
      aria-expanded={openSection === key}
      onClick={() => toggle(key)}
    >
      <span>{label}</span>
      <span className="dictionary-accordion-chevron" aria-hidden="true">{openSection === key ? "⌃" : "⌄"}</span>
    </button>
  );

  return (
    <dialog open className="dialog dictionary-card-dialog" aria-label={t("dictionary", language)}>
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <div className="dictionary-card">
        <div className="dictionary-card-top">
          <span className="badge badge-red">{item.jlpt || "—"}</span>
          <span className="dictionary-card-mastery">{t("dictionaryMastery", language)} {formatNumber(mastery, language)}%</span>
        </div>

        <div className="dictionary-stroke-order-wrap">
          <StrokeOrderViewer character={item.character} language={language} mode="dictionary-loop" />
          <DictionaryAudio value={item.character} label={t("playKanjiPronunciation", language)} />
        </div>

        {item.meanings.length ? (
          <div className="dictionary-card-section">
            <span>{t("meaning", language)}</span>
            <strong>{item.meanings.join(" · ")}</strong>
          </div>
        ) : null}

        <div className="readings-header dictionary-readings-header">
          <span>{language === "fa" ? "خوانش‌ها" : "Readings"}</span>
        </div>
        <div className="readings learning-back-readings dictionary-readings">
          <DictionaryReading title="On’yomi" values={item.on} language={language} />
          <DictionaryReading title="Kun’yomi" values={item.kun} language={language} />
        </div>

        <div className="dictionary-card-meta">
          {item.strokes ? <span>{t("dictionaryStrokes", language)} {formatNumber(item.strokes, language)}</span> : null}
          {item.grade ? <span>{t("dictionaryGrade", language)} {formatNumber(item.grade, language)}</span> : null}
          {item.frequency ? <span>{t("dictionaryFrequency", language)} #{formatNumber(item.frequency, language)}</span> : null}
        </div>

        <div className="dictionary-card-accordion" aria-label={language === "fa" ? "اطلاعات تکمیلی" : "Additional information"}>
          <section ref={node => { if (node) sectionRefs.current.structure = node; }} className="dictionary-accordion-section">
            {sectionButton("structure", language === "fa" ? "ساختار" : "Structure")}
            {openSection === "structure" ? (
              <div className="dictionary-accordion-panel">
                {componentInfo?.available && componentInfo.components.length ? (
                  <>
                    <ComponentBreakdown
                      info={componentInfo}
                      title={language === "fa" ? "ساختار کانجی" : "Kanji structure"}
                      note={language === "fa" ? "اجزای دیداری" : "Visual components"}
                      ariaLabel={language === "fa" ? "ساختار دیداری کانجی" : "Kanji visual structure"}
                    />
                    <ComponentLearningPath
                      character={item.character}
                      components={componentInfo.components}
                      catalog={catalog}
                      language={language}
                      onSelectKanji={onSelectKanji}
                    />
                  </>
                ) : (
                  <p className="empty-text">{language === "fa" ? "اطلاعات ساختار در دسترس نیست." : "Structure information is unavailable."}</p>
                )}
              </div>
            ) : null}
          </section>

          <section ref={node => { if (node) sectionRefs.current.writing = node; }} className="dictionary-accordion-section">
            {sectionButton("writing", language === "fa" ? "تمرین نوشتن" : "Practice writing")}
            {openSection === "writing" ? (
              <div className="dictionary-accordion-panel">
                <HandwritingPractice
                  character={item.character}
                  language={language}
                  learningSignal={handwritingSkill ? { state: handwritingSkill.state, confidence: handwritingSkill.confidence, score: handwritingSkill.score } : undefined}
                  onGradeRecorded={(grade) => recordHandwritingGrade(item.character, grade).then(async saved => {
                    if (!saved) return false;
                    const skill = await getHandwritingSkill(item.character);
                    setHandwritingSkill(skill);
                    return true;
                  })}
                />
              </div>
            ) : null}
          </section>

          <section ref={node => { if (node) sectionRefs.current.vocabulary = node; }} className="dictionary-accordion-section">
            {sectionButton("vocabulary", language === "fa" ? "واژگان" : "Vocabulary")}
            {openSection === "vocabulary" ? (
              <div className="dictionary-accordion-panel">
                <VocabularyExamples character={item.character} language={language} catalog={catalog} onSelectKanji={onSelectKanji} />
              </div>
            ) : null}
          </section>

          <section ref={node => { if (node) sectionRefs.current.mnemonic = node; }} className="dictionary-accordion-section">
            {sectionButton("mnemonic", language === "fa" ? "یادسپار" : "Mnemonic")}
            {openSection === "mnemonic" ? (
              <div className="dictionary-accordion-panel">
                {mnemonicContent}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </dialog>
  );
}
