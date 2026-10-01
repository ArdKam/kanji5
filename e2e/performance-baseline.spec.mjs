import { test, expect } from "@playwright/test";
import { readFileSync, statSync } from "node:fs";

const profiles = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const artifactBudgets = [
  ["react-dist/kanji5-react.js", 650 * 1024],
  ["react-dist/kanji5-react.css", 220 * 1024],
];

const startupBudgets = {
  fcpMs: 1200,
  lcpMs: 2000,
  cls: 0.25,
  longTaskTotalMs: 2500,
  longTaskMaxMs: 1000,
  appTransferKB: 2000,
  interactionMs: 500,
};

test("startup does not block on Supabase UMD", () => {
  const html = readFileSync("index.html", "utf8");
  expect(html).not.toContain("@supabase/supabase-js@2.57.4/dist/umd/supabase.js");
});

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
  test(`performance budget — ${profile.name}`, async ({ page }) => {
    await page.setViewportSize({ width: profile.width, height: profile.height });

    await page.addInitScript(() => {
      const metrics = {
        lcp: 0,
        cls: 0,
        fcp: 0,
        longTasks: [],
      };
      window.__KANJI5_PERF_BASELINE__ = metrics;

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics.lcp = Math.max(metrics.lcp, entry.startTime);
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
      } catch (_) {}

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) metrics.cls += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      } catch (_) {}

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) metrics.longTasks.push(entry.duration);
        }).observe({ type: "longtask", buffered: true });
      } catch (_) {}
    });

    const started = Date.now();
    await page.goto(`/?perf-budget=${profile.name}-${started}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(750);

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const paints = performance.getEntriesByType("paint");
      const resources = performance.getEntriesByType("resource");

      const fcp = paints.find((entry) => entry.name === "first-contentful-paint")?.startTime ?? 0;
      const perf = window.__KANJI5_PERF_BASELINE__ ?? { lcp: 0, cls: 0, longTasks: [] };
      const appResources = resources
        .filter((entry) => /react-dist|react-entry|app-bootstrap|v1\.|vendor\//.test(entry.name))
        .reduce((sum, entry) => sum + Number(entry.transferSize || 0), 0);

      return {
        navigationMs: Number(navigation?.duration || 0),
        domContentLoadedMs: Number(navigation?.domContentLoadedEventEnd || 0),
        loadEventMs: Number(navigation?.loadEventEnd || 0),
        fcpMs: Number(fcp || perf.fcp || 0),
        lcpMs: Number(perf.lcp || 0),
        cls: Number(perf.cls || 0),
        longTaskCount: perf.longTasks.length,
        longTaskTotalMs: perf.longTasks.reduce((sum, duration) => sum + duration, 0),
        longTaskMaxMs: perf.longTasks.reduce((max, duration) => Math.max(max, duration), 0),
        resourceCount: resources.length,
        appTransferKB: Math.round(appResources / 1024),
      };
    });

    expect(metrics.navigationMs).toBeGreaterThan(0);
    expect(metrics.fcpMs, "FCP measurement was not captured").toBeGreaterThan(0);
    expect(metrics.lcpMs, "LCP measurement was not captured").toBeGreaterThan(0);

    expect(
      metrics.fcpMs,
      `FCP budget exceeded: ${metrics.fcpMs.toFixed(0)}ms > ${startupBudgets.fcpMs}ms`
    ).toBeLessThanOrEqual(startupBudgets.fcpMs);
    expect(
      metrics.lcpMs,
      `LCP budget exceeded: ${metrics.lcpMs.toFixed(0)}ms > ${startupBudgets.lcpMs}ms`
    ).toBeLessThanOrEqual(startupBudgets.lcpMs);
    expect(
      metrics.cls,
      `CLS budget exceeded: ${metrics.cls.toFixed(3)} > ${startupBudgets.cls}`
    ).toBeLessThanOrEqual(startupBudgets.cls);
    expect(
      metrics.longTaskTotalMs,
      `long-task budget exceeded: ${metrics.longTaskTotalMs.toFixed(0)}ms > ${startupBudgets.longTaskTotalMs}ms`
    ).toBeLessThanOrEqual(startupBudgets.longTaskTotalMs);
    expect(
      metrics.longTaskMaxMs,
      `max long-task budget exceeded: ${metrics.longTaskMaxMs.toFixed(0)}ms > ${startupBudgets.longTaskMaxMs}ms`
    ).toBeLessThanOrEqual(startupBudgets.longTaskMaxMs);
    expect(
      metrics.appTransferKB,
      `application transfer budget exceeded: ${metrics.appTransferKB}KB > ${startupBudgets.appTransferKB}KB`
    ).toBeLessThanOrEqual(startupBudgets.appTransferKB);

    await page.evaluate(() => {
      window.__KANJI5_PERF_INTERACTION__ = { startedAt: 0, paintedAt: 0 };
      const button = document.querySelector(".header-menu-trigger");
      if (button) {
        button.addEventListener("click", () => {
          window.__KANJI5_PERF_INTERACTION__.startedAt = performance.now();
          requestAnimationFrame(() => {
            window.__KANJI5_PERF_INTERACTION__.paintedAt = performance.now();
          });
        }, { once: true });
      }
    });
    await page.getByRole("button", { name: "بیشتر", exact: true }).click();
    await expect(page.locator("#header-tools-menu")).toHaveClass(/open/);
    const interactionMs = await page.evaluate(() => {
      const value = window.__KANJI5_PERF_INTERACTION__;
      return value?.startedAt && value?.paintedAt ? value.paintedAt - value.startedAt : 0;
    });
    expect(interactionMs, "interaction timing was not captured").toBeGreaterThan(0);
    expect(
      interactionMs,
      `critical navigation interaction exceeded budget: ${interactionMs.toFixed(0)}ms > ${startupBudgets.interactionMs}ms`
    ).toBeLessThanOrEqual(startupBudgets.interactionMs);
    await page.getByRole("button", { name: "بیشتر", exact: true }).click();

    console.log(
      [
        `PERF_BUDGET profile=${profile.name}`,
        `navigation=${metrics.navigationMs.toFixed(0)}ms`,
        `domContentLoaded=${metrics.domContentLoadedMs.toFixed(0)}ms`,
        `load=${metrics.loadEventMs.toFixed(0)}ms`,
        `FCP=${metrics.fcpMs.toFixed(0)}ms/${startupBudgets.fcpMs}ms`,
        `LCP=${metrics.lcpMs.toFixed(0)}ms/${startupBudgets.lcpMs}ms`,
        `CLS=${metrics.cls.toFixed(3)}/${startupBudgets.cls}`,
        `longTasks=${metrics.longTaskCount}`,
        `longTaskTotal=${metrics.longTaskTotalMs.toFixed(0)}ms/${startupBudgets.longTaskTotalMs}ms`,
        `longTaskMax=${metrics.longTaskMaxMs.toFixed(0)}ms/${startupBudgets.longTaskMaxMs}ms`,
        `resources=${metrics.resourceCount}`,
        `appTransfer≈${metrics.appTransferKB}KB/${startupBudgets.appTransferKB}KB`,
        `interaction=${interactionMs.toFixed(0)}ms/${startupBudgets.interactionMs}ms`,
      ].join(" ")
    );
  });
}
