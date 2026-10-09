export type OnboardingStep =
  | "welcome"
  | "learning-loop"
  | "starting-point"
  | "placement"
  | "placement-result"
  | "daily-rhythm"
  | "account";

export type StartingPointChoice = "beginner" | "some-knowledge" | "assess";
export type PlacementLevel = "N5" | "N4" | "N3" | "N2";
export type PlacementConfidence = "provisional" | "boundary" | "limited";
export type PlacementLevelScore = { correct: number; total: number };
export type PlacementSummary = {
  score: number;
  total: number;
  answered: number;
  levelScores: Record<string, PlacementLevelScore>;
  suggestedLevel: PlacementLevel;
  confidence: PlacementConfidence;
  boundaryLevels: string[];
  upperBoundReached: boolean;
};

export type PlacementOption = { id: string; label: string; };

export type PlacementQuestion = {
  id: string;
  prompt: string;
  stimulus: string;
  options: PlacementOption[];
  level?: string | null;
};

export type PlacementAnswer = { questionId: string; optionId: string; };

export type OnboardingDraft = {
  startingPoint: StartingPointChoice | null;
  placementAnswers: PlacementAnswer[];
  suggestedLevel: string | null;
  placementSummary: PlacementSummary | null;
  dailyNew: number;
};

export type OnboardingProgress = {
  draft: OnboardingDraft;
  step: OnboardingStep;
  placementIndex: number;
  placementAnswer: string;
  completedPlacement: boolean;
  placementSeed: number;
};

export type OnboardingCompletion = {
  mode: "guest" | "account";
  draft: OnboardingDraft;
};

const PLACEMENT_LEVELS: PlacementLevel[] = ["N5", "N4", "N3", "N2"];

function emptyPlacementSummary(): PlacementSummary | null {
  return null;
}

function sanitizePlacementSummary(value: unknown): PlacementSummary | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<PlacementSummary>;
  const suggestedLevel = PLACEMENT_LEVELS.includes(candidate.suggestedLevel as PlacementLevel)
    ? candidate.suggestedLevel as PlacementLevel
    : null;
  const confidence = candidate.confidence === "provisional" || candidate.confidence === "boundary" || candidate.confidence === "limited"
    ? candidate.confidence
    : null;
  if (!suggestedLevel || !confidence) return null;
  const suppliedScores = candidate.levelScores && typeof candidate.levelScores === "object" ? candidate.levelScores : {};
  const levelScores: Record<string, PlacementLevelScore> = {};
  for (const level of PLACEMENT_LEVELS) {
    const row = (suppliedScores as Record<string, Partial<PlacementLevelScore>>)[level];
    levelScores[level] = {
      correct: Math.max(0, Math.min(5, Math.floor(Number(row?.correct) || 0))),
      total: Math.max(0, Math.min(5, Math.floor(Number(row?.total) || 0))),
    };
  }
  const total = Math.max(0, Math.min(20, Math.floor(Number(candidate.total) || 0)));
  const score = Math.max(0, Math.min(total, Math.floor(Number(candidate.score) || 0)));
  const answered = Math.max(0, Math.min(total, Math.floor(Number(candidate.answered) || 0)));
  return {
    score,
    total,
    answered,
    levelScores,
    suggestedLevel,
    confidence,
    boundaryLevels: Array.isArray(candidate.boundaryLevels)
      ? candidate.boundaryLevels.filter(level => PLACEMENT_LEVELS.includes(level as PlacementLevel))
      : [],
    upperBoundReached: candidate.upperBoundReached === true,
  };
}

export function createInitialOnboardingDraft(): OnboardingDraft {
  return {
    startingPoint: null,
    placementAnswers: [],
    suggestedLevel: null,
    placementSummary: emptyPlacementSummary(),
    dailyNew: 5,
  };
}

export function createInitialOnboardingProgress(): OnboardingProgress {
  return {
    draft: createInitialOnboardingDraft(),
    step: "welcome",
    placementIndex: 0,
    placementAnswer: "",
    completedPlacement: false,
    placementSeed: Date.now() >>> 0,
  };
}

export function getVisibleSteps(draft: OnboardingDraft): OnboardingStep[] {
  return [
    "welcome",
    "learning-loop",
    "starting-point",
    ...(draft.startingPoint === "assess" ? ["placement", "placement-result"] as OnboardingStep[] : []),
    "daily-rhythm",
    "account",
  ];
}

export function getStepIndex(step: OnboardingStep, draft: OnboardingDraft): number {
  return Math.max(0, getVisibleSteps(draft).indexOf(step));
}

export function canProceedFromStartingPoint(draft: OnboardingDraft): boolean { return Boolean(draft.startingPoint); }

export function canProceedFromPlacement(question: PlacementQuestion | undefined, currentAnswer: string): boolean {
  return Boolean(question && currentAnswer);
}

export function normalizeDailyNew(value: number): number {
  return Math.max(1, Math.min(30, Math.round(Number(value) || 0)));
}

export function sanitizeOnboardingProgress(value: Partial<OnboardingProgress> | null | undefined): OnboardingProgress {
  const initial = createInitialOnboardingProgress();
  const suppliedDraft = value?.draft ?? initial.draft;
  const startingPoint =
    suppliedDraft.startingPoint === "beginner" || suppliedDraft.startingPoint === "some-knowledge" || suppliedDraft.startingPoint === "assess"
      ? suppliedDraft.startingPoint : null;
  const suggestedLevel = ["N5", "N4", "N3", "N2", "N1"].includes(String(suppliedDraft.suggestedLevel))
    ? suppliedDraft.suggestedLevel
    : null;
  const draft: OnboardingDraft = {
    startingPoint,
    placementAnswers: Array.isArray(suppliedDraft.placementAnswers)
      ? suppliedDraft.placementAnswers.filter(answer => Boolean(answer) && typeof answer.questionId === "string" && typeof answer.optionId === "string")
      : [],
    suggestedLevel,
    placementSummary: sanitizePlacementSummary(suppliedDraft.placementSummary),
    dailyNew: normalizeDailyNew(suppliedDraft.dailyNew),
  };
  const steps = getVisibleSteps(draft);
  const step = steps.includes(value?.step as OnboardingStep) ? value!.step as OnboardingStep : "welcome";
  const seedValue = Number(value?.placementSeed);
  return {
    draft,
    step,
    placementIndex: Math.max(0, Math.floor(Number(value?.placementIndex) || 0)),
    placementAnswer: typeof value?.placementAnswer === "string" ? value.placementAnswer : "",
    completedPlacement: Boolean(value?.completedPlacement),
    placementSeed: Number.isFinite(seedValue) ? seedValue >>> 0 : initial.placementSeed,
  };
}
