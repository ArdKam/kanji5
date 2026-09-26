export type Rating = "Again" | "Hard" | "Good" | "Easy";

export type Settings = {
  dailyNew: number;
  retention: number;
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
    attributes?: Record<string, { state?: string; accuracy?: number; recentAccuracy?: number; confidence?: number; momentum?: number; repeatedFailure?: boolean }>;
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
    last7?: { label?: string; count?: number }[];
  };
  settings?: Settings;
};

export type KanjiDictionaryResult = {
  character: string;
  meanings: string[];
  on: string[];
  kun: string[];
  strokes?: number;
  grade?: number;
  jlpt?: string | null;
  frequency?: number;
  order?: number;
};

export type KanjiCatalogItem = KanjiDictionaryResult & { mastery:number; state?:string };
export type CustomStudyFocus = "available" | "due" | "new" | "weak";
export type CustomStudyFilter = { level?: "all" | "N5" | "N4" | "N3" | "N2" | "N1"; focus?: CustomStudyFocus; limit?: number };

export type VocabularyItem = { word: string; reading: string; meaning: string; source?: string };
export type RadicalEntry = {
  id: number;
  canonicalGlyph: string;
  radicalCharacter: string;
  codePoint: string;
  variants: string[];
  names?: { ja?: string };
  readings?: { ja?: string[] };
};

export type RadicalInfo = {
  character: string;
  available: boolean;
  radicalId?: number;
  radical?: RadicalEntry;
  source?: { name?: string; version?: string; url?: string } | null;
  mappingSource?: { name?: string; via?: string; commit?: string; field?: string; semantics?: string } | null;
};

export type RadicalCatalogResult = {
  id: number;
  canonicalGlyph: string;
  variants: string[];
  names?: { ja?: string };
  readings?: { ja?: string[] };
  kanjiCount?: number;
};

export type StructureLookupResult = {
  character: string;
  direct?: boolean;
  recursive?: boolean;
  radicalId?: number;
};

export type ComponentNode = {
  glyph: string;
  relation: "leaf" | "nested" | "cycle";
  sourceConfidence: "source-direct" | "derived-recursive";
  children: ComponentNode[];
};

export type ComponentEntity = {
  glyph: string;
  isJoyoKanji: boolean;
  sourceConfidence: "source-direct";
};

export type ComponentInfo = {
  character: string;
  available: boolean;
  components: string[];
  recursive?: ComponentNode[];
  sourceGap: boolean;
  
  coverage?: { available?: number; total?: number; fraction?: number } | null;
  source?: { name?: string; commit?: string; license?: string; semantics?: string } | null;
};

export type Boundary = {
  snapshot: () => Promise<Snapshot>;
  getVocabulary: (character: string) => Promise<{ character: string; items: VocabularyItem[] }>;
  getComponentInfo: (character: string) => Promise<ComponentInfo>;
  getRadicalInfo: (character: string) => Promise<RadicalInfo>;
  listRadicals: () => Promise<{ results: RadicalCatalogResult[] }>;
  getKanjiByRadical: (radicalId: number, limit?: number) => Promise<{ radicalId: number; results: KanjiDictionaryResult[] }>;
  getKanjiByComponent: (glyph: string, recursive?: boolean, limit?: number) => Promise<{ glyph: string; recursive: boolean; results: KanjiDictionaryResult[] }>;
  getKanjiByComponents: (glyphs: string[], recursive?: boolean, limit?: number) => Promise<{ glyphs: string[]; recursive: boolean; results: KanjiDictionaryResult[] }>;
  searchKanji: (query: string, limit?: number) => Promise<{ query: string; results: KanjiDictionaryResult[] }>;
  getMnemonic: (character: string) => Promise<{ character: string; text: string }>;
  saveMnemonic: (character: string, value: string) => Promise<{ character: string; text: string }>;
  listKanji: () => Promise<{ results: KanjiCatalogItem[] }>;
  startCustomStudy: (filter: CustomStudyFilter) => Promise<{ started: boolean; available: number }>;
  clearCustomStudyFilter: () => Promise<boolean>;
  ensureEducationRuntime: () => Promise<boolean>;
  refreshLearning: () => Promise<Snapshot>;
  revealLearning: (direct?: boolean) => Promise<boolean>;
  rateLearning: (rating: Rating) => Promise<boolean>;
  updateSettings: (value: Settings) => Promise<Snapshot>;
  clearTransient?: () => Promise<boolean>;
  resetProgress?: () => boolean;
};

type EducationStartResult = {
  started?: boolean;
  reason?: string;
  character?: string;
  mode?: string;
};

type EducationBridge = {
  start?: () => Promise<EducationStartResult | unknown> | (EducationStartResult | unknown);
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
  const boundary = await waitForEngine();
  await boundary.clearCustomStudyFilter?.();
  const session = window.__KANJI5_V16_SESSION_API__;
  if (session?.startExperience) await session.startExperience("review");
}

