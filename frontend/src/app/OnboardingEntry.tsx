import { useCallback, useEffect, useMemo, useState } from "react";
import { AccountDialog } from "./AccountDialog";
import {
  buildPlacementQuestions,
  scorePlacementAnswers,
  type PlacementQuestionRecord,
} from "./placement-logic";
import {
  completeOnboarding,
  readOnboardingProgress,
  writeOnboardingProgress,
} from "./onboarding";
import { OnboardingFlow } from "./onboarding";
import { t, type Language } from "./i18n";
import {
  clearTransient,
  listKanji,
  startCustomStudy,
  startLearningExperience,
  updateSettings,
  type Settings,
  type Snapshot,
} from "./engine";
import type {
  OnboardingCompletion,
  OnboardingDraft,
  OnboardingProgress,
  PlacementQuestion,
} from "./onboarding/onboarding-model";

type OnboardingEntryProps = {
  language: Language;
  snapshot: Snapshot | null;
  busy?: boolean;
  onFinished: () => void;
  onLanguageChange: (language: Language) => void;
};

function toPlacementQuestions(records: PlacementQuestionRecord[]): PlacementQuestion[] {
  return records.map(record => ({
    id: record.id,
    prompt: record.prompt,
    stimulus: record.stimulus,
    level: record.level,
    options: record.options.map(option => ({ id: option.id, label: option.label })),
  }));
}


export function OnboardingEntry({
  language,
  snapshot,
  busy: parentBusy = false,
  onFinished,
  onLanguageChange,
}: OnboardingEntryProps) {
  const [initialProgress] = useState<OnboardingProgress | null>(() => readOnboardingProgress());
  const [progress, setProgress] = useState<OnboardingProgress | null>(initialProgress);
  const [placementRecords, setPlacementRecords] = useState<PlacementQuestionRecord[]>([]);
  const [placementLoading, setPlacementLoading] = useState(false);
  const [placementError, setPlacementError] = useState("");
  const [placementRetry, setPlacementRetry] = useState(0);
  // The first-run shell must stay interactive while the authoritative engine warms in the background.
  const [busy, setBusy] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountIntent, setAccountIntent] = useState<"sign-in" | "sign-up">("sign-in");
  const [accountDraft, setAccountDraft] = useState<OnboardingDraft | null>(null);
  const [error, setError] = useState("");

  const placementQuestions = useMemo(
    () => toPlacementQuestions(placementRecords),
    [placementRecords],
  );

  useEffect(() => {
    let active = true;
    if (progress?.draft.startingPoint !== "assess") {
      setPlacementLoading(false);
      setPlacementError("");
      return () => { active = false; };
    }
    setPlacementLoading(true);
    setPlacementError("");
    void listKanji()
      .then(result => {
        if (!active) return;
        const records = buildPlacementQuestions(
          result.results,
          t("diagnosticMeaningPrompt", language),
        );
        setPlacementRecords(records);
        if (!records.length) {
          setPlacementError(t("onboardingPlacementUnavailable", language));
        }
      })
      .catch(() => {
        if (active) {
          setPlacementRecords([]);
          setPlacementError(t("onboardingPlacementUnavailable", language));
        }
      })
      .finally(() => {
        if (active) setPlacementLoading(false);
      });
    return () => {
      active = false;
    };
  }, [language, placementRetry, progress?.draft.startingPoint]);

  const handleProgressChange = useCallback((next: OnboardingProgress) => {
    setProgress(next);
    writeOnboardingProgress(next);
  }, []);

  const resolvePlacement = useCallback(
    (answers: OnboardingCompletion["draft"]["placementAnswers"]) => {
      const map = Object.fromEntries(answers.map(answer => [answer.questionId, answer.optionId]));
      return scorePlacementAnswers(placementRecords, map).suggestedLevel;
    },
    [placementRecords],
  );

  const run = useCallback(async (task: () => Promise<void>) => {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      await task();
      return true;
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "";
      setError(
        code === "KANJI5_NO_EXERCISE_AVAILABLE"
          ? (language === "fa"
            ? "برای این نقطهٔ شروع هنوز تمرین قابل‌مطالعه‌ای پیدا نشد. با شروع عادی ادامه می‌دهیم."
            : "No study cards were available for that starting point. We will continue with normal Learning.")
          : code || t("actionFailed", language),
      );
      return false;
    } finally {
      setBusy(false);
    }
  }, [busy, language]);

  const finish = useCallback(async (completion: OnboardingCompletion) => {
    const ok = await run(async () => {
      const current = (snapshot?.settings ?? {}) as Partial<Settings>;
      await updateSettings({
        dailyNew: completion.draft.dailyNew,
        retention: Number(current.retention) || 0.9,
        dailyGoal: Number(current.dailyGoal) || 20,
        leechThreshold: Number(current.leechThreshold) || 8,
        production: current.production !== false,
        vocabulary: current.vocabulary !== false,
        context: current.context !== false,
      });

      await clearTransient();

      let started = false;
      if (
        (completion.draft.startingPoint === "some-knowledge" ||
          completion.draft.startingPoint === "assess") &&
        completion.draft.suggestedLevel
      ) {
        const result = await startCustomStudy({
          level: completion.draft.suggestedLevel as "N5" | "N4" | "N3" | "N2" | "N1",
          focus: "available",
          limit: completion.draft.dailyNew,
        });
        started = Boolean(result?.started);
      }

      if (!started) {
        await startLearningExperience();
      }
    });

    if (!ok) return;
    completeOnboarding();
    setProgress(null);
    onFinished();
  }, [onFinished, run, snapshot]);

  const handleSkip = useCallback(async () => {
    const ok = await run(async () => {
      await clearTransient();
      await startLearningExperience();
    });
    if (!ok) return;
    completeOnboarding();
    setProgress(null);
    onFinished();
  }, [onFinished, run]);

  const handleCreateAccount = useCallback((draft: OnboardingDraft) => {
    setAccountDraft(draft);
    setAccountIntent("sign-up");
    setAccountOpen(true);
  }, []);

  const handleSignIn = useCallback(() => {
    setAccountDraft(progress?.draft ?? null);
    setAccountIntent("sign-in");
    setAccountOpen(true);
  }, [progress]);

  const handleAuthenticated = useCallback(() => {
    const draft = accountDraft ?? progress?.draft ?? {
      startingPoint: null,
      placementAnswers: [],
      suggestedLevel: null,
      dailyNew: 5,
    };
    setAccountOpen(false);
    void finish({ mode: "account", draft });
  }, [accountDraft, finish, progress]);

  return (
    <>
      <div className="kanji5-onboarding-entry" data-testid="onboarding-entry">
        <OnboardingFlow
          language={language}
          placementQuestions={placementQuestions}
          placementLoading={placementLoading}
          placementError={placementError}
          onRetryPlacement={() => setPlacementRetry(value => value + 1)}
          onPlacementComplete={resolvePlacement}
          initialProgress={initialProgress}
          busy={busy}
          onSkip={() => void handleSkip()}
          onProgressChange={handleProgressChange}
          onComplete={finish}
          onCreateAccount={handleCreateAccount}
          onSignIn={handleSignIn}
          onLanguageChange={onLanguageChange}
        />
        {error ? (
          <div className="kanji5-onboarding-host-error" role="alert">
            <span>{error}</span>
          </div>
        ) : null}
      </div>
      <AccountDialog
        open={accountOpen}
        language={language}
        onClose={() => setAccountOpen(false)}
        onAuthenticated={handleAuthenticated}
        initialEmailIntent={accountIntent}
      />
    </>
  );
}
