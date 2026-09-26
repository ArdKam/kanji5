export type HandwritingPoint = { x: number; y: number };
export type HandwritingStroke = HandwritingPoint[];
export type HandwritingFeedbackCode = "good" | "improve" | "shape" | "stroke-count" | "stroke-order" | "placement" | "endpoints" | "length" | "direction" | "curvature" | "empty" | "unavailable";
export type HandwritingScoreReliability = "high" | "medium" | "low";
export type HandwritingGradingOptions = {
  resamplePoints?: number;
  minPointDistance?: number;
  smoothing?: number;
  sizeTolerance?: number;
};
export type HandwritingPerStrokeScore = {
  index: number;
  shape: number;
  endpoints: number;
  length: number;
  direction: number;
  curvature: number;
  score: number;
};
export type HandwritingGrade = {
  score: number;
  scoreReliability: HandwritingScoreReliability;
  strokeCount: { user: number; reference: number; ratio: number; missing: number; extra: number };
  orderScore: number;
  placementScore: number;
  lengthIntegrity: number;
  perStroke: HandwritingPerStrokeScore[];
  feedbackCode: HandwritingFeedbackCode;
  feedbackStroke: number | null;
};
export function preprocessStrokes(strokes: HandwritingStroke[], options?: HandwritingGradingOptions): HandwritingStroke[];
export function gradeHandwriting(userStrokes: HandwritingStroke[], referenceStrokes: HandwritingStroke[], options?: HandwritingGradingOptions): HandwritingGrade;
