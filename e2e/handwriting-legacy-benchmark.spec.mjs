import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const FIXTURE = JSON.parse(await readFile(new URL("./fixtures/handwriting-kanjivg.json", import.meta.url), "utf8"));

function legacyScoreSource(source) {
  const match = source.match(/function drawUserStrokes[\s\S]*?\n}\n\nexport function HandwritingPractice/);
  if (!match) throw new Error("Current HandwritingPractice.tsx legacy scorer was not found.");
  return match[0]
    .replace(/\n\nexport function HandwritingPractice[\s\S]*$/, "")
    .replace(/: [A-Za-z_$][A-Za-z0-9_$<>\[\].]*/g, "");
}

async function sampleReferenceStrokes(page, paths) {
  return page.evaluate((pathRows) => {
    const NS="http://www.w3.org/2000/svg";
    const holder=document.createElement("div"), svg=document.createElementNS(NS,"svg");
    holder.style.cssText="position:absolute;left:-10000px;top:-10000px;width:109px;height:109px;visibility:hidden";
    svg.setAttribute("viewBox","0 0 109 109"); holder.appendChild(svg); document.body.appendChild(holder);
    try {
      return [...pathRows].sort((a,b)=>a.strokeNumber-b.strokeNumber).map(row=>{
        const path=document.createElementNS(NS,"path"); path.setAttribute("d",row.d); svg.appendChild(path);
        const total=path.getTotalLength(), count=48;
        const points=Array.from({length:count},(_,i)=>{const p=path.getPointAtLength((total*i)/Math.max(1,count-1));return {x:p.x,y:p.y};});
        path.remove(); return {strokeNumber:row.strokeNumber,d:row.d,points};
      });
    } finally { holder.remove(); }
  }, paths);
}

function transform(strokes,fn){return strokes.map(stroke=>stroke.map(fn));}
function perturbShape(strokes){return strokes.map((stroke,index)=>stroke.map((point,i)=>{
  if(index!==3||i<10||i>37)return point;
  const phase=(i-10)/27;
  return {x:point.x+16*Math.sin(phase*Math.PI),y:point.y-10*Math.sin(phase*Math.PI)};
}));}

async function legacyEvaluate(page,source,userStrokes,referencePaths){
  return page.evaluate(({source,userStrokes,referencePaths})=>{
    const fn=new Function(source+"\nreturn scoreDrawing;")();
    return fn(userStrokes,referencePaths,220);
  },{source,userStrokes,referencePaths});
}

test.setTimeout(30000);

test("legacy handwriting grader exposes the current scoring defects",async({page})=>{
  const source=legacyScoreSource(await readFile(new URL("../frontend/src/app/HandwritingPractice.tsx",import.meta.url),"utf8"));
  const reference=await sampleReferenceStrokes(page,FIXTURE.characters["学"].paths);
  expect(reference).toHaveLength(8);
  const base=reference.map(row=>row.points);
  const score=(strokes)=>legacyEvaluate(page,source,strokes,reference);

  const perfect=await score(base);
  const translated=await score(transform(base,p=>({x:p.x+3,y:p.y+2})));
  const scaled=await score(transform(base,p=>({x:54.5+(p.x-54.5)*0.94,y:54.5+(p.y-54.5)*0.94})));
  const reversedOrder=await score([...base].reverse());
  const missing=await score(base.slice(0,-1));
  const extra=await score(base.concat([[{x:92,y:92},{x:98,y:98}]]));
  const wrongShape=await score(perturbShape(base));
  const person=await sampleReferenceStrokes(page,FIXTURE.characters["人"].paths);
  const wrongKanji=await legacyEvaluate(page,source,person.map(row=>row.points),reference);

  const thickness=(lineWidth)=>page.evaluate(({reference,base,lineWidth})=>{
    const size=220,target=document.createElement("canvas"),user=document.createElement("canvas");
    target.width=target.height=user.width=user.height=size;
    const tc=target.getContext("2d"),uc=user.getContext("2d"),scale=size/109;
    tc.fillStyle="#1c1a17";tc.save();tc.scale(scale,scale);for(const path of reference)tc.fill(new Path2D(path.d));tc.restore();
    uc.save();uc.scale(scale,scale);uc.strokeStyle="#1c1a17";uc.lineWidth=lineWidth;uc.lineCap="round";uc.lineJoin="round";
    for(const s of base){uc.beginPath();uc.moveTo(s.points[0].x,s.points[0].y);for(let i=1;i<s.points.length;i++)uc.lineTo(s.points[i].x,s.points[i].y);uc.stroke();}uc.restore();
    const a=tc.getImageData(0,0,size,size).data,b=uc.getImageData(0,0,size,size).data;let t=0,u=0,i=0;
    for(let p=3;p<a.length;p+=4){const x=a[p]>20,y=b[p]>20;if(x)t++;if(y)u++;if(x&&y)i++;}
    if(!t||!u||!i)return 0;
    return Math.round((((2*i)/(t+u))*.82+(Math.min(base.length,reference.length)/Math.max(base.length,reference.length))*.18)*100);
  },{reference,base,lineWidth});
  const thin=await thickness(4),thick=await thickness(16);

  console.log(JSON.stringify({grader:"legacy-v1",character:"学",perfect,translated,scaled,reversedOrder,missing,extra,wrongShape,wrongKanji,thin,thick},null,2));
  expect(perfect).toBeLessThan(80);
  expect(reversedOrder).toBe(perfect);
  expect(missing).toBeLessThan(perfect);
  expect(extra).toBeLessThan(perfect);
});