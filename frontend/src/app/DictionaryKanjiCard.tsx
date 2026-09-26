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
  const [isIdle, setIsIdle] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const sectionRefs = useRef<Partial<Record<Exclude<SectionKey, null>, HTMLElement>>>({});

  useEffect(() => {
    setOpenSection(null);
    setIsIdle(false);
    setIsWaking(false);
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

  const scrollOpenSectionIntoView = (section: Exclude<SectionKey, null>, behavior: ScrollBehavior = "smooth") => {
    const target = sectionRefs.current[section];
    const scrollContainer = target?.closest<HTMLElement>(".dictionary-card");
    if (!target || !scrollContainer) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const optionNav = scrollContainer.querySelector<HTMLElement>(".dictionary-section-nav");
    const stickyOffset = (optionNav?.getBoundingClientRect().height ?? 0) + 12;
    const targetTop = scrollContainer.scrollTop + (targetRect.top - containerRect.top) - stickyOffset;
    const maxScrollTop = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
    const nextScrollTop = Math.max(0, Math.min(maxScrollTop, targetTop));
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    scrollContainer.scrollTo({
      top: nextScrollTop,
      behavior: reducedMotion ? "auto" : behavior,
    });
  };

  useEffect(() => {
    if (!openSection) return;
    const target = sectionRefs.current[openSection];
    if (!target) return;

    let frame = 0;
    let nextFrame = 0;
    let settleTimer = 0;
    let observer: ResizeObserver | null = null;
    let observationStopTimer = 0;

    const scheduleScroll = (behavior: ScrollBehavior) => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        frame = window.requestAnimationFrame(() => {
          nextFrame = window.requestAnimationFrame(() => {
            scrollOpenSectionIntoView(openSection, behavior);
          });
        });
      }, 180);
    };

    const handleResize = () => {
      scheduleScroll("auto");
    };

    scheduleScroll("smooth");

    if ("ResizeObserver" in window) {
      observer = new ResizeObserver(handleResize);
      observer.observe(target);
      observationStopTimer = window.setTimeout(() => {
        observer?.disconnect();
        observer = null;
      }, 1800);
    }

    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(observationStopTimer);
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(nextFrame);
    };
  }, [openSection, item.character]);

  const idleTimerRef = useRef<number | null>(null);
  const wakeTimerRef = useRef<number | null>(null);

  const armIdleTimer = () => {
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      setIsIdle(true);
      setIsWaking(false);
    }, 4200);
  };

  const wakeFromIdle = () => {
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    if (wakeTimerRef.current !== null) window.clearTimeout(wakeTimerRef.current);
    setIsIdle(false);
    setIsWaking(true);
    wakeTimerRef.current = window.setTimeout(() => setIsWaking(false), 900);
    armIdleTimer();
  };

  useEffect(() => {
    armIdleTimer();
    return () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
      if (wakeTimerRef.current !== null) window.clearTimeout(wakeTimerRef.current);
    };
  }, [item.character]);

  const handleCardActivity = () => {
    if (isIdle) {
      wakeFromIdle();
      return;
    }
    armIdleTimer();
  };

  const toggle = (section: Exclude<SectionKey, null>) => {
    setOpenSection(current => current === section ? null : section);
  };

  const sectionButton = (key: Exclude<SectionKey, null>, label: string) => (
    <button
      className={`dictionary-accordion-trigger${openSection === key ? " is-active" : ""}`}
      type="button"
      aria-expanded={openSection === key}
      aria-controls={`dictionary-section-panel-${key}`}
      onClick={() => toggle(key)}
    >
      <span className="dictionary-accordion-label">{label}</span>
      <span className="dictionary-accordion-state" aria-hidden="true">
        {openSection === key ? "●" : "○"}
      </span>
    </button>
  );

  return (
    <dialog open className="dialog dictionary-card-dialog" aria-label={t("dictionary", language)}>
      <div
        className={`dictionary-card${isIdle ? " is-idle" : ""}${isWaking ? " is-waking" : ""}`}
        onPointerDown={handleCardActivity}
        onWheel={handleCardActivity}
        onKeyDown={handleCardActivity}
      >
        <div className="dictionary-card-close-layer" aria-hidden="true">
          <button
            className="dialog-close"
            type="button"
            aria-label={t("close", language)}
            onClick={onClose}
            aria-hidden="false"
          >×</button>
        </div>
        {isIdle ? (
          <button
            className="dictionary-card-idle-wake"
            type="button"
            aria-label={language === "fa" ? "فعال کردن دوباره کارت" : "Wake card"}
            onPointerDown={(event) => {
              event.stopPropagation();
              wakeFromIdle();
            }}
          />
        ) : null}
        <div className="dictionary-card-top">
          <span className="badge badge-red">{item.jlpt || "—"}</span>
          <span className="dictionary-card-mastery">{t("dictionaryMastery", language)} {formatNumber(mastery, language)}%</span>
        </div>

        <div className="dictionary-section-nav" role="toolbar" aria-label={language === "fa" ? "گزینه‌های کارت" : "Card options"}>
          {sectionButton("structure", language === "fa" ? "ساختار" : "Structure")}
          {sectionButton("writing", language === "fa" ? "تمرین نوشتن" : "Practice writing")}
          {sectionButton("vocabulary", language === "fa" ? "واژگان" : "Vocabulary")}
          {sectionButton("mnemonic", language === "fa" ? "یادسپار" : "Mnemonic")}
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
          <section ref={node => { if (node) sectionRefs.current.structure = node; }} className="dictionary-accordion-section" aria-hidden={openSection !== "structure"}>
            {openSection === "structure" ? (
              <div id="dictionary-section-panel-structure" className="dictionary-accordion-panel" role="region" aria-label={language === "fa" ? "ساختار" : "Structure"}>
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

          <section ref={node => { if (node) sectionRefs.current.writing = node; }} className="dictionary-accordion-section" aria-hidden={openSection !== "writing"}>
            {openSection === "writing" ? (
              <div id="dictionary-section-panel-writing" className="dictionary-accordion-panel" role="region" aria-label={language === "fa" ? "تمرین نوشتن" : "Practice writing"}>
                <HandwritingPractice
                  character={item.character}
                  language={language}
                  defaultExpanded
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

          <section ref={node => { if (node) sectionRefs.current.vocabulary = node; }} className="dictionary-accordion-section" aria-hidden={openSection !== "vocabulary"}>
            {openSection === "vocabulary" ? (
              <div id="dictionary-section-panel-vocabulary" className="dictionary-accordion-panel" role="region" aria-label={language === "fa" ? "واژگان" : "Vocabulary"}>
                <VocabularyExamples character={item.character} language={language} catalog={catalog} onSelectKanji={onSelectKanji} />
              </div>
            ) : null}
          </section>

          <section ref={node => { if (node) sectionRefs.current.mnemonic = node; }} className="dictionary-accordion-section" aria-hidden={openSection !== "mnemonic"}>
            {openSection === "mnemonic" ? (
              <div id="dictionary-section-panel-mnemonic" className="dictionary-accordion-panel" role="region" aria-label={language === "fa" ? "یادسپار" : "Mnemonic"}>
                {mnemonicContent}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </dialog>
  );
}
