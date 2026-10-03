import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
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
.kanji5-onboarding-root{--paper:#f5efe3;--ink:#262523;--mute:#6f695f;--line:rgba(38,37,35,.12);--line-strong:rgba(38,37,35,.2);--indigo:#304f74;--shu:#b56d72;--washi:rgba(255,252,246,.72);--shadow:0 28px 70px rgba(38,37,35,.12);min-height:100svh;display:flex;flex-direction:column;overflow:hidden;background:radial-gradient(circle at 18% 12%,rgba(181,109,114,.08),transparent 25%),radial-gradient(circle at 84% 16%,rgba(48,79,116,.09),transparent 32%),repeating-linear-gradient(0deg,rgba(38,37,35,.012) 0 1px,transparent 1px 4px),var(--paper);color:var(--ink)}
.kanji5-onboarding-root:before,.kanji5-onboarding-root:after{content:"";position:absolute;pointer-events:none;z-index:-1;border-radius:999px;opacity:.55}
.kanji5-onboarding-root:before{width:220px;height:220px;inset:auto -90px 8%;background:radial-gradient(circle,rgba(181,109,114,.12),transparent 68%)}
.kanji5-onboarding-root:after{width:260px;height:260px;inset:8% auto auto -120px;background:radial-gradient(circle,rgba(48,79,116,.1),transparent 68%)}
.kanji5-onboarding-root *{box-sizing:border-box}
.kanji5-onboarding-header,.kanji5-onboarding-footer{width:min(1180px,100%);margin:auto}
.kanji5-onboarding-header{padding:18px 28px 10px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px}
.kanji5-onboarding-brand{display:flex;align-items:center;gap:10px;justify-self:start}
.kanji5-onboarding-brand>span{display:grid;place-items:center;width:38px;height:38px;border:1px solid var(--line);border-radius:13px;background:rgba(255,252,246,.65);font-family:"Noto Serif JP","Hiragino Mincho ProN",serif;font-size:20px;box-shadow:0 8px 22px rgba(38,37,35,.05)}
.kanji5-onboarding-brand strong{font-size:15px;letter-spacing:.01em}
.kanji5-onboarding-progress{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;min-width:160px;color:var(--mute);font-size:11px;font-weight:800}
.kanji5-onboarding-progress i{display:none}
.kanji5-onboarding-progress-track{position:relative;inset:auto;width:116px;height:4px;border-radius:99px;overflow:hidden;background:rgba(38,37,35,.1)}
.kanji5-onboarding-progress-track span{display:block;height:100%;background:linear-gradient(90deg,var(--indigo),#466b94);border-radius:inherit;transition:width .35s cubic-bezier(.22,.75,.2,1)}
.kanji5-onboarding-root[dir=rtl] .kanji5-onboarding-progress-track span{transform-origin:right center}
.kanji5-onboarding-language{display:flex;align-items:center;gap:3px;justify-self:end;padding:3px;border:1px solid var(--line);border-radius:999px;background:rgba(255,252,246,.64);box-shadow:0 8px 22px rgba(38,37,35,.05);backdrop-filter:blur(10px)}
.kanji5-onboarding-language button{min-height:32px;padding:5px 11px;border:0;border-radius:999px;background:transparent;color:var(--mute);font:inherit;font-size:11px;font-weight:800;cursor:pointer;transition:background .18s ease,color .18s ease,transform .18s ease}
.kanji5-onboarding-language button:hover{transform:translateY(-1px)}
.kanji5-onboarding-language button.is-active{background:var(--ink);color:#fff}
.kanji5-onboarding-main{flex:1;min-height:0;width:100%;padding:22px 28px 10px;overflow:auto;overscroll-behavior:contain;touch-action:pan-y}
.kanji5-onboarding-stage{width:min(1040px,100%);min-height:min(650px,calc(100svh - 150px));margin:auto;display:grid;grid-template-columns:minmax(340px,.78fr) minmax(0,1.22fr);align-items:stretch;gap:clamp(28px,5vw,76px)}
.kanji5-onboarding-visual{position:relative;display:grid;place-items:center;min-height:460px;padding:34px;border-radius:34px;background:linear-gradient(145deg,rgba(255,252,246,.75),rgba(255,252,246,.26));border:1px solid var(--line);box-shadow:var(--shadow);overflow:hidden}
.kanji5-onboarding-visual:before,.kanji5-onboarding-visual:after{content:"";position:absolute;width:9px;height:24px;border-radius:999px;background:rgba(181,109,114,.25);transform:rotate(34deg)}
.kanji5-onboarding-visual:before{top:46px;left:54px}.kanji5-onboarding-visual:after{right:48px;bottom:54px;transform:rotate(-24deg)}
.kanji5-onboarding-visual-art{width:min(100%,390px);color:var(--ink);filter:drop-shadow(0 24px 26px rgba(38,37,35,.12))}
.kanji5-onboarding-visual-art .line{fill:none;stroke:currentColor;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.kanji5-onboarding-visual-art .soft{fill:rgba(48,79,116,.08);stroke:rgba(48,79,116,.28);stroke-width:2}.kanji5-onboarding-visual-art .shu{fill:rgba(181,109,114,.14);stroke:rgba(181,109,114,.42);stroke-width:2}.kanji5-onboarding-visual-art .paper{fill:rgba(255,252,246,.9);stroke:rgba(38,37,35,.1);stroke-width:2}
.kanji5-onboarding-visual-kanji{position:absolute;inset:50% auto auto 50%;transform:translate(-50%,-58%);font-family:"Noto Serif JP","Hiragino Mincho ProN",serif;font-size:124px;line-height:1;color:var(--ink);opacity:.08}
.kanji5-onboarding-panel-shell{display:flex;align-items:center;min-width:0}.kanji5-onboarding-step-wrap{min-width:0;transition:transform .22s cubic-bezier(.22,.75,.2,1)}
.kanji5-onboarding-panel{width:min(620px,100%);text-align:start;animation:onbEnterForward .38s cubic-bezier(.22,.75,.2,1) both}.kanji5-onboarding-stage.is-back .kanji5-onboarding-panel{animation-name:onbEnterBack}
@keyframes onbEnterForward{from{opacity:0;transform:translate3d(-22px,8px,0)}to{opacity:1;transform:none}}@keyframes onbEnterBack{from{opacity:0;transform:translate3d(22px,8px,0)}to{opacity:1;transform:none}}
.kanji5-onboarding-eyebrow{margin:0 0 13px;color:var(--shu);font-size:11px;font-weight:850;letter-spacing:.14em;text-transform:uppercase}
.kanji5-onboarding-panel h1{margin:0;max-width:17ch;font-size:clamp(34px,4.4vw,58px);line-height:1.05;letter-spacing:-.025em}
.kanji5-onboarding-body{max-width:58ch;margin:19px 0 0;color:var(--mute);font-size:16px;line-height:1.85}
.kanji5-onboarding-hero-mark,.kanji5-onboarding-stimulus{display:grid;place-items:center;border:1px solid var(--line);background:var(--washi);box-shadow:0 18px 44px rgba(38,37,35,.08)}
.kanji5-onboarding-hero-mark{width:104px;height:104px;margin:28px 0;border-radius:28px;font-family:"Noto Serif JP","Hiragino Mincho ProN",serif;font-size:62px}
.kanji5-onboarding-stimulus{width:142px;height:142px;margin:7px 0 20px;border-radius:30px;font-family:"Noto Serif JP","Hiragino Mincho ProN",serif;font-size:74px}
.kanji5-onboarding-loop{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center;gap:11px;margin:30px 0}.kanji5-onboarding-loop>div{min-height:108px;padding:18px;border:1px solid var(--line);border-radius:22px;background:var(--washi);box-shadow:0 14px 34px rgba(38,37,35,.05)}.kanji5-onboarding-loop span{display:block;margin-bottom:14px;color:var(--shu);font-size:10px;font-weight:850;letter-spacing:.12em}.kanji5-onboarding-loop b{color:var(--mute);font-size:18px;font-weight:500}
.kanji5-onboarding-choices{display:grid;gap:10px;margin:27px 0}.kanji5-onboarding-choice{position:relative;display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:13px;width:100%;padding:17px 18px;border:1px solid var(--line);border-radius:20px;background:rgba(255,252,246,.58);color:inherit;text-align:start;cursor:pointer;box-shadow:0 10px 26px rgba(38,37,35,.035);transition:border-color .18s ease,background .18s ease,transform .18s ease,box-shadow .18s ease}.kanji5-onboarding-choice:hover{transform:translateY(-2px);box-shadow:0 15px 34px rgba(38,37,35,.08)}.kanji5-onboarding-choice.is-selected{border-color:rgba(48,79,116,.42);background:linear-gradient(120deg,rgba(48,79,116,.1),rgba(255,252,246,.6));box-shadow:0 15px 34px rgba(48,79,116,.09)}
.kanji5-onboarding-choice-check{display:grid;place-items:center;width:32px;height:32px;border:1px solid var(--line-strong);border-radius:50%;color:var(--indigo);background:rgba(255,252,246,.72)}.kanji5-onboarding-choice.is-selected .kanji5-onboarding-choice-check{border-color:var(--indigo);background:var(--indigo);color:#fff}.kanji5-onboarding-choice-copy{display:grid;gap:5px;min-width:0}.kanji5-onboarding-choice-copy strong{font-size:15px}.kanji5-onboarding-choice-copy small,.kanji5-onboarding-footnote,.kanji5-onboarding-question-meta{color:var(--mute)}.kanji5-onboarding-choice-copy small{font-size:12px;line-height:1.55}.kanji5-onboarding-choice-arrow{display:grid;place-items:center;width:34px;height:34px;color:var(--mute);font-size:18px;transition:transform .18s ease}.kanji5-onboarding-root[dir=rtl] .kanji5-onboarding-choice-arrow{transform:scaleX(-1)}.kanji5-onboarding-choice:hover .kanji5-onboarding-choice-arrow{transform:translateX(3px)}.kanji5-onboarding-root[dir=rtl] .kanji5-onboarding-choice:hover .kanji5-onboarding-choice-arrow{transform:scaleX(-1) translateX(3px)}
.kanji5-onboarding-question-meta{display:flex;align-items:center;gap:9px;margin:10px 0 18px;font-size:12px;font-weight:800}.kanji5-onboarding-question-meta:after{content:"";flex:1;height:4px;border-radius:99px;background:linear-gradient(90deg,var(--indigo) 0 24%,rgba(38,37,35,.08) 24%);opacity:.75}
.kanji5-onboarding-question{margin:0 0 18px;font-size:17px;line-height:1.6}.kanji5-onboarding-option-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.kanji5-onboarding-option{min-height:66px;padding:14px 16px;border:1px solid var(--line);border-radius:18px;background:rgba(255,252,246,.62);color:inherit;font-size:15px;text-align:start;cursor:pointer;box-shadow:0 8px 22px rgba(38,37,35,.03);transition:border-color .18s ease,background .18s ease,transform .18s ease,box-shadow .18s ease}.kanji5-onboarding-option:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(38,37,35,.07)}.kanji5-onboarding-option.is-selected{border-color:rgba(48,79,116,.42);background:rgba(48,79,116,.09);box-shadow:0 11px 24px rgba(48,79,116,.08)}
.kanji5-onboarding-result{display:grid;gap:7px;margin:28px 0;padding:25px 26px;border:1px solid var(--line);border-radius:24px;background:linear-gradient(135deg,rgba(255,252,246,.82),rgba(48,79,116,.07));box-shadow:0 18px 44px rgba(38,37,35,.07)}.kanji5-onboarding-result span{color:var(--mute);font-size:12px;font-weight:800}.kanji5-onboarding-result strong{font-family:"Noto Serif JP","Hiragino Mincho ProN",serif;font-size:44px;line-height:1}.kanji5-onboarding-result-scale{display:flex;align-items:center;gap:7px;margin-top:6px}.kanji5-onboarding-result-scale span{width:13px;height:13px;border-radius:50%;background:rgba(38,37,35,.12)}.kanji5-onboarding-result-scale span.is-hit{background:var(--indigo);box-shadow:0 0 0 5px rgba(48,79,116,.1)}
.kanji5-onboarding-range{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:28px 0 10px}.kanji5-onboarding-range-option{position:relative;display:grid;place-items:start;gap:7px;min-height:136px;padding:19px;border:1px solid var(--line);border-radius:22px;background:rgba(255,252,246,.6);color:inherit;text-align:start;cursor:pointer;box-shadow:0 10px 28px rgba(38,37,35,.035);transition:background .18s ease,border-color .18s ease,transform .18s ease,box-shadow .18s ease}.kanji5-onboarding-range-option:hover{transform:translateY(-2px);box-shadow:0 16px 30px rgba(38,37,35,.08)}.kanji5-onboarding-range-option.is-selected{border-color:rgba(48,79,116,.42);background:linear-gradient(145deg,rgba(48,79,116,.1),rgba(255,252,246,.62));box-shadow:0 16px 32px rgba(48,79,116,.08)}.kanji5-onboarding-range-option strong{font-size:38px;line-height:1}.kanji5-onboarding-range-option span{color:var(--mute);font-size:11px;line-height:1.5}
.kanji5-onboarding-account-actions{display:grid;gap:9px;width:min(430px,100%);margin:30px 0 0}.kanji5-onboarding-primary,.kanji5-onboarding-secondary{min-height:52px;padding:13px 19px;border-radius:15px;font:inherit;font-weight:800;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}.kanji5-onboarding-primary{border:1px solid var(--indigo);background:var(--indigo);color:#fff;box-shadow:0 15px 28px rgba(48,79,116,.2)}.kanji5-onboarding-primary:hover{transform:translateY(-1px);box-shadow:0 19px 34px rgba(48,79,116,.25)}.kanji5-onboarding-secondary{border:1px solid var(--line);background:rgba(255,252,246,.58);color:inherit}.kanji5-onboarding-secondary:hover{transform:translateY(-1px);background:rgba(255,252,246,.84)}
.kanji5-onboarding-ghost,.kanji5-onboarding-footer-action{border:0;background:transparent;color:var(--mute);font:inherit;cursor:pointer}.kanji5-onboarding-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:24px}.kanji5-onboarding-footnote{margin:11px 0 0;font-size:12px;line-height:1.65}.kanji5-onboarding-swipe-hint{display:flex;align-items:center;gap:8px;margin:15px 0 0;color:var(--mute);font-size:11px}.kanji5-onboarding-swipe-hint:before{content:"↔";display:grid;place-items:center;width:26px;height:26px;border:1px solid var(--line);border-radius:50%;background:rgba(255,252,246,.55)}
.kanji5-onboarding-footer{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:7px 28px 20px;min-height:54px}.kanji5-onboarding-footer-action{padding:10px 0;font-size:12px}.kanji5-onboarding-primary:focus-visible,.kanji5-onboarding-secondary:focus-visible,.kanji5-onboarding-ghost:focus-visible,.kanji5-onboarding-footer-action:focus-visible,.kanji5-onboarding-language button:focus-visible,.kanji5-onboarding-choice:focus-visible,.kanji5-onboarding-option:focus-visible,.kanji5-onboarding-range-option:focus-visible{outline:3px solid rgba(48,79,116,.26);outline-offset:3px}.kanji5-onboarding-host-error{position:fixed;left:50%;bottom:20px;z-index:3;transform:translateX(-50%);max-width:min(640px,calc(100% - 32px));padding:12px 15px;border:1px solid rgba(181,109,114,.28);border-radius:16px;background:rgba(255,252,246,.95);color:var(--mute);font-size:12px;line-height:1.5;box-shadow:0 12px 30px rgba(38,37,35,.14);text-align:center}
@media(max-width:860px){.kanji5-onboarding-header{padding:13px 16px 8px}.kanji5-onboarding-main{padding:12px 16px 10px}.kanji5-onboarding-stage{display:block;min-height:0;width:min(680px,100%)}.kanji5-onboarding-visual{min-height:210px;height:30svh;max-height:260px;margin-bottom:18px;padding:16px;border-radius:28px}.kanji5-onboarding-visual-art{width:min(74vw,290px)}.kanji5-onboarding-visual-kanji{font-size:90px}.kanji5-onboarding-panel-shell{display:block}.kanji5-onboarding-panel{width:100%}.kanji5-onboarding-panel h1{max-width:none;font-size:clamp(31px,8vw,44px)}.kanji5-onboarding-body{margin-top:14px;font-size:15px}.kanji5-onboarding-loop{grid-template-columns:1fr;gap:7px}.kanji5-onboarding-loop>div{min-height:68px;padding:14px 15px}.kanji5-onboarding-loop b{display:none}.kanji5-onboarding-option-grid,.kanji5-onboarding-range{grid-template-columns:1fr}.kanji5-onboarding-range-option{min-height:82px;grid-template-columns:auto minmax(0,1fr);align-items:center}.kanji5-onboarding-account-actions{width:100%}.kanji5-onboarding-footer{padding:6px 16px 14px}.kanji5-onboarding-progress{min-width:122px}.kanji5-onboarding-progress-track{width:78px}.kanji5-onboarding-brand strong{display:none}}
@media(max-width:500px){.kanji5-onboarding-header{grid-template-columns:1fr auto}.kanji5-onboarding-progress{grid-column:1/-1;grid-row:2;justify-self:center;order:3;margin-top:4px}.kanji5-onboarding-language{grid-column:2}.kanji5-onboarding-main{padding-top:9px}.kanji5-onboarding-visual{height:24svh;min-height:166px;max-height:205px;margin-bottom:15px}.kanji5-onboarding-visual:before{top:26px;left:28px}.kanji5-onboarding-visual:after{right:26px;bottom:28px}.kanji5-onboarding-visual-kanji{font-size:78px}.kanji5-onboarding-stimulus{width:118px;height:118px;font-size:62px}.kanji5-onboarding-choice{grid-template-columns:30px minmax(0,1fr) auto;padding:15px}.kanji5-onboarding-choice-arrow{width:27px}.kanji5-onboarding-actions{margin-top:19px}.kanji5-onboarding-actions .kanji5-onboarding-primary{flex:1}.kanji5-onboarding-actions .kanji5-onboarding-ghost{flex:0 0 auto}.kanji5-onboarding-swipe-hint{margin-top:11px}}
@media(prefers-reduced-motion:reduce){.kanji5-onboarding-panel,.kanji5-onboarding-visual-art,.kanji5-onboarding-primary,.kanji5-onboarding-secondary,.kanji5-onboarding-choice,.kanji5-onboarding-option,.kanji5-onboarding-range-option,.kanji5-onboarding-language button,.kanji5-onboarding-progress-track span{animation:none!important;transition:none!important}}`;

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
  onLanguageChange?: (language: Language) => void;
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
      <span className="kanji5-onboarding-choice-arrow" aria-hidden="true">→</span>
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
  onLanguageChange,
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
  const [dragX, setDragX] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "back">("forward");
  const swipeRef = useRef<{ x: number; y: number; active: boolean; pointerId: number }>({ x: 0, y: 0, active: false, pointerId: -1 });
  const suppressClickRef = useRef(false);

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
    setTransitionDirection("forward");
    setDragX(0);
    setStep(steps[currentIndex + 1]);
  };

  const goBack = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex <= 0) return;
    setTransitionDirection("back");
    setDragX(0);
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
      setTransitionDirection("forward");
      setDragX(0);
      setPlacementIndex(nextIndex);
      setPlacementAnswer(
        answers.find(answer => answer.questionId === placementQuestions[nextIndex]?.id)?.optionId ?? "",
      );
      return;
    }
    const suggestedLevel = onPlacementComplete?.(answers) ?? "N5";
    setCompletedPlacement(true);
    setDraft(current => ({ ...current, placementAnswers: answers, suggestedLevel }));
    setTransitionDirection("forward");
    setDragX(0);
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
    setTransitionDirection("back");
    setDragX(0);
    setStep("placement");
  };

  const canAdvanceBySwipe = () =>
    step === "welcome" ||
    step === "learning-loop" ||
    (step === "starting-point" && canProceedFromStartingPoint(draft)) ||
    (step === "placement" && Boolean(placementAnswer)) ||
    (step === "placement-result" && completedPlacement) ||
    (step === "daily-rhythm" && Boolean(draft.dailyNew));

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (busy || completing || (event.pointerType === "mouse" && event.button !== 0)) return;
    swipeRef.current = { x: event.clientX, y: event.clientY, active: true, pointerId: event.pointerId };
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const start = swipeRef.current;
    if (!start.active || start.pointerId !== event.pointerId || busy || completing) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < Math.abs(dy) * 0.65) {
      setDragX(0);
      return;
    }
    setDragX(Math.max(-86, Math.min(86, dx * 0.6)));
  };

  const finishPointerGesture = (event: ReactPointerEvent<HTMLElement>) => {
    const start = swipeRef.current;
    const wasActive = start.active;
    swipeRef.current.active = false;
    if (start.pointerId === event.pointerId) event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!wasActive || busy || completing) {
      setDragX(0);
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const isHorizontal = Math.abs(dx) >= 52 && Math.abs(dx) >= Math.abs(dy) * 1.25;
    setDragX(0);
    if (!isHorizontal) return;
    const isNextSwipe = language === "fa" ? dx > 0 : dx < 0;
    if (isNextSwipe) {
      if (!canAdvanceBySwipe()) return;
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
      if (step === "placement") answerPlacement();
      else advance();
      return;
    }
    if (steps.indexOf(step) > 0) {
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
      goBack();
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => finishPointerGesture(event);
  const handlePointerCancel = () => {
    swipeRef.current.active = false;
    setDragX(0);
  };
  const handleClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
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
            <div className="kanji5-onboarding-swipe-hint" aria-hidden="true">{t("onboardingSwipeHint", language)}</div>
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
              <div className="kanji5-onboarding-result-scale" aria-hidden="true">
                {["N5","N4","N3","N2","N1"].map(level => <span key={level} className={draft.suggestedLevel === level ? "is-hit" : ""} />)}
              </div>
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

  const visualKanji = step === "placement" ? "漢" : step === "placement-result" ? (draft.suggestedLevel ?? "N5") : step === "daily-rhythm" ? "五" : step === "account" ? "守" : "学";

  const renderVisual = () => (
    <div className="kanji5-onboarding-visual" aria-hidden="true">
      <span className="kanji5-onboarding-visual-kanji" lang="ja">{visualKanji}</span>
      <svg className="kanji5-onboarding-visual-art" viewBox="0 0 420 330" role="presentation">
        <ellipse className="soft" cx="210" cy="270" rx="150" ry="28" />
        <g transform="translate(58 66)">
          <path className="paper" d="M94 55 78 26 58 56c-5 15-1 33 10 44 9 9 25 12 35 1 10-11 12-30 6-46Z"/>
          <path className="line" d="M84 49 78 26 58 56M72 70q18 14 38 0"/>
          <circle cx="70" cy="62" r="3" fill="currentColor"/><circle cx="101" cy="62" r="3" fill="currentColor"/>
          <path className="line" d="M83 77q4 6 9 0"/>
          <path className="shu" d="M48 115q34-25 76 0v76H48Z"/>
          <path className="line" d="M66 135v54M105 135v54M49 147 25 171M123 147l22 24"/>
        </g>
        <g transform="translate(240 94)">
          <path className="paper" d="M56 62q-8-26 13-48l18 15 25-16q22 20 11 49-10 29-39 32-28-3-28-32Z"/>
          <path className="line" d="M69 33 87 15l22 14M62 52 47 70M120 52l16 18"/>
          <circle cx="77" cy="52" r="3" fill="currentColor"/><circle cx="105" cy="52" r="3" fill="currentColor"/>
          <path className="line" d="M88 67q6 7 12 0"/>
          <path className="soft" d="M62 104q37-25 73 0v63H62Z"/>
          <path className="line" d="M73 126v38M111 126v38M63 130 39 151M134 130l22 21"/>
        </g>
        <path className="line" d="M184 228c18-16 35-16 52 0" opacity=".45"/>
        <circle className="shu" cx="184" cy="236" r="10"/><circle className="soft" cx="236" cy="236" r="10"/>
        <circle className="paper" cx="210" cy="214" r="16"/><path className="line" d="M203 214h14M210 207v14"/>
      </svg>
    </div>
  );

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
          <div className="kanji5-onboarding-language" aria-label={t("onboardingLanguage", language)}>
            <button type="button" className={language === "fa" ? "is-active" : ""} aria-pressed={language === "fa"} onClick={() => onLanguageChange?.("fa")}>فارسی</button>
            <button type="button" className={language === "en" ? "is-active" : ""} aria-pressed={language === "en"} onClick={() => onLanguageChange?.("en")}>EN</button>
          </div>
        </header>
        <main className="kanji5-onboarding-main" aria-live="polite" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} onClickCapture={handleClickCapture}>
          <div className={"kanji5-onboarding-stage " + (transitionDirection === "back" ? "is-back" : "is-forward")}>
            {renderVisual()}
            <div className="kanji5-onboarding-panel-shell">
              <div key={step + ":" + placementIndex} className="kanji5-onboarding-step-wrap" style={dragX ? { transform: "translate3d(" + dragX + "px,0,0)" } : undefined}>
                {renderStep()}
              </div>
            </div>
          </div>
        </main>
        <footer className="kanji5-onboarding-footer">
          {step !== "welcome" ? <button className="kanji5-onboarding-footer-action" type="button" onClick={goBack} disabled={busy || completing}>{t("onboardingBack", language)}</button> : <span />}
          {step !== "account" ? <button className="kanji5-onboarding-footer-action" type="button" onClick={handleSkip} disabled={busy || completing}>{t("onboardingSkip", language)}</button> : <span />}
        </footer>
      </div>
    </>
  );