export async function startExercise(): Promise<void> {
  const boundary = await waitForEngine();
  await boundary.clearCustomStudyFilter?.();
  const educationReady = await boundary.ensureEducationRuntime();
  if (!educationReady) throw new Error("KANJI5_EDUCATION_RUNTIME_UNAVAILABLE");
  const bridge = window.__KANJI5_EDU_BRIDGE__;
  if (!bridge?.start) throw new Error("KANJI5_EDU_BRIDGE_UNAVAILABLE");
  const session = window.__KANJI5_V16_SESSION_API__;
  if (session?.startExperience) await session.startExperience("practice");
  else {
    const current = session?.getSession?.();
    if (session?.startReady && !current?.started && !current?.finished) await session.startReady();
    else if (session?.start && !current?.started && !current?.finished) await session.start();
  }
  const startResult = await bridge.start();
  if (startResult && typeof startResult === "object" && "started" in startResult && startResult.started === false) return;
  const started = performance.now();
  while (performance.now() - started < 15000) {
    const current = await snapshot();
    if (current.exercise?.mode && current.exercise?.prompt && current.exercise?.stimulus) return;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  throw new Error("KANJI5_EXERCISE_READY_TIMEOUT");
}

type ExerciseOutcome = { correct?: boolean; outcome?: string; quality?: string; score?: number };

async function awaitExerciseOutcome(result: unknown): Promise<ExerciseOutcome | unknown> {
  if (result && typeof result === "object") return result;
  const started = performance.now();
  while (performance.now() - started < 2500) {
    const feedback = (await snapshot()).feedback;
    if (feedback?.outcome && typeof feedback.correct === "boolean") return feedback;
    await new Promise((resolve) => window.setTimeout(resolve, 40));
  }
  return result;
}

export async function submitExercise(value: string): Promise<ExerciseOutcome | unknown> {
  const fn = window.__KANJI5_EDU_BRIDGE__?.submitValue;
  if (!fn) throw new Error("KANJI5_EDU_SUBMIT_UNAVAILABLE");
  return awaitExerciseOutcome(await fn(value));
}

export async function dontKnow(): Promise<ExerciseOutcome | unknown> {
  const fn = window.__KANJI5_EDU_BRIDGE__?.dontKnow;
  if (!fn) throw new Error("KANJI5_EDU_DONT_KNOW_UNAVAILABLE");
  return awaitExerciseOutcome(await fn());
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
export async function searchKanji(query: string, limit = 24): Promise<{ query: string; results: KanjiDictionaryResult[] }> {
  return (await waitForEngine()).searchKanji(query, limit);
}

export async function listKanji(): Promise<{ results: KanjiCatalogItem[] }> {
  return (await waitForEngine()).listKanji();
}

export async function startCustomStudy(filter: CustomStudyFilter): Promise<{ started: boolean; available: number }> {
  return (await waitForEngine()).startCustomStudy(filter);
}

export async function clearCustomStudyFilter(): Promise<boolean> {
  return Boolean((await waitForEngine()).clearCustomStudyFilter?.());
}

export async function getMnemonic(character: string): Promise<{ character: string; text: string }> {
  return (await waitForEngine()).getMnemonic(character);
}

export async function saveMnemonic(character: string, value: string): Promise<{ character: string; text: string }> {
  return (await waitForEngine()).saveMnemonic(character, value);
}

export async function getVocabulary(character: string): Promise<{ character: string; items: VocabularyItem[] }> {
  return (await waitForEngine()).getVocabulary(character);
}

export async function getComponentInfo(character: string): Promise<ComponentInfo> {
  return (await waitForEngine()).getComponentInfo(character);
}

export async function getRadicalInfo(character: string): Promise<RadicalInfo> {
  return (await waitForEngine()).getRadicalInfo(character);
}
export async function listRadicals(): Promise<{ results: RadicalCatalogResult[] }> {
  return (await waitForEngine()).listRadicals();
}
export async function getKanjiByRadical(radicalId: number, limit = 80): Promise<{ radicalId: number; results: KanjiDictionaryResult[] }> {
  return (await waitForEngine()).getKanjiByRadical(radicalId, limit);
}
export async function getKanjiByComponent(glyph: string, recursive = true, limit = 80): Promise<{ glyph: string; recursive: boolean; results: KanjiDictionaryResult[] }> {
  return (await waitForEngine()).getKanjiByComponent(glyph, recursive, limit);
}
export async function getKanjiByComponents(glyphs: string[], recursive = true, limit = 80): Promise<{ glyphs: string[]; recursive: boolean; results: KanjiDictionaryResult[] }> {
  return (await waitForEngine()).getKanjiByComponents(glyphs, recursive, limit);
}
