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

const ONBOARDING_STYLES = `.kanji5-onboarding-entry{position:fixed;inset:0;z-index:2100;isolation:isolate;pointer-events:auto}
.kanji5-onboarding-root{--paper:#f7f2e8;--ink:#252525;--mute:#6e6a61;--line:rgba(37,37,37,.12);--accent:#304f74;--soft:rgba(48,79,116,.1);--warm:#bb6b70;min-height:100svh;display:flex;flex-direction:column;overflow:hidden;background:radial-gradient(circle at 50% -5%,rgba(48,79,116,.07),transparent 38%),var(--paper);color:var(--ink)}
.kanji5-onboarding-root *{box-sizing:border-box}.kanji5-onboarding-header,.kanji5-onboarding-footer{width:min(1120px,100%);margin:auto}.kanji5-onboarding-header{padding:18px 24px 8px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px}.kanji5-onboarding-brand{display:flex;align-items:center;gap:10px;justify-self:start}.kanji5-onboarding-brand>span{display:grid;place-items:center;width:34px;height:34px;border:1px solid var(--line);border-radius:50%;background:#ffffff60;font-size:20px}.kanji5-onboarding-brand strong{font-size:15px}.kanji5-onboarding-progress{position:relative;display:flex;align-items:center;justify-content:center;gap:5px;min-width:90px;grid-column:2;color:var(--mute);font-size:12px}.kanji5-onboarding-progress i{width:4px;height:4px;border-radius:50%;background:currentColor}.kanji5-onboarding-progress-track{position:absolute;inset:auto 0 -10px;height:3px;border-radius:99px;overflow:hidden;background:var(--line)}.kanji5-onboarding-progress-track span{display:block;height:100%;background:var(--accent);border-radius:inherit;transition:width .2s}.kanji5-onboarding-close{grid-column:3;justify-self:end;width:38px;height:38px;border:0;border-radius:50%;background:transparent;color:var(--mute);font-size:28px;cursor:pointer}
.kanji5-onboarding-main{flex:1;display:grid;place-items:center;width:100%;padding:28px 20px 22px;overflow:auto;touch-action:pan-y;user-select:none}.kanji5-onboarding-panel{width:min(620px,100%);text-align:center;animation:onbIn .22s ease both}.kanji5-onboarding-panel-wide{width:min(760px,100%)}@keyframes onbIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.kanji5-onboarding-root[dir=ltr] .kanji5-onboarding-panel{animation-name:onbInL}@keyframes onbInL{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.kanji5-onboarding-eyebrow{margin:0 0 12px;color:var(--warm);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.kanji5-onboarding-panel h1{margin:0;font-size:clamp(30px,4vw,48px);line-height:1.12}.kanji5-onboarding-body{max-width:600px;margin:18px auto 0;color:var(--mute);font-size:16px;line-height:1.8}.kanji5-onboarding-hero-mark,.kanji5-onboarding-stimulus{display:grid;place-items:center;border:1px solid var(--line);background:#ffffff70;box-shadow:0 16px 42px #25252510}.kanji5-onboarding-hero-mark{width:132px;height:132px;margin:32px auto;border-radius:50%;font-size:72px}.kanji5-onboarding-stimulus{width:132px;height:132px;margin:4px auto 18px;border-radius:24px;font-size:70px}.kanji5-onboarding-loop{display:flex;align-items:center;justify-content:center;gap:12px;margin:32px auto;flex-wrap:wrap}.kanji5-onboarding-loop>div{min-width:120px;padding:16px 18px;border:1px solid var(--line);border-radius:18px;background:#ffffff70}.kanji5-onboarding-loop span{display:block;margin-bottom:6px;color:var(--mute);font-size:11px}.kanji5-onboarding-loop>b{color:var(--mute);font-weight:500}
.kanji5-onboarding-choices{display:grid;gap:12px;margin:28px 0}.kanji5-onboarding-choice{display:grid;grid-template-columns:28px 1fr;gap:12px;width:100%;padding:18px;border:1px solid var(--line);border-radius:18px;background:#ffffff70;color:inherit;text-align:start;cursor:pointer}.kanji5-onboarding-choice.is-selected,.kanji5-onboarding-option.is-selected,.kanji5-onboarding-range-option.is-selected{border-color:#304f7466;background:var(--soft)}.kanji5-onboarding-choice-check{display:grid;place-items:center;width:28px;height:28px;border:1px solid var(--line);border-radius:50%;color:var(--accent)}.kanji5-onboarding-choice-copy{display:grid;gap:5px}.kanji5-onboarding-choice-copy small,.kanji5-onboarding-footnote,.kanji5-onboarding-question-meta{color:var(--mute)}.kanji5-onboarding-choice-copy small{font-size:13px;line-height:1.5}
.kanji5-onboarding-question-meta{margin:10px 0 18px;font-size:12px}.kanji5-onboarding-question{margin:0 0 18px;font-size:17px;line-height:1.6}.kanji5-onboarding-option-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.kanji5-onboarding-option{min-height:62px;padding:14px 16px;border:1px solid var(--line);border-radius:16px;background:#ffffff70;color:inherit;font-size:15px;text-align:start;cursor:pointer}.kanji5-onboarding-result{display:grid;gap:7px;margin:28px auto;padding:26px;border:1px solid var(--line);border-radius:22px;background:#ffffff70}.kanji5-onboarding-result span{color:var(--mute);font-size:13px}.kanji5-onboarding-result strong{font-size:30px}.kanji5-onboarding-range{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px auto 10px}.kanji5-onboarding-range-option{display:grid;place-items:center;gap:5px;min-height:122px;border:1px solid var(--line);border-radius:20px;background:#ffffff70;color:inherit;cursor:pointer}.kanji5-onboarding-range-option strong{font-size:32px}.kanji5-onboarding-range-option span{color:var(--mute);font-size:12px}.kanji5-onboarding-account-actions{display:grid;gap:10px;width:min(420px,100%);margin:30px auto 0}
.kanji5-onboarding-primary,.kanji5-onboarding-secondary{min-height:50px;padding:12px 18px;border-radius:14px;font:inherit;font-weight:700;cursor:pointer}.kanji5-onboarding-primary{border:1px solid var(--accent);background:var(--accent);color:#fff;box-shadow:0 12px 24px #304f7428}.kanji5-onboarding-secondary{border:1px solid var(--line);background:#ffffff70;color:inherit}.kanji5-onboarding-ghost,.kanji5-onboarding-footer-action{border:0;background:transparent;color:var(--mute);font:inherit;cursor:pointer}.kanji5-onboarding-actions{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:26px}.kanji5-onboarding-actions>*{min-width:150px}.kanji5-onboarding-footnote{margin:12px auto 0;font-size:12px;line-height:1.6}.kanji5-onboarding-footer{padding:6px 24px 20px;display:flex;justify-content:space-between;min-height:54px}.kanji5-onboarding-footer-action{padding:10px 0;font-size:13px}.kanji5-onboarding-primary:focus-visible,.kanji5-onboarding-secondary:focus-visible,.kanji5-onboarding-ghost:focus-visible,.kanji5-onboarding-close:focus-visible,.kanji5-onboarding-choice:focus-visible,.kanji5-onboarding-option:focus-visible,.kanji5-onboarding-range-option:focus-visible{outline:3px solid #304f744d;outline-offset:3px}
.kanji5-onboarding-host-error{position:fixed;left:50%;bottom:20px;z-index:3;transform:translateX(-50%);max-width:min(640px,calc(100% - 32px));padding:11px 14px;border:1px solid #bb6b7042;border-radius:14px;background:#fffffff2;color:var(--mute);font-size:12px;line-height:1.5;box-shadow:0 12px 30px #2525251a;text-align:center}
@media(max-width:700px){.kanji5-onboarding-header{padding:12px 16px 7px}.kanji5-onboarding-brand strong{display:none}.kanji5-onboarding-main{padding:20px 16px 10px}.kanji5-onboarding-panel h1{font-size:31px}.kanji5-onboarding-body{font-size:15px}.kanji5-onboarding-option-grid,.kanji5-onboarding-range{grid-template-columns:1fr}.kanji5-onboarding-range-option{min-height:86px;grid-template-columns:auto 1fr;padding:16px 20px;text-align:start}.kanji5-onboarding-range-option strong{font-size:28px}.kanji5-onboarding-actions{justify-content:stretch}.kanji5-onboarding-actions>*{flex:1;min-width:0}.kanji5-onboarding-footer{padding:7px 16px 16px}}
@media(prefers-reduced-motion:reduce){.kanji5-onboarding-panel,.kanji5-onboarding-progress-track span{animation:none;transition:none}}`;

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
    <>
      <style>{ONBOARDING_STYLES}</style>
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
    </>
  );
}
