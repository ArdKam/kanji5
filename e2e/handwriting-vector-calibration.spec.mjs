import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { gradeHandwriting } from "../frontend/src/app/handwriting-grader.js";

const FIXTURE=JSON.parse(await readFile(new URL("./fixtures/handwriting-kanjivg.json",import.meta.url),"utf8"));

async function sampleReferenceStrokes(page,paths){
  return page.evaluate(pathRows=>{
    const NS="http://www.w3.org/2000/svg";
    const holder=document.createElement("div");
    const svg=document.createElementNS(NS,"svg");
    holder.style.cssText="position:absolute;left:-10000px;top:-10000px;width:109px;height:109px;visibility:hidden";
    svg.setAttribute("viewBox","0 0 109 109");
    holder.appendChild(svg);document.body.appendChild(holder);
    try{
      return [...pathRows].sort((a,b)=>a.strokeNumber-b.strokeNumber).map(row=>{
        const path=document.createElementNS(NS,"path");
        path.setAttribute("d",row.d);svg.appendChild(path);
        const total=path.getTotalLength(),count=48;
        const points=Array.from({length:count},(_,i)=>{
          const p=path.getPointAtLength((total*i)/Math.max(1,count-1));
          return {x:p.x,y:p.y};
        });
        path.remove();
        return points;
      });
    }finally{holder.remove();}
  },paths);
}

function translate(strokes,dx,dy){return strokes.map(stroke=>stroke.map(p=>({x:p.x+dx,y:p.y+dy})))}
function scale(strokes,factor,cx=54.5,cy=54.5){return strokes.map(stroke=>stroke.map(p=>({x:cx+(p.x-cx)*factor,y:cy+(p.y-cy)*factor})))}
function jitter(strokes){return strokes.map((stroke,si)=>stroke.map((p,i)=>({x:p.x+(((i+si)%5)-2)*0.45,y:p.y+(((i+2*si)%4)-1.5)*0.35})))}
function reverseOrder(strokes){return [...strokes].reverse()}
function reverseDirection(strokes){return strokes.map(stroke=>[...stroke].reverse())}
function perturb(strokes){return strokes.map((stroke,si)=>stroke.map((p,i)=>{
  if(si!==3||i<8||i>40)return p;
  const t=(i-8)/32;
  const bump=Math.sin(t*Math.PI);
  return {x:p.x+18*bump,y:p.y-12*bump};
}))}
function grossShape(strokes){
  return strokes.map((stroke,si)=>stroke.map(p=>{
    if(si!==2)return p;
    return {x:109-p.y*0.20,y:p.x*0.15+28};
  }));
}

test.setTimeout(30000);

test("vector grader calibration remains deterministic across meaningful handwriting cases",async({page})=>{
  const school=await sampleReferenceStrokes(page,FIXTURE.characters["学"].paths);
  const person=await sampleReferenceStrokes(page,FIXTURE.characters["人"].paths);
  const day=await sampleReferenceStrokes(page,FIXTURE.characters["日"].paths);
  const month=await sampleReferenceStrokes(page,FIXTURE.characters["月"].paths);
  const cases={
    perfect:gradeHandwriting(school,school),
    translated:gradeHandwriting(translate(school,3,2),school),
    scaled:gradeHandwriting(scale(school,0.94),school),
    jittered:gradeHandwriting(jitter(school),school),
    missingStroke:gradeHandwriting(school.slice(0,-1),school),
    extraStroke:gradeHandwriting([...school,[{x:92,y:92},{x:98,y:98}]],school),
    wrongOrder:gradeHandwriting(reverseOrder(school),school),
    swappedOrder:gradeHandwriting([school[1],school[0],...school.slice(2)],school),
    wrongDirection:gradeHandwriting(reverseDirection(school),school),
    wrongShape:gradeHandwriting(perturb(school),school),
    wrongKanji:gradeHandwriting(person,school),
    wrongSameCountKanji:gradeHandwriting(day,month),
    grossTranslation:gradeHandwriting(translate(school,25,25),school),
    largeScale:gradeHandwriting(scale(school,1.45),school),
    grossShape:gradeHandwriting(grossShape(school),school),
  };
  const report=Object.fromEntries(Object.entries(cases).map(([name,result])=>[name,{
    score:result.overallSimilarity,
    order:result.orderScore,
    placement:result.placementScore,
    reliability:result.scoreReliability,
    feedback:result.feedbackCode,
    stroke:result.feedbackStroke
  }]));
  console.log(JSON.stringify({grader:"vector-2.0.0",character:"学",...report},null,2));

  expect(cases.perfect.overallSimilarity).toBeGreaterThanOrEqual(98);
  expect(cases.translated.overallSimilarity).toBeGreaterThanOrEqual(85);
  expect(cases.scaled.overallSimilarity).toBeGreaterThanOrEqual(85);
  expect(cases.jittered.overallSimilarity).toBeGreaterThanOrEqual(85);
  expect(cases.missingStroke.overallSimilarity).toBeLessThan(90);
  expect(cases.extraStroke.overallSimilarity).toBeLessThan(90);
  expect(cases.wrongOrder.overallSimilarity).toBeLessThan(75);
  expect(cases.wrongOrder.orderScore).toBeLessThan(0.70);
  expect(cases.swappedOrder.overallSimilarity).toBeLessThan(82);
  expect(cases.swappedOrder.orderScore).toBeLessThan(0.80);
  expect(cases.wrongDirection.overallSimilarity).toBeLessThan(80);
  expect(cases.wrongShape.overallSimilarity).toBeLessThan(75);
  expect(cases.grossShape.overallSimilarity).toBeLessThan(65);
  expect(cases.wrongKanji.overallSimilarity).toBeLessThan(45);
  expect(cases.wrongSameCountKanji.overallSimilarity).toBeLessThan(55);
  expect(cases.grossTranslation.overallSimilarity).toBeLessThan(75);
  expect(cases.largeScale.overallSimilarity).toBeLessThan(85);
});