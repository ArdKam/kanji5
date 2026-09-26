export const HANDWRITING_FEEDBACK_FOCUS_VERSION: string;
export type HandwritingFeedbackFocusKind="endpoints"|"direction"|"length"|"curvature"|"shape"|"general";
export function feedbackStrokeIndex(grade?: {feedbackStroke?: number|null}): number;
export function feedbackFocusKind(code?: string): HandwritingFeedbackFocusKind;
export function feedbackMarkerPoints(stroke?: Array<{x:number;y:number}>): {start:{x:number;y:number};end:{x:number;y:number};ahead:{x:number;y:number}}|null;
