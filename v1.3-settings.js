(() => {
  "use strict";
  const KEY = "kanji5-v1.3-education-settings";
  const DEFAULTS = {
    production: true,
    vocabulary: true,
    context: true
  };
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "null");
      return {...DEFAULTS, ...(value && typeof value === "object" ? value : {})};
    } catch (_) {
      return {...DEFAULTS};
    }
  };
  const write = value => {
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch (_) {}
  };
  window.KANJI5_EDUCATION_SETTINGS = {read, write, defaults: {...DEFAULTS}};

  const add = () => {
    const dialog = document.getElementById("settingsDialog");
    if (!dialog || dialog.querySelector("#v13EducationSettings")) return;
    const modal = dialog.querySelector(".modal");
    if (!modal) return;
    const section = document.createElement("div");
    section.id = "v13EducationSettings";
    section.innerHTML = `
      <h3 style="font-size:15px;margin:20px 0 8px">قابلیت‌های آموزشی</h3>
      <div style="color:var(--muted);font-size:12px;line-height:1.6;margin-bottom:10px">می‌توانی تمرین‌های پیشرفته را جداگانه فعال یا غیرفعال کنی.</div>
      <label class="setting"><span>تولید کانجی (Kanji Production)</span><input id="v13Production" type="checkbox"></label>
      <label class="setting"><span>تکمیل واژه (Vocabulary Completion)</span><input id="v13Vocabulary" type="checkbox"></label>
      <label class="setting"><span>یادآوری بافت واژه (Context Recall)</span><input id="v13Context" type="checkbox"></label>`;
    const resetRow = modal.querySelector("#resetBtn")?.closest(".setting");
    (resetRow || modal.querySelector(".setting"))?.before(section);
    const settings = read();
    document.getElementById("v13Production").checked = settings.production;
    document.getElementById("v13Vocabulary").checked = settings.vocabulary;
    document.getElementById("v13Context").checked = settings.context;
    ["v13Production", "v13Vocabulary", "v13Context"].forEach(id => {
      document.getElementById(id)?.addEventListener("change", () => {
        const next = read();
        next.production = document.getElementById("v13Production").checked;
        next.vocabulary = document.getElementById("v13Vocabulary").checked;
        next.context = document.getElementById("v13Context").checked;
        write(next);
      });
    });
  };
  document.addEventListener("DOMContentLoaded", add, {once: true});
  document.getElementById("settingsBtn")?.addEventListener("click", () => setTimeout(add, 0));
})();
