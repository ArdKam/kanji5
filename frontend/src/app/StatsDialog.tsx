import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { listKanji, type KanjiCatalogItem, type Snapshot } from "./engine";
import { usePageDialog } from "./usePageDialog";

function StatRow({ label, value }: { label: string; value: string }) {
  return <div className="stat-row"><span>{label}</span><strong>{value}</strong></div>;
}
function SevenDayActivity({ snapshot, language }: { snapshot: Snapshot; language: Language }) {
  const days = snapshot.stats?.last7 ?? [];
  const max = Math.max(1, ...days.map(day => Math.max(0, Number(day.count) || 0)));
  const total = days.reduce((sum, day) => sum + Math.max(0, Number(day.count) || 0), 0);

  if (!days.length) {
    return (
      <section className="stats-activity-section" aria-labelledby="stats-seven-day-title">
        <div className="stats-section-heading">
          <div>
            <p className="eyebrow">{language === "fa" ? "فعالیت" : "Activity"}</p>
            <h3 id="stats-seven-day-title">{t("sevenDayActivity", language)}</h3>
          </div>
        </div>
        <p className="empty-text">{language === "fa" ? "هنوز داده‌ای برای نمایش فعالیت ۷ روز اخیر وجود ندارد." : "There is not enough activity data to show the last 7 days yet."}</p>
      </section>
    );
  }

  return (
    <section className="stats-activity-section" aria-labelledby="stats-seven-day-title">
      <div className="stats-section-heading">
        <div>
          <p className="eyebrow">{language === "fa" ? "فعالیت" : "Activity"}</p>
          <h3 id="stats-seven-day-title">{t("sevenDayActivity", language)}</h3>
        </div>
        <div className="stats-activity-total">
          <span>{t("reviewsCount", language)}</span>
          <strong>{formatNumber(total, language)}</strong>
        </div>
      </div>
      <div className="activity-chart" role="img" aria-label={days.map(day => String(day.label ?? "—") + " " + formatNumber(Math.max(0, Number(day.count) || 0), language)).join(" · ")}>
        {days.map((day, index) => {
          const count = Math.max(0, Number(day.count) || 0);
          const height = Math.max(6, Math.round(count / max * 100));
          return (
            <div className="activity-bar-wrap" key={(day.label ?? "") + index}>
              <div className="activity-count">{formatNumber(count, language)}</div>
              <div className="activity-bar-track" aria-hidden="true"><span style={{ height: height + "%" }} /></div>
              <div className="activity-label">{String(day.label ?? "—")}</div>
            </div>
          );
        })}
      </div>
      <p className="stats-chart-note">{language === "fa" ? "تعداد مرورهای ثبت‌شده در هر روز" : "Recorded reviews for each day"}</p>
    </section>
  );
}


