import { parseStrokePaths, type StrokePath } from "./stroke-order-core";

export const HANDWRITING_REFERENCE_VERSION = "1.0.0";

export type SampledStrokePath = StrokePath & {
  points: Array<{x:number;y:number}>;
};

export function sampleSvgStrokePaths(svgText:string,pointsPerStroke=48):SampledStrokePath[]{
  if(typeof document==="undefined") throw new Error("SVG_REFERENCE_SAMPLING_REQUIRES_DOM");
  const NS="http://www.w3.org/2000/svg";
  const holder=document.createElement("div");
  const svg=document.createElementNS(NS,"svg");
  holder.style.cssText="position:absolute;left:-10000px;top:-10000px;width:109px;height:109px;visibility:hidden";
  svg.setAttribute("viewBox","0 0 109 109");
  holder.appendChild(svg);
  document.body.appendChild(holder);
  try{
    return parseStrokePaths(svgText).map(row=>{
      const path=document.createElementNS(NS,"path");
      path.setAttribute("d",row.d);
      svg.appendChild(path);
      const total=path.getTotalLength();
      const count=Math.max(16,Math.min(96,Math.round(pointsPerStroke)));
      const points=Array.from({length:count},(_,index)=>{
        const point=path.getPointAtLength((total*index)/Math.max(1,count-1));
        return {x:point.x,y:point.y};
      });
      path.remove();
      return {...row,points};
    });
  } finally {
    holder.remove();
  }
}
