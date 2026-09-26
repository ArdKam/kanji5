import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const FIXTURE=JSON.parse(await readFile(new URL("./fixtures/handwriting-kanjivg.json",import.meta.url),"utf8"));

function svgFor(character){
  const rows=FIXTURE.characters[character].paths;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 109 109"><g fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${rows.map(row=>`<path id="kvg:${FIXTURE.characters[character].codePoint}-s${row.strokeNumber}" d="${row.d}"/>`).join("")}</g></svg>`;
}

async function clean(page){
  await page.goto("/");
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith("kanji5-"))localStorage.removeItem(key);sessionStorage.clear();});
  await page.reload();
  await expect(page.locator("#root .app-shell")).toBeVisible({timeout:20000});
}

async function openSchoolHandwriting(page){
  await page.locator(".experience-nav .experience-tab").nth(2).click();
  await expect(page.locator(".dictionary-page")).toBeVisible({timeout:10000});
  const search=page.locator(".dictionary-page-search input");
  await search.fill("学");
  const tile=page.locator(".kanji-catalog-tile").filter({hasText:"学"}).first();
  await expect(tile).toBeVisible({timeout:10000});
  await tile.click();
  const dialog=page.locator(".dictionary-card-dialog");
  await expect(dialog).toBeVisible({timeout:10000});
  const handwriting=dialog.locator(".handwriting-practice");
  await expect(handwriting).toBeVisible();
  await handwriting.locator(".handwriting-header").click();
  await expect(handwriting.locator(".handwriting-ink-canvas")).toBeVisible({timeout:10000});
  return handwriting;
}

async function drawReference(page,canvas,strokes){
  const box=await canvas.boundingBox();
  if(!box)throw new Error("handwriting canvas has no bounding box");
  const toClient=p=>({x:Math.round(box.x+(Number(p.x)/109)*box.width),y:Math.round(box.y+(Number(p.y)/109)*box.height)});
  for(const stroke of strokes){
    const first=toClient(stroke[0]);
    if(!Number.isFinite(first.x)||!Number.isFinite(first.y))throw new Error(`Invalid first point: ${JSON.stringify(stroke[0])}`);
    await page.mouse.move(first.x,first.y);
    await page.mouse.down();
    for(let i=1;i<stroke.length;i+=1){
      const point=toClient(stroke[i]);
      if(!Number.isFinite(point.x)||!Number.isFinite(point.y))throw new Error(`Invalid point: ${JSON.stringify(stroke[i])}`);
      await page.mouse.move(point.x,point.y);
    }
    await page.mouse.up();
  }
}

test.setTimeout(45000);

