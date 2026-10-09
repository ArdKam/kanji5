export type PlacementCatalogItem = {
  character?: string;
  id?: string;
  meanings?: string[];
  meaning?: string[];
  on?: string[];
  kun?: string[];
  jlpt?: string | null;
  order?: number;
  frequency?: number;
  [key: string]: unknown;
};

export type PlacementCoreOption = { id: string; label: string; correct: boolean };
export type PlacementCoreQuestion<T extends PlacementCatalogItem = PlacementCatalogItem> = {
  id: string;
  item: T;
  level: string | null;
  stimulus: string;
  prompt: string;
  options: PlacementCoreOption[];
};
export type PlacementCoreScore = {
  score: number;
  total: number;
  answered: number;
  levelScores: Record<string, { correct: number; total: number }>;
  suggestedLevel: string;
  confidence: "provisional" | "boundary" | "limited";
  boundaryLevels: string[];
  upperBoundReached: boolean;
};

export const DIAGNOSTIC_LEVELS: readonly ["N5", "N4", "N3", "N2"];
export const PLACEMENT_ITEMS_PER_LEVEL: 5;
export const PLACEMENT_PASS_CORRECT: 4;
export const PLACEMENT_TOTAL_QUESTIONS: 20;
export function buildPlacementQuestionsCore<T extends PlacementCatalogItem>(
  catalog: T[],
  prompt: string,
  seed?: number,
): PlacementCoreQuestion<T>[];
export function scorePlacementAnswersCore(
  questions: PlacementCoreQuestion[],
  answers?: Record<string, string>,
): PlacementCoreScore;
