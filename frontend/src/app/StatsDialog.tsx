import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { listKanji, type KanjiCatalogItem, type Snapshot } from "./engine";
import { usePageDialog } from "./usePageDialog";

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="stats-metric"><span>{label}</span><strong>{value}</strong>{hint ? <small>{hint}</small> : null}</div>;
}

function formatAverage(value: number, language: Language) { return new Intl.NumberFormat(language === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 1 }).format(value); }

function DayLabel({ index, language }: { index: number; language: Language }) {
  const date = new Date();
  date.setDate(date.getDate() - (6 - index));
  return new Intl.DateTimeFormat(language === "fa" ? "fa-IR" : "en-US", { weekday: "short" }).format(date);
}

function ActivitySection({ snapshot, language }: { snapshot: Snapshot; language: Language }) {
  const days = snapshot.stats?.last7 ?? [];
  const counts = days.map(day => Math.max(0, Number(day.count) || 0));
  const max = Math.max(1, ...counts);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const average = total / Math.max(1, counts.length);
  const todayIndex = Math.max(0, counts.length - 1);

  return (
    <section className="stats-section stats-activity stats-activity-section" aria-labelledby="stats-activity-title">
      <div className="stats-section-heading">
        <div>
          <p className="eyebrow">{language === "fa" ? "فعالیت" : "Activity"}</p>
          <h3 id="stats-activity-title">{t("sevenDayActivity", language)}</h3>
        </div>
        <div className="stats-section-summary"><strong>{formatNumber(total, language)}</strong><span>{language === "fa" ? "مرور ثبت‌شده" : "reviews"}</span></div>
      </div>
      {days.length ? (
        <>
          <div className="activity-chart stats-activity-chart" role="img" aria-label={days.map((day, index) => {
            const count = Math.max(0, Number(day.count) || 0);
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            return new Intl.DateTimeFormat(language === "fa" ? "fa-IR" : "en-US", { weekday: "long" }).format(date) + " " + formatNumber(count, language);
          }).join(" · ")}>
            {counts.map((count, index) => (
              <div className={"activity-bar-wrap" + (index === todayIndex ? " is-today" : "")} key={String(days[index]?.label ?? "") + index}>
                <div className="activity-count">{formatNumber(count, language)}</div>
                <div className="activity-bar-track" aria-hidden="true"><span style={{ height: Math.max(6, Math.round((count / max) * 100)) + "%" }} /></div>
                <div className="activity-label"><DayLabel index={index} language={language} /></div>
              </div>
            ))}
          </div>
          <div className="stats-activity-footer">
            <span>{language === "fa" ? formatAverage(average, language) + " مرور در روز به‌طور میانگین" : average.toFixed(1) + " reviews/day on average"}</span>
            <span>{language === "fa" ? "امروز" : "Today"} · {formatNumber(counts[todayIndex] ?? 0, language)}</span>
          </div>
        </>
      ) : <p className="empty-text">{language === "fa" ? "هنوز داده‌ای برای نمایش فعالیت وجود ندارد." : "There is not enough activity data to show yet."}</p>}
    </section>
  );
}

