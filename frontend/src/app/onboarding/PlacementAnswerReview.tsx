import { formatNumber, t, type Language } from "../i18n";
import type { PlacementAnswer, PlacementQuestion } from "./onboarding-model";
import reviewStyles from "./placement-answer-review.css?inline";

export function PlacementAnswerReview({
  language,
  questions,
  answers,
}: {
  language: Language;
  questions: PlacementQuestion[];
  answers: PlacementAnswer[];
}) {
  const answersByQuestion = new Map(answers.map(answer => [answer.questionId, answer.optionId]));

  return (
    <>
      <style data-placement-answer-review-styles>{reviewStyles}</style>
      <div className="kanji5-onboarding-review-list" aria-label={t("onboardingPlacementReviewAnswers", language)}>
        {questions.map((question, index) => {
          const selectedId = answersByQuestion.get(question.id);
          const selectedOption = question.options.find(option => option.id === selectedId);
          const correctOption = question.options.find(option => option.id === question.correctOptionId);
          const isCorrect = Boolean(selectedId && question.correctOptionId && selectedId === question.correctOptionId);
          return (
            <article className="kanji5-onboarding-review-item" key={question.id} data-result={isCorrect ? "correct" : "incorrect"}>
              <div className="kanji5-onboarding-review-head">
                <span className="kanji5-onboarding-review-kanji" lang="ja">{question.stimulus}</span>
                <span className="kanji5-onboarding-review-meta">
                  <strong>{formatNumber(index + 1, language)} · {question.level ?? "—"}</strong>
                </span>
                <span className={"kanji5-onboarding-review-status " + (isCorrect ? "is-correct" : "is-incorrect")}>
                  {isCorrect ? t("correct", language) : t("wrong", language)}
                </span>
              </div>
              <div className="kanji5-onboarding-review-answers">
                <div className="kanji5-onboarding-review-answer">
                  <span>{t("onboardingPlacementYourAnswer", language)}</span>
                  <strong>{selectedOption?.label ?? "—"}</strong>
                </div>
                <div className="kanji5-onboarding-review-answer">
                  <span>{t("onboardingPlacementCorrectAnswer", language)}</span>
                  <strong>{correctOption?.label ?? "—"}</strong>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
