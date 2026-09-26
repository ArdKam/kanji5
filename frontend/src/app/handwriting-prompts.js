/** Pure adapter from an existing learning exercise to a handwriting production prompt. */
export const HANDWRITING_PROMPT_VERSION="1.0.0";
const clean=value=>String(value??"").trim();
const cue=exercise=>clean(exercise?.stimulus?.primary)||clean(exercise?.prompt)||clean(exercise?.character);
export function deriveHandwritingPrompt(exercise={}){const mode=clean(exercise?.mode).toLowerCase(),kind=clean(exercise?.stimulus?.kind).toLowerCase();if(kind==="masked-vocabulary"||mode==="vocabulary")return Object.freeze({kind:"vocabulary",cue:cue(exercise),secondary:clean(exercise?.stimulus?.secondary)});if(kind==="masked-context"||mode==="context")return Object.freeze({kind:"context",cue:cue(exercise),secondary:clean(exercise?.stimulus?.translation)});if(mode==="reading")return Object.freeze({kind:"reading",cue:cue(exercise)});if(mode==="production")return Object.freeze({kind:"production",cue:cue(exercise)});return Object.freeze({kind:"meaning",cue:cue(exercise)});}