function MasterySection({ snapshot, language }: { snapshot: Snapshot; language: Language }) {
  const distribution = snapshot.stats?.masteryDistribution ?? {
    unseen: 0,
    learning: 0,
    attention: 0,
    stable: 0,
    mastered: 0,
    average: 0,
    total: 0,
  };

  const items = [
    ["unseen", Number(distribution.unseen) || 0, t("masteryUnseen", language)],
    ["learning", Number(distribution.learning) || 0, t("masteryLearning", language)],
    ["attention", Number(distribution.attention) || 0, t("masteryNeedsAttention", language)],
    ["stable", Number(distribution.stable) || 0, t("masteryStable", language)],
    ["mastered", Number(distribution.mastered) || 0, t("masteryMastered", language)],
  ] as const;
  const total = Math.max(1, Number(distribution.total) || 0);
  const hasData = Number(distribution.total) > 0;

  return (
    <section className="stats-section" aria-labelledby="stats-mastery-title">
      <div className="stats-section-heading">
        <div><p className="eyebrow">{language === "fa" ? "تسلط" : "Mastery"}</p><h3 id="stats-mastery-title">{language === "fa" ? "توزیع وضعیت کانجی‌ها" : "Kanji mastery"}</h3></div>
        <div className="stats-section-summary"><strong>{formatNumber(Math.round((Number(distribution.average) || 0) * 100), language)}%</strong><span>{language === "fa" ? "تسلط کانجی‌های مطالعه‌شده" : "studied mastery"}</span></div>
      </div>
      {hasData ? (
        <>
          <div className="stats-mastery-bar" role="img" aria-label={items.map(([, count, label]) => label + " " + formatNumber(count, language)).join(" · ")}>
            {items.map(([key, count]) => <span key={key} className={"stats-mastery-segment " + key} style={{ width: (count / total) * 100 + "%" }} />)}
          </div>
          <div className="stats-mastery-legend">
            {items.map(([key, count, label]) => <div key={key} className="stats-mastery-item"><i className={"stats-mastery-dot " + key} aria-hidden="true" /><span>{label}</span><strong>{formatNumber(count, language)}</strong></div>)}
          </div>
        </>
      ) : <p className="empty-text">{language === "fa" ? "اطلاعات تسلط هنوز آماده نیست." : "Mastery data is not available yet."}</p>}
    </section>
  );
}

function SkillsSection({ snapshot, language }: { snapshot: Snapshot; language: Language }) {
  const skillKeys = ["meaning", "reading", "production", "vocabulary", "context"] as const;
  const skillLabels: Record<typeof skillKeys[number], string> = {
    meaning: t("meaning", language),
    reading: t("reading", language),
    production: t("production", language),
    vocabulary: t("vocabulary", language),
    context: t("context", language),
  };

  return (
    <section className="stats-section" aria-labelledby="stats-skills-title">
      <div className="stats-section-heading"><div><p className="eyebrow">{language === "fa" ? "مهارت‌ها" : "Skills"}</p><h3 id="stats-skills-title">{language === "fa" ? "پروفایل یادگیری" : "Learning profile"}</h3></div></div>
      <div className="stats-skills-list">
        {skillKeys.map(key => {
          const skill = snapshot.learner?.attributes?.[key] ?? {};
          const attempts = Number((skill as { attempts?: number }).attempts);
          const accuracy = Number(skill.accuracy);
          const hasEvidence = Number.isFinite(accuracy) && attempts > 0;
          const value = hasEvidence ? Math.round(Math.max(0, Math.min(1, accuracy)) * 100) : null;
          const stateLabel = skill.state === "weak" ? t("masteryNeedsAttention", language) : skill.state === "stable" ? t("masteryStable", language) : skill.state === "mastered" ? t("masteryMastered", language) : t("masteryLearning", language);
          return <div className="stats-skill-row" key={key}>
            <div className="stats-skill-label"><span>{skillLabels[key]}</span><strong>{value === null ? "—" : formatNumber(value, language) + "%"}</strong></div>
            <div className="stats-skill-track" aria-hidden="true"><span style={{ width: (value ?? 0) + "%" }} /></div>
            <span className="stats-skill-state">{skill.state ? stateLabel : "—"}</span>
          </div>;
        })}
      </div>
      <p className="stats-footnote">{language === "fa" ? "درصد اینجا دقت پاسخ‌هاست؛ جزئیات اطمینان مدل و تعداد تلاش‌ها را در آمار پیشرفته ببین." : "This percentage is response accuracy; advanced stats show model confidence and attempt evidence."}</p>
    </section>
  );
}

