export type LearnerContentSource = {
  character?: string;
  id?: string;
  meanings?: string[];
  meaning?: string[];
  on?: string[];
  kun?: string[];
  vocabularySupportedReadings?: string[];
  coreOn?: string[];
  coreKun?: string[];
};

export type LearnerContentProjection = {
  version: string;
  character: string;
  sourceMeanings: readonly string[];
  meanings: {
    primary: readonly string[];
    secondary: readonly string[];
    reference: readonly string[];
  };
  readings: {
    coreOn: readonly string[];
    coreKun: readonly string[];
    vocabularySupported: readonly string[];
    referenceOn: readonly string[];
    referenceKun: readonly string[];
  };
};

export function buildLearnerContent(source?: LearnerContentSource): LearnerContentProjection;
export function learnerPrimaryMeanings(source?: LearnerContentSource): readonly string[];
export function learnerCoreReadings(source?: LearnerContentSource): string[];
export function learnerContentPolicy(): Readonly<Record<string, string>>;
export function selectLearnerExamples(examples: unknown[], character: string, limit?: number): Array<{ word: string; reading: string; meaning: string }>;
