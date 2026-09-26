import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const FIXTURE = JSON.parse(await readFile(new URL("./fixtures/handwriting-kanjivg.json", import.meta.url), "utf8"));

function legacyScoreSource() {
  return `
function drawUserStrokes(ctx,strokes,scale){
  ctx.save();
  ctx.scale(scale,scale);
  ctx.strokeStyle="#1c1a17";
  ctx.lineWidth=8;
  ctx.lineCap="round";
  ctx.lineJoin="round";
  for(const stroke of strokes){
    if(!stroke.length)continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x,stroke[0].y);
    for(let i=1;i<stroke.length;i++)ctx.lineTo(stroke[i].x,stroke[i].y);
    ctx.stroke();
  }
  ctx.restore();
}
function scoreDrawing(strokes,paths,size){
  if(!strokes.length||!paths.length)return 0;
  const target=document.createElement("canvas"),user=document.createElement("canvas");
  target.width=target.height=user.width=user.height=size;
  const targetCtx=target.getContext("2d"),userCtx=user.getContext("2d");
  if(!targetCtx||!userCtx)return 0;
  targetCtx.fillStyle="#1c1a17";
  const scale=size/109;
  targetCtx.save();
  targetCtx.scale(scale,scale);
  for(const path of paths)targetCtx.fill(new Path2D(path.d));
  targetCtx.restore();
  drawUserStrokes(userCtx,strokes,scale);
  const targetPixels=targetCtx.getImageData(0,0,size,size).data;
  const userPixels=userCtx.getImageData(0,0,size,size).data;
  let targetCount=0,userCount=0,intersection=0;
  for(let i=3;i<targetPixels.length;i+=4){
    const targetInk=targetPixels[i]>20,userInk=userPixels[i]>20;
    if(targetInk)targetCount++;
    if(userInk)userCount++;
    if(targetInk&&userInk)intersection++;
  }
  if(!targetCount||!userCount||!intersection)return 0;
  const overlapScore=2*intersection/(targetCount+userCount);
  const strokeRatio=Math.min(strokes.length,paths.length)/Math.max(strokes.length,paths.length);
  return Math.round((overlapScore*.82+strokeRatio*.18)*100);
}
`;
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
    for(const s of base){uc.beginPath();uc.moveTo(s[0].x,s[0].y);for(let i=1;i<s.length;i++)uc.lineTo(s[i].x,s[i].y);uc.stroke();}uc.restore();
    const a=tc.getImageData(0,0,size,size).data,b=uc.getImageData(0,0,size,size).data;let t=0,u=0,i=0;
    for(let p=3;p<a.length;p+=4){const x=a[p]>20,y=b[p]>20;if(x)t++;if(y)u++;if(x&&y)i++;}
    if(!t||!u||!i)return 0;
    return Math.round((((2*i)/(t+u))*.82+(Math.min(base.length,reference.length)/Math.max(base.length,reference.length))*.18)*100);
  },{reference,base,lineWidth});
  const thin=await thickness(4),thick=await thickness(16);

  console.log(JSON.stringify({grader:"legacy-v1",character:"学",perfect,translated,scaled,reversedOrder,missing,extra,wrongShape,wrongKanji,thin,thick},null,2));
  expect({perfect,translated,scaled,reversedOrder,missing,extra,wrongShape,wrongKanji,thin,thick}).toEqual({
    perfect:52,
    translated:50,
    scaled:56,
    reversedOrder:52,
    missing:50,
    extra:49,
    wrongShape:51,
    wrongKanji:17,
    thin:55,
    thick:43,
  });
});