import topicTaxonomy from "./kanji-topics.json";
import type { Language } from "./i18n";

export type TopicStudyTopic = {
  id: string;
  label: { fa: string; en: string };
  characters: string[];
};

export const TOPICS: TopicStudyTopic[] = topicTaxonomy.topics.map(topic => ({
  id: topic.id,
  label: topic.label,
  characters: String(topic.characters || "").split(/\s+/).filter(Boolean),
}));

export function getTopicLabel(id: string, language: Language): string | null {
  const topic = TOPICS.find(item => item.id === id);
  return topic ? topic.label[language] : null;
}
