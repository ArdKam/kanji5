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
    sourceMeanings?: string[];
    learnerMeanings?: { primary?: string[]; secondary?: string[]; reference?: string[] };
    learnerReadings?: { coreOn?: string[]; coreKun?: string[]; vocabularySupported?: string[]; referenceOn?: string[]; referenceKun?: string[] };
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
    modality?: string;
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
    evaluation?: {
      version?: string;
      sessions?: number;
      completedSessions?: number;
      sessionCompletionRate?: number | null;
      totalAttempts?: number;
      accuracy?: number;
      unknownRate?: number;
      recoveryRate?: number;
      repeatedFailureRate?: number;
      attributeCoverage?: number;
      averageRecallsPerSession?: number;
      modeDistribution?: Record<string, number>;
      attributes?: Record<string, {
        attempts?: number;
        accuracy?: number;
        recentAccuracy?: number;
        retentionRate?: number | null;
        recoveryRate?: number;
        repeatedFailureRate?: number;
      }>;
      comparison?: {
        available?: boolean;
        sufficient?: boolean;
        accuracyDelta?: number | null;
        recoveryDelta?: number | null;
        coverageDelta?: number | null;
        evidenceReason?: string;
      };
      evidence?: {
        sessions?: number;
        attempts?: number;
        sufficient?: boolean;
        reason?: string;
      };
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
export type CustomStudyFilter = { level?: "all" | "N5" | "N4" | "N3" | "N2" | "N1"; focus?: CustomStudyFocus; limit?: number; characterScope?: string[] };

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

export type VisualStructureNode = {
  character: string;
  components: VisualStructureNode[];
  position?: string;
  variant?: boolean;
  radicalRole?: string;
  phoneticRole?: string;
  part?: string;
  partial?: boolean;
  original?: string;
  sourceParts?: string[];
  sourcePartDetails?: Array<{ part: string; position?: string; radicalRole?: string; phoneticRole?: string }>;
};
export type VisualStructureInfo = {
  character: string;
  available: boolean;
  root: VisualStructureNode | null;
  components: VisualStructureNode[];
  atomic: boolean;
  sourceGap: boolean;
  coverage?: { available?: number; total?: number; fraction?: number } | null;
  source?: { name?: string; commit?: string; license?: string; attribution?: string; url?: string; semantics?: string } | null;
};

export type BackupSummary = {
  cards: number;
  reviews: number;
  personalMnemonics: number;
  completedSessions: number;
};
export type PortableBackup = {
  format: "kanji5-backup";
  version: 1 | 2;
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
  getVisualStructureInfo: (character: string) => Promise<VisualStructureInfo>;
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
  startLearningSession: () => Promise<void>;
  startLearningExperience: () => Promise<void>;
  startPracticeExperience: () => Promise<void>;
  startExercise: () => Promise<void>;
  submitExercise: (value:string, meta?: { hintUsed?: boolean }) => Promise<ExerciseOutcome | unknown>;
  dontKnowExercise: () => Promise<ExerciseOutcome | unknown>;
  selfReportProduction: (knewIt:boolean) => Promise<ExerciseOutcome | unknown>;
  retryExercise: () => Promise<unknown>;
  nextExercise: () => Promise<void>;
  getHandwritingSkill: (character:string) => Promise<HandwritingSkill|null>;
  recordHandwritingGrade: (character:string,grade:HandwritingGradeLike) => Promise<boolean>;
};


declare global {
  interface Window {
    __KANJI5_V19_V2_BOUNDARY__?: Boundary;
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

export async function getStats(): Promise<NonNullable<Snapshot["stats"]>> {
  const stats = await (await waitForEngine()).getStats?.();
  if (!stats) throw new Error("KANJI5_STATS_UNAVAILABLE");
  return stats;
}

export async function startLearningSession(): Promise<void> {
  return (await waitForEngine()).startLearningSession();
}
export async function startLearningExperience(): Promise<void> {
  return (await waitForEngine()).startLearningExperience();
}
export async function startPracticeExperience(): Promise<void> {
  return (await waitForEngine()).startPracticeExperience();
}
export async function startExercise(): Promise<void> {
  return (await waitForEngine()).startExercise();
}

type ExerciseOutcome = { correct?: boolean; outcome?: string; quality?: string; score?: number };

export async function submitExercise(value: string, meta?: { hintUsed?: boolean }): Promise<ExerciseOutcome | unknown> {
  return (await waitForEngine()).submitExercise(value, meta);
}
export async function dontKnow(): Promise<ExerciseOutcome | unknown> {
  return (await waitForEngine()).dontKnowExercise();
}
export async function selfReportProduction(knewIt: boolean): Promise<ExerciseOutcome | unknown> {
  return (await waitForEngine()).selfReportProduction(knewIt);
}
export async function retryExercise(): Promise<unknown> {
  return (await waitForEngine()).retryExercise();
}
export async function nextExercise(): Promise<void> {
  return (await waitForEngine()).nextExercise();
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

export async function getVisualStructureInfo(character: string): Promise<VisualStructureInfo> {
  return (await waitForEngine()).getVisualStructureInfo(character);
}

export async function getRadicalInfo(character: string): Promise<RadicalInfo> {
  return (await waitForEngine()).getRadicalInfo(character);
}

export async function getHandwritingSkill(character:string):Promise<HandwritingSkill|null>{
  return (await waitForEngine()).getHandwritingSkill(character);
}
export async function recordHandwritingGrade(character:string,grade:HandwritingGradeLike):Promise<boolean>{
  return (await waitForEngine()).recordHandwritingGrade(character,grade);
}
