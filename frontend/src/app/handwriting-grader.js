/** @typedef {{x:number,y:number}} Point */
/** @typedef {Point[]} Stroke */

export const HANDWRITING_GRADER_VERSION = "2.0.0";

const EPSILON = 1e-6;
const DEFAULTS = Object.freeze({
  resamplePoints: 48,
  minPointDistance: 0.35,
  smoothing: 0.10,
  maxScaleAdjustment: 0.18,
});

const clamp = (value, min=0, max=1) => Math.max(min, Math.min(max, value));
const distance = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);

function pathLength(stroke){
  let total=0;
  for(let i=1;i<stroke.length;i+=1) total += distance(stroke[i-1],stroke[i]);
  return total;
}

function cleanStroke(stroke,minDistance){
  if(!Array.isArray(stroke)) return [];
  const clean=[];
  for(const point of stroke){
    const x=Number(point?.x), y=Number(point?.y);
    if(!Number.isFinite(x)||!Number.isFinite(y)) continue;
    const next={x,y};
    if(!clean.length || distance(clean[clean.length-1],next)>=minDistance) clean.push(next);
  }
  return clean.length>=2 && pathLength(clean)>EPSILON ? clean : [];
}

function resampleStroke(stroke,count){
  if(stroke.length<2) return [];
  const total=pathLength(stroke);
  if(total<EPSILON) return [];
  const result=[{...stroke[0]}];
  let segmentIndex=1;
  let segmentStart=stroke[0];
  let traversed=0;
  for(let targetIndex=1;targetIndex<count-1;targetIndex+=1){
    const target=(total*targetIndex)/(count-1);
    while(segmentIndex<stroke.length){
      const next=stroke[segmentIndex];
      const segment=distance(segmentStart,next);
      if(traversed+segment>=target) break;
      traversed+=segment;
      segmentStart=next;
      segmentIndex+=1;
    }
    const end=stroke[Math.min(segmentIndex,stroke.length-1)];
    const segment=Math.max(EPSILON,distance(segmentStart,end));
    const t=clamp((target-traversed)/segment);
    result.push({
      x:segmentStart.x+(end.x-segmentStart.x)*t,
      y:segmentStart.y+(end.y-segmentStart.y)*t,
    });
  }
  result.push({...stroke[stroke.length-1]});
  return result;
}

function smoothStroke(stroke,amount){
  if(stroke.length<4 || amount<=0) return stroke.map(point=>({...point}));
  const result=stroke.map(point=>({...point}));
  for(let i=1;i<stroke.length-1;i+=1){
    result[i]={
      x:stroke[i].x*(1-amount)+(stroke[i-1].x+stroke[i+1].x)*amount/2,
      y:stroke[i].y*(1-amount)+(stroke[i-1].y+stroke[i+1].y)*amount/2,
    };
  }
  result[0]={...stroke[0]};
  result[result.length-1]={...stroke[stroke.length-1]};
  return result;
}

function prepare(strokes,options,applySmoothing){
  const settings={...DEFAULTS,...(options||{})};
  const count=Math.max(16,Math.min(96,Math.round(Number(settings.resamplePoints)||DEFAULTS.resamplePoints)));
  const minDistance=Math.max(0,Number(settings.minPointDistance)||0);
  const smoothing=clamp(Number(settings.smoothing)||0,0,0.24);
  return (Array.isArray(strokes)?strokes:[])
    .map(stroke=>cleanStroke(stroke,minDistance))
    .filter(stroke=>stroke.length>=2)
    .map(stroke=>resampleStroke(stroke,count))
    .map(stroke=>applySmoothing?smoothStroke(stroke,smoothing):stroke);
}

export function preprocessStrokes(strokes,options={}){
  return prepare(strokes,options,true);
}

