import {
  buildPlacementQuestionsCore,
  scorePlacementAnswersCore,
  DIAGNOSTIC_LEVELS as LEVELS,
  PLACEMENT_ITEMS_PER_LEVEL as ITEMS_PER_LEVEL,
  PLACEMENT_PASS_CORRECT as PASS_CORRECT,
  type PlacementCoreQuestion,
  type PlacementCoreScore,
} from "../../../placement-assessment-core.js";
import type { KanjiCatalogItem } from "./engine";

export const DIAGNOSTIC_LEVELS = LEVELS;
export const PLACEMENT_ITEMS_PER_LEVEL = ITEMS_PER_LEVEL;
export const PLACEMENT_PASS_CORRECT = PASS_CORRECT;

export type PlacementQuestionRecord = PlacementCoreQuestion<KanjiCatalogItem>;
export type PlacementScore = PlacementCoreScore;

export function buildPlacementQuestions(
  catalog: KanjiCatalogItem[],
  prompt: string,
  seed = 0,
): PlacementQuestionRecord[] {
  return buildPlacementQuestionsCore(catalog, prompt, seed);
}

export function scorePlacementAnswers(
  questions: PlacementQuestionRecord[],
  answers: Record<string, string>,
): PlacementScore {
  return scorePlacementAnswersCore(questions, answers);
}
