import type { KanjiCatalogItem } from "./engine";

export const DIAGNOSTIC_LEVELS = ["N5", "N4", "N3", "N2"] as const;
export const PLACEMENT_ITEMS_PER_LEVEL = 4;
const BLUEPRINT_QUANTILES = [0.05, 0.35, 0.65, 0.95] as const;

export const PLACEMENT_SEMANTIC_FIXTURES = Object.freeze([
  Object.freeze({ character: "会", equivalent: ["meet", "meeting"] }),
  Object.freeze({ character: "学", equivalent: ["study", "learning"] }),
  Object.freeze({ character: "生", equivalent: ["life", "birth"] }),
  Object.freeze({ character: "行", equivalent: ["go"] }),
]);

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
  confidence: "high" | "boundary" | "limited";
  boundaryLevels: string[];
  upperBoundReached: boolean;
};

const stemMeaningToken = (token: string): string => token.toLowerCase().replace(/(?:ing|ed|es|s)$/i, "");
const meaningTokens = (value: string): string[] => String(value ?? "").normalize("NFKC").toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).map(stemMeaningToken).filter(token => token.length > 1);
function semanticMeaningOverlap(left: string, right: string): number {
  const a = meaningTokens(left); const b = meaningTokens(right);
  if (!a.length || !b.length) return 0;
  const bSet = new Set(b);
  const shared = a.filter(token => bSet.has(token)).length;
  return shared / Math.max(1, Math.min(a.length, b.length));
}
function meaningSetsAmbiguous(character: string, targetMeanings: string[], candidateMeanings: string[]): boolean {
  const fixture = PLACEMENT_SEMANTIC_FIXTURES.find(item => item.character === character);
  if (fixture && fixture.equivalent.some(target => candidateMeanings.some(candidate => semanticMeaningOverlap(target, candidate) >= 0.8))) return true;
  return targetMeanings.some(target => candidateMeanings.some(candidate => semanticMeaningOverlap(target, candidate) >= 0.8));
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: number, salt: string): number {
  let x = stableHash(String(seed) + ":" + salt);
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

function shuffleWithSeed<T>(values: T[], seed: number, salt: string): T[] {
  const result = values.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const unit = seededUnit(seed, salt + ":" + i);
    const j = Math.floor(unit * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickBlueprintItems(pool: KanjiCatalogItem[]): KanjiCatalogItem[] {
  if (!pool.length) return [];
  const selected: KanjiCatalogItem[] = [];
  const used = new Set<KanjiCatalogItem>();
  for (const quantile of BLUEPRINT_QUANTILES) {
    const index = Math.min(pool.length - 1, Math.max(0, Math.round(quantile * (pool.length - 1))));
    const item = pool[index];
    if (item && !used.has(item)) {
      used.add(item);
      selected.push(item);
    }
  }
  for (const item of pool) {
    if (selected.length >= PLACEMENT_ITEMS_PER_LEVEL || used.has(item)) continue;
    used.add(item);
    selected.push(item);
  }
  return selected.slice(0, PLACEMENT_ITEMS_PER_LEVEL);
}

function optionId(questionIndex: number, label: string): string {
  return "option-" + questionIndex + "-" + stableHash(label).toString(16);
}

export function buildPlacementQuestions(
  catalog: KanjiCatalogItem[],
  prompt: string,
  seed = 0,
): PlacementQuestionRecord[] {
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
    const pool = (byLevel.get(level) ?? [])
      .slice()
      .sort((a, b) => Number(a.order ?? Infinity) - Number(b.order ?? Infinity));
    selected.push(...pickBlueprintItems(pool));
  }

  if (selected.length < DIAGNOSTIC_LEVELS.length * PLACEMENT_ITEMS_PER_LEVEL) {
    const fallback = catalog
      .filter(item => item.meanings.length)
      .slice()
      .sort((a, b) => Number(a.order ?? Infinity) - Number(b.order ?? Infinity));
    for (const item of fallback) {
      if (selected.includes(item)) continue;
      selected.push(item);
      if (selected.length >= DIAGNOSTIC_LEVELS.length * PLACEMENT_ITEMS_PER_LEVEL) break;
    }
  }

  return selected.slice(0, DIAGNOSTIC_LEVELS.length * PLACEMENT_ITEMS_PER_LEVEL).map((item, questionIndex) => {
    const correct = item.meanings[0];
    const distractors = catalog
      .filter(candidate => candidate.character !== item.character && candidate.meanings[0] && candidate.meanings[0] !== correct && !meaningSetsAmbiguous(item.character, item.meanings, candidate.meanings))
      .slice()
      .sort((a, b) => Number(a.order ?? Infinity) - Number(b.order ?? Infinity))
      .map(candidate => candidate.meanings[0])
      .filter((value, index, values) => values.indexOf(value) === index)
      .slice(questionIndex % 7, questionIndex % 7 + 6);

    const optionLabels = shuffleWithSeed(
      [correct, ...distractors].slice(0, 4),
      seed,
      "placement-options:" + item.character + ":" + questionIndex,
    );

    return {
      id: "placement-" + item.character + "-" + questionIndex,
      item,
      level: item.jlpt ?? null,
      stimulus: item.character,
      prompt,
      options: optionLabels.map(label => ({
        id: optionId(questionIndex, label),
        label,
        correct: label === correct,
      })),
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
    if (result && result.total >= 3 && result.correct / result.total >= 0.75) {
      suggestedLevel = level;
      break;
    }
  }

  const boundaryLevels = DIAGNOSTIC_LEVELS.filter(level => {
    const result = levelScores[level];
    return Boolean(result && result.total === PLACEMENT_ITEMS_PER_LEVEL && (result.correct === 2 || result.correct === 3));
  });
  const complete = questions.length === DIAGNOSTIC_LEVELS.length * PLACEMENT_ITEMS_PER_LEVEL && DIAGNOSTIC_LEVELS.every(level => (levelScores[level]?.total ?? 0) === PLACEMENT_ITEMS_PER_LEVEL);
  const upperBoundReached = (levelScores.N2?.total ?? 0) === PLACEMENT_ITEMS_PER_LEVEL && (levelScores.N2?.correct ?? 0) === PLACEMENT_ITEMS_PER_LEVEL;
  const confidence = !complete ? "limited" : boundaryLevels.length ? "boundary" : "high";
  return { score, total: questions.length, levelScores, suggestedLevel, confidence, boundaryLevels, upperBoundReached };
}
