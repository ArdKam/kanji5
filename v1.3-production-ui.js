(() => {
  "use strict";
  const STORAGE = "kanji5-v1";

  function getDeck() {
    try {
      const x = JSON.parse(localStorage.getItem("kanji5-deck") || "[]");
      return Array.isArray(x) ? x : [];
    } catch (_) { return []; }
  }

  function firstExposure() {
    const el = document.querySelector(".kanji");
    const id = el?.dataset?.kanjiId;
    if (!id) return false;
    try {
      const x = JSON.parse(localStorage.getItem(STORAGE) || "null");
      return !x?.cards?.[id];
    } catch (_) { return false; }
  }

  function targetCharacter() { return document.querySelector(".kanji")?.textContent?.trim() || ""; }

  function buildProductionChoices(target) {
    const deck = getDeck();
    const pool = deck.map(x => x.character).filter(ch => ch && ch !== target);
    const choices = [];
    while (pool.length && choices.length < 3) {
      const i = Math.floor(Math.random() * pool.length);
      choices.push(pool.splice(i, 1)[0]);
    }
    return [target, ...choices].sort(() => Math.random() - 0.5);
  }

  function upgradeProductionPrompt() {
    const prompt = document.querySelector("#v13P1Prompt");
    const input = document.querySelector("#v13P1Input");
    const submit = document.querySelector("#v13P1Submit");
    const gate = document.querySelector(".v13-p1-gate");
    if (!prompt || !input || !submit || !gate) return;
    if (!/کانجی مناسب را بنویس/.test(prompt.textContent || "")) return;
    if (gate.dataset.productionUi === "1") return;

    const target = targetCharacter();
    if (!target) return;
    const choices = buildProductionChoices(target);
    if (choices.length < 4) return;
    gate.dataset.productionUi = "1";

    input.style.display = "none";
    const box = document.createElement("div");
    box.className = "v13-production-choices";
    box.style.cssText = "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:8px";
    box.innerHTML = choices.map(ch => `<button type="button" class="secondary v13-production-choice" data-choice="${ch}" style="font-family:serif;font-size:38px;padding:14px 8px;min-height:78px" aria-label="انتخاب کانجی ${ch}">${ch}</button>`).join("");
    input.parentNode.insertBefore(box, input);

    box.addEventListener("click", event => {
      const btn = event.target.closest("[data-choice]");
      if (!btn) return;
      box.querySelectorAll("button").forEach(b => b.disabled = true);
      input.value = btn.dataset.choice || "";
      submit.click();
    });
  }

  const observer = new MutationObserver(() => {
    if (!firstExposure()) upgradeProductionPrompt();
  });
  observer.observe(document.body, {childList:true, subtree:true});
})();
