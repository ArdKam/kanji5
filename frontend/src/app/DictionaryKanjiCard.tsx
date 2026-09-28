import { useEffect, useState, type ReactNode } from "react";
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
  if (key === "overview") return language === "fa" ? "نمای کلی" : "Overview";
  if (key === "structure") return t("structure", language);
  if (key === "writing") return t("handwritingPractice", language);
  if (key === "vocabulary") return t("vocabulary", language);
  return t("personalMnemonic", language);
};

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
  const dialogRef = useModalDialog(true, onClose);
  const mastery = Math.round(Math.max(0, Math.min(1, item.mastery)) * 100);
  const [componentInfo, setComponentInfo] = useState<ComponentInfo | null>(null);
  const [radicalInfo, setRadicalInfo] = useState<RadicalInfo | null>(null);
  const [handwritingSkill, setHandwritingSkill] = useState<HandwritingSkill | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");

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
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.scrollTo({ top: 0, behavior: "auto" });
  }, [activeSection, item.character, dialogRef]);

  const selectSection = (section: SectionKey) => {
    if (section === activeSection) return;
    setActiveSection(section);
  };

  const handleSectionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
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
    <div
      id="dictionary-section-panel-overview"
      className="dictionary-tabpanel"
      role="tabpanel"
      aria-labelledby="dictionary-section-tab-overview"
      tabIndex={0}
    >
      <div className="dictionary-stroke-order-wrap">
        <StrokeOrderViewer character={item.character} language={language} mode="dictionary-loop" />
        <DictionaryAudio value={item.character} label={t("playKanjiPronunciation", language)} />
      </div>

      {item.meanings.length ? (
        <div className="dictionary-card-section">
          <span className="dictionary-card-section-label">{t("meaning", language)}:</span>
          <bdi className="dictionary-card-section-value" dir="auto">{item.meanings.join(" · ")}</bdi>
        </div>
      ) : null}

      <div className="readings-header dictionary-readings-header">
        <span>{t("reading", language)}</span>
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
            defaultExpanded={false}
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

  return (
    <dialog ref={dialogRef} className="dialog dictionary-card-dialog" aria-label={t("dictionary", language)}>
      <div className="dictionary-card">
        <div className="dictionary-card-close-layer">
          <button
            className="dialog-close"
            type="button"
            aria-label={t("close", language)}
            onClick={onClose}
          >×</button>
        </div>

        <div className="dictionary-card-top">
          <span className="badge badge-red">{item.jlpt || "—"}</span>
          {item.grade ? <span className="dictionary-card-grade">G{formatNumber(item.grade, language)}</span> : null}
          <span className="dictionary-card-mastery">{t("dictionaryMastery", language)} {formatNumber(mastery, language)}%</span>
        </div>

        <div className="dictionary-section-nav" role="tablist" aria-label={t("dictionaryCardOptions", language)}>
          {(["overview", "structure", "writing", "vocabulary", "mnemonic"] as SectionKey[]).map(tabButton)}
        </div>

        {renderActivePanel()}
      </div>
    </dialog>
  );
}
