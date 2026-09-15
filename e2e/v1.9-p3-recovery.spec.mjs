import {test,expect} from '@playwright/test';
async function cleanStart(page){await page.goto('/');await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);sessionStorage.clear()});await page.reload();await expect(page.locator('#app')).toBeVisible({timeout:20000});await expect(page.locator('#v16Start')).toBeVisible()}
async function seedReviewedCard(page){await page.locator('#revealBtn').click();await expect(page.locator('#ratings')).toHaveClass(/show/);await page.locator('.rate[data-r="Good"]').click();await expect(page.locator('#revealBtn')).toBeVisible()}
async function startReview(page){await page.locator('#v16Start').click();await expect(page.locator('#v16FinishExternal')).toBeVisible();await page.locator('#v16DashboardToggle').click();await expect(page.locator('#v16Session')).toBeVisible()}
async function forceMeaning(page){await page.evaluate(async()=>{await import('./v1.6-session-feedback.js');window.__KANJI5_V16_SESSION_AUTH__={nextMode:()=> 'meaning',consumeMode:()=>{}}})}
async function targetMeaning(page){return page.evaluate(()=>{const raw=localStorage.getItem('kanji5-deck');const deck=raw?JSON.parse(raw):[];const cards=JSON.parse(localStorage.getItem('kanji5-v1-cards')||'{}');const ids=new Set(Object.keys(cards));const item=deck.find(x=>x?.id&&ids.has(x.id));return item?.meaning?.[0]||''})}

test('wrong answer offers one bounded retry and successful retry records recovery',async({page})=>{
 await cleanStart(page);await seedReviewedCard(page);await startReview(page);await forceMeaning(page);await page.locator('[data-tab="education"]').click();const pane=page.locator('#v14EducationPane');await expect(pane.locator('#v14EduInput')).toBeVisible({timeout:10000});
 const answer=await targetMeaning(page);expect(answer).toBeTruthy();
 await pane.locator('#v14EduInput').fill('definitely-wrong');await pane.locator('#v14EduSubmit').click();await expect(pane).toContainText('پاسخ نادرست بود');await expect(pane.locator('#v19RecoveryFeedback')).toBeVisible();await expect(pane.locator('#v19RetryBtn')).toBeVisible();
 const before=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('v19RecoveryState')||'null'));expect(before?.state).toBe('pending_retry');expect(before?.retryCount).toBe(0);
 await pane.locator('#v19RetryBtn').click();await expect(pane.locator('#v14EduInput')).toBeVisible({timeout:10000});
 const retrying=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('v19RecoveryState')||'null'));expect(retrying?.state).toBe('retrying');expect(retrying?.retryCount).toBe(1);
 await pane.locator('#v14EduInput').fill(answer);await pane.locator('#v14EduSubmit').click();await expect(pane).toContainText('پاسخ درست بود');
 const final=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('v19RecoveryState')||'null'));expect(final?.state).toBe('recovered');expect(final?.recovered).toBe(true);expect(final?.retryCount).toBe(1);
});

test('recovery state survives reload before retry',async({page})=>{
 await cleanStart(page);await seedReviewedCard(page);await startReview(page);await forceMeaning(page);await page.locator('[data-tab="education"]').click();const pane=page.locator('#v14EducationPane');await expect(pane.locator('#v14EduInput')).toBeVisible({timeout:10000});await pane.locator('#v14EduInput').fill('wrong');await pane.locator('#v14EduSubmit').click();await expect(pane.locator('#v19RetryBtn')).toBeVisible();
 await page.reload();await expect(page.locator('#app')).toBeVisible({timeout:20000});await page.locator('#v16DashboardToggle').click();await page.locator('[data-tab="education"]').click();await expect(page.locator('#v14EducationPane')).toBeVisible();
 const persisted=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('v19RecoveryState')||'null'));expect(persisted?.state).toBe('pending_retry');expect(persisted?.retryCount).toBe(0);
});