test("handwriting UI captures and grades a complete reference trace",async({page})=>{
  await page.route("**/kanji/05b66.svg",route=>route.fulfill({
    status:200,
    contentType:"image/svg+xml",
    body:svgFor("学"),
  }));
  await clean(page);
  const handwriting=await openSchoolHandwriting(page);
  await expect(handwriting).toHaveAttribute("data-hint-level","0");
  await expect(handwriting).toHaveAttribute("data-hint-mode","trace");
  await expect(handwriting.getByRole("button",{name:"راهنمای بیشتر"})).toBeDisabled();
  const canvas=handwriting.locator(".handwriting-ink-canvas");
  await expect(handwriting.locator(".handwriting-guide-canvas")).toBeVisible();
  const penBox=await canvas.boundingBox();
  if(!penBox)throw new Error("handwriting canvas has no bounding box");
  const penX=penBox.x+penBox.width*0.4, penY=penBox.y+penBox.height*0.4;
  await canvas.dispatchEvent("pointerdown",{pointerId:73,pointerType:"pen",isPrimary:true,button:0,buttons:1,clientX:penX,clientY:penY});
  await canvas.dispatchEvent("pointermove",{pointerId:73,pointerType:"pen",isPrimary:true,button:-1,buttons:1,clientX:penX+12,clientY:penY+8});
  await canvas.dispatchEvent("pointerup",{pointerId:73,pointerType:"pen",isPrimary:true,button:0,buttons:0,clientX:penX+12,clientY:penY+8});
  await expect(handwriting.locator(".handwriting-actions .primary")).toBeEnabled();
  await handwriting.getByRole("button",{name:"پاک کردن",exact:true}).click();

  const reference=await page.evaluate(paths=>{
    const holder=document.createElement("div"),svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    holder.style.cssText="position:absolute;left:-10000px;top:-10000px;width:109px;height:109px;visibility:hidden";
    svg.setAttribute("viewBox","0 0 109 109");holder.appendChild(svg);document.body.appendChild(holder);
    try{
      return paths.map(row=>{
        const path=document.createElementNS("http://www.w3.org/2000/svg","path");
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
  },FIXTURE.characters["学"].paths);

  await drawReference(page,canvas,reference);
  await expect(handwriting.locator(".handwriting-actions .primary")).toBeEnabled();
  await handwriting.locator(".handwriting-actions .primary").click();
  const result=handwriting.locator(".handwriting-result");
  await expect(result).toBeVisible();
  const goodScore=Number(await result.getAttribute("data-score"));
  expect(goodScore).toBeGreaterThanOrEqual(95);
  await expect(handwriting).toHaveAttribute("data-feedback-stroke");
  await expect(result).toContainText("%");
  await expect(handwriting).toHaveAttribute("data-hint-level","1");
  await expect(handwriting).toHaveAttribute("data-hint-mode","ghost");
  await handwriting.getByRole("button",{name:"راهنمای بیشتر"}).click();
  await expect(handwriting).toHaveAttribute("data-hint-level","0");
  await expect(handwriting).toHaveAttribute("data-hint-mode","trace");

  await handwriting.getByRole("button",{name:"واگردانی آخرین حرکت",exact:true}).click();
  await expect(handwriting).toHaveAttribute("data-stroke-count",String(reference.length-1));
  await expect(result).toHaveCount(0);

  await handwriting.getByRole("button",{name:"پاک کردن",exact:true}).click();
  await expect(handwriting.locator(".handwriting-actions .primary")).toBeDisabled();

  const bad=reference.map((stroke,index)=>index===0?[...stroke].reverse():stroke);
  await drawReference(page,canvas,bad);
  await handwriting.locator(".handwriting-actions .primary").click();
  await expect(result).toBeVisible();
  const badScore=Number(await result.getAttribute("data-score"));
  expect(badScore).toBeLessThan(goodScore);
  expect(await result.getAttribute("data-feedback-code")).toBeTruthy();
  await expect(handwriting.locator(".handwriting-focus-copy")).toHaveCount(1);
});


test("handwriting UI gives reliable real-time stroke feedback",async({page})=>{
  await page.route("**/kanji/05b66.svg",route=>route.fulfill({
    status:200,
    contentType:"image/svg+xml",
    body:svgFor("学"),
  }));
  await clean(page);
  const handwriting=await openSchoolHandwriting(page);
  const canvas=handwriting.locator(".handwriting-ink-canvas");
  const box=await canvas.boundingBox();
  if(!box)throw new Error("handwriting canvas has no bounding box");
  const points=[
    {x:box.x+box.width*0.68,y:box.y+box.height*0.86},
    {x:box.x+box.width*0.82,y:box.y+box.height*0.68},
    {x:box.x+box.width*0.94,y:box.y+box.height*0.88},
    {x:box.x+box.width*0.74,y:box.y+box.height*0.58},
  ];
  await canvas.dispatchEvent("pointerdown",{pointerId:81,pointerType:"pen",isPrimary:true,button:0,buttons:1,clientX:points[0].x,clientY:points[0].y});
  for(let i=1;i<points.length;i+=1){
    const point=points[i];
    await canvas.dispatchEvent("pointermove",{pointerId:81,pointerType:"pen",isPrimary:true,button:-1,buttons:1,clientX:point.x,clientY:point.y});
  }
  const last=points[points.length-1];
  await canvas.dispatchEvent("pointerup",{pointerId:81,pointerType:"pen",isPrimary:true,button:0,buttons:0,clientX:last.x,clientY:last.y});
  await expect(handwriting).toHaveAttribute("data-stroke-count","1");
  await expect(handwriting).toHaveAttribute("data-live-feedback",/^(?!none$).+/);
  await expect(handwriting.locator(".handwriting-live-feedback")).toBeVisible();
  await expect(handwriting.locator(".handwriting-live-feedback")).toHaveAttribute("data-feedback-code",/endpoints|direction|shape|length|curvature/);
});

test("handwriting UI remains usable in English and reduced-motion mode",async({page})=>{
  await page.route("**/kanji/05b66.svg",route=>route.fulfill({
    status:200,
    contentType:"image/svg+xml",
    body:svgFor("学"),
  }));
  await clean(page);
  await page.getByRole("button",{name:"بیشتر",exact:true}).click();
  await page.locator("#header-tools-menu").getByRole("button",{name:"تنظیمات",exact:true}).click();
  const settings=page.getByRole("dialog");
  await settings.getByRole("button",{name:"English",exact:true}).click();
  await settings.getByRole("button",{name:"Close",exact:true}).last().click();
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.setViewportSize({width:390,height:844});
  const handwriting=await openSchoolHandwriting(page);
  const canvasBox=await handwriting.locator(".handwriting-canvas-wrap").boundingBox();
  expect(canvasBox?.width??999).toBeLessThanOrEqual(286);
  const actionBoxes=await handwriting.locator(".handwriting-actions .button").evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().height));
  expect(actionBoxes.every(height=>height>=42)).toBe(true);
  const help=handwriting.locator(".handwriting-help");
  await expect(help).toHaveText(/mouse|touch|stylus/i);
  await expect(handwriting.locator(".handwriting-ink-canvas")).toHaveAttribute("aria-label","Handwriting practice");
  await expect(handwriting.locator(".handwriting-ink-canvas")).toHaveAttribute("aria-describedby",/handwriting-help-/);
  await expect(handwriting.locator(".handwriting-guide-canvas")).toHaveAttribute("aria-hidden","true");
});

test("handwriting is an optional skill-building layer inside Practice",async({page})=>{
  await clean(page);
  await expect(page.locator(".practice-handwriting")).toHaveCount(0);
  await page.locator(".experience-nav .experience-tab").nth(1).click();
  await expect(page.locator("#exercise")).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.locator(".practice-handwriting").count()).toBeGreaterThan(0);
  const practiceHandwriting=page.locator(".practice-handwriting");
  await expect(practiceHandwriting).toHaveAttribute("data-experience","practice");
  await expect(practiceHandwriting).toHaveAttribute("data-character",/.+/);
  const session=await page.evaluate(()=>window.__KANJI5_V16_SESSION_API__?.getSession?.());
  expect(session?.experience).toBe("practice");
  await expect(practiceHandwriting.locator(".handwriting-header")).toBeVisible();
});
