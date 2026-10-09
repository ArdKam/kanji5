import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { getStats, listKanji, type KanjiCatalogItem, type Snapshot } from "./engine";
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
      {days.length > 0 && total > 0 ? (
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
      ) : <p className="empty-text">{language === "fa" ? "در هفت روز اخیر هنوز مروری ثبت نشده است؛ پس از اولین جلسه، روند فعالیت اینجا نمایش داده می‌شود." : "No reviews have been recorded in the last seven days. Activity will appear here after your first review session."}</p>}
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
  const activityAverage = activityTotal / Math.max(1, counts.length);
  const hasActivityEvidence = activityTotal > 0;
  const evaluation = snapshot.stats?.evaluation;
  const hasEvaluationEvidence = Boolean(evaluation?.evidence?.sufficient);
  const hasCompletedSessions = Number(evaluation?.completedSessions ?? 0) > 0;
  const mastery = snapshot.stats?.masteryDistribution ?? {};
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
    <section className="stats-section stats-advanced" aria-labelledby="stats-advanced-title">
      <div className="stats-section-heading">
        <div>
          <p className="eyebrow">{language === "fa" ? "جزئیات پیشرفت" : "Progress details"}</p>
          <h3 id="stats-advanced-title">{language === "fa" ? "عملکرد دقیق‌تر" : "A closer look"}</h3>
        </div>
      </div>

      <div className="stats-overview stats-advanced-metrics">
        <Metric label={language === "fa" ? "روزهای فعال" : "Active days"} value={formatNumber(activeDays, language)} hint={language === "fa" ? "از ۷ روز" : "of 7 days"} />
        <Metric label={language === "fa" ? "میانگین مرور" : "Average reviews"} value={hasActivityEvidence ? formatNumber(Number(activityAverage.toFixed(1)), language) : "—"} hint={language === "fa" ? "در روز" : "per day"} />
        <Metric label={language === "fa" ? "نرخ بازیابی" : "Recovery"} value={hasEvaluationEvidence ? formatRate(evaluation?.recoveryRate, language) : "—"} />
        <Metric label={language === "fa" ? "پوشش مهارت‌ها" : "Attribute coverage"} value={hasEvaluationEvidence ? formatRate(evaluation?.attributeCoverage, language) : "—"} />
        <Metric label={language === "fa" ? "تکمیل جلسه" : "Session completion"} value={hasEvaluationEvidence ? formatRate(evaluation?.sessionCompletionRate, language) : "—"} />
        <Metric label={language === "fa" ? "میانگین فراخوانی" : "Recalls / session"} value={hasEvaluationEvidence && hasCompletedSessions ? formatNumber(Number((evaluation?.averageRecallsPerSession ?? 0).toFixed(1)), language) : "—"} />
      </div>

      <div className="stats-section-summary" aria-live="polite">
        <span>
          {snapshot.stats?.evaluation?.evidence?.sufficient
            ? (language === "fa"
              ? `شواهد کافی: ${formatNumber(snapshot.stats?.evaluation?.evidence?.sessions ?? 0, language)} جلسه · ${formatNumber(snapshot.stats?.evaluation?.evidence?.attempts ?? 0, language)} تلاش`
              : `Sufficient evidence: ${formatNumber(snapshot.stats?.evaluation?.evidence?.sessions ?? 0, language)} sessions · ${formatNumber(snapshot.stats?.evaluation?.evidence?.attempts ?? 0, language)} attempts`)
            : (language === "fa"
              ? `شواهد محدود است؛ نرخ‌ها برای قضاوت طولی کافی نیستند.`
              : `Evidence is limited; longitudinal rates are not yet strong enough to interpret.`)}
        </span>
      </div>

      <div className="stats-skills-list stats-advanced-skill-list">
        {skillKeys.map(key => {
          const skill = (snapshot.learner?.attributes?.[key] ?? {}) as AdvancedSkill;
          const attempts = Number(skill.attempts);
          const rate = Number(skill.accuracy);
          return (
            <div className="stats-skill-row" key={key}>
              <div className="stats-skill-label"><span>{skillLabels[key]}</span><strong>{formatRate(skill.accuracy, language)}</strong></div>
              <div className="stats-skill-track" aria-hidden="true"><span style={{ width: (Number.isFinite(rate) ? Math.max(0, Math.min(1, rate)) : 0) * 100 + "%" }} /></div>
              <span className="stats-skill-state">
                {Number.isFinite(attempts) && attempts > 0
                  ? <>
                      {(language === "fa" ? "اخیر " : "Recent ") + formatRate(skill.recentAccuracy, language)}
                      {" · "}
                      {(language === "fa" ? "بازیابی " : "Recovery ") + formatRate(snapshot.stats?.evaluation?.attributes?.[key]?.recoveryRate, language)}
                      {" · "}
                      {(language === "fa" ? "تکرار خطا " : "Repeated failure ") + formatRate(snapshot.stats?.evaluation?.attributes?.[key]?.repeatedFailureRate, language)}
                      {" · "}
                      {(language === "fa" ? "تلاش " : "Attempts ") + formatNumber(attempts, language)}
                      {" · "}
                      {snapshot.stats?.evaluation?.attributes?.[key]?.retentionRate == null
                        ? (language === "fa" ? "حفظ: —" : "Retention: —")
                        : (language === "fa" ? "حفظ " : "Retention ") + formatRate(snapshot.stats?.evaluation?.attributes?.[key]?.retentionRate, language)}
                      {" · "}
                      {stateLabel(skill.state)}
                    </>
                  : language === "fa" ? "داده کافی نیست" : "Not enough data"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="stats-section-summary" style={{ marginTop: "0.75rem" }}>
        <span>{language === "fa" ? "نرخ ناشناخته" : "Unknown"} · {hasEvaluationEvidence ? formatRate(evaluation?.unknownRate, language) : "—"}</span>
        <span>{language === "fa" ? "تکرار خطای کل" : "Repeated failure"} · {hasEvaluationEvidence ? formatRate(evaluation?.repeatedFailureRate, language) : "—"}</span>
        <span>{language === "fa" ? "جلسه تکمیل‌شده" : "Completed sessions"} · {formatNumber(evaluation?.completedSessions ?? 0, language)}</span>
      </div>

      {snapshot.stats?.evaluation?.comparison?.available ? (
        <div className="stats-section-summary" style={{ marginTop: "0.5rem" }}>
          <span>
            {snapshot.stats?.evaluation?.comparison?.sufficient
              ? (language === "fa" ? "مقایسه adaptive با baseline با شواهد کافی در دسترس است." : "Adaptive vs baseline comparison has sufficient evidence.")
              : (language === "fa" ? "مقایسهٔ adaptive/baseline هنوز شواهد کافی ندارد." : "Adaptive/baseline comparison does not yet have sufficient evidence.")}
          </span>
        </div>
      ) : null}

      <p className="stats-footnote">{language === "fa" ? "دقت، عملکرد مشاهده‌شده است؛ اطمینان مدل فقط قدرت شواهد را نشان می‌دهد. مقایسهٔ adaptive و baseline فقط پس از رسیدن به آستانهٔ شواهد نمایش داده می‌شود." : "Accuracy is observed performance; model confidence reflects evidence strength. Adaptive vs baseline comparisons are interpreted only after the evidence threshold is met."}</p>
    </section>
  );
}

export function StatsDialog({ open, snapshot, language, onClose, onStudyWeak }: { open: boolean; snapshot: Snapshot; language: Language; onClose: () => void; onStudyWeak?: () => void }) {
  const [catalog, setCatalog] = useState<KanjiCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [resolvedStats, setResolvedStats] = useState<Snapshot["stats"]>(snapshot.stats);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setResolvedStats(snapshot.stats);
    setStatsLoading(true);
    void getStats().then(stats => {
      if (active) setResolvedStats(stats);
    }).catch(() => {
      if (active) setResolvedStats(snapshot.stats);
    }).finally(() => {
      if (active) setStatsLoading(false);
    });
    return () => { active = false; };
  }, [open, snapshot]);

  useEffect(() => {
    if (!open || !showAdvanced) return;
    void import("./StatsAdvanced.css");
  }, [open, showAdvanced]);

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

  const effectiveSnapshot: Snapshot = { ...snapshot, stats: resolvedStats ?? snapshot.stats };
  const studiedCount = Number(effectiveSnapshot.stats?.studiedCount ?? 0);
  const deckSize = Number(effectiveSnapshot.stats?.deckSize ?? 0);
  const coverage = deckSize ? Math.round(Math.max(0, Math.min(1, studiedCount / deckSize)) * 100) : 0;
  const streak = Number(effectiveSnapshot.stats?.currentStreak ?? 0);
  const totalReviews = Number(effectiveSnapshot.stats?.totalReviews ?? 0);
  const reviewsDueToday = effectiveSnapshot.dailySummary?.dueCount;

  const dialogRef = usePageDialog(open, onClose);
  if (!open) return null;

  return (
    <dialog ref={dialogRef} className="dialog secondary-page-dialog stats-dialog stats-dashboard" aria-labelledby="stats-title" aria-busy={statsLoading}>
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
        <Metric label={t("todayReviews", language)} value={reviewsDueToday == null || !Number.isFinite(Number(reviewsDueToday)) ? "—" : formatNumber(Math.max(0, Number(reviewsDueToday)), language)} />
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

      <div className="stats-dashboard-scroll">
        {showAdvanced ? <AdvancedStatsSection snapshot={effectiveSnapshot} language={language} /> : null}

        <ActivitySection snapshot={effectiveSnapshot} language={language} />
        <MasterySection snapshot={effectiveSnapshot} language={language} />
        <SkillsSection snapshot={effectiveSnapshot} language={language} />
        <AttentionSection catalog={catalog} language={language} onStudyWeak={onStudyWeak} />
      </div>
    </dialog>
  );
}
