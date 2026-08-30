(() => {
  const V12 = "kanji5-v1.2";
  const $ = (sel, root = document) => root.querySelector(sel);

  let activePrompt = null;
  let originalRevealButton = null;
  let allowNativeReveal = false;

  const normalize = value => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s\u3000]+/g, " ")
    .replace(/[。、・,.;:!?！？]/g, "");

  function choosePrompt() {
    return Math.random() < 0.5 ? "meaning" : "reading";
  }

  function makeRecallGate() {
    const mode = choosePrompt();
    activePrompt = mode;
    originalRevealButton = document.getElementById("revealBtn");

    const prompt = mode === "meaning"
      ? "معنی این کانجی چیست؟ سعی کن حداقل یک معنی را از حافظه بنویسی."
      : "حداقل یک خوانش رایج این کانجی را به kana از حافظه بنویس.";

    const gate = document.createElement("div");
    gate.className = "v12-recall-gate";
    gate.innerHTML = `
      <div style="border:1px solid var(--line);background:#f9fafb;border-radius:16px;padding:14px;margin-top:14px">
        <div style="font-weight:800;margin-bottom:8px">🧠 بازیابی فعال</div>
        <div style="color:var(--muted);font-size:14px;line-height:1.7;margin-bottom:10px">${prompt}</div>
        <textarea id="v12RecallInput" rows="2" placeholder="پاسخ خودت را اینجا بنویس..." style="width:100%;resize:vertical;border:1px solid var(--line);border-radius:12px;padding:10px;font:inherit;box-sizing:border-box"></textarea>
        <button id="v12SubmitRecall" class="primary" style="margin-top:9px;width:100%">ثبت تلاش و نمایش پاسخ</button>
      </div>`;

    originalRevealButton?.replaceWith(gate);
    setTimeout(() => document.getElementById("v12RecallInput")?.focus(), 0);
  }

  function addStageButton(container, text, onClick) {
    const button = document.createElement("button");
    button.className = "secondary";
    button.textContent = text;
    button.style.width = "100%";
    button.style.marginTop = "12px";
    button.addEventListener("click", onClick);
    container.appendChild(button);
    return button;
  }

  function setupProgressiveReveal() {
    const answerBox = document.getElementById("answerBox");
    const ratings = document.getElementById("ratings");
    if (!answerBox || !ratings || answerBox.dataset.v12Enhanced === "1") return;

    answerBox.dataset.v12Enhanced = "1";
    const readings = answerBox.querySelector(".readings");
    const examples = answerBox.querySelector(".examples");
    const meta = answerBox.querySelector(".meta");

    if (readings) readings.style.display = "none";
    if (examples) examples.style.display = "none";
    if (meta) meta.style.display = "none";
    ratings.style.display = "none";

    const readingsButton = addStageButton(answerBox, "نمایش خوانش‌ها", () => {
      if (readings) readings.style.display = "grid";
      readingsButton.remove();

      const examplesButton = addStageButton(
        answerBox,
        "نمایش واژه‌های نمونه و آماده‌شدن برای امتیازدهی",
        () => {
          if (examples) examples.style.display = "block";
          if (meta) meta.style.display = "flex";
          ratings.style.display = "grid";
          examplesButton.remove();
        }
      );
    });
  }

  document.addEventListener("click", event => {
    const target = event.target;

    if (target?.id === "revealBtn" && !allowNativeReveal) {
      event.preventDefault();
      event.stopImmediatePropagation();
      makeRecallGate();
      return;
    }

    if (target?.id === "v12SubmitRecall") {
      const input = document.getElementById("v12RecallInput");
      const value = normalize(input?.value || "");
      if (!value) {
        input?.focus();
        return;
      }

      localStorage.setItem(`${V12}-last-attempt`, JSON.stringify({
        mode: activePrompt,
        attemptedAt: new Date().toISOString(),
        hadAttempt: true
      }));

      const gate = target.closest(".v12-recall-gate");
      if (!originalRevealButton || !gate) return;

      gate.replaceWith(originalRevealButton);
      allowNativeReveal = true;
      originalRevealButton.click();
      allowNativeReveal = false;
      originalRevealButton = null;
    }
  }, true);

  const observer = new MutationObserver(() => {
    const answerBox = document.getElementById("answerBox");
    if (answerBox?.classList.contains("show")) setupProgressiveReveal();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