export function StatsDialog({ open, snapshot, language, onClose }: { open: boolean; snapshot: Snapshot; language: Language; onClose: () => void }) {
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

  const mastery = useMemo(() => {
    const total = catalog.length;
    if (!total) return { average: 0, mastered: 0, stable: 0, learning: 0, attention: 0, unseen: 0, buckets: [] as { key: string; count: number; label: string }[] };
    const count = (name: string) => catalog.filter(item => item.state === name).length;
    const buckets = [
      { key: "low", count: catalog.filter(item => item.mastery < 0.25).length, label: t("masteryRangeLow", language) },
      { key: "developing", count: catalog.filter(item => item.mastery >= 0.25 && item.mastery < 0.5).length, label: t("masteryRangeDeveloping", language) },
      { key: "strong", count: catalog.filter(item => item.mastery >= 0.5 && item.mastery < 0.75).length, label: t("masteryRangeStrong", language) },
      { key: "mastered", count: catalog.filter(item => item.mastery >= 0.75).length, label: t("masteryRangeMastered", language) },
    ];
    return {
      average: catalog.reduce((sum, item) => sum + Math.max(0, Math.min(1, Number(item.mastery) || 0)), 0) / total,
      mastered: count("mastered"),
      stable: count("stable"),
      learning: count("learning") + count("introduced"),
      attention: count("weak") + count("recovering"),
      unseen: count("unseen"),
      buckets,
    };
  }, [catalog, language]);

  const dialogRef = usePageDialog(open, onClose);

  if (!open) return null;

  return (
    <dialog ref={dialogRef} className="dialog secondary-page-dialog stats-dialog" aria-labelledby="stats-title">
      <button className="dialog-close" type="button" aria-label={t("close", language)} onClick={onClose}>×</button>
      <h2 id="stats-title">{t("stats", language)}</h2>
      <div className="dialog-grid">
        <StatRow label={language === "fa" ? "کل مرورها" : "Total reviews"} value={formatNumber(snapshot?.stats?.totalReviews ?? 0, language)} />
        <StatRow label={language === "fa" ? "مرورهای غیر Again" : "Non-Again reviews"} value={formatNumber(Math.round(Math.max(0, Math.min(1, Number(snapshot?.stats?.nonAgainRate) || 0)) * 100), language) + (language === "fa" ? "٪" : "%")} />
        <StatRow label={language === "fa" ? "کانجی مطالعه‌شده" : "Kanji studied"} value={formatNumber(snapshot?.stats?.studiedCount ?? 0, language) + " / " + formatNumber(snapshot?.stats?.deckSize ?? 0, language)} />
        <StatRow label={language === "fa" ? "رشتهٔ فعلی" : "Current streak"} value={formatNumber(snapshot?.stats?.currentStreak ?? 0, language) + " 🔥"} />
        <StatRow label={language === "fa" ? "طولانی‌ترین رشته" : "Longest streak"} value={formatNumber(snapshot?.stats?.longestStreak ?? 0, language) + " 🔥"} />
        <StatRow label="Leech" value={formatNumber(snapshot?.stats?.leechCount ?? 0, language)} />
      </div>

      <SevenDayActivity snapshot={snapshot} language={language} />

      <section className="mastery-map-summary stats-mastery-summary" aria-labelledby="stats-kanji-mastery-title">
        <div className="mastery-map-summary-head">
          <div>
            <p className="eyebrow">{language === "fa" ? "تسلط کانجی" : "Kanji mastery"}</p>
            <h3 id="stats-kanji-mastery-title">{language === "fa" ? "نمای کلی تسلط بر کانجی‌های جویو" : "Jōyō Kanji mastery overview"}</h3>
          </div>
          <div className="mastery-map-average">
            <span>{t("masteryAverage", language)}</span>
            <strong>{formatNumber(Math.round(mastery.average * 100), language)}%</strong>
          </div>
        </div>
        <div className="mastery-map-metrics">
          <div className="mastery-map-metric"><span className="mastery-swatch mastered" aria-hidden="true" /><strong>{formatNumber(mastery.mastered, language)}</strong><span>{t("masteryMastered", language)}</span></div>
          <div className="mastery-map-metric"><span className="mastery-swatch stable" aria-hidden="true" /><strong>{formatNumber(mastery.stable, language)}</strong><span>{t("masteryStable", language)}</span></div>
          <div className="mastery-map-metric"><span className="mastery-swatch learning" aria-hidden="true" /><strong>{formatNumber(mastery.learning, language)}</strong><span>{t("masteryLearning", language)}</span></div>
          <div className="mastery-map-metric"><span className="mastery-swatch attention" aria-hidden="true" /><strong>{formatNumber(mastery.attention, language)}</strong><span>{t("masteryNeedsAttention", language)}</span></div>
          <div className="mastery-map-metric"><span className="mastery-swatch unseen" aria-hidden="true" /><strong>{formatNumber(mastery.unseen, language)}</strong><span>{t("masteryUnseen", language)}</span></div>
        </div>
        {loading ? <p className="empty-text" role="status">{t("dictionaryLoading", language)}</p> : (
          <div className="mastery-distribution" aria-label={t("masteryDistribution", language)}>
            <div className="mastery-distribution-title">{t("masteryDistribution", language)}</div>
            <div className="mastery-distribution-bar" role="img" aria-label={mastery.buckets.map(bucket => bucket.label + " " + formatNumber(bucket.count, language)).join(" · ")}>
              {mastery.buckets.map(bucket => <span key={bucket.key} className={"mastery-distribution-segment " + bucket.key} style={{ width: (bucket.count / Math.max(1, catalog.length)) * 100 + "%" }} />)}
            </div>
            <div className="mastery-distribution-legend">
              {mastery.buckets.map(bucket => <span key={bucket.key}><i className={"mastery-distribution-dot " + bucket.key} aria-hidden="true" />{bucket.label}<strong>{formatNumber(bucket.count, language)}</strong></span>)}
            </div>
          </div>
        )}
      </section>
    </dialog>
  );
}
