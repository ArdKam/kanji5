import { useEffect, useState } from "react";
import { t, type Language } from "./i18n";
import { listKanji, type CustomStudyFilter, type KanjiCatalogItem } from "./engine";
import { CustomStudyPanel } from "./CustomStudyPanel";
import { PlacementDiagnostic } from "./PlacementDiagnostic";

export function PracticeHome({
  language,
  onStartActiveRecall,
  onStartCustomStudy,
  placementRequest = 0,
}: {
  language: Language;
  onStartActiveRecall: () => Promise<void>;
  onStartCustomStudy: (filter: CustomStudyFilter) => Promise<boolean>;
  placementRequest?: number;
}) {
  const [placementOpen, setPlacementOpen] = useState(false);
  const [catalog, setCatalog] = useState<KanjiCatalogItem[]>([]);
  const [loadingPlacement, setLoadingPlacement] = useState(false);
  const [placementError, setPlacementError] = useState("");

  const loadPlacement = async () => {
    setPlacementOpen(true);
    if (catalog.length || loadingPlacement) return;
    setLoadingPlacement(true);
    setPlacementError("");
    try {
      const result = await listKanji();
      setCatalog(result.results);
    } catch {
      setPlacementError(language === "fa" ? "آزمون تعیین سطح بارگذاری نشد." : "The placement check could not be loaded.");
    } finally {
      setLoadingPlacement(false);
    }
  };

  useEffect(() => {
    if (placementRequest <= 0) return;
    void loadPlacement();
    // The request is an explicit one-shot trigger from Settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placementRequest]);

  return (
    <section className="practice-home" aria-labelledby="practice-home-title">
      <section className="surface card practice-home-hero">
        <p className="eyebrow red">{t("activeRecallLabel", language)}</p>
        <h2 id="practice-home-title">{t("activeRecall", language)}</h2>
        <p>{language === "fa" ? "تمرین فعال را شروع کنید یا یک جلسهٔ هدفمند بسازید." : "Start active recall or build a focused study session."}</p>
        <button className="button primary practice-start-button" type="button" onClick={() => void onStartActiveRecall()}>
          {t("startExercise", language)}
        </button>
      </section>

      <CustomStudyPanel language={language} onStartCustomStudy={onStartCustomStudy} />

      <section className="surface card practice-placement-card" aria-labelledby="practice-placement-title">
        <div className="practice-home-section-heading">
          <div>
            <p className="eyebrow">{t("placementDiagnostic", language)}</p>
            <h3 id="practice-placement-title">{t("placementDiagnostic", language)}</h3>
            <p>{t("placementDiagnosticHint", language)}</p>
          </div>
          <button className="button secondary" type="button" onClick={() => void loadPlacement()} disabled={loadingPlacement}>
            {loadingPlacement ? "…" : t("startDiagnostic", language)}
          </button>
        </div>
        {placementError ? <p className="custom-study-message" role="status">{placementError}</p> : null}
        {placementOpen && !loadingPlacement && catalog.length ? <PlacementDiagnostic catalog={catalog} language={language} onStartCustomStudy={onStartCustomStudy} autoOpen /> : null}
      </section>
    </section>
  );
}
