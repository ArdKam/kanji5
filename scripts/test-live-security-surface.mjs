import { chromium } from "@playwright/test";

const BASE_URL = String(process.env.KANJI5_LIVE_URL || "https://ardkam.github.io/kanji5").replace(/\/+$/, "");
const FINDINGS = [];
const WARNINGS = [];

function pass(name, detail) {
  console.log("[PASS] " + name + (detail ? " — " + detail : ""));
}

function fail(name, severity, detail) {
  const finding = { name, severity, detail };
  FINDINGS.push(finding);
  console.log("[FAIL][" + severity + "] " + name + " — " + detail);
}

function warn(name, detail) {
  WARNINGS.push({ name, detail });
  console.log("[WARN] " + name + " — " + detail);
}

function record(name, condition, severity, successDetail, failureDetail) {
  if (condition) pass(name, successDetail);
  else fail(name, severity, failureDetail);
}

function policyHasFrameAncestors(policy) {
  return /(?:^|;)\s*frame-ancestors\s+(?:'none'|'self')(?:\s|;|$)/i.test(policy || "");
}

function parseCspMeta(html) {
  const tag = html.match(/<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i)?.[0] || "";
  return tag.match(/\bcontent="([^"]*)"/i)?.[1] || "";
}

function parseReferrerMeta(html) {
  const tag = html.match(/<meta\b[^>]*name=["']referrer["'][^>]*>/i)?.[0] || "";
  return tag.match(/\bcontent="([^"]*)"/i)?.[1] || "";
}

function getDirective(policy, name) {
  const directive = String(policy || "").split(";").map(value => value.trim()).find(value => value.toLowerCase().startsWith(name.toLowerCase() + " "));
  return directive ? directive.split(/\s+/).slice(1) : [];
}

async function fetchWithTimeout(url, options = {}) {
  return fetch(url, {
    ...options,
    signal: options.signal || AbortSignal.timeout(20000),
    redirect: options.redirect || "follow",
  });
}

async function auditHttpSurface() {
  console.log("\n=== HTTPS and response headers ===");
  let response;
  let html = "";
  try {
    response = await fetchWithTimeout(BASE_URL + "/?security_audit_probe=" + Date.now(), {
      headers: { "cache-control": "no-cache" },
    });
    html = await response.text();
  } catch (error) {
    fail("LIVE_HTTP_REACHABLE", "CRITICAL", "The deployed homepage could not be fetched from the audit runner: " + String(error?.message || error));
    return { html, headers: new Headers(), cspHeader: "", cspMeta: "" };
  }

  const finalUrl = new URL(response.url);
  record("HTTPS_FINAL_URL", finalUrl.protocol === "https:", "HIGH", finalUrl.origin, "The final homepage URL is not HTTPS: " + response.url);
  record("HOMEPAGE_HTTP_200", response.status === 200, "HIGH", "HTTP 200", "Unexpected homepage HTTP status: " + response.status);

  const headers = response.headers;
  const hsts = headers.get("strict-transport-security") || "";
  const hstsAge = Number(hsts.match(/max-age\s*=\s*(\d+)/i)?.[1] || 0);
  record("HSTS", hstsAge >= 31536000, "MEDIUM", hsts, hsts ? "HSTS max-age is below one year: " + hsts : "Strict-Transport-Security header is absent.");

  const cspHeader = headers.get("content-security-policy") || "";
  const cspMeta = parseCspMeta(html);
  record("CSP_POLICY_PRESENT", Boolean(cspHeader || cspMeta), "HIGH", cspHeader ? "HTTP response header present" : "Enforced CSP meta policy found in index.html", "No HTTP CSP header or CSP meta policy was found.");
  if (!cspHeader && cspMeta) warn("CSP_HTTP_HEADER", "The page has a meta CSP, but no HTTP CSP header. Meta CSP cannot enforce frame-ancestors and has fewer available directives.");
  else if (cspHeader) pass("CSP_HTTP_HEADER", "HTTP response header is present");

  const xfo = (headers.get("x-frame-options") || "").trim().toLowerCase();
  const frameAncestorPolicy = policyHasFrameAncestors(cspHeader);
  const clickjackingHeader = xfo === "deny" || xfo === "sameorigin" || frameAncestorPolicy;
  if (clickjackingHeader) pass("CLICKJACKING_RESPONSE_CONTROL", xfo ? "X-Frame-Options: " + xfo : "CSP frame-ancestors directive present");
  else warn("CLICKJACKING_RESPONSE_CONTROL", "No effective HTTP X-Frame-Options or CSP frame-ancestors directive was found; browser framing test will decide whether this is exploitable.");

  const noSniff = (headers.get("x-content-type-options") || "").trim().toLowerCase() === "nosniff";
  record("X_CONTENT_TYPE_OPTIONS", noSniff, "MEDIUM", "nosniff", "X-Content-Type-Options: nosniff is absent.");

  const referrerHeader = headers.get("referrer-policy") || "";
  const referrerMeta = parseReferrerMeta(html);
  const referrerEffective = Boolean(referrerHeader.trim() || referrerMeta.trim());
  record("REFERRER_POLICY", referrerEffective, "MEDIUM", referrerHeader || ("meta: " + referrerMeta), "Neither a Referrer-Policy HTTP header nor a referrer meta policy was found.");
  if (!referrerHeader && referrerMeta) warn("REFERRER_POLICY_HEADER", "A meta referrer policy is present, but the HTTP header is absent.");

  if (headers.get("permissions-policy")) {
    pass("PERMISSIONS_POLICY_HEADER", headers.get("permissions-policy"));
  } else {
    warn("PERMISSIONS_POLICY_HEADER", "No Permissions-Policy response header; consider disabling unused capabilities such as camera, microphone, geolocation, payment, and USB.");
  }

  const policies = [cspHeader, cspMeta].filter(Boolean);
  const safeScriptSrc = policies.length > 0 && policies.every(policy => {
    const values = getDirective(policy, "script-src");
    return values.includes("'self'") && !values.includes("'unsafe-inline'") && !values.includes("'unsafe-eval'");
  });
  record("CSP_SCRIPT_SOURCE", safeScriptSrc, "HIGH", "All present CSP policies use script-src self without unsafe-inline or unsafe-eval", "At least one effective CSP policy is missing a restrictive script-src or permits unsafe inline/eval scripts.");

  const noInlineHandlers = policies.length > 0 && policies.every(policy => getDirective(policy, "script-src-attr").includes("'none'"));
  record("CSP_INLINE_EVENT_HANDLERS", noInlineHandlers, "HIGH", "script-src-attr none", "At least one CSP policy does not explicitly prohibit inline event handlers.");

  const noObjects = policies.length > 0 && policies.every(policy => getDirective(policy, "object-src").includes("'none'"));
  record("CSP_OBJECTS", noObjects, "MEDIUM", "object-src none", "At least one CSP policy does not prohibit object/embed content.");

  const noBaseInjection = policies.length > 0 && policies.every(policy => getDirective(policy, "base-uri").includes("'self'"));
  record("CSP_BASE_URI", noBaseInjection, "MEDIUM", "base-uri self", "At least one CSP policy does not constrain base-uri to self.");

  const noExternalFrames = policies.length > 0 && policies.every(policy => getDirective(policy, "frame-src").includes("'none'"));
  record("CSP_OUTBOUND_FRAMES", noExternalFrames, "MEDIUM", "frame-src none", "At least one CSP policy permits or does not constrain nested frames.");

  return { html, headers, cspHeader, cspMeta, clickjackingHeader, responseStatus: response.status };
}

async function auditSourceMaps() {
  console.log("\n=== Public source-map exposure ===");
  for (const path of ["/react-dist/kanji5-react.js.map", "/react-dist/kanji5-react.css.map"]) {
    try {
      const response = await fetchWithTimeout(BASE_URL + path + "?security_audit_probe=" + Date.now(), {
        method: "GET",
        headers: { "cache-control": "no-cache" },
      });
      if (response.status === 200) {
        const body = await response.text();
        const isSourceMap = /"version"\s*:\s*3/.test(body.slice(0, 20000))
          && /"sources"\s*:/.test(body.slice(0, 20000))
          && /"mappings"\s*:/.test(body.slice(0, 20000));
        if (isSourceMap) {
          fail("SOURCE_MAP_NOT_PUBLIC_" + path, "MEDIUM", "A public .map URL returned a source-map document; contents suppressed.");
        } else {
          pass("SOURCE_MAP_NOT_PUBLIC_" + path, "HTTP 200 was a non-source-map response; body suppressed.");
        }
      } else if ([403, 404, 410].includes(response.status)) {
        pass("SOURCE_MAP_NOT_PUBLIC_" + path, "HTTP " + response.status);
      } else {
        fail("SOURCE_MAP_NOT_PUBLIC_" + path, "MEDIUM", "Inconclusive HTTP status " + response.status + " for source-map probe.");
        await response.body?.cancel();
      }
    } catch (error) {
      fail("SOURCE_MAP_NOT_PUBLIC_" + path, "MEDIUM", "Request failed: " + String(error?.message || error));
    }
  }
}

async function auditAnonymousSupabaseRead() {
  console.log("\n=== Unauthenticated Supabase read isolation ===");
  try {
    const configResponse = await fetchWithTimeout(BASE_URL + "/supabase-config.js?security_audit_probe=" + Date.now());
    if (!configResponse.ok) {
      fail("SUPABASE_PUBLIC_CONFIG_REACHABLE", "HIGH", "supabase-config.js returned HTTP " + configResponse.status);
      return;
    }
    const config = await configResponse.text();
    const url = config.match(/\burl\s*:\s*["']([^"']+)["']/)?.[1];
    const key = config.match(/\banonKey\s*:\s*["']([^"']+)["']/)?.[1];
    if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
      fail("SUPABASE_PUBLIC_CONFIG_PARSE", "HIGH", "Could not parse the expected public Supabase URL and publishable key.");
      return;
    }
    if (/service[_-]?role|sb_secret_/i.test(key)) {
      fail("SUPABASE_BROWSER_KEY_TYPE", "CRITICAL", "The public browser config appears to contain a privileged/secret key. Key value suppressed.");
      return;
    }
    pass("SUPABASE_BROWSER_KEY_TYPE", "Only a publishable/anon-style key was found; key value suppressed.");

    const endpoint = url.replace(/\/+$/, "") + "/rest/v1/user_learning_state?select=user_id&limit=1";
    const response = await fetchWithTimeout(endpoint, {
      headers: { apikey: key, accept: "application/json", "cache-control": "no-cache" },
    });
    if ([401, 403].includes(response.status)) {
      pass("SUPABASE_ANON_ROW_READ", "Unauthenticated REST request denied with HTTP " + response.status + "; response body suppressed.");
      await response.body?.cancel();
      return;
    }
    if (response.status === 200) {
      let data;
      try { data = await response.json(); } catch { data = null; }
      if (Array.isArray(data) && data.length === 0) {
        pass("SUPABASE_ANON_ROW_READ", "HTTP 200 but zero rows exposed; response contents suppressed.");
      } else {
        fail("SUPABASE_ANON_ROW_READ", "CRITICAL", "Unauthenticated REST request returned a non-empty or unexpected response. Response contents suppressed.");
      }
      return;
    }
    fail("SUPABASE_ANON_ROW_READ", "HIGH", "Unauthenticated REST probe was inconclusive: HTTP " + response.status + ". Response body suppressed.");
    await response.body?.cancel();
  } catch (error) {
    fail("SUPABASE_ANON_ROW_READ", "HIGH", "Unauthenticated read probe failed: " + String(error?.message || error));
  }
}

