export const HANDWRITING_FEEDBACK_FOCUS_VERSION="1.0.0";
export function feedbackStrokeIndex(grade={}){const n=Number(grade?.feedbackStroke);return Number.isInteger(n)&&n>0?n-1:-1;}
export function feedbackFocusKind(code){switch(String(code||"")){case "endpoints":return"endpoints";case "direction":return"direction";case "length":return"length";case "curvature":return"curvature";case "shape":return"shape";default:return"general";}}
export function feedbackMarkerPoints(stroke=[]){if(!Array.isArray(stroke)||stroke.length<2)return null;const start=stroke[0],end=stroke[stroke.length-1],ahead=stroke[Math.min(8,stroke.length-1)];return {start:{x:Number(start.x),y:Number(start.y)},end:{x:Number(end.x),y:Number(end.y)},ahead:{x:Number(ahead.x),y:Number(ahead.y)}};}
