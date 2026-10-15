import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

const kanjiVgUrl = character => {
  const codePoint = character.codePointAt(0);
  return "https://raw.githubusercontent.com/KanjiVG/kanjivg/422b5538595676da918c288a4230cb5e22a1ee7e/kanji/" +
    codePoint.toString(16).padStart(5, "0").toLowerCase() + ".svg";
};

test("Stroke Order component shows a truthful offline error and its retry recovers", async ({ page, context }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanji5-onboarding-v2", "complete");
    localStorage.setItem("kanji5-ui-language", "en");
  });
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const character = (await card.locator(".kanji-display").textContent())?.trim();
  if (!character) throw new Error("Active Kanji is missing");
  const svgUrl = kanjiVgUrl(character);
  await page.evaluate(async url => (await caches.open("kanji5-stroke-svg-v1")).delete(url), svgUrl);
  await context.setOffline(true);
  await page.reload();
  const offlineCard = page.locator("#root .learning-card");
  await expect(offlineCard).toBeVisible({ timeout: 20000 });
  await offlineCard.getByRole("button", { name: "Reveal meaning & readings" }).click();
  await expect(offlineCard).toHaveClass(/is-revealed/);
  await offlineCard.locator(".learning-back-page-shortcut").nth(3).click();
  const panel = card.locator(".learning-back-page.active .stroke-order-panel");
  await expect(panel.locator(".stroke-order-error")).toBeVisible({ timeout: 10000 });
  await expect(panel.locator(".stroke-order-error")).toContainText("not available right now.");
  const retry = panel.locator(".stroke-order-error").getByRole("button", { name: "Try again" });
  await expect(retry).toBeVisible();

  await context.setOffline(false);
  await retry.click();
  await expect(panel.locator(".stroke-order-stage")).toBeVisible({ timeout: 15000 });
  await expect(panel.locator(".stroke-order-error")).toHaveCount(0);
  await expect(panel.locator(".stroke-order-source")).toContainText("KanjiVG");
});

test("service worker keeps a used KanjiVG SVG available offline and reports an uncached SVG as unavailable", async ({ page, context }) => {
  const cachedUrl = kanjiVgUrl("学");
  const uncachedUrl = kanjiVgUrl("生");
  await page.addInitScript(() => {
    localStorage.setItem("kanji5-onboarding-v2", "complete");
    localStorage.setItem("kanji5-ui-language", "en");
  });
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  // Fetch through the active service worker while online; its own cache must retain the successful response.
  const firstOnline = await page.evaluate(async url => {
    const response = await fetch(url);
    return { status: response.status, text: await response.text() };
  }, cachedUrl);
  expect(firstOnline.status).toBe(200);
  expect(firstOnline.text).toContain("<svg");

  const cachedVocabularyUrl = "https://kanjiapi.dev/v1/words/学";
  const uncachedVocabularyUrl = "https://kanjiapi.dev/v1/words/語";
  await page.evaluate(url => caches.open("kanji5-api-v15").then(cache =>
    cache.put(url, new Response(JSON.stringify([{ variants: [{ written: "学校", pronounced: "がっこう" }], meanings: [{ glosses: ["school"] }] }]), {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Kanji5-Cache-Time": String(Date.now()) },
    }))
  ), cachedVocabularyUrl);

  await context.setOffline(true);
  const cachedVocabulary = await page.evaluate(async url => {
    const response = await fetch(url);
    return { status: response.status, offlineFallback: response.headers.get("X-Kanji5-Offline-Fallback"), json: await response.json() };
  }, cachedVocabularyUrl);
  expect(cachedVocabulary.status).toBe(200);
  expect(cachedVocabulary.offlineFallback).toBe("1");
  expect(cachedVocabulary.json[0].variants[0].written).toBe("学校");

  const missingVocabulary = await page.evaluate(async url => {
    const response = await fetch(url);
    return { status: response.status, offlineFallback: response.headers.get("X-Kanji5-Offline-Fallback"), json: await response.json() };
  }, uncachedVocabularyUrl);
  expect(missingVocabulary.status).toBe(503);
  expect(missingVocabulary.offlineFallback).toBe("1");

  const cached = await page.evaluate(async url => {
    const response = await fetch(url);
    return { status: response.status, text: await response.text() };
  }, cachedUrl);
  expect(cached.status).toBe(200);
  expect(cached.text).toContain('id="kvg:05b66-s1"');

  const missing = await page.evaluate(async url => {
    const response = await fetch(url);
    return { status: response.status, offlineFallback: response.headers.get("X-Kanji5-Offline-Fallback"), text: await response.text() };
  }, uncachedUrl);
  expect(missing.status).toBe(503);
  expect(missing.offlineFallback).toBe("1");
  expect(missing.text).toContain("not available offline");

  await context.setOffline(false);
  // Restore network, retry the same never-cached request and require the actual upstream fetch to succeed.
  const recovered = await page.evaluate(async url => {
    const response = await fetch(url);
    return { status: response.status, text: await response.text() };
  }, uncachedUrl);
  expect(recovered.status).toBe(200);
  expect(recovered.text).toContain("<path");
  await expect.poll(() => page.evaluate(async url => (await caches.open("kanji5-stroke-svg-v1")).match(url).then(Boolean)), { timeout: 5000 }).toBe(true);
});
