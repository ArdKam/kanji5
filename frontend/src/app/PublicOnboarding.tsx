import { useEffect, useState } from "react";
import { t, type Language } from "./i18n";

const ONBOARDING_KEY = "kanji5-public-onboarding-v1";

function readSeen() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === "seen";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(ONBOARDING_KEY, "seen");
  } catch {
    // Local storage is convenience state only; onboarding remains dismissible.
  }
}

export function PublicOnboarding({
  language,
  dailyGoal,
  returningUser,
  busy,
  onStartLearning,
  onOpenAccount,
  onSetDailyGoal,
}: {
  language: Language;
  dailyGoal: number;
  returningUser: boolean;
  busy?: boolean;
  onStartLearning: () => Promise<void> | void;
  onOpenAccount: () => void;
  onSetDailyGoal: (value: number) => Promise<void> | void;
}) {
  const [seen, setSeen] = useState(readSeen);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    if (returningUser && !seen) {
      markSeen();
      setSeen(true);
    }
  }, [returningUser, seen]);

  if (seen || returningUser) return null;

  const selectGoal = async (value: number) => {
    if (savingGoal || value === dailyGoal) return;
    setSavingGoal(true);
    try {
      await onSetDailyGoal(value);
    } finally {
      setSavingGoal(false);
    }
  };

  const dismiss = () => {
    markSeen();
    setSeen(true);
  };

  const start = async () => {
    markSeen();
    setSeen(true);
    await onStartLearning();
  };

  return (
    <section className="surface card public-onboarding" aria-labelledby="public-onboarding-title">
      <div>
        <p className="eyebrow red">{t("onboardingEyebrow", language)}</p>
        <h2 id="public-onboarding-title">{t("onboardingTitle", language)}</h2>
        <p className="subtitle">{t("onboardingIntro", language)}</p>
        <p className="eyebrow">{t("learningLoop", language)}</p>
        <div className="actions" aria-label={t("learningLoop", language)}>
          <span className="badge">{t("learning", language)}</span><span aria-hidden="true">→</span>
          <span className="badge">{t("activeRecall", language)}</span><span aria-hidden="true">→</span>
          <span className="badge">{t("learningReviewLabel", language)}</span>
        </div>
      </div>

      <div className="setting-control-row">
        <span className="setting-copy">
          <span className="setting-label">{t("onboardingGoalTitle", language)}</span>
          <span className="setting-description">{t("onboardingGoalHint", language)}</span>
        </span>
        <div className="actions" role="group" aria-label={t("dailyGoal", language)}>
          {[10, 20, 30].map(value => (
            <button
              key={value}
              className={"button secondary" + (dailyGoal === value ? " active" : "")}
              type="button"
              disabled={busy || savingGoal}
              aria-pressed={dailyGoal === value}
              onClick={() => void selectGoal(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="actions">
        <button className="button primary" type="button" disabled={busy} onClick={() => void start()}>
          {t("onboardingStart", language)}
        </button>
        <button className="button secondary" type="button" disabled={busy} onClick={() => { dismiss(); onOpenAccount(); }}>
          {t("onboardingAccount", language)}
        </button>
        <button className="public-onboarding-dismiss" type="button" disabled={busy} onClick={dismiss}>
          {t("onboardingLater", language)}
        </button>
      </div>

      <p className="subtitle">{t("guestModeHint", language)}</p>
    </section>
  );
}
