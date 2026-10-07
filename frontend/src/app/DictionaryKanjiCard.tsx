import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ComponentBreakdown } from "./ComponentBreakdown";
import { ComponentLearningPath } from "./ComponentLearningPath";
import { TraditionalRadical } from "./TraditionalRadical";
import { HandwritingPractice } from "./HandwritingPractice";
import { StrokeOrderViewer } from "./StrokeOrderViewer";
import { DictionaryAudio, DictionaryReading } from "./DictionaryPrimitives";
import { VocabularyExamples } from "./VocabularyExamples";
import { formatNumber, t, type Language } from "./i18n";
import { useModalDialog } from "./useModalDialog";
import { getComponentInfo, getRadicalInfo, getHandwritingSkill, recordHandwritingGrade, type ComponentInfo, type HandwritingSkill, type KanjiCatalogItem, type RadicalInfo } from "./engine";

type SectionKey = "overview" | "structure" | "writing" | "vocabulary" | "mnemonic";

const sectionLabel = (key: SectionKey, language: Language) => {
  if (language === "fa") {
    if (key === "overview") return "نمای کلی";
    if (key === "structure") return "کالبد";
    if (key === "writing") return "نوشتن";
    if (key === "vocabulary") return "واژه";
    return "یادسپار";
  }
  if (key === "overview") return "Overview";
  if (key === "structure") return "Anatomy";
  if (key === "writing") return "Writing";
  if (key === "vocabulary") return "Words";
  return "Mnemonic";
};

