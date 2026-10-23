export const HANDWRITING_PROMPT_VERSION:string;
export type HandwritingPromptKind="meaning"|"reading"|"vocabulary"|"context"|"production";
export type HandwritingPrompt={kind:HandwritingPromptKind;cue:string;secondary?:string};
export function deriveHandwritingPrompt(exercise?:{mode?:string;prompt?:string;character?:string;stimulus?:{kind?:string;primary?:string;secondary?:string;translation?:string}}):HandwritingPrompt;
