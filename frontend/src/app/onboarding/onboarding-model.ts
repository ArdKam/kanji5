export type OnboardingStep =
  | "welcome"
  | "learning-loop"
  | "starting-point"
  | "placement"
  | "placement-result"
  | "daily-rhythm"
  | "account";

export type StartingPointChoice = "beginner" | "some-knowledge" | "assess";

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
  dailyNew: number;
};

export type OnboardingProgress = {
  draft: OnboardingDraft;
  step: OnboardingStep;
  placementIndex: number;
  placementAnswer: string;
  completedPlacement: boolean;
};

export type OnboardingCompletion = {
  mode: "guest" | "account";
  draft: OnboardingDraft;
};

export function createInitialOnboardingDraft(): OnboardingDraft {
  return { startingPoint: null, placementAnswers: [], suggestedLevel: null, dailyNew: 5 };
}

export function createInitialOnboardingProgress(): OnboardingProgress {
  return { draft: createInitialOnboardingDraft(), step: "welcome", placementIndex: 0, placementAnswer: "", completedPlacement: false };
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
  const draft: OnboardingDraft = {
    startingPoint,
    placementAnswers: Array.isArray(suppliedDraft.placementAnswers)
      ? suppliedDraft.placementAnswers.filter(answer => Boolean(answer) && typeof answer.questionId === "string" && typeof answer.optionId === "string")
      : [],
    suggestedLevel: typeof suppliedDraft.suggestedLevel === "string" ? suppliedDraft.suggestedLevel : null,
    dailyNew: normalizeDailyNew(suppliedDraft.dailyNew),
  };
  const steps = getVisibleSteps(draft);
  const step = steps.includes(value?.step as OnboardingStep) ? value!.step as OnboardingStep : "welcome";
  return {
    draft,
    step,
    placementIndex: Math.max(0, Math.floor(Number(value?.placementIndex) || 0)),
    placementAnswer: typeof value?.placementAnswer === "string" ? value.placementAnswer : "",
    completedPlacement: Boolean(value?.completedPlacement),
  };
}