export function DictionaryKanjiCard({
  item,
  language,
  onClose,
  catalog,
  onSelectKanji,
  navigationItems,
  mnemonicContent,
}: {
  item: KanjiCatalogItem;
  language: Language;
  onClose: () => void;
  catalog: KanjiCatalogItem[];
  onSelectKanji: (item: KanjiCatalogItem) => void;
  navigationItems: KanjiCatalogItem[];
  mnemonicContent?: ReactNode;
}) {
  const dialogRef = useModalDialog(true, onClose);
  const mastery = Math.round(Math.max(0, Math.min(1, item.mastery)) * 100);
  const [componentInfo, setComponentInfo] = useState<ComponentInfo | null>(null);
  const [radicalInfo, setRadicalInfo] = useState<RadicalInfo | null>(null);
  const [handwritingSkill, setHandwritingSkill] = useState<HandwritingSkill | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [navigationDirection, setNavigationDirection] = useState<"next" | "previous" | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let active = true;
    setComponentInfo(null);
    void getComponentInfo(item.character).then(info => {
      if (active) setComponentInfo(info);
    }).catch(() => {
      if (active) setComponentInfo(null);
    });
    return () => { active = false; };
  }, [item.character]);

  useEffect(() => {
    let active = true;
    setRadicalInfo(null);
    void getRadicalInfo(item.character).then(info => {
      if (active) setRadicalInfo(info);
    }).catch(() => {
      if (active) setRadicalInfo(null);
    });
    return () => { active = false; };
  }, [item.character]);

  useEffect(() => {
    let active = true;
    setHandwritingSkill(null);
    void getHandwritingSkill(item.character).then(skill => {
      if (active) setHandwritingSkill(skill);
    }).catch(() => {
      if (active) setHandwritingSkill(null);
    });
    return () => { active = false; };
  }, [item.character]);

  useEffect(() => {
    setActiveSection("overview");
  }, [item.character]);

  useEffect(() => {
    if (!navigationDirection) return;
    const timer = window.setTimeout(() => setNavigationDirection(null), 240);
    return () => window.clearTimeout(timer);
  }, [item.character, navigationDirection]);


  const navigateKanji = (direction: "next" | "previous") => {
    const index = navigationItems.findIndex(candidate => candidate.character === item.character);
    if (index < 0) return;
    const nextIndex = direction === "next" ? index + 1 : index - 1;
    const nextItem = navigationItems[nextIndex];
    if (!nextItem) return;
    setNavigationDirection(direction);
    onSelectKanji(nextItem);
  };

  const handleCardPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    if ((event.target as HTMLElement).closest("button, input, textarea, select, a")) return;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleCardPointerCancel = () => {
    pointerStartRef.current = null;
  };

  const handleCardPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || event.pointerType === "mouse") return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) <= Math.abs(dy) * 1.15) return;
    // Dictionary contract: swipe right = next, swipe left = previous.
    navigateKanji(dx > 0 ? "next" : "previous");
  };

  const selectSection = (section: SectionKey) => {
    if (section === activeSection) return;
    setActiveSection(section);
  };

  const handleSectionKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const sections: SectionKey[] = ["overview", "structure", "writing", "vocabulary", "mnemonic"];
    const index = sections.indexOf(activeSection);
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = language === "fa" ? (index - 1 + sections.length) % sections.length : (index + 1) % sections.length;
    if (event.key === "ArrowLeft") nextIndex = language === "fa" ? (index + 1) % sections.length : (index - 1 + sections.length) % sections.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = sections.length - 1;
    if (nextIndex === index) return;
    event.preventDefault();
    setActiveSection(sections[nextIndex]);
    window.requestAnimationFrame(() => {
      document.getElementById("dictionary-section-tab-" + sections[nextIndex])?.focus();
    });
  };

  const tabButton = (key: SectionKey) => (
    <button
      id={"dictionary-section-tab-" + key}
      className={"dictionary-section-tab" + (activeSection === key ? " is-active" : "")}
      type="button"
      role="tab"
      aria-selected={activeSection === key}
      aria-controls={"dictionary-section-panel-" + key}
      tabIndex={activeSection === key ? 0 : -1}
      onClick={() => selectSection(key)}
      onKeyDown={handleSectionKeyDown}
    >
      <span className="dictionary-section-tab-label">{sectionLabel(key, language)}</span>
    </button>
  );

  const renderOverview = () => (
    <div id="dictionary-section-panel-overview" className="dictionary-tabpanel dictionary-overview" role="tabpanel" aria-labelledby="dictionary-section-tab-overview" tabIndex={0}>
      <div className="dictionary-overview-hero">
        <div className="dictionary-overview-character" lang="ja" aria-label={item.character}>{item.character}</div>
        <div className="dictionary-overview-copy">
          <div className="dictionary-overview-reading-line">
            <span className="dictionary-overview-reading">{item.on.slice(0, 2).join(" · ") || item.kun.slice(0, 2).join(" · ") || "—"}</span>
            <DictionaryAudio value={item.on[0] || item.kun[0] || item.character} label={t("playKanjiPronunciation", language)} />
          </div>
          {item.meanings.length ? (
            <div className="dictionary-card-section dictionary-overview-meaning" dir="auto">
              <strong><bdi>{item.meanings[0]}</bdi></strong>
              {item.meanings.length > 1 ? <span>{item.meanings.slice(1, 4).map((meaning, index) => <bdi key={meaning + "-" + index}>{meaning}</bdi>)}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="dictionary-stroke-order-wrap">
        <StrokeOrderViewer character={item.character} language={language} mode="dictionary-loop" />
      </div>
      <div className="readings-header dictionary-readings-header"><span>{t("reading", language)}</span></div>
      <div className="readings learning-back-readings dictionary-readings">
        <DictionaryReading title="On’yomi" values={item.on} language={language} />
        <DictionaryReading title="Kun’yomi" values={item.kun} language={language} />
      </div>
      <div className="dictionary-card-meta">
        {item.strokes ? <span>{t("dictionaryStrokes", language)} {formatNumber(item.strokes, language)}</span> : null}
        {item.grade ? <span>{t("dictionaryGrade", language)} {formatNumber(item.grade, language)}</span> : null}
        {item.frequency ? <span>{t("dictionaryFrequency", language)} #{formatNumber(item.frequency, language)}</span> : null}
      </div>
    </div>
  );

  const renderActivePanel = () => {
    if (activeSection === "overview") return renderOverview();
    if (activeSection === "structure") {
      return (
        <div
          id="dictionary-section-panel-structure"
          className="dictionary-tabpanel"
          role="tabpanel"
          aria-labelledby="dictionary-section-tab-structure"
          tabIndex={0}
        >
          {radicalInfo?.available ? <TraditionalRadical info={radicalInfo} language={language} /> : null}
          {componentInfo?.available && componentInfo.components.length ? (
            <>
              <ComponentBreakdown
                info={componentInfo}
                title={t("kanjiStructure", language)}
                note={t("visualComponents", language)}
                ariaLabel={t("visualKanjiStructure", language)}
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
            <p className="empty-text">{t("structureUnavailable", language)}</p>
          )}
        </div>
      );
    }
    if (activeSection === "writing") {
      return (
        <div
          id="dictionary-section-panel-writing"
          className="dictionary-tabpanel"
          role="tabpanel"
          aria-labelledby="dictionary-section-tab-writing"
          tabIndex={0}
        >
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
      );
    }
    if (activeSection === "vocabulary") {
      return (
        <div
          id="dictionary-section-panel-vocabulary"
          className="dictionary-tabpanel"
          role="tabpanel"
          aria-labelledby="dictionary-section-tab-vocabulary"
          tabIndex={0}
        >
          <VocabularyExamples character={item.character} language={language} catalog={catalog} onSelectKanji={onSelectKanji} />
        </div>
      );
    }
    return (
      <div
        id="dictionary-section-panel-mnemonic"
        className="dictionary-tabpanel"
        role="tabpanel"
        aria-labelledby="dictionary-section-tab-mnemonic"
        tabIndex={0}
      >
        {mnemonicContent}
      </div>
    );
  };

  const masteryRingCircumference = 2 * Math.PI * 18;
  const masteryRingOffset = masteryRingCircumference * (1 - mastery / 100);
  const masteryRingStyle = { strokeDasharray: masteryRingCircumference.toFixed(2), strokeDashoffset: masteryRingOffset.toFixed(2) };

  useEffect(() => {
    const handleNavigationKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a, [contenteditable='true']")) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateKanji("next");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateKanji("previous");
      }
    };
    document.addEventListener("keydown", handleNavigationKey);
    return () => document.removeEventListener("keydown", handleNavigationKey);
  }, [item.character, navigationItems]);

  const navigationIndex = navigationItems.findIndex(candidate => candidate.character === item.character);
  const hasPrevious = navigationIndex > 0;
  const hasNext = navigationIndex >= 0 && navigationIndex < navigationItems.length - 1;

  return (
    <dialog ref={dialogRef} className="dialog dictionary-card-dialog" aria-labelledby="dictionary-card-title">
      <div
        className={"dictionary-card" + (navigationDirection ? " is-navigation-" + navigationDirection : "")}
        onPointerDown={handleCardPointerDown}
        onPointerUp={handleCardPointerUp}
        onPointerCancel={handleCardPointerCancel}
      >
        <header className="dictionary-card-header">
          <div className="dictionary-card-classification">
            <span className="dictionary-card-jlpt badge badge-red">{item.jlpt || "—"}</span>
            {item.grade ? <span className="dictionary-card-grade">G{formatNumber(item.grade, language)}</span> : null}
          </div>
          <button
            className="dictionary-card-nav dictionary-card-nav-previous"
            type="button"
            aria-label={language === "fa" ? "کانجی قبلی" : "Previous kanji"}
            onClick={() => navigateKanji("previous")}
            disabled={!hasPrevious}
          >‹</button>
          <span id="dictionary-card-title" className="dictionary-card-header-character" lang="ja">{item.character}</span>
          <button
            className="dictionary-card-nav dictionary-card-nav-next"
            type="button"
            aria-label={language === "fa" ? "کانجی بعدی" : "Next kanji"}
            onClick={() => navigateKanji("next")}
            disabled={!hasNext}
          >›</button>
          <div className="dictionary-card-header-end">
            <div className="dictionary-card-mastery" role="img" aria-label={t("dictionaryMastery", language) + " " + formatNumber(mastery, language) + "%"}>
              <svg className="dictionary-mastery-ring" viewBox="0 0 44 44" aria-hidden="true">
                <circle className="dictionary-mastery-ring-track" cx="22" cy="22" r="18" />
                <circle className="dictionary-mastery-ring-value" cx="22" cy="22" r="18" style={masteryRingStyle as CSSProperties} />
                <text x="22" y="22" textAnchor="middle" dominantBaseline="central">{formatNumber(mastery, language)}</text>
              </svg>
              <span className="sr-only">{t("dictionaryMastery", language)} {formatNumber(mastery, language)}%</span>
            </div>
            <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
          </div>
        </header>
        <div className="dictionary-card-navigation-hint" aria-live="polite">
          {hasPrevious || hasNext ? (language === "fa" ? "← قبلی · سوایپ به راست: بعدی · سوایپ به چپ: قبلی · → بعدی" : "Swipe right: next · swipe left: previous") : null}
        </div>
        <div className="dictionary-section-nav" role="tablist" aria-label={t("dictionaryCardOptions", language)}>
          {(["overview", "structure", "writing", "vocabulary", "mnemonic"] as SectionKey[]).map(tabButton)}
        </div>
        <div className="dictionary-card-content" key={activeSection} data-active-section={activeSection}>
          {renderActivePanel()}
        </div>
      </div>
    </dialog>
  );
}
