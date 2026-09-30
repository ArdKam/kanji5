import { test, expect } from "@playwright/test";

async function clean(page){
  await page.goto("/");
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage)) if(key.startsWith("kanji5-")) localStorage.removeItem(key);
    sessionStorage.clear();
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
  await page.getByRole("button",{name:"یادآوری فعال"}).click();
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
    await exercise.focus();
    await page.keyboard.press("Space");

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
  if(await optionsHint.count()){
    await optionsHint.focus();
    await page.keyboard.press("Space");
    await expect(exercise.locator(".production-recall-revealed")).toHaveCount(0);
    await expect(exercise.locator(".production-grid .active-recall-choice")).toHaveCount(4);
    return;
  }

  const injectedInput=exercise.locator('input[data-kanji5-test="shortcut-guard"]');
  await exercise.evaluate(el=>{
    const input=document.createElement("input");
    input.setAttribute("data-kanji5-test","shortcut-guard");
    input.type="text";
    input.value="";
    el.appendChild(input);
  });
  await injectedInput.focus();
  await page.keyboard.press("Space");
  await expect(exercise.locator(".production-recall-revealed")).toHaveCount(0);
  await expect(injectedInput).toBeFocused();
});
