export type Rating = "Again" | "Hard" | "Good" | "Easy";

export type Settings = {
  dailyNew: number;
  dailyGoal: number;
  leechThreshold: number;
  production: boolean;
  vocabulary: boolean;
  context: boolean;
};

export type Snapshot = {
  dailySummary?: {
    dueCount?: number;
    newCount?: number;
    masteredCount?: number;
    streak?: number;
  };
  dailyGoal?: {
    completed?: number;
    target?: number;
    progress?: number;
    celebrated?: boolean;
  };
  upcomingReviews?: { character: string; dueAt: string }[];
  session?: {
    status?: string;
    completionFraction?: number;
    plannedTotal?: number;
    remainingTotal?: number;
  };
  learning?: {
    active?: boolean;
    isNew?: boolean;
    character?: string;
    revealed?: boolean;
    meanings?: string[];
    on?: string[];
    kun?: string[];
    examples?: { word?: string; reading?: string; meaning?: string }[];
    hint?: string;
    revealLabel?: string;
  };
  exercise?: {
    mode?: string;
    character?: string;
    prompt?: string;
    answerHint?: string;
    stimulus?: {
      kind?: string;
      primary?: string;
      secondary?: string;
      translation?: string;
      inputPlaceholder?: string;
    };
    choices?: string[];
    contentId?: string;
  };
  feedback?: {
    outcome?: string;
    correct?: boolean;
    reason?: string;
    answerHint?: string;
    state?: string;
  };
  learner?: {
    attributes?: Record<string, { state?: string; recentAccuracy?: number }>;
  };
  adaptiveReason?: {
    mode?: string;
    action?: string;
    reasons?: string[];
  };
  sessionSummary?: {
    attempts?: number;
    correct?: number;
    accuracy?: number;
  };
  recentOutcomes?: {
    character?: string;
    mode?: string;
    quality?: string;
    outcome?: string;
    correct?: boolean;
  }[];
  stats?: {
    totalReviews?: number;
    nonAgainRate?: number;
    studiedCount?: number;
    deckSize?: number;
    currentStreak?: number;
    longestStreak?: number;
    leechCount?: number;
  };
  settings?: Settings;
};

export type ComponentInfo = {
  character: string;
  available: boolean;
  components: string[];
  sourceGap: boolean;
  coverage?: { available?: number; total?: number; fraction?: number } | null;
  source?: { name?: string; commit?: string; license?: string; semantics?: string } | null;
};

export type Boundary = {
  snapshot: () => Promise<Snapshot>;
  getComponentInfo: (character: string) => Promise<ComponentInfo>;
  refreshLearning: () => Promise<Snapshot>;
  revealLearning: (direct?: boolean) => Promise<boolean>;
  rateLearning: (rating: Rating) => Promise<boolean>;
  updateSettings: (value: Settings) => Promise<Snapshot>;
  clearTransient?: () => Promise<boolean>;
  resetProgress?: () => boolean;
};

type EducationBridge = {
  start?: () => Promise<unknown> | unknown;
  submitValue?: (value: string) => Promise<unknown> | unknown;
  dontKnow?: () => Promise<unknown> | unknown;
  retry?: () => Promise<unknown> | unknown;
  next?: () => Promise<unknown> | unknown;
};

type SessionApi = {
  getSession?: () => { started?: boolean; finished?: boolean; experience?: "review" | "practice" } | null;
  startExperience?: (experience: "review" | "practice") => Promise<unknown> | unknown;
  startReady?: () => Promise<unknown> | unknown;
  start?: () => Promise<unknown> | unknown;
};

declare global {
  interface Window {
    __KANJI5_V19_V2_BOUNDARY__?: Boundary;
    __KANJI5_EDU_BRIDGE__?: EducationBridge;
    __KANJI5_V16_SESSION_API__?: SessionApi;
  }
}

export async function waitForEngine(timeoutMs = 12000): Promise<Boundary> {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    const boundary = window.__KANJI5_V19_V2_BOUNDARY__;
    if (boundary) return boundary;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  throw new Error("KANJI5_V19_V2_BOUNDARY_TIMEOUT");
}

export async function snapshot(): Promise<Snapshot> {
  return (await waitForEngine()).snapshot();
}

export async function revealLearning(): Promise<boolean> {
  return (await waitForEngine()).revealLearning();
}

export async function rateLearning(rating: Rating): Promise<boolean> {
  return (await waitForEngine()).rateLearning(rating);
}

export async function updateSettings(settings: Settings): Promise<Snapshot> {
  return (await waitForEngine()).updateSettings(settings);
}

export async function clearTransient(): Promise<boolean> {
  return Boolean(await (await waitForEngine()).clearTransient?.());
}

export function resetProgress(): boolean {
  return Boolean(window.__KANJI5_V19_V2_BOUNDARY__?.resetProgress?.());
}

export async function startLearningExperience(): Promise<void> {
  await waitForEngine();
  const session = window.__KANJI5_V16_SESSION_API__;
  if (session?.startExperience) await session.startExperience("review");
}

export async function startExercise(): Promise<void> {
  const bridge = window.__KANJI5_EDU_BRIDGE__;
  if (!bridge?.start) throw new Error("KANJI5_EDU_BRIDGE_UNAVAILABLE");
  const session = window.__KANJI5_V16_SESSION_API__;
  if (session?.startExperience) await session.startExperience("practice");
  else {
    const current = session?.getSession?.();
    if (session?.startReady && !current?.started && !current?.finished) await session.startReady();
    else if (session?.start && !current?.started && !current?.finished) await session.start();
  }
  await bridge.start();
}

export async function submitExercise(value: string): Promise<void> {
  const fn = window.__KANJI5_EDU_BRIDGE__?.submitValue;
  if (!fn) throw new Error("KANJI5_EDU_SUBMIT_UNAVAILABLE");
  await fn(value);
}

export async function dontKnow(): Promise<void> {
  const fn = window.__KANJI5_EDU_BRIDGE__?.dontKnow;
  if (!fn) throw new Error("KANJI5_EDU_DONT_KNOW_UNAVAILABLE");
  await fn();
}

export async function retryExercise(): Promise<void> {
  const fn = window.__KANJI5_EDU_BRIDGE__?.retry;
  if (!fn) throw new Error("KANJI5_EDU_RETRY_UNAVAILABLE");
  await fn();
}

export async function nextExercise(): Promise<void> {
  const fn = window.__KANJI5_EDU_BRIDGE__?.next;
  if (!fn) throw new Error("KANJI5_EDU_NEXT_UNAVAILABLE");
  await fn();
}
export async function getComponentInfo(character: string): Promise<ComponentInfo> {
  return (await waitForEngine()).getComponentInfo(character);
}
