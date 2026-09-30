import { test, expect } from "@playwright/test";
import { statSync } from "node:fs";

const profiles = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const artifactBudgets = [
  ["react-dist/kanji5-react.js", 650 * 1024],
  ["react-dist/kanji5-react.css", 220 * 1024],
];

test("performance artifact budgets", () => {
  for (const [path, budgetBytes] of artifactBudgets) {
    const sizeBytes = statSync(path).size;
    expect(
      sizeBytes,
      `${path} should remain under ${Math.round(budgetBytes / 1024)}KB (actual ${Math.round(sizeBytes / 1024)}KB)`
    ).toBeLessThanOrEqual(budgetBytes);
  }
});

for (const profile of profiles) {
  test(`performance baseline — ${profile.name}`, async ({ page }) => {
    await page.setViewportSize({ width: profile.width, height: profile.height });

    await page.addInitScript(() => {
      const metrics = {
        lcp: 0,
        fcp: 0,
        longTasks: [],
      };
      window.__KANJI5_PERF_BASELINE__ = metrics;

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) metrics.lcp = Math.max(metrics.lcp, entry.startTime);
        }).observe({ type: "largest-contentful-paint", buffered: true });
      } catch (_) {}

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) metrics.longTasks.push(entry.duration);
        }).observe({ type: "longtask", buffered: true });
      } catch (_) {}
    });

    const started = Date.now();
    await page.goto(`/?perf-baseline=${profile.name}-${started}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(750);

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const paints = performance.getEntriesByType("paint");
      const resources = performance.getEntriesByType("resource");

      const fcp = paints.find((entry) => entry.name === "first-contentful-paint")?.startTime ?? 0;
      const perf = window.__KANJI5_PERF_BASELINE__ ?? { lcp: 0, longTasks: [] };
      const appResources = resources
        .filter((entry) => /react-dist|react-entry|app-bootstrap|v1\.|vendor\//.test(entry.name))
        .reduce((sum, entry) => sum + Number(entry.transferSize || 0), 0);

      return {
        navigationMs: Number(navigation?.duration || 0),
        domContentLoadedMs: Number(navigation?.domContentLoadedEventEnd || 0),
        loadEventMs: Number(navigation?.loadEventEnd || 0),
        fcpMs: Number(fcp || perf.fcp || 0),
        lcpMs: Number(perf.lcp || 0),
        longTaskCount: perf.longTasks.length,
        longTaskTotalMs: perf.longTasks.reduce((sum, duration) => sum + duration, 0),
        longTaskMaxMs: perf.longTasks.reduce((max, duration) => Math.max(max, duration), 0),
        resourceCount: resources.length,
        appTransferKB: Math.round(appResources / 1024),
      };
    });

    expect(metrics.navigationMs).toBeGreaterThan(0);
    expect(metrics.navigationMs).toBeLessThan(20_000);

    console.log(
      [
        `PERF_BASELINE profile=${profile.name}`,
        `navigation=${metrics.navigationMs.toFixed(0)}ms`,
        `domContentLoaded=${metrics.domContentLoadedMs.toFixed(0)}ms`,
        `load=${metrics.loadEventMs.toFixed(0)}ms`,
        `FCP=${metrics.fcpMs.toFixed(0)}ms`,
        `LCP=${metrics.lcpMs.toFixed(0)}ms`,
        `longTasks=${metrics.longTaskCount}`,
        `longTaskTotal=${metrics.longTaskTotalMs.toFixed(0)}ms`,
        `longTaskMax=${metrics.longTaskMaxMs.toFixed(0)}ms`,
        `resources=${metrics.resourceCount}`,
        `appTransfer≈${metrics.appTransferKB}KB`,
      ].join(" ")
    );
  });
}
