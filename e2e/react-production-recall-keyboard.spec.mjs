import { test, expect } from "@playwright/test";

async function clean(page){
  await page.goto("/");
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage)) if(key.startsWith("kanji5-")) localStorage.removeItem(key);
    sessionStorage.clear();localStorage.setItem('kanji5-onboarding-v2','complete');
  });
  await page.reload();
  await expect(page.locator("#root .app-shell")).toBeVisible({timeout:20000});
}

async function seedSeenCard(page){
  await expect(page.locator("#root .learning-card")).toBeVisible({timeout:10000});
  await page.locator("#root .learning-card .button.wide").click();
  await expect(page.locator("#root .learning-card .rating-good")).toBeVisible({timeout:5000});
  await page.locator("#root .learning-card .rating-good").click();
  await expect(page.locator("#root .learning-card")).toBeVisible({timeout:10000});
}

async function startProductionExercise(page){
  const character=(await page.locator("#root .learning-card .kanji-display").textContent()).trim();
  await page.evaluate(({character})=>{
    window.__KANJI5_V19_RECOVERY_TARGET__={character,mode:"production",contentId:character};
  },{character});
  await page.getByRole("button",{name:"تمرین"}).click();
  await expect(page.locator("#root .practice-home")).toBeVisible({timeout:5000});
  await page.getByRole("button",{name:"شروع تمرین",exact:true}).click();
  await expect(page.locator("#root #exercise .production-recall")).toBeVisible({timeout:15000});
}

test("Production Recall Space reveals the answer only from the exercise surface",async({page})=>{
  for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    await clean(page);
    await seedSeenCard(page);
    await startProductionExercise(page);

    const exercise=page.locator("#root #exercise");
    await expect(exercise.locator("kbd")).toHaveText("Space");
    await page.evaluate(()=>window.scrollTo({top:Math.min(160,document.documentElement.scrollHeight),behavior:"auto"}));
    const scrollBefore=await page.evaluate(()=>window.scrollY);
    await exercise.evaluate(el=>el.focus({preventScroll:true}));
    await page.keyboard.press("Space");

    await expect.poll(async()=>page.evaluate(()=>window.scrollY)).toBe(scrollBefore);

    await expect(exercise.locator(".production-recall-revealed")).toBeVisible();
    await expect(exercise.getByRole("button",{name:"بلد بودم"})).toBeVisible();
    await expect(exercise.getByRole("button",{name:"نمی‌دانستم"})).toBeVisible();

    await page.keyboard.press("Space");
    await expect(exercise.locator(".production-recall-revealed")).toHaveCount(1);
    await expect(exercise.locator(".production-recall")).toHaveCount(1);
  }
});

test("Production Recall Space does not hijack focused native controls",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await clean(page);
  await seedSeenCard(page);
  await startProductionExercise(page);

  const exercise=page.locator("#root #exercise");
  const optionsHint=exercise.getByRole("button",{name:"کمک: نمایش گزینه‌ها"});
  await expect(optionsHint).toBeVisible();
  await optionsHint.focus();
  await page.keyboard.press("Space");
  await expect(exercise.locator(".production-recall-revealed")).toHaveCount(0);
  await expect(exercise.locator(".production-grid .active-recall-choice")).toHaveCount(4);
});

test("Production Recall Space is ignored from focused text fields",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await clean(page);
  await seedSeenCard(page);
  await startProductionExercise(page);

  const exercise=page.locator("#root #exercise");
  for(const tag of ["input","textarea"]){
    const field=exercise.locator(tag+'[data-kanji5-test="shortcut-guard"]');
    await exercise.evaluate((el,fieldTag)=>{
      const field=document.createElement(fieldTag);
      field.setAttribute("data-kanji5-test","shortcut-guard");
      field.setAttribute("aria-label","test shortcut guard");
      el.appendChild(field);
    },tag);
    await field.focus();
    await page.keyboard.press("Space");
    await expect(exercise.locator(".production-recall-revealed")).toHaveCount(0);
    await expect(field).toBeFocused();
    await field.evaluate(el=>el.remove());
  }
});

test("Production Recall 1/2 grade keys invoke the visible self-report controls",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await clean(page);
  await seedSeenCard(page);
  await startProductionExercise(page);

  const exercise=page.locator("#root #exercise");
  await page.evaluate(()=>{
    const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
    if(!boundary)throw new Error("V2 boundary unavailable");
    boundary.selfReportProduction=async knewIt=>({correct:knewIt,outcome:knewIt?"correct":"unknown"});
    boundary.nextExercise=async()=>{};
  });

  await page.keyboard.press("Space");
  await expect(exercise.locator(".production-recall-revealed")).toBeVisible();
  await page.keyboard.press("1");
  await expect(exercise.locator(".active-recall-feedback")).toContainText("درست");
});