function AttentionSection({ catalog, language, onStudyWeak }: { catalog: KanjiCatalogItem[]; language: Language; onStudyWeak?: () => void }) {
  const items = catalog
    .filter(item => item.state === "weak" || item.state === "recovering")
    .sort((a, b) => Number(a.mastery || 0) - Number(b.mastery || 0))
    .slice(0, 5);

  return (
    <section className="stats-section stats-attention" aria-labelledby="stats-attention-title">
      <div className="stats-section-heading">
        <div><p className="eyebrow">{language === "fa" ? "تمرکز بعدی" : "Next focus"}</p><h3 id="stats-attention-title">{t("masteryNeedsAttention", language)}</h3></div>
        {items.length > 0 && onStudyWeak ? <button className="button secondary stats-attention-action" type="button" onClick={onStudyWeak}>{language === "fa" ? "تمرین این‌ها" : "Practice these"}</button> : null}
      </div>
      {items.length ? (
        <div className="stats-attention-list">
          {items.map(item => <div className="stats-attention-row" key={item.character}><strong lang="ja">{item.character}</strong><span>{language === "fa" ? "نیازمند مرور بیشتر" : "Needs more review"}</span><b>{formatNumber(Math.round(Math.max(0, Math.min(1, Number(item.mastery) || 0)) * 100), language)}%</b></div>)}
        </div>
      ) : <p className="empty-text">{language === "fa" ? "فعلاً کانجیِ نیازمند توجه ویژه‌ای ثبت نشده است." : "No kanji currently need extra attention."}</p>}
    </section>
  );
}

type AdvancedSkill = {
  state?: string;
  accuracy?: number;
  recentAccuracy?: number;
  confidence?: number;
  attempts?: number;
  recentAttempts?: number;
};

function formatRate(value: unknown, language: Language) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? formatNumber(Math.round(Math.max(0, Math.min(1, numeric)) * 100), language) + "%" : "—";
}

function AdvancedStatsSection({ snapshot, language }: { snapshot: Snapshot; language: Language }) {
  const last7 = snapshot.stats?.last7 ?? [];
  const counts = last7.map(day => Math.max(0, Number(day.count) || 0));
  const activeDays = counts.filter(count => count > 0).length;
  const activityTotal = counts.reduce((sum, count) => sum + count, 0);
  const skillKeys = ["meaning", "reading", "production", "vocabulary", "context"] as const;
  const skillLabels: Record<typeof skillKeys[number], string> = {
    meaning: t("meaning", language),
    reading: t("reading", language),
    production: t("production", language),
    vocabulary: t("vocabulary", language),
    context: t("context", language),
  };
  const stateLabel = (state?: string) => {
    if (!state) return "—";
    if (state === "weak" || state === "recovering") return t("masteryNeedsAttention", language);
    if (state === "stable") return t("masteryStable", language);
    if (state === "mastered") return t("masteryMastered", language);
    return t("masteryLearning", language);
  };

  return (
    <section className="stats-advanced surface card" id="stats-advanced-panel" aria-labelledby="stats-advanced-title">
      <div className="stats-section-heading">
        <div>
          <p className="eyebrow">{language === "fa" ? "جزئیات" : "Details"}</p>
          <h3 id="stats-advanced-title">{language === "fa" ? "عملکرد دقیق‌تر" : "A closer look"}</h3>
        </div>
        <div className="stats-section-summary">
          <strong>{formatNumber(activeDays, language)}/{formatNumber(7, language)}</strong>
          <span>{language === "fa" ? "روز فعال · " : "active days · "}{formatNumber(activityTotal, language)} {language === "fa" ? "مرور" : "reviews"}</span>
        </div>
      </div>

      <div className="stats-skills-list stats-advanced-table" role="list" aria-label={language === "fa" ? "جزئیات مهارت‌ها" : "Skill details"}>
        {skillKeys.map(key => {
          const skill = (snapshot.learner?.attributes?.[key] ?? {}) as AdvancedSkill;
          const attempts = Number(skill.attempts);
          const attemptLabel = Number.isFinite(attempts) && attempts > 0 ? formatNumber(attempts, language) : "—";
          return (
            <div className="row stats-advanced-row" role="listitem" key={key}>
              <strong>{skillLabels[key]}</strong>
              <span className="stats-skill-state">
                {language === "fa"
                  ? `دقت ${formatRate(skill.accuracy, language)} · اخیر ${formatRate(skill.recentAccuracy, language)} · ${attemptLabel} تلاش · ${stateLabel(skill.state)}`
                  : `${formatRate(skill.accuracy, language)} accuracy · ${formatRate(skill.recentAccuracy, language)} recent · ${attemptLabel} attempts · ${stateLabel(skill.state)}`}
              </span>
            </div>
          );
        })}
      </div>
      <p className="stats-footnote">{language === "fa" ? "اعتماد مدل فقط نشان‌دهندهٔ قدرت شواهد است و جای دقت واقعی پاسخ را نمی‌گیرد." : "Model confidence reflects evidence strength; it does not replace observed response accuracy."}</p>
    </section>
  );
}

