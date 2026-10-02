import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { t, type Language } from "../i18n";
import {
  canProceedFromPlacement,
  canProceedFromStartingPoint,
  createInitialOnboardingProgress,
  getVisibleSteps,
  normalizeDailyNew,
  sanitizeOnboardingProgress,
  type OnboardingCompletion,
  type OnboardingDraft,
  type OnboardingProgress,
  type OnboardingStep,
  type PlacementAnswer,
  type PlacementQuestion,
  type StartingPointChoice,
} from "./onboarding-model";

export type OnboardingFlowProps = {
  language: Language;
  placementQuestions?: PlacementQuestion[];
  placementLoading?: boolean;
  placementError?: string;
  onRetryPlacement?: () => void;
  onPlacementComplete?: (answers: PlacementAnswer[]) => string | null;
  initialProgress?: OnboardingProgress | null;
  busy?: boolean;
  onClose?: () => void;
  onSkip?: () => void;
  onProgressChange?: (progress: OnboardingProgress) => void;
  onComplete?: (completion: OnboardingCompletion) => Promise<void> | void;
  onCreateAccount?: (draft: OnboardingDraft) => Promise<void> | void;
  onSignIn?: () => Promise<void> | void;
};

function ChoiceCard({
  selected,
  title,
  hint,
  onSelect,
}: {
  selected: boolean;
  title: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button className={"kanji5-onboarding-choice" + (selected ? " is-selected" : "")} type="button" aria-pressed={selected} onClick={onSelect}>
      <span className="kanji5-onboarding-choice-check" aria-hidden="true">{selected ? "✓" : ""}</span>
      <span className="kanji5-onboarding-choice-copy">
        <strong>{title}</strong>
        <small>{hint}</small>
      </span>
    </button>
  );
}

function Progress({
  step,
  steps,
  language,
}: {
  step: OnboardingStep;
  steps: OnboardingStep[];
  language: Language;
}) {
  const current = Math.max(0, steps.indexOf(step));
  const progress = steps.length ? ((current + 1) / steps.length) * 100 : 0;
  return (
    <div className="kanji5-onboarding-progress" aria-label={(current + 1) + " / " + steps.length}>
      <span>{language === "fa" ? String(current + 1).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) : current + 1}</span>
      <i aria-hidden="true" />
      <span>{language === "fa" ? String(steps.length).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) : steps.length}</span>
      <div className="kanji5-onboarding-progress-track" aria-hidden="true"><span style={{ width: progress + "%" }} /></div>
    </div>
  );
}

