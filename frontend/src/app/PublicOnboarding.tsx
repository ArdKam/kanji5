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
    <section className="surface public-onboarding" aria-labelledby="public-onboarding-title">
      <div className="public-onboarding-copy">
        <p className="eyebrow red">{t("onboardingEyebrow", language)}</p>
        <h2 id="public-onboarding-title">{t("onboardingTitle", language)}</h2>
        <p>{t("onboardingIntro", language)}</p>
        <div className="public-onboarding-loop" aria-label={t("learningLoop", language)}>
          <span>{t("learning", language)}</span><i aria-hidden="true">→</i>
          <span>{t("activeRecall", language)}</span><i aria-hidden="true">→</i>
          <span>{t("learningReviewLabel", language)}</span>
        </div>
      </div>

      <div className="public-onboarding-goal">
        <div>
          <strong>{t("onboardingGoalTitle", language)}</strong>
          <span>{t("onboardingGoalHint", language)}</span>
        </div>
        <div className="public-onboarding-goal-options" role="group" aria-label={t("dailyGoal", language)}>
          {[10, 20, 30].map(value => (
            <button
              key={value}
              className={"button secondary" + (dailyGoal === value ? " is-selected" : "")}
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

      <div className="public-onboarding-actions">
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

      <p className="public-onboarding-footnote">{t("guestModeHint", language)}</p>
    </section>
  );
}
