import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

const kanjiVgUrl = character => {
  const codePoint = character.codePointAt(0);
  return "https://raw.githubusercontent.com/KanjiVG/kanjivg/422b5538595676da918c288a4230cb5e22a1ee7e/kanji/" +
    codePoint.toString(16).padStart(5, "0").toLowerCase() + ".svg";
};

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

  await context.setOffline(true);
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