export function OnboardingFlow({
  language,
  placementQuestions = [],
  placementLoading = false,
  placementError = "",
  onRetryPlacement,
  onPlacementComplete,
  initialProgress,
  busy = false,
  onClose,
  onSkip,
  onProgressChange,
  onComplete,
  onCreateAccount,
  onSignIn,
}: OnboardingFlowProps) {
  const restored = useMemo(
    () => sanitizeOnboardingProgress(initialProgress ?? createInitialOnboardingProgress()),
    [initialProgress],
  );
  const [draft, setDraft] = useState<OnboardingDraft>(restored.draft);
  const [step, setStep] = useState<OnboardingStep>(restored.step);
  const [placementIndex, setPlacementIndex] = useState(restored.placementIndex);
  const [placementAnswer, setPlacementAnswer] = useState(restored.placementAnswer);
  const [completedPlacement, setCompletedPlacement] = useState(restored.completedPlacement);
  const [completing, setCompleting] = useState(false);
  const swipeRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  const steps = useMemo(() => getVisibleSteps(draft), [draft]);
  const currentQuestion = placementQuestions[placementIndex];

  useEffect(() => {
    const progress: OnboardingProgress = {
      draft,
      step,
      placementIndex,
      placementAnswer,
      completedPlacement,
    };
    onProgressChange?.(progress);
  }, [draft, step, placementIndex, placementAnswer, completedPlacement, onProgressChange]);

  useEffect(() => {
    if (step !== "placement" || currentQuestion) return;
    setPlacementAnswer("");
  }, [currentQuestion, step]);

  const advance = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < 0 || currentIndex >= steps.length - 1) return;
    setStep(steps[currentIndex + 1]);
  };

  const goBack = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex <= 0) return;
    if (step === "placement" && placementIndex > 0) {
      const nextIndex = placementIndex - 1;
      setPlacementIndex(nextIndex);
      setPlacementAnswer(
        draft.placementAnswers.find(answer => answer.questionId === placementQuestions[nextIndex]?.id)?.optionId ?? "",
      );
      return;
    }
    setStep(steps[currentIndex - 1]);
  };

  const chooseStartingPoint = (value: StartingPointChoice) => {
    setDraft(current => ({
      ...current,
      startingPoint: value,
      placementAnswers: value === "assess" ? current.placementAnswers : [],
      suggestedLevel: value === "beginner" ? "N5" : value === "some-knowledge" ? "N4" : null,
    }));
    setPlacementIndex(0);
    setPlacementAnswer("");
    setCompletedPlacement(false);
  };

  const answerPlacement = () => {
    if (!currentQuestion || !canProceedFromPlacement(currentQuestion, placementAnswer)) return;
    const nextAnswer: PlacementAnswer = { questionId: currentQuestion.id, optionId: placementAnswer };
    const answers = [
      ...draft.placementAnswers.filter(answer => answer.questionId !== currentQuestion.id),
      nextAnswer,
    ];
    setDraft(current => ({ ...current, placementAnswers: answers }));
    if (placementIndex + 1 < placementQuestions.length) {
      const nextIndex = placementIndex + 1;
      setPlacementIndex(nextIndex);
      setPlacementAnswer(
        answers.find(answer => answer.questionId === placementQuestions[nextIndex]?.id)?.optionId ?? "",
      );
      return;
    }
    const suggestedLevel = onPlacementComplete?.(answers) ?? "N5";
    setCompletedPlacement(true);
    setDraft(current => ({ ...current, placementAnswers: answers, suggestedLevel }));
    setStep("placement-result");
  };

  const setDailyNew = (value: number) => {
    setDraft(current => ({ ...current, dailyNew: normalizeDailyNew(value) }));
  };

  const complete = async (mode: "guest" | "account") => {
    if (completing || busy) return;
    setCompleting(true);
    try {
      await onComplete?.({
        mode,
        draft: {
          ...draft,
          dailyNew: normalizeDailyNew(draft.dailyNew),
          suggestedLevel: draft.suggestedLevel ?? null,
        },
      });
    } finally {
      setCompleting(false);
    }
  };

  const handleSkip = () => {
    if (busy || completing) return;
    if (onSkip) onSkip();
    else onClose?.();
  };

  const startOverPlacement = () => {
    if (!placementQuestions.length) return;
    setPlacementIndex(0);
    setPlacementAnswer("");
    setCompletedPlacement(false);
    setDraft(current => ({ ...current, placementAnswers: [], suggestedLevel: null }));
    setStep("placement");
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (busy || completing || (event.pointerType === "mouse" && event.button !== 0)) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button,input,select,textarea,a")) {
      swipeRef.current.active = false;
      return;
    }
    swipeRef.current = { x: event.clientX, y: event.clientY, active: true };
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const start = swipeRef.current;
    swipeRef.current.active = false;
    if (!start.active || busy || completing) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    if (dx < 0) {
      const canNext =
        step === "welcome" ||
        step === "learning-loop" ||
        (step === "starting-point" && canProceedFromStartingPoint(draft)) ||
        (step === "placement" && Boolean(placementAnswer)) ||
        (step === "placement-result" && completedPlacement) ||
        (step === "daily-rhythm" && Boolean(draft.dailyNew));
      if (canNext) {
        if (step === "placement") answerPlacement();
        else advance();
      }
    } else {
      goBack();
    }
  };

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <section className="kanji5-onboarding-panel">
            <p className="kanji5-onboarding-eyebrow">{t("onboardingWelcomeEyebrow", language)}</p>
            <h1>{t("onboardingWelcomeTitle", language)}</h1>
            <p className="kanji5-onboarding-body">{t("onboardingWelcomeBody", language)}</p>
            <div className="kanji5-onboarding-hero-mark" aria-hidden="true" lang="ja">漢</div>
            <button className="kanji5-onboarding-primary" type="button" onClick={advance} disabled={busy || completing}>{t("onboardingStart", language)}</button>
          </section>
        );
      case "learning-loop":
        return (
          <section className="kanji5-onboarding-panel">
            <p className="kanji5-onboarding-eyebrow">{t("onboardingLoopEyebrow", language)}</p>
            <h1>{t("onboardingLoopTitle", language)}</h1>
            <p className="kanji5-onboarding-body">{t("onboardingLoopBody", language)}</p>
            <div className="kanji5-onboarding-loop" aria-label={t("learningLoop", language)}>
              <div><span>1</span><strong>{t("onboardingLearn", language)}</strong></div>
              <b aria-hidden="true">→</b>
              <div><span>2</span><strong>{t("onboardingRecall", language)}</strong></div>
              <b aria-hidden="true">→</b>
              <div><span>3</span><strong>{t("onboardingReview", language)}</strong></div>
            </div>
            <button className="kanji5-onboarding-primary" type="button" onClick={advance} disabled={busy || completing}>{t("onboardingNext", language)}</button>
          </section>
        );
      case "starting-point":
        return (
          <section className="kanji5-onboarding-panel kanji5-onboarding-panel-wide">
            <p className="kanji5-onboarding-eyebrow">{t("onboardingStartPointEyebrow", language)}</p>
            <h1>{t("onboardingStartPointTitle", language)}</h1>
            <p className="kanji5-onboarding-body">{t("onboardingStartPointBody", language)}</p>
            <div className="kanji5-onboarding-choices">
              <ChoiceCard selected={draft.startingPoint === "beginner"} title={t("onboardingBeginner", language)} hint={t("onboardingBeginnerHint", language)} onSelect={() => chooseStartingPoint("beginner")} />
              <ChoiceCard selected={draft.startingPoint === "some-knowledge"} title={t("onboardingSomeKnowledge", language)} hint={t("onboardingSomeKnowledgeHint", language)} onSelect={() => chooseStartingPoint("some-knowledge")} />
              <ChoiceCard selected={draft.startingPoint === "assess"} title={t("onboardingAssess", language)} hint={t("onboardingAssessHint", language)} onSelect={() => chooseStartingPoint("assess")} />
            </div>
            <div className="kanji5-onboarding-actions">
              <button className="kanji5-onboarding-ghost" type="button" onClick={goBack} disabled={busy || completing}>{t("onboardingBack", language)}</button>
              <button className="kanji5-onboarding-primary" type="button" onClick={advance} disabled={busy || completing || !canProceedFromStartingPoint(draft)}>{t("onboardingNext", language)}</button>
            </div>
          </section>
        );
      case "placement":
        if (!currentQuestion) {
          return (
            <section className="kanji5-onboarding-panel kanji5-onboarding-panel-wide">
              <p className="kanji5-onboarding-eyebrow">{t("onboardingPlacementEyebrow", language)}</p>
              <h1>{t("onboardingPlacementTitle", language)}</h1>
              {placementLoading ? <p className="kanji5-onboarding-body">{t("onboardingPlacementLoading", language)}</p> : null}
              {placementError ? <>
                <p className="kanji5-onboarding-body" role="alert">{t("onboardingPlacementUnavailable", language)}</p>
                <button className="kanji5-onboarding-secondary" type="button" onClick={onRetryPlacement} disabled={busy || completing || !onRetryPlacement}>{t("onboardingPlacementRetry", language)}</button>
              </> : null}
              {!placementLoading && !placementError && placementQuestions.length === 0 ? <p className="kanji5-onboarding-body">{t("onboardingPlacementLoading", language)}</p> : null}
              <div className="kanji5-onboarding-actions">
                <button className="kanji5-onboarding-ghost" type="button" onClick={goBack} disabled={busy || completing}>{t("onboardingBack", language)}</button>
              </div>
            </section>
          );
        }
        return (
          <section className="kanji5-onboarding-panel kanji5-onboarding-panel-wide">
            <p className="kanji5-onboarding-eyebrow">{t("onboardingPlacementEyebrow", language)}</p>
            <h1>{t("onboardingPlacementTitle", language)}</h1>
            <p className="kanji5-onboarding-question-meta">{t("onboardingQuestionLabel", language)} {placementIndex + 1} / {placementQuestions.length}{currentQuestion.level ? " · " + currentQuestion.level : ""}</p>
            <div className="kanji5-onboarding-stimulus" lang="ja">{currentQuestion.stimulus}</div>
            <p className="kanji5-onboarding-question">{currentQuestion.prompt}</p>
            <div className="kanji5-onboarding-option-grid">
              {currentQuestion.options.map(option => (
                <button key={option.id} className={"kanji5-onboarding-option" + (placementAnswer === option.id ? " is-selected" : "")} type="button" aria-pressed={placementAnswer === option.id} disabled={busy || completing} onClick={() => setPlacementAnswer(option.id)}>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
            <div className="kanji5-onboarding-actions">
              <button className="kanji5-onboarding-ghost" type="button" onClick={goBack} disabled={busy || completing}>{t("onboardingBack", language)}</button>
              <button className="kanji5-onboarding-primary" type="button" onClick={answerPlacement} disabled={busy || completing || !placementAnswer}>{placementIndex + 1 >= placementQuestions.length ? t("onboardingPlacementFinish", language) : t("onboardingPlacementNext", language)}</button>
            </div>
          </section>
        );
      case "placement-result":
        return (
          <section className="kanji5-onboarding-panel">
            <p className="kanji5-onboarding-eyebrow">{t("onboardingPlacementResultEyebrow", language)}</p>
            <h1>{t("onboardingPlacementResultTitle", language)}</h1>
            <p className="kanji5-onboarding-body">{t("onboardingPlacementResultBody", language)}</p>
            <div className="kanji5-onboarding-result">
              <span>{t("onboardingPlacementRecommended", language)}</span>
              <strong>{draft.suggestedLevel ?? "N5"}</strong>
            </div>
            <div className="kanji5-onboarding-actions">
              <button className="kanji5-onboarding-ghost" type="button" onClick={startOverPlacement} disabled={busy || completing || !placementQuestions.length}>{t("onboardingPlacementRestart", language)}</button>
              <button className="kanji5-onboarding-primary" type="button" onClick={advance} disabled={busy || completing || !completedPlacement}>{t("onboardingPlacementUse", language)}</button>
            </div>
          </section>
        );
      case "daily-rhythm":
        return (
          <section className="kanji5-onboarding-panel">
            <p className="kanji5-onboarding-eyebrow">{t("onboardingRhythmEyebrow", language)}</p>
            <h1>{t("onboardingRhythmTitle", language)}</h1>
            <p className="kanji5-onboarding-body">{t("onboardingRhythmBody", language)}</p>
            <div className="kanji5-onboarding-range">
              {[5, 10, 15].map(value => (
                <button key={value} className={"kanji5-onboarding-range-option" + (draft.dailyNew === value ? " is-selected" : "")} type="button" aria-pressed={draft.dailyNew === value} disabled={busy || completing} onClick={() => setDailyNew(value)}>
                  <strong>{value}</strong>
                  <span>{t("onboardingDailyNew", language)}</span>
                </button>
              ))}
            </div>
            <p className="kanji5-onboarding-footnote">{t("onboardingDailyNewHint", language)}</p>
            <div className="kanji5-onboarding-actions">
              <button className="kanji5-onboarding-ghost" type="button" onClick={goBack} disabled={busy || completing}>{t("onboardingBack", language)}</button>
              <button className="kanji5-onboarding-primary" type="button" onClick={advance} disabled={busy || completing}>{t("onboardingNext", language)}</button>
            </div>
          </section>
        );
      case "account":
        return (
          <section className="kanji5-onboarding-panel">
            <p className="kanji5-onboarding-eyebrow">{t("onboardingAccountEyebrow", language)}</p>
            <h1>{t("onboardingAccountTitle", language)}</h1>
            <p className="kanji5-onboarding-body">{t("onboardingAccountBody", language)}</p>
            <div className="kanji5-onboarding-account-actions">
              <button className="kanji5-onboarding-primary" type="button" disabled={busy || completing} onClick={() => onCreateAccount ? void onCreateAccount(draft) : void complete("account")}>{t("createAccountAction", language)}</button>
              {onSignIn ? <button className="kanji5-onboarding-secondary" type="button" disabled={busy || completing} onClick={() => void onSignIn()}>{t("signIn", language)}</button> : null}
              <button className="kanji5-onboarding-secondary" type="button" disabled={busy || completing} onClick={() => void complete("guest")}>{t("onboardingContinueGuest", language)}</button>
            </div>
            <p className="kanji5-onboarding-footnote">{t("onboardingGuestHint", language)}</p>
          </section>
        );
    }
  };

  return (
    <div className="kanji5-onboarding-root" dir={language === "fa" ? "rtl" : "ltr"} data-testid="onboarding-flow">
      <header className="kanji5-onboarding-header">
        <div className="kanji5-onboarding-brand" aria-label={t("onboardingBrand", language)}>
          <span lang="ja" aria-hidden="true">学</span>
          <strong>Kanji5</strong>
        </div>
        <Progress step={step} steps={steps} language={language} />
        {onClose || onSkip ? <button className="kanji5-onboarding-close" type="button" aria-label={t("onboardingClose", language)} onClick={handleSkip} disabled={busy || completing}>×</button> : null}
      </header>
      <main className="kanji5-onboarding-main" aria-live="polite" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        {renderStep()}
      </main>
      <footer className="kanji5-onboarding-footer">
        {step !== "welcome" ? <button className="kanji5-onboarding-footer-action" type="button" onClick={goBack} disabled={busy || completing}>{t("onboardingBack", language)}</button> : <span />}
        {step !== "account" ? <button className="kanji5-onboarding-footer-action" type="button" onClick={handleSkip} disabled={busy || completing}>{t("onboardingSkip", language)}</button> : <span />}
      </footer>
    </div>
  );
}
