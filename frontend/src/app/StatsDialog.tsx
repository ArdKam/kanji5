import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { listKanji, type KanjiCatalogItem, type Snapshot } from "./engine";
import { usePageDialog } from "./usePageDialog";

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="stats-metric"><span>{label}</span><strong>{value}</strong>{hint ? <small>{hint}</small> : null}</div>;
}

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
    <section className="stats-section stats-activity" aria-labelledby="stats-activity-title">
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
            <span>{language === "fa" ? formatNumber(average, language) + " مرور در روز به‌طور میانگین" : average.toFixed(1) + " reviews/day on average"}</span>
            <span>{language === "fa" ? "امروز" : "Today"} · {formatNumber(counts[todayIndex] ?? 0, language)}</span>
          </div>
        </>
      ) : <p className="empty-text">{language === "fa" ? "هنوز داده‌ای برای نمایش فعالیت وجود ندارد." : "There is not enough activity data to show yet."}</p>}
    </section>
  );
}

function MasterySection({ catalog, loading, language }: { catalog: KanjiCatalogItem[]; loading: boolean; language: Language }) {
  const mastery = useMemo(() => {
    const groups = { unseen: 0, learning: 0, attention: 0, stable: 0, mastered: 0 };
    const studied = catalog.filter(item => item.state !== "unseen");
    for (const item of catalog) {
      switch (item.state) {
        case "mastered": groups.mastered++; break;
        case "stable": groups.stable++; break;
        case "weak":
        case "recovering": groups.attention++; break;
        case "introduced":
        case "learning": groups.learning++; break;
        default: groups.unseen++;
      }
    }
    const average = studied.length
      ? studied.reduce((sum, item) => sum + Math.max(0, Math.min(1, Number(item.mastery) || 0)), 0) / studied.length
      : 0;
    return { ...groups, average, total: catalog.length };
  }, [catalog]);

  const items = [
    ["unseen", mastery.unseen, t("masteryUnseen", language)],
    ["learning", mastery.learning, t("masteryLearning", language)],
    ["attention", mastery.attention, t("masteryNeedsAttention", language)],
    ["stable", mastery.stable, t("masteryStable", language)],
    ["mastered", mastery.mastered, t("masteryMastered", language)],
  ] as const;

  return (
    <section className="stats-section" aria-labelledby="stats-mastery-title">
      <div className="stats-section-heading">
        <div><p className="eyebrow">{language === "fa" ? "تسلط" : "Mastery"}</p><h3 id="stats-mastery-title">{language === "fa" ? "توزیع وضعیت کانجی‌ها" : "Kanji mastery"}</h3></div>
        <div className="stats-section-summary"><strong>{formatNumber(Math.round(mastery.average * 100), language)}%</strong><span>{language === "fa" ? "تسلط کانجی‌های مطالعه‌شده" : "studied mastery"}</span></div>
      </div>
      {loading ? (
        <div className="stats-mastery-skeleton" aria-hidden="true"><span /><span /><span /></div>
      ) : catalog.length ? (
        <>
          <div className="stats-mastery-bar" role="img" aria-label={items.map(([, count, label]) => label + " " + formatNumber(count, language)).join(" · ")}>
            {items.map(([key, count]) => <span key={key} className={"stats-mastery-segment " + key} style={{ width: (count / Math.max(1, mastery.total)) * 100 + "%" }} />)}
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
          const value = Math.round(Math.max(0, Math.min(1, Number(skill.confidence ?? skill.accuracy) || 0)) * 100);
          const stateLabel = skill.state === "weak" ? t("masteryNeedsAttention", language) : skill.state === "stable" ? t("masteryStable", language) : skill.state === "mastered" ? t("masteryMastered", language) : t("masteryLearning", language);
          return <div className="stats-skill-row" key={key}>
            <div className="stats-skill-label"><span>{skillLabels[key]}</span><strong>{formatNumber(value, language)}%</strong></div>
            <div className="stats-skill-track" aria-hidden="true"><span style={{ width: value + "%" }} /></div>
            <span className="stats-skill-state">{skill.state ? stateLabel : "—"}</span>
          </div>;
        })}
      </div>
      <p className="stats-footnote">{t("modelConfidence", language)}</p>
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

export function StatsDialog({ open, snapshot, language, onClose, onStudyWeak }: { open: boolean; snapshot: Snapshot; language: Language; onClose: () => void; onStudyWeak?: () => void }) {
  const [catalog, setCatalog] = useState<KanjiCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);

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

      <ActivitySection snapshot={snapshot} language={language} />
      <MasterySection catalog={catalog} loading={loading} language={language} />
      <SkillsSection snapshot={snapshot} language={language} />
      <AttentionSection catalog={catalog} language={language} onStudyWeak={onStudyWeak} />
    </dialog>
  );
}
