export const HANDWRITING_GRADER_VERSION: string;
export type HandwritingPoint = { x:number; y:number };
export type HandwritingStroke = HandwritingPoint[];
export type HandwritingFeedbackCode = "good"|"improve"|"shape"|"stroke-count"|"stroke-order"|"placement"|"endpoints"|"length"|"direction"|"curvature"|"empty"|"unavailable";
export type HandwritingScoreReliability = "high"|"medium"|"low";
export type HandwritingGradingOptions = {
  resamplePoints?: number;
  minPointDistance?: number;
  smoothing?: number;
  maxScaleAdjustment?: number;
};
export type HandwritingPerStrokeScore = {
  strokeNumber:number;
  similarity:number;
  shape:number;
  endpoints:number;
  length:number;
  lengthRatio:number;
  direction:number;
  curvature:number;
  feedbackCode:Exclude<HandwritingFeedbackCode,"empty"|"unavailable"|"stroke-count"|"stroke-order"|"placement">;
};
export type HandwritingStrokeGrade = {
  similarity:number;
  scoreReliability:HandwritingScoreReliability;
  feedbackCode:Exclude<HandwritingFeedbackCode,"stroke-count"|"stroke-order"|"placement"|"empty"|"unavailable">;
  actionable:boolean;
  metrics:{shape:number;endpoints:number;length:number;lengthRatio:number;direction:number;curvature:number;placement:number};
};
export type HandwritingGrade = {
  overallSimilarity:number;
  scoreReliability:HandwritingScoreReliability;
  strokeCount:{user:number;reference:number;ratio:number;missing:number;extra:number};
  orderScore:number;
  placementScore:number;
  perStroke:HandwritingPerStrokeScore[];
  feedbackCode:HandwritingFeedbackCode;
  feedbackStroke:number|null;
};
export function preprocessStrokes(strokes:HandwritingStroke[],options?:HandwritingGradingOptions):HandwritingStroke[];
export function gradeHandwritingStroke(userStroke:HandwritingStroke,referenceStroke:HandwritingStroke,options?:HandwritingGradingOptions):HandwritingStrokeGrade;
export function gradeHandwriting(userStrokes:HandwritingStroke[],referenceStrokes:HandwritingStroke[],options?:HandwritingGradingOptions):HandwritingGrade;