function bounds(strokes){
  const points=strokes.flat();
  if(!points.length) return {minX:0,minY:0,maxX:0,maxY:0,width:0,height:0,cx:0,cy:0,diagonal:0};
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const point of points){
    minX=Math.min(minX,point.x);
    minY=Math.min(minY,point.y);
    maxX=Math.max(maxX,point.x);
    maxY=Math.max(maxY,point.y);
  }
  const width=Math.max(0,maxX-minX), height=Math.max(0,maxY-minY);
  return {minX,minY,maxX,maxY,width,height,cx:(minX+maxX)/2,cy:(minY+maxY)/2,diagonal:Math.hypot(width,height)};
}

function alignUserToReference(user,reference,maxScaleAdjustment){
  if(!user.length||!reference.length) return [];
  const ub=bounds(user), rb=bounds(reference);
  const userHeight=Math.max(ub.height,1), refHeight=Math.max(rb.height,1);
  const rawScale=refHeight/userHeight;
  const scale=clamp(rawScale,1-maxScaleAdjustment,1+maxScaleAdjustment);
  const tx=rb.cx-ub.cx*scale;
  const ty=rb.cy-ub.cy*scale;
  return user.map(stroke=>stroke.map(point=>({x:point.x*scale+tx,y:point.y*scale+ty})));
}

function directionVector(stroke,index){
  const next=stroke[index+1];
  const point=stroke[index];
  const dx=next.x-point.x, dy=next.y-point.y, length=Math.hypot(dx,dy);
  return length<EPSILON?null:{x:dx/length,y:dy/length};
}

function directionScore(user,reference){
  const coarseUser=resampleStroke(user,16), coarseReference=resampleStroke(reference,16);
  const count=Math.min(coarseUser.length,coarseReference.length)-1;
  if(count<=0) return 0.5;
  let total=0;
  for(let i=0;i<count;i+=1){
    const a=directionVector(coarseUser,i), b=directionVector(coarseReference,i);
    if(!a||!b) continue;
    total += clamp((a.x*b.x+a.y*b.y+1)/2);
  }
  return total/count;
}

function turningAngles(stroke){
  const out=[];
  for(let i=1;i<stroke.length-1;i+=1){
    const a=Math.atan2(stroke[i].y-stroke[i-1].y,stroke[i].x-stroke[i-1].x);
    const b=Math.atan2(stroke[i+1].y-stroke[i].y,stroke[i+1].x-stroke[i].x);
    let delta=b-a;
    while(delta>Math.PI) delta-=2*Math.PI;
    while(delta<-Math.PI) delta+=2*Math.PI;
    out.push(delta);
  }
  return out;
}

function curvatureScore(user,reference){
  const a=turningAngles(resampleStroke(user,16)), b=turningAngles(resampleStroke(reference,16));
  if(!a.length||!b.length) return 0.5;
  const count=Math.min(a.length,b.length);
  const tolerance=0.18;
  let error=0;
  for(let i=0;i<count;i+=1){
    const ai=a[Math.floor(i*a.length/count)], bi=b[Math.floor(i*b.length/count)];
    error += Math.max(0,Math.abs(ai-bi)-tolerance);
  }
  return clamp(1-(error/count)/1.45);
}

function nearestMean(source,target){
  if(!source.length||!target.length) return Infinity;
  let sum=0;
  for(const a of source){
    let best=Infinity;
    for(const b of target) best=Math.min(best,distance(a,b));
    sum+=best;
  }
  return sum/source.length;
}

function percentile(values,q){
  if(!values.length)return 0;
  const sorted=[...values].sort((a,b)=>a-b);
  const index=(sorted.length-1)*q;
  const lower=Math.floor(index),upper=Math.ceil(index);
  if(lower===upper)return sorted[lower];
  const weight=index-lower;
  return sorted[lower]+(sorted[upper]-sorted[lower])*weight;
}

function shapeScore(user,reference,diagonal){
  const count=Math.min(user.length,reference.length);
  if(!count) return 0;
  const errors=[];
  for(let i=0;i<count;i+=1)errors.push(distance(user[i],reference[i]));
  const indexed=errors.reduce((sum,value)=>sum+value,0)/count;
  const p90=percentile(errors,0.90);
  const chamfer=(nearestMean(user,reference)+nearestMean(reference,user))/2;
  const scale=Math.max(pathLength(reference)*0.35,diagonal*0.05,1);
  const error=(indexed*0.52+chamfer*0.26+p90*0.22)/scale;
  return Math.exp(-error*2.7);
}