export function StatsDialog({ open, snapshot, language, onClose, onStudyWeak }: { open: boolean; snapshot: Snapshot; language: Language; onClose: () => void; onStudyWeak?: () => void }) {
  const [catalog, setCatalog] = useState<KanjiCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!open || catalog.length || loading || attempted) return;
    let active = true;
    setAttempted(true);
    setLoading(true);
    void listKanji().then(result => {
      if (active) setCatalog(result.results);
    }).catch(() => {
      if (active) setCatalog([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [open, catalog.length, loading, attempted]);

  const studiedCount = Number(snapshot?.stats?.studiedCount ?? 0);
  const deckSize = Number(snapshot?.stats?.deckSize ?? 0);
  const coverage = deckSize ? Math.round((studiedCount / deckSize) * 100) : 0;
  const streak = Number(snapshot?.stats?.currentStreak ?? 0);
  const totalReviews = Number(snapshot?.stats?.totalReviews ?? 0);

  const dialogRef = usePageDialog(open, onClose);
  if (!open) return null;

  return (
    <dialog ref={dialogRef} className="dialog secondary-page-dialog stats-dialog stats-dashboard" aria-labelledby="stats-title">
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <header className="stats-header">
        <p className="eyebrow">{language === "fa" ? "پیشرفت" : "Progress"}</p>
        <h2 id="stats-title">{language === "fa" ? "مسیر یادگیری تو" : "Your learning progress"}</h2>
        <p>{language === "fa" ? "ببین چه مقدار پیش رفته‌ای، چه مهارت‌هایی در حال رشدند و روی چه کانجی‌هایی بهتر است دوباره تمرکز کنی." : "See what you have learned, which skills are growing, and which kanji deserve another look."}</p>
      </header>

      <section className="stats-overview" aria-label={language === "fa" ? "نمای کلی پیشرفت" : "Progress overview"}>
        <div className="stats-overview-primary">
          <div className="stats-overview-copy"><span>{language === "fa" ? "کانجی مطالعه‌شده" : "Kanji studied"}</span><strong>{formatNumber(studiedCount, language)}<small> / {formatNumber(deckSize, language)}</small></strong></div>
          <div className="stats-overview-track" aria-hidden="true"><span style={{ width: coverage + "%" }} /></div>
        </div>
        <Metric label={language === "fa" ? "پوشش جویو" : "Jōyō coverage"} value={formatNumber(coverage, language) + "%"} />
        <Metric label={t("streak", language)} value={formatNumber(streak, language)} hint={language === "fa" ? "روز" : "days"} />
        <Metric label={language === "fa" ? "کل مرورها" : "Total reviews"} value={formatNumber(totalReviews, language)} />
      </section>

      <button
        className="button wide row stats-advanced-trigger"
        type="button"
        aria-expanded={showAdvanced}
        aria-controls="stats-advanced-panel"
        onClick={() => setShowAdvanced(value => !value)}
      >
        <span className="stats-advanced-trigger-copy">
          <strong>{language === "fa" ? "آمار پیشرفته" : "Advanced stats"}</strong>
          <small>{language === "fa" ? "جزئیات عملکرد مهارت‌ها و شواهد پاسخ" : "Skill performance and response evidence"}</small>
        </span>
        <span className="stats-advanced-trigger-action">{showAdvanced ? (language === "fa" ? "بستن" : "Hide") : (language === "fa" ? "مشاهده" : "View")} <span aria-hidden="true">{showAdvanced ? "⌃" : "⌄"}</span></span>
      </button>

      {showAdvanced ? <AdvancedStatsSection snapshot={snapshot} language={language} /> : null}

      <ActivitySection snapshot={snapshot} language={language} />
      <MasterySection snapshot={snapshot} language={language} />
      <SkillsSection snapshot={snapshot} language={language} />
      <AttentionSection catalog={catalog} language={language} onStudyWeak={onStudyWeak} />
    </dialog>
  );
}
