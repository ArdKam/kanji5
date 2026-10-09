import { useEffect, useMemo, useRef, useState } from "react";
import topicTaxonomy from "./kanji-topics.json";
import { formatNumber, t, type Language } from "./i18n";
import type { CustomStudyFilter, CustomStudyFocus } from "./engine";
import { UiIcon } from "./UiIcon";
import "./topic-learning.css";

export type TopicStudyTopic = {
  id: string;
  label: { fa: string; en: string };
  characters: string[];
};

const TOPICS: TopicStudyTopic[] = topicTaxonomy.topics.map(topic => ({
  id: topic.id,
  label: topic.label,
  characters: String(topic.characters || "").split(/\\s+/).filter(Boolean),
}));

export function getTopicLabel(id: string, language: Language): string | null {
  const topic = TOPICS.find(item => item.id === id);
  return topic ? topic.label[language] : null;
}

export function TopicLearningDialog({
  open,
  language,
  busy = false,
  onClose,
  onStart,
}: {
  open: boolean;
  language: Language;
  busy?: boolean;
  onClose: () => void;
  onStart: (topic: TopicStudyTopic, filter: CustomStudyFilter) => Promise<boolean>;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [focus, setFocus] = useState<CustomStudyFocus>("available");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) return;
    setQuery("");
    setSelectedTopicId("");
    setFocus("available");
    setMessage("");
  }, [open]);

  const visibleTopics = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(language === "fa" ? "fa" : "en");
    if (!normalized) return TOPICS;
    return TOPICS.filter(topic => {
      const label = topic.label[language].toLocaleLowerCase(language === "fa" ? "fa" : "en");
      return label.includes(normalized) || topic.id.toLocaleLowerCase().includes(normalized);
    });
  }, [language, query]);

  const selectedTopic = TOPICS.find(topic => topic.id === selectedTopicId) ?? null;
  const focusOptions: Array<{ value: CustomStudyFocus; label: string }> = [
    { value: "available", label: t("topicAvailable", language) },
    { value: "due", label: t("topicDue", language) },
    { value: "new", label: t("topicNewOnly", language) },
  ];

  const start = async () => {
    if (!selectedTopic || busy) return;
    setMessage("");
    const started = await onStart(selectedTopic, {
      focus,
      limit: 20,
      characterScope: selectedTopic.characters,
    });
    if (started) onClose();
    else setMessage(t("topicNoEligibleItems", language));
  };

  return (
    <dialog
      ref={dialogRef}
      className="topic-learning-dialog"
      dir={language === "fa" ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby="topic-learning-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="topic-learning-dialog-inner">
        <header className="topic-learning-heading">
          <div>
            <p className="eyebrow red">{t("learnByTopic", language)}</p>
            <h2 id="topic-learning-title">{t("topicLearningTitle", language)}</h2>
            <p>{t("topicLearningIntro", language)}</p>
          </div>
          <button className="topic-learning-close" type="button" aria-label={t("close", language)} onClick={onClose}>
            <UiIcon name="close" size={19} />
          </button>
        </header>

        <label className="topic-learning-search">
          <UiIcon name="dictionary" size={18} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t("topicSearch", language)}
            aria-label={t("topicSearch", language)}
            autoComplete="off"
          />
        </label>

        <div className="topic-learning-grid" aria-label={t("topicLearningTitle", language)}>
          {visibleTopics.map(topic => {
            const selected = topic.id === selectedTopicId;
            return (
              <button
                key={topic.id}
                type="button"
                className={"topic-learning-tile" + (selected ? " selected" : "")}
                aria-pressed={selected}
                data-topic-id={topic.id}
                onClick={() => { setSelectedTopicId(topic.id); setMessage(""); }}
              >
                <span className="topic-learning-kanji" lang="ja" dir="ltr">{topic.characters.slice(0, 3).join(" ")}</span>
                <span className="topic-learning-tile-copy">
                  <strong>{topic.label[language]}</strong>
                  <small>{formatNumber(topic.characters.length, language)} {t("topicItemCount", language)}</small>
                </span>
                <span className="topic-learning-selection" aria-hidden="true">{selected ? "✓" : ""}</span>
              </button>
            );
          })}
          {!visibleTopics.length ? <p className="topic-learning-empty" role="status">{t("topicNoMatches", language)}</p> : null}
        </div>

        {selectedTopic ? (
          <section className="topic-learning-session" aria-label={t("topicSessionLabel", language)}>
            <div className="topic-learning-selected">
              <span className="topic-learning-selected-label">{t("topicSessionLabel", language)}</span>
              <strong>{selectedTopic.label[language]}</strong>
              <small>{formatNumber(selectedTopic.characters.length, language)} {t("topicItemCount", language)}</small>
            </div>
            <div className="topic-learning-focus" role="group" aria-label={t("customFocus", language)}>
              {focusOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={"topic-learning-focus-option" + (focus === option.value ? " active" : "")}
                  aria-pressed={focus === option.value}
                  disabled={busy}
                  onClick={() => { setFocus(option.value); setMessage(""); }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {message ? <p className="topic-learning-message" role="status">{message}</p> : null}
            <button className="button primary topic-learning-start" type="button" disabled={busy || !selectedTopic.characters.length} onClick={() => void start()}>
              {busy ? "…" : t("topicStart", language)}
              <UiIcon name="next" size={17} />
            </button>
          </section>
        ) : (
          <p className="topic-learning-footer-note">{t("topicLearningIntro", language)}</p>
        )}
      </div>
    </dialog>
  );
}
