import assert from "node:assert/strict";
import { HANDWRITING_GRADER_VERSION, gradeHandwriting, preprocessStrokes } from "../frontend/src/app/handwriting-grader.js";

assert.equal(HANDWRITING_GRADER_VERSION, "2.0.0");

const point=(x,y)=>({x,y});
const line=(x1,y1,x2,y2,n=32)=>Array.from({length:n},(_,i)=>{
  const t=i/(n-1);
  return point(x1+(x2-x1)*t,y1+(y2-y1)*t);
});
const reference=[
  line(18,18,52,18),
  line(52,18,52,46),
  line(18,46,52,46),
  line(18,70,52,70),
];
const grade=(strokes)=>gradeHandwriting(strokes,reference);

const perfect=grade(reference);
assert.equal(perfect.overallSimilarity,100);
assert.equal(perfect.strokeCount.ratio,1);
assert.equal(perfect.scoreReliability,"high");
assert.equal(perfect.perStroke.length,reference.length);
assert.ok(perfect.perStroke.every(row=>row.similarity>0.99));

const translated=grade(reference.map(s=>s.map(p=>point(p.x+3,p.y+2))));
assert.ok(translated.overallSimilarity>=90, `small translation should remain high: ${translated.overallSimilarity}`);

const scaled=grade(reference.map(s=>s.map(p=>point(54.5+(p.x-54.5)*0.94,54.5+(p.y-54.5)*0.94))));
assert.ok(scaled.overallSimilarity>=88, `small scale change should remain high: ${scaled.overallSimilarity}`);

const mediumTranslation=grade(reference.map(s=>s.map(p=>point(p.x+8,p.y+8))));
assert.ok(mediumTranslation.overallSimilarity>=75 && mediumTranslation.overallSimilarity<translated.overallSimilarity);

const grossTranslation=grade(reference.map(s=>s.map(p=>point(p.x+25,p.y+25))));
assert.ok(grossTranslation.overallSimilarity<75, `gross displacement must be visible: ${grossTranslation.overallSimilarity}`);

const missing=grade(reference.slice(0,-1));
assert.ok(missing.overallSimilarity<85, `missing stroke should be materially penalized: ${missing.overallSimilarity}`);
assert.equal(missing.strokeCount.missing,1);

const extra=grade(reference.concat([line(78,78,92,92)]));
assert.ok(extra.overallSimilarity<85, `extra stroke should be materially penalized: ${extra.overallSimilarity}`);
assert.equal(extra.strokeCount.extra,1);

const reversedOrder=grade([...reference].reverse());
assert.ok(reversedOrder.overallSimilarity<70, `reversed order should be materially penalized: ${reversedOrder.overallSimilarity}`);
assert.ok(reversedOrder.orderScore<0.70);

const reversedDirection=grade(reference.map(s=>[...s].reverse()));
assert.ok(reversedDirection.overallSimilarity<80, `reversed stroke direction should be penalized: ${reversedDirection.overallSimilarity}`);

const wrongShape=grade([
  line(12,12,88,12),
  line(52,18,52,20),
  line(18,46,52,18),
  line(82,4,94,40),
]);
assert.ok(wrongShape.overallSimilarity<75, `obvious shape error should be low: ${wrongShape.overallSimilarity}`);

const wrongKanji=grade([
  line(68,12,68,38),
  line(54,32,82,32),
]);
assert.ok(wrongKanji.overallSimilarity<45, `wrong character must not score well: ${wrongKanji.overallSimilarity}`);

const veryIncomplete=grade([reference[0]]);
assert.ok(veryIncomplete.overallSimilarity<40);

const noisy=grade(reference.map((s,si)=>s.map((p,i)=>point(
  p.x+((i+si)%3===0?0.8:-0.4),
  p.y+((i+si)%4===0?0.6:-0.3),
))));
assert.ok(noisy.overallSimilarity>=85, `small jitter should remain high: ${noisy.overallSimilarity}`);

const shortStroke=grade([
  line(18,18,34,18),
  ...reference.slice(1),
]);
assert.ok(shortStroke.overallSimilarity<88, `short stroke should be visible: ${shortStroke.overallSimilarity}`);

const largeScale=grade(reference.map(s=>s.map(p=>point(
  54.5+(p.x-54.5)*1.45,
  54.5+(p.y-54.5)*1.45,
))));
assert.ok(largeScale.overallSimilarity<85, `large scale deviation should be visible: ${largeScale.overallSimilarity}`);

const rotated=grade(reference.map(s=>s.map(p=>point(
  54.5-(p.y-54.5),
  54.5+(p.x-54.5),
))));
assert.ok(rotated.overallSimilarity<70);

assert.equal(grade([]).feedbackCode,"empty");
assert.equal(grade([[point(10,10)]]).feedbackCode,"empty");
assert.equal(grade([[point(NaN,1),point(2,2)]]).feedbackCode,"empty");

const many=grade([line(18,18,52,18,1000),...reference.slice(1)]);
assert.ok(Number.isFinite(many.overallSimilarity));
assert.equal(many.strokeCount.user,reference.length);
assert.ok(preprocessStrokes([line(18,18,52,18,1000)])[0].length<=96);

console.log("Handwriting grader contract passed.");
