import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { listKanji, type CustomStudyFilter, type KanjiCatalogItem } from "./engine";
import { CustomStudyPanel } from "./CustomStudyPanel";
import { PlacementDiagnostic } from "./PlacementDiagnostic";
import topicData from "./kanji-topics.json";

type DictionaryTopic = { id: string; label: { fa: string; en: string }; characters: string };
type TopicCardData = DictionaryTopic & { characterList: string[]; count: number; glyph: string };
const TOPICS = topicData.topics as DictionaryTopic[];
const FEATURED_TOPIC_IDS = ["numbers", "body", "nature", "food", "school", "time"];
const TOPIC_GLYPHS: Record<string, string> = {
  numbers: "一", body: "手", nature: "山", time: "日", family: "父", people: "人",
  food: "食", school: "学", places: "駅", directions: "上", weather: "雨", animals: "犬",
  plants: "木", actions: "行", work: "事", emotions: "心", qualities: "大", government: "政",
  communication: "話", money: "円", transport: "車", health: "病", industry: "機", culture: "芸",
};

export function PracticeHome({
  language,
  busy = false,
  onStartActiveRecall,
  onStartCustomStudy,
}: {
  language: Language;
  busy?: boolean;
  onStartActiveRecall: () => Promise<void>;
  onStartCustomStudy: (filter: CustomStudyFilter) => Promise<boolean>;
}) {
  const [catalog, setCatalog] = useState<KanjiCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [topicBusy, setTopicBusy] = useState(false);
  const [topicMessage, setTopicMessage] = useState("");

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    setCatalogError(false);
    void listKanji().then(result => {
      if (!active) return;
      setCatalog(result.results);
    }).catch(() => {
      if (active) setCatalogError(true);
    }).finally(() => {
      if (active) setCatalogLoading(false);
    });
    return () => { active = false; };
  }, [catalogAttempt]);

  const catalogByCharacter = useMemo(
    () => new Map(catalog.map(item => [item.character, item] as const)),
    [catalog],
  );
  const topics = useMemo<TopicCardData[]>(() => TOPICS.map(topic => {
    const characterList = [...new Set(topic.characters.trim().split(/\s+/).filter(Boolean))];
    return {
      ...topic,
      characterList,
      count: characterList.filter(character => catalogByCharacter.has(character)).length,
      glyph: TOPIC_GLYPHS[topic.id] ?? characterList[0] ?? "字",
    };
  }), [catalogByCharacter]);
  const featuredTopics = FEATURED_TOPIC_IDS
    .map(id => topics.find(topic => topic.id === id))
    .filter((topic): topic is TopicCardData => Boolean(topic));
  const otherTopics = topics.filter(topic => !FEATURED_TOPIC_IDS.includes(topic.id));
  const selectedTopic = topics.find(topic => topic.id === selectedTopicId) ?? null;
  const selectedTopicScope = selectedTopic ? {
    id: selectedTopic.id,
    label: language === "fa" ? selectedTopic.label.fa : selectedTopic.label.en,
    characters: selectedTopic.characterList,
  } : null;

  const startTopicStudy = async () => {
    if (!selectedTopic || topicBusy || busy) return;
    setTopicBusy(true);
    setTopicMessage("");
    try {
      const started = await onStartCustomStudy({
        level: "all",
        focus: "available",
        limit: 20,
        topicId: selectedTopic.id,
        topicCharacters: selectedTopic.characterList,
      });
      if (!started) setTopicMessage(t("customNoCards", language));
    } catch {
      setTopicMessage(t("actionFailed", language));
    } finally {
      setTopicBusy(false);
    }
  };

  const renderTopicCard = (topic: TopicCardData) => {
    const label = language === "fa" ? topic.label.fa : topic.label.en;
    const isSelected = selectedTopicId === topic.id;
    return (
      <button
        className={"practice-topic-card" + (isSelected ? " is-selected" : "")}
        type="button"
        key={topic.id}
        aria-pressed={isSelected}
        aria-label={label}
        onClick={() => {
          setSelectedTopicId(topic.id);
          setTopicMessage("");
        }}
      >
        <span className="practice-topic-glyph" lang="ja" aria-hidden="true">{topic.glyph}</span>
        <span className="practice-topic-copy">
          <strong>{label}</strong>
          <span className="practice-topic-count">
            {catalogLoading
              ? t("loading", language)
              : formatNumber(topic.count, language) + " " + t("practiceTopicCount", language)}
          </span>
        </span>
        <span className="practice-topic-select-mark" aria-hidden="true">{isSelected ? "✓" : ""}</span>
      </button>
    );
  };

  return (
    <section className="practice-home" aria-labelledby="practice-home-title">
      <header className="practice-home-header">
        <p className="eyebrow">{t("activeRecallLabel", language)}</p>
        <h2 id="practice-home-title">{t("practiceTitle", language)}</h2>
        <p>{t("practiceIntro", language)}</p>
      </header>

      <section className="practice-home-hero" aria-labelledby="practice-recommended-title">
        <div className="practice-home-hero-copy">
          <p className="practice-home-kicker">{t("practiceRecommendedLabel", language)}</p>
          <h3 id="practice-recommended-title">{t("practiceRecommendedTitle", language)}</h3>
          <p>{t("practiceRecommendedHint", language)}</p>
        </div>
        <button className="button primary practice-start-button" type="button" disabled={busy} onClick={() => void onStartActiveRecall()}>
          <span>{t("startExercise", language)}</span>
          <span aria-hidden="true" className="practice-button-arrow">{language === "fa" ? "←" : "→"}</span>
        </button>
      </section>

      <section className="practice-topic-section" aria-labelledby="practice-topics-title">
        <div className="practice-section-heading">
          <div>
            <h3 id="practice-topics-title">{t("practiceTopicsTitle", language)}</h3>
            <p>{t("practiceTopicsHint", language)}</p>
          </div>
        </div>

        {catalogLoading && !catalog.length ? (
          <div className="practice-topic-status" role="status">{t("practiceTopicsLoading", language)}</div>
        ) : null}

        {catalogError && !catalog.length ? (
          <div className="practice-topic-status is-error" role="alert">
            <span>{t("practiceTopicsLoadError", language)}</span>
            <button className="button secondary" type="button" onClick={() => setCatalogAttempt(value => value + 1)}>
              {t("practiceTopicsRetry", language)}
            </button>
          </div>
        ) : null}

        {catalog.length ? (
          <>
            <div className="practice-topic-grid">{featuredTopics.map(renderTopicCard)}</div>
            <details className="practice-all-topics">
              <summary>
                <span>{t("practiceTopicsShowAll", language)}</span>
                <span className="practice-all-topics-count">{formatNumber(otherTopics.length, language)}</span>
              </summary>
              <div className="practice-topic-grid practice-topic-grid-secondary">{otherTopics.map(renderTopicCard)}</div>
            </details>
            <p className="practice-topic-coverage-note">{t("practiceTopicCoverageNote", language)}</p>
          </>
        ) : null}

        {selectedTopic ? (
          <section className="practice-topic-selected" aria-live="polite" aria-labelledby="practice-topic-selected-title">
            <div className="practice-topic-selected-copy">
              <p className="practice-home-kicker">{formatNumber(selectedTopic.count, language)} {t("practiceTopicCount", language)}</p>
              <h4 id="practice-topic-selected-title">{language === "fa" ? selectedTopic.label.fa : selectedTopic.label.en}</h4>
              <p>{t("practiceTopicSelectedHint", language)}</p>
            </div>
            <button className="button primary practice-topic-start" type="button" disabled={busy || topicBusy || selectedTopic.count === 0} onClick={() => void startTopicStudy()}>
              {topicBusy ? t("practiceTopicStarting", language) : t("practiceTopicStart", language)}
            </button>
            {topicMessage ? <p className="practice-topic-message" role="status">{topicMessage}</p> : null}
          </section>
        ) : null}
      </section>

      <details className="practice-advanced">
        <summary>
          <span>{t("practiceAdvancedTitle", language)}</span>
          <span className="practice-summary-hint">{t("practiceAdvancedHint", language)}</span>
        </summary>
        <CustomStudyPanel language={language} selectedTopic={selectedTopicScope} onStartCustomStudy={onStartCustomStudy} />
      </details>

      <PlacementDiagnostic catalog={catalog} language={language} onStartCustomStudy={onStartCustomStudy} />
    </section>
  );
}