function endpointScore(user,reference,diagonal){
  if(!user.length||!reference.length) return 0;
  const start=Math.exp(-(distance(user[0],reference[0])/Math.max(diagonal,1))*6);
  const end=Math.exp(-(distance(user[user.length-1],reference[reference.length-1])/Math.max(diagonal,1))*6);
  return (start+end)/2;
}

function effectiveStrokeLength(stroke){
  const lowFrequencyCount=Math.max(8,Math.min(10,Math.round(stroke.length/5)));
  const smoothed=resampleStroke(stroke,lowFrequencyCount);
  return Math.max(EPSILON,pathLength(smoothed));
}

function lengthScore(user,reference){
  const ul=effectiveStrokeLength(user), rl=effectiveStrokeLength(reference);
  return Math.exp(-Math.abs(Math.log(ul/rl))/0.30);
}

function centroid(stroke){
  if(!stroke.length) return {x:0,y:0};
  let x=0,y=0;
  for(const p of stroke){x+=p.x;y+=p.y;}
  return {x:x/stroke.length,y:y/stroke.length};
}

function orderScore(user,reference,diagonal){
  if(!user.length||!reference.length) return 0;
  if(user.length===1&&reference.length===1) return 1;
  const count=Math.min(user.length,reference.length);
  const maxIndex=Math.max(1,Math.max(user.length,reference.length)-1);
  const rows=[];
  for(let i=0;i<count;i+=1){
    let best=Infinity,bestIndex=0;
    for(let j=0;j<reference.length;j+=1){
      const shapeCost=1-shapeScore(user[i],reference[j],diagonal);
      const endpointCost=1-endpointScore(user[i],reference[j],diagonal);
      const lengthCost=1-lengthScore(user[i],reference[j]);
      const positionCost=Math.abs(i-j)/maxIndex*0.10;
      const cost=shapeCost*0.72+endpointCost*0.16+lengthCost*0.12+positionCost;
      if(cost<best){best=cost;bestIndex=j;}
    }
    const exact=bestIndex===i ? 1 : 0;
    const soft=Math.exp(-(Math.abs(i-bestIndex)/maxIndex)*8);
    rows.push(exact*0.75+soft*0.25);
  }
  return rows.reduce((a,b)=>a+b,0)/rows.length;
}

function placementScore(user,reference){
  const ub=bounds(user), rb=bounds(reference), diagonal=Math.max(rb.diagonal,1);
  const center=Math.hypot(ub.cx-rb.cx,ub.cy-rb.cy)/diagonal;
  const centerScore=Math.exp(-center*3.5);
  const widthRatio=Math.max(EPSILON,ub.width/Math.max(rb.width,1));
  const heightRatio=Math.max(EPSILON,ub.height/Math.max(rb.height,1));
  const sizeScore=(Math.exp(-Math.abs(Math.log(widthRatio))/0.24)+Math.exp(-Math.abs(Math.log(heightRatio))/0.24))/2;
  return clamp(centerScore*0.58+sizeScore*0.42);
}

function meaningfulLengthPenalty(user,reference){
  const ratio=effectiveStrokeLength(user)/effectiveStrokeLength(reference);
  const deviation=Math.abs(Math.log(ratio));
  const severity=clamp((deviation-0.08)/0.50);
  return { ratio, penalty: 1-0.35*severity };
}

function featureIssue(features){
  if(features.endpoints<0.60) return "endpoints";
  if(features.direction<0.62) return "direction";
  if(features.length<0.62) return "length";
  if(features.curvature<0.58) return "curvature";
  if(features.shape<0.62) return "shape";
  return "good";
}

