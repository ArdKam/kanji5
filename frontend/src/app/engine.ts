export type Rating = "Again" | "Hard" | "Good" | "Easy";
export type HandwritingSkill = {version?:string;attempts?:number;correct?:number;accuracy?:number;score?:number;averageScore?:number;recentAverageScore?:number;confidence?:number;consistency?:number;state?:string;momentum?:number;errorStreak?:number;successStreak?:number;lastScore?:number;lastOutcome?:string|null;feedbackCode?:string|null;feedbackStroke?:number|null;weakestMetric?:string|null;metrics?:{shape?:number|null;endpoints?:number|null;length?:number|null;direction?:number|null;curvature?:number|null;placement?:number|null}};
export type HandwritingGradeLike = {overallSimilarity?:number;feedbackCode?:string;feedbackStroke?:number|null;perStroke?:Array<Record<string,unknown>>};

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
     contentStage?: "introduction" | "guided" | "retrieval";
     contentState?: string;
  };
  feedback?: {
    outcome?: string;
    correct?: boolean;
    reason?: string;
    answerHint?: string;
    state?: string;
  };
  learner?: {
    attributes?: Record<string, { state?: string; accuracy?: number; recentAccuracy?: number; confidence?: number; momentum?: number; attempts?: number; recentAttempts?: number; repeatedFailure?: boolean }>;
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
    masteryDistribution?: {
      unseen?: number;
      learning?: number;
      attention?: number;
      stable?: number;
      mastered?: number;
      average?: number;
      total?: number;
    };
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
export type CustomStudyFocus = "available" | "due" | "new" | "weak" | "mistakes";
export type CustomStudyFilter = { level?: "all" | "N5" | "N4" | "N3" | "N2" | "N1"; focus?: CustomStudyFocus; limit?: number };

export type VocabularyItem = { word: string; reading: string; meaning: string; source?: string };
export type RadicalInfo = { character:string; available:boolean; radicalId:number|null; radical:{id:number;glyph:string;strokeCount:number;meanings:string[];sourceForms?:string[]}|null; coverage?:{available?:number;total?:number;fraction?:number}|null; source?:{name?:string;upstreamVersion?:string;license?:string;radicalDefinitionsRevision?:number}|null; };
export type ComponentInfo = {
  character: string;
  available: boolean;
  components: string[];
  sourceGap: boolean;
  coverage?: { available?: number; total?: number; fraction?: number } | null;
  source?: { name?: string; commit?: string; license?: string; semantics?: string } | null;
};

export type BackupSummary = {
  cards: number;
  reviews: number;
  personalMnemonics: number;
  completedSessions: number;
};
export type PortableBackup = {
  format: "kanji5-backup";
  version: 1;
  createdAt: string;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  summary: BackupSummary;
  checksum: string;
};

export type Boundary = {
  snapshot: () => Promise<Snapshot>;
  getStats?: () => Promise<NonNullable<Snapshot["stats"]>>;
  startupSnapshot: () => Promise<Snapshot>;
  getVocabulary: (character: string) => Promise<{ character: string; items: VocabularyItem[] }>;
  getComponentInfo: (character: string) => Promise<ComponentInfo>;
  getRadicalInfo: (character: string) => Promise<RadicalInfo>;
  searchKanji: (query: string, limit?: number) => Promise<{ query: string; results: KanjiDictionaryResult[] }>;
  getMnemonic: (character: string) => Promise<{ character: string; text: string }>;
  listPersonalMnemonics?: () => Promise<{ mnemonics: Record<string, string> }>;
  saveMnemonic: (character: string, value: string) => Promise<{ character: string; text: string }>;
  createBackup?: () => PortableBackup | null;
  restoreBackup?: (backup: PortableBackup) => BackupSummary;
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
  selfReportProduction?: (knewIt: boolean) => Promise<unknown> | unknown;
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
    __KANJI5_V19_LEARNER_MODEL__?: { project?: (character:string)=>Promise<{skills?:{handwriting?:HandwritingSkill}}>; recordOutcome?: (detail:Record<string,unknown>)=>Promise<unknown>|unknown; };
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

export async function startupSnapshot(): Promise<Snapshot> {
  return (await waitForEngine()).startupSnapshot();
}

export async function getStats(): Promise<NonNullable<Snapshot["stats"]>> {
  const stats = await (await waitForEngine()).getStats?.();
  if (!stats) throw new Error("KANJI5_STATS_UNAVAILABLE");
  return stats;
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

export async function startLearningSession(): Promise<void> {
  await waitForEngine();
  const session = window.__KANJI5_V16_SESSION_API__;
  if (session?.start) await session.start();
  else if (session?.startExperience) await session.startExperience("review");
}

export async function startLearningExperience(): Promise<void> {
  const boundary = await waitForEngine();
  await boundary.clearCustomStudyFilter?.();
  const session = window.__KANJI5_V16_SESSION_API__;
  if (session?.startExperience) await session.startExperience("review");
}

export async function startPracticeExperience(): Promise<void> {
  await waitForEngine();
  const session = window.__KANJI5_V16_SESSION_API__;
  if (session?.startExperience) await session.startExperience("practice");
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
  if (startResult && typeof startResult === "object" && "started" in startResult && startResult.started === false) {
    throw new Error("KANJI5_NO_EXERCISE_AVAILABLE");
  }
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

export async function selfReportProduction(knewIt: boolean): Promise<ExerciseOutcome | unknown> {
  const fn = window.__KANJI5_EDU_BRIDGE__?.selfReportProduction;
  if (!fn) throw new Error("KANJI5_EDU_SELF_REPORT_UNAVAILABLE");
  return awaitExerciseOutcome(await fn(Boolean(knewIt)));
}

export async function retryExercise(): Promise<unknown> {
  const fn = window.__KANJI5_EDU_BRIDGE__?.retry;
  if (!fn) throw new Error("KANJI5_EDU_RETRY_UNAVAILABLE");
  return await fn();
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

export async function listPersonalMnemonics(): Promise<{ mnemonics: Record<string, string> }> {
  const api = await waitForEngine();
  if (!api.listPersonalMnemonics) return { mnemonics: {} };
  return api.listPersonalMnemonics();
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
export async function createBackup(): Promise<PortableBackup> {
  const backup = (await waitForEngine()).createBackup?.();
  if (!backup) throw new Error("KANJI5_BACKUP_UNAVAILABLE");
  return backup;
}

export async function restoreBackup(backup: PortableBackup): Promise<BackupSummary> {
  const summary = (await waitForEngine()).restoreBackup?.(backup);
  if (!summary) throw new Error("KANJI5_BACKUP_RESTORE_UNAVAILABLE");
  return summary;
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

export async function getHandwritingSkill(character:string):Promise<HandwritingSkill|null>{const key=String(character||"").trim();if(!key)return null;const started=performance.now();while(performance.now()-started<6000){const api=window.__KANJI5_V19_LEARNER_MODEL__;if(api?.project){try{return(await api.project(key))?.skills?.handwriting??null}catch{return null}}await new Promise(resolve=>window.setTimeout(resolve,50))}return null}
export async function recordHandwritingGrade(character:string,grade:HandwritingGradeLike):Promise<boolean>{const key=String(character||"").trim(),fn=window.__KANJI5_V19_LEARNER_MODEL__?.recordOutcome;if(!key||!fn)return false;const score=Math.max(0,Math.min(1,Number(grade?.overallSimilarity||0)/100)),evidence:Record<string,unknown>={};const weak=Array.isArray(grade?.perStroke)?grade.perStroke.find(row=>Number(row.strokeNumber)===Number(grade?.feedbackStroke)):null;if(weak)for(const metric of ["shape","endpoints","length","direction","curvature","placement"]){const value=Number(weak[metric]);if(Number.isFinite(value))evidence[metric]=Math.max(0,Math.min(1,value))}if(typeof grade?.feedbackCode==="string")evidence.feedbackCode=grade.feedbackCode;if(Number.isFinite(Number(grade?.feedbackStroke)))evidence.feedbackStroke=Number(grade.feedbackStroke);const outcome=grade?.feedbackCode==="good"||score>=.88?"correct":"wrong";return Boolean(await fn({character:key,mode:"handwriting",outcome,correct:outcome==="correct",quality:outcome==="correct"?"good":"needs-work",score,graderVersion:"handwriting-vector-v2",schemaVersion:1,evidence}))}
