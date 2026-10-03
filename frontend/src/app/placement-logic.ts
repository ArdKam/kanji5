import type { KanjiCatalogItem } from "./engine";

export const DIAGNOSTIC_LEVELS = ["N5", "N4", "N3", "N2"] as const;

export type PlacementQuestionRecord = {
  id: string;
  item: KanjiCatalogItem;
  level: string | null;
  stimulus: string;
  prompt: string;
  options: Array<{ id: string; label: string; correct: boolean }>;
};

export type PlacementScore = {
  score: number;
  total: number;
  levelScores: Record<string, { correct: number; total: number }>;
  suggestedLevel: string;
};

export function buildPlacementQuestions(catalog: KanjiCatalogItem[], prompt: string): PlacementQuestionRecord[] {
  const byLevel = new Map<string, KanjiCatalogItem[]>();
  catalog
    .filter(item => item.meanings.length && DIAGNOSTIC_LEVELS.includes(item.jlpt as typeof DIAGNOSTIC_LEVELS[number]))
    .forEach(item => {
      const list = byLevel.get(item.jlpt ?? "") ?? [];
      list.push(item);
      byLevel.set(item.jlpt ?? "", list);
    });

  const selected: KanjiCatalogItem[] = [];
  for (const level of DIAGNOSTIC_LEVELS) {
    const pool = (byLevel.get(level) ?? []).slice().sort((a, b) => Number(a.order ?? Infinity) - Number(b.order ?? Infinity));
    selected.push(...pool.slice(0, 3));
  }

  if (selected.length < 8) {
    const fallback = catalog.filter(item => item.meanings.length).slice().sort((a, b) => Number(a.order ?? Infinity) - Number(b.order ?? Infinity));
    for (const item of fallback) {
      if (selected.includes(item)) continue;
      selected.push(item);
      if (selected.length >= 12) break;
    }
  }

  return selected.slice(0, 12).map((item, questionIndex) => {
    const correct = item.meanings[0];
    const distractors = catalog
      .filter(candidate => candidate.character !== item.character && candidate.meanings[0] && candidate.meanings[0] !== correct)
      .slice()
      .sort((a, b) => Number(a.order ?? Infinity) - Number(b.order ?? Infinity))
      .map(candidate => candidate.meanings[0])
      .filter((value, index, values) => values.indexOf(value) === index)
      .slice(questionIndex % 5, questionIndex % 5 + 3);
    const labels = [correct, ...distractors].slice(0, 4);
    return {
      id: "placement-" + item.character + "-" + questionIndex,
      item,
      level: item.jlpt ?? null,
      stimulus: item.character,
      prompt,
      options: labels.map((label, index) => ({ id: "option-" + index, label, correct: index === 0 })),
    };
  }).filter(question => question.options.length >= 2);
}

export function scorePlacementAnswers(questions: PlacementQuestionRecord[], answers: Record<string, string>): PlacementScore {
  const levelScores: Record<string, { correct: number; total: number }> = {};
  let score = 0;
  for (const question of questions) {
    const level = question.level ?? "unknown";
    const chosen = answers[question.id] ?? "";
    const isCorrect = chosen === question.options.find(option => option.correct)?.id;
    const existing = levelScores[level] ?? { correct: 0, total: 0 };
    levelScores[level] = {
      correct: existing.correct + (isCorrect ? 1 : 0),
      total: existing.total + 1,
    };
    score += isCorrect ? 1 : 0;
  }
  let suggestedLevel = "N5";
  for (const level of ["N2", "N3", "N4", "N5"]) {
    const result = levelScores[level];
    if (result && result.total >= 2 && result.correct / result.total >= 0.67) {
      suggestedLevel = level;
      break;
    }
  }
  return { score, total: questions.length, levelScores, suggestedLevel };
}