export function gradeHandwriting(userStrokes,referenceStrokes,options={}){
  const settings={...DEFAULTS,...(options||{})};
  const user=prepare(userStrokes,settings,true);
  const reference=prepare(referenceStrokes,settings,false);

  if(!reference.length){
    return {
      overallSimilarity:0,
      scoreReliability:"low",
      strokeCount:{user:user.length,reference:0,ratio:0,missing:0,extra:user.length},
      orderScore:0,
      placementScore:0,
      perStroke:[],
      feedbackCode:"unavailable",
      feedbackStroke:null,
    };
  }
  if(!user.length){
    return {
      overallSimilarity:0,
      scoreReliability:"low",
      strokeCount:{user:0,reference:reference.length,ratio:0,missing:reference.length,extra:0},
      orderScore:0,
      placementScore:0,
      perStroke:[],
      feedbackCode:"empty",
      feedbackStroke:null,
    };
  }

  const diagonal=Math.max(bounds(reference).diagonal,1);
  const aligned=alignUserToReference(user,reference,Number(settings.maxScaleAdjustment)||DEFAULTS.maxScaleAdjustment);
  const matched=Math.min(aligned.length,reference.length);
  const perStroke=[];

  for(let i=0;i<matched;i+=1){
    const shape=shapeScore(aligned[i],reference[i],diagonal);
    const endpoints=endpointScore(aligned[i],reference[i],diagonal);
    const length=lengthScore(aligned[i],reference[i]);
    const direction=directionScore(aligned[i],reference[i]);
    const curvature=curvatureScore(aligned[i],reference[i]);
    const lengthInfo=meaningfulLengthPenalty(aligned[i],reference[i]);
    const baseSimilarity=clamp(
      shape*0.55+
      endpoints*0.15+
      length*0.10+
      direction*0.16+
      curvature*0.04
    );
    const similarity=clamp(baseSimilarity*lengthInfo.penalty);
    perStroke.push({
      strokeNumber:i+1,
      similarity,
      shape,
      endpoints,
      length,
      lengthRatio:lengthInfo.ratio,
      direction,
      curvature,
      feedbackCode:featureIssue({shape,endpoints,length,direction,curvature}),
    });
  }

  const average=perStroke.length?perStroke.reduce((sum,row)=>sum+row.similarity,0)/perStroke.length:0;
  const weakest=perStroke.length?Math.min(...perStroke.map(row=>row.similarity)):0;
  const strokeQuality=average*0.82+weakest*0.18;
  const ratio=matched/Math.max(aligned.length,reference.length);
  const countFactor=Math.pow(ratio,1.55);
  const order=orderScore(aligned,reference,diagonal);
  const placement=placementScore(user,reference);
  const raw=strokeQuality*0.75+order*0.10+placement*0.15;
  const placementFactor=0.25+0.75*placement;
  const similarity=Math.round(clamp(raw*countFactor*placementFactor)*100);
  const weakest=[...perStroke].sort((a,b)=>a.similarity-b.similarity)[0]||null;

  const feedbackCode =
    ratio<1 ? "stroke-count" :
    order<0.70 ? "stroke-order" :
    placement<0.58 ? "placement" :
    weakest?.feedbackCode==="good" ? (similarity>=85?"good":"improve") :
    weakest?.feedbackCode || (similarity>=85?"good":"improve");

  const rawPointCount=Array.isArray(userStrokes)?userStrokes.flat().length:0;
  const avgRawPoints=user.length?rawPointCount/user.length:0;
  const scoreReliability =
    avgRawPoints<3 ? "low" :
    user.length===reference.length ? "high" :
    ratio>=0.5 ? "medium" : "low";

  return {
    overallSimilarity:similarity,
    scoreReliability,
    strokeCount:{
      user:user.length,
      reference:reference.length,
      ratio,
      missing:Math.max(0,reference.length-user.length),
      extra:Math.max(0,user.length-reference.length),
    },
    orderScore:order,
    placementScore:placement,
    perStroke,
    feedbackCode,
    feedbackStroke:weakest?.strokeNumber??null,
  };
}