async function auditBrowserBehavior(httpEvidence) {
  console.log("\n=== Chromium runtime security probes ===");
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    fail("CHROMIUM_LAUNCH", "HIGH", "Could not start Chromium: " + String(error?.message || error));
    return;
  }

  try {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    page.on("pageerror", error => {
      // Runtime errors are counted, not dumped; avoid including any user or page data.
      WARNINGS.push({ name: "BROWSER_PAGE_ERROR", detail: String(error?.name || "Error") });
    });

    await page.addInitScript(() => {
      localStorage.setItem("kanji5-onboarding-v2", "complete");
      localStorage.setItem("kanji5-ui-language", "en");
      window.__KANJI5_AUDIT_INLINE_SCRIPT_RAN__ = false;
      window.__KANJI5_AUDIT_INLINE_HANDLER_RAN__ = false;
      window.__KANJI5_AUDIT_SEARCH_XSS_RAN__ = false;
      window.__KANJI5_AUDIT_STORED_XSS_RAN__ = false;
      window.__KANJI5_AUDIT_CSP_VIOLATIONS__ = [];
      document.addEventListener("securitypolicyviolation", event => {
        window.__KANJI5_AUDIT_CSP_VIOLATIONS__.push(String(event.effectiveDirective || "unknown"));
      });
    });

    try {
      await page.goto(BASE_URL + "/?security_audit_browser=" + Date.now(), {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.locator("#root .app-shell").waitFor({ state: "visible", timeout: 30000 });
      pass("BROWSER_APP_BOOT", "Fresh Chromium context loaded the production app shell.");
    } catch (error) {
      fail("BROWSER_APP_BOOT", "HIGH", "Production app did not become visible in Chromium: " + String(error?.message || error));
      await context.close();
      return;
    }

    try {
      const inlineResult = await page.evaluate(async () => {
        const script = document.createElement("script");
        script.textContent = "window.__KANJI5_AUDIT_INLINE_SCRIPT_RAN__ = true;";
        document.head.appendChild(script);

        const button = document.createElement("button");
        button.setAttribute("onclick", "window.__KANJI5_AUDIT_INLINE_HANDLER_RAN__ = true;");
        document.body.appendChild(button);
        button.click();
        button.remove();

        await new Promise(resolve => setTimeout(resolve, 150));
        return {
          scriptRan: Boolean(window.__KANJI5_AUDIT_INLINE_SCRIPT_RAN__),
          handlerRan: Boolean(window.__KANJI5_AUDIT_INLINE_HANDLER_RAN__),
          blockedDirectives: Array.from(new Set(window.__KANJI5_AUDIT_CSP_VIOLATIONS__ || [])),
        };
      });
      record("BROWSER_CSP_BLOCKS_INLINE_SCRIPT", !inlineResult.scriptRan, "HIGH", "Injected inline script did not execute; violation directives: " + (inlineResult.blockedDirectives.join(", ") || "not reported"), "Injected inline script executed in the production page.");
      record("BROWSER_CSP_BLOCKS_INLINE_HANDLER", !inlineResult.handlerRan, "HIGH", "Injected inline event handler did not execute", "Injected inline event handler executed in the production page.");
    } catch (error) {
      fail("BROWSER_CSP_EXECUTION_PROBES", "HIGH", "Browser test was inconclusive: " + String(error?.message || error));
    }

    try {
      await page.locator(".experience-nav .experience-tab").nth(2).click();
      const search = page.locator(".dictionary-page-search input");
      await search.waitFor({ state: "visible" });
      const payload = '<img id="kanji5-audit-search-xss" src="/kanji5-audit-missing-image" onerror="window.__KANJI5_AUDIT_SEARCH_XSS_RAN__=true"><svg id="kanji5-audit-search-svg" onload="window.__KANJI5_AUDIT_SEARCH_XSS_RAN__=true"></svg>';
      await search.fill(payload);
      await page.waitForTimeout(300);
      const state = await page.evaluate(() => ({
        executed: Boolean(window.__KANJI5_AUDIT_SEARCH_XSS_RAN__),
        injectedNodes: document.querySelectorAll("#root #kanji5-audit-search-xss, #root #kanji5-audit-search-svg, #root [onerror], #root [onload]").length,
      }));
      record("BROWSER_REFLECTED_XSS_DICTIONARY_SEARCH", !state.executed && state.injectedNodes === 0, "HIGH", "Payload remained inert data; no payload nodes or execution observed", "Dictionary search rendered active payload markup or executed a payload. Marker=" + state.executed + ", payloadNodes=" + state.injectedNodes);
    } catch (error) {
      fail("BROWSER_REFLECTED_XSS_DICTIONARY_SEARCH", "HIGH", "Browser test was inconclusive: " + String(error?.message || error));
    }

    try {
      await page.locator(".experience-nav .experience-tab").first().click();
      const card = page.locator("#root .learning-card");
      await card.waitFor({ state: "visible" });
      const isRevealed = await card.evaluate(element => element.classList.contains("is-revealed"));
      if (!isRevealed) await card.getByRole("button", { name: "Reveal meaning & readings" }).click();
      const shortcut = card.locator('.learning-back-page-shortcut[aria-label="Personal mnemonic"]');
      await shortcut.waitFor({ state: "visible" });
      await shortcut.click();
      await card.locator(".mnemonic-tool").getByRole("button", { name: "Personal mnemonic" }).click();
      const editor = card.locator(".mnemonic-editor textarea");
      await editor.waitFor({ state: "visible" });
      const payload = '<img id="kanji5-audit-stored-xss" src="/kanji5-audit-missing-image" onerror="window.__KANJI5_AUDIT_STORED_XSS_RAN__=true"><svg id="kanji5-audit-stored-svg" onload="window.__KANJI5_AUDIT_STORED_XSS_RAN__=true"></svg>';
      await editor.fill(payload);
      await card.getByRole("button", { name: "Save mnemonic" }).click();
      await page.waitForTimeout(250);

      const afterSave = await page.evaluate(() => ({
        executed: Boolean(window.__KANJI5_AUDIT_STORED_XSS_RAN__),
        injectedNodes: document.querySelectorAll("#root #kanji5-audit-stored-xss, #root #kanji5-audit-stored-svg, #root [onerror], #root [onload]").length,
      }));
      record("BROWSER_STORED_XSS_PERSONAL_MNEMONIC", !afterSave.executed && afterSave.injectedNodes === 0, "CRITICAL", "Saved mnemonic remained inert data; no payload nodes or execution observed", "Saved mnemonic rendered active payload markup or executed a payload. Marker=" + afterSave.executed + ", payloadNodes=" + afterSave.injectedNodes);

      await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
      const reloadedCard = page.locator("#root .learning-card");
      await reloadedCard.waitFor({ state: "visible", timeout: 20000 });
      const revealedAfterReload = await reloadedCard.evaluate(element => element.classList.contains("is-revealed"));
      if (!revealedAfterReload) await reloadedCard.getByRole("button", { name: "Reveal meaning & readings" }).click();
      const reloadedShortcut = reloadedCard.locator('.learning-back-page-shortcut[aria-label="Personal mnemonic"]');
      await reloadedShortcut.waitFor({ state: "visible", timeout: 10000 });
      await reloadedShortcut.click();
      const activeMnemonicPage = reloadedCard.locator(".learning-back-page.active .mnemonic-page");
      await activeMnemonicPage.waitFor({ state: "visible", timeout: 10000 });
      const activeMnemonicTool = activeMnemonicPage.locator(".mnemonic-tool");
      await activeMnemonicTool.waitFor({ state: "visible", timeout: 10000 });
      await activeMnemonicTool.getByRole("button", { name: "Personal mnemonic" }).click();
      await page.waitForTimeout(250);
      const afterReload = await page.evaluate(() => ({
        executed: Boolean(window.__KANJI5_AUDIT_STORED_XSS_RAN__),
        injectedNodes: document.querySelectorAll("#root #kanji5-audit-stored-xss, #root #kanji5-audit-stored-svg, #root [onerror], #root [onload]").length,
      }));
      record("BROWSER_STORED_XSS_AFTER_RELOAD", !afterReload.executed && afterReload.injectedNodes === 0, "CRITICAL", "Persisted mnemonic remained inert after reload", "Persisted mnemonic became active markup or executed after reload. Marker=" + afterReload.executed + ", payloadNodes=" + afterReload.injectedNodes);
    } catch (error) {
      fail("BROWSER_STORED_XSS_PERSONAL_MNEMONIC", "CRITICAL", "Stored-XSS browser test was inconclusive: " + String(error?.message || error));
    }

    await context.close();

    console.log("\n=== Clickjacking / iframe embedding test ===");
    const parent = await browser.newPage();
    let iframeResponseStatus = null;
    parent.on("response", response => {
      if (response.url().startsWith(BASE_URL + "/?security_audit_iframe=")) iframeResponseStatus = response.status();
    });
    const parentHtml = '<!doctype html><meta charset="utf-8"><title>security audit parent</title><iframe id="target-frame" style="width:1200px;height:800px" src="' + BASE_URL + '/?security_audit_iframe=' + Date.now() + '"></iframe>';
    await parent.goto("data:text/html;charset=utf-8," + encodeURIComponent(parentHtml), { waitUntil: "domcontentloaded", timeout: 15000 });
    let appRenderedInsideFrame = false;
    let iframeDiagnostics = null;
    try {
      await parent.frameLocator("#target-frame").locator("body").waitFor({ state: "attached", timeout: 15000 });
      const targetFrame = parent.frames().find(frame => frame.url().startsWith(BASE_URL + "/?security_audit_iframe="));
      if (targetFrame) {
        iframeDiagnostics = await targetFrame.evaluate(() => ({
          readyState: document.readyState,
          title: document.title,
          rootExists: Boolean(document.querySelector("#root")),
          rootChildCount: document.querySelector("#root")?.childElementCount ?? -1,
          appShellVisible: (() => {
            const el = document.querySelector("#root .app-shell");
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
          })(),
          frameElementPresent: Boolean(window.frameElement),
          isTopLevel: window.self === window.top,
          bodyTextPrefix: (document.body?.innerText || "").slice(0, 160)
        }));
        appRenderedInsideFrame = Boolean(iframeDiagnostics.appShellVisible);
      }
    } catch (error) {
      warn("IFRAME_DIAGNOSTIC_ERROR", String(error?.message || error));
    }

    if (appRenderedInsideFrame) {
      fail("BROWSER_CLICKJACKING_FRAME_BLOCK", "HIGH", "The production app rendered inside a cross-origin iframe; browser framing was not blocked.");
    } else if (httpEvidence.clickjackingHeader) {
      pass("BROWSER_CLICKJACKING_FRAME_BLOCK", "Target did not render inside the iframe and an effective HTTP framing header was present.");
    } else {
      // Absence of a framing policy is directly verified from the production HTTP headers.
      // Whether an attacker can render the full UI remains a separate browser/runtime question.
      fail("CLICKJACKING_RESPONSE_POLICY_MISSING", "HIGH", "No effective HTTP X-Frame-Options or CSP frame-ancestors directive exists on the production response.");
      warn("BROWSER_IFRAME_EMBEDDING_INCONCLUSIVE", "The page returned HTTP " + String(iframeResponseStatus) + " but the app shell did not visibly render inside the iframe. Diagnostics: " + JSON.stringify(iframeDiagnostics));
    }
    await parent.close();
  } finally {
    await browser.close();
  }
}

console.log("Live target: " + BASE_URL);
await auditHttpSurface().then(async evidence => {
  await auditSourceMaps();
  await auditAnonymousSupabaseRead();
  await auditBrowserBehavior(evidence);
}).catch(error => {
  fail("AUDIT_RUNNER_UNEXPECTED_ERROR", "CRITICAL", String(error?.message || error));
});

console.log("\n=== Strict audit summary ===");
console.log("Blocking findings: " + FINDINGS.length);
for (const finding of FINDINGS) console.log("- [" + finding.severity + "] " + finding.name + ": " + finding.detail);
console.log("Warnings: " + WARNINGS.length);
for (const warning of WARNINGS) console.log("- " + warning.name + ": " + warning.detail);
if (FINDINGS.length) {
  console.error("\nSTRICT_SECURITY_AUDIT_FAILED");
  process.exitCode = 1;
} else {
  console.log("\nSTRICT_SECURITY_AUDIT_PASSED");
}
