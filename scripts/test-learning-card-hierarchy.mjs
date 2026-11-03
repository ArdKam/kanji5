import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [app, copy, styles, enhancements, engine, runtime, boundary, contract] = await Promise.all([
  read("../frontend/src/app/App.tsx"),
  read("../frontend/src/app/learning-copy.ts"),
  read("../frontend/src/app/learning-surface.css"),
  read("../frontend/src/app/learning-card-enhancements.css"),
  read("../frontend/src/app/engine.ts"),
  read("../review-runtime.js"),
  read("../v1.9-v2-boundary.js"),
  read("../v1.9-v2-contract-core.js"),
]);
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(
  app.includes('<span className="kanji-audio-control"><Audio value={card.character}'),
  "The pronunciation control must sit in its own wrapper, outside the kanji's centering flow",
);
assert(
  /\.learning-card-front \.kanji-audio-control\{[^}]*position:absolute;[^}]*inset-inline-end:[^}]*top:50%;[^}]*transform:translateY\(-50%\)/.test(styles),
  "The audio wrapper must be positioned independently from the kanji glyph",
);
assert(
  !app.includes('<div className="card-topline"><span className="badge badge-red">{t("learning")}</span><div className="actions"><span>{t("cardBack")}</span></div></div>'),
  "The redundant learning/card-back header must not take space away from the answer",
);

const backStart = app.indexOf('<div className="learning-card-face learning-card-back"');
assert(backStart >= 0, "Learning-card back face is required");
const pagerStart = app.indexOf('className="learning-back-pager-shell"', backStart);
assert(pagerStart > backStart, "Learning-card back pager is required");
const backHeader = app.slice(backStart, pagerStart);
assert(!backHeader.includes('className="card-topline"'), "The back face must not repeat a generic card title");
const pageStart = app.indexOf('<div className={"learning-back-page"', pagerStart);
const pageOrder = [
  app.indexOf('className={"learning-back-page"+(backPage===0', pageStart),
  app.indexOf('className={"learning-back-page"+(backPage===1', pageStart),
  app.indexOf('className={"learning-back-page"+(backPage===(hasExamplesPage?2:1)', pageStart),
  app.indexOf('className={"learning-back-page"+(backPage===(hasExamplesPage?3:2)', pageStart),
];
assert(pageOrder.every((position) => position > pageStart), "All four learning pages must remain present");
assert(pageOrder.every((position, index) => index === 0 || position > pageOrder[index - 1]), "Back-card order must stay meaning/structure → vocabulary → mnemonic → stroke order"); 

const pageLabels = [
  'aria-label={t("meaningAndStructure")}',
  'aria-label={t("vocabularyExamples")}',
  'aria-label={t("personalMnemonic")}',
  'aria-label={t("strokeOrder")}',
];
assert(pageOrder.every((position, index) => app.indexOf(pageLabels[index], position) > position), "Each page must retain its matching accessible label");

const overviewMarkup = app.slice(pageOrder[0], pageOrder[1]);
assert(overviewMarkup.includes('className="learning-back-detail-grid"'), "The answer view must separate its reading panel from supporting example and structure content");
assert(overviewMarkup.includes('className="learning-back-support-column"'), "Vocabulary example and structure need a dedicated support column");
assert(overviewMarkup.includes('lang={meaningLanguage} dir="auto"'), "Localized and fallback meanings must use direction-aware rendering");
assert(overviewMarkup.includes('<Audio value={displayExamples[0].reading} label={t("playWordPronunciation")}/>'), "The quick vocabulary example must expose its reading audio control");
assert(overviewMarkup.includes('className="example-source-label"'), "The quick vocabulary example must retain its source-review status");
assert(!/learning-back-page:first-child[^}]*!important/.test(enhancements), "The answer-page layout must not rely on important overrides");


assert(app.includes('learningCopy("rateRecall",getLanguage())'), "The rating choices need a localized decision prompt");
assert(app.includes('className="rating-interval">{formatReviewInterval(card.ratingPreviews?.[r])}'), "Each rating choice must show its own review interval");
assert(
  app.includes('const ratingOptions=()=>[["Again",t("again")],["Hard",t("hard")],["Good",t("good")],["Easy",t("easy")]] as const;'),
  "The visible rating choices must preserve Again → Hard → Good → Easy",
);
assert(copy.includes('rateRecall: "چقدر خوب به یاد آوردی؟"'), "Persian rating prompt is missing");
assert(copy.includes('rateRecall: "How well did you recall it?"'), "English rating prompt is missing");
assert(engine.includes("ratingPreviews?: Partial<Record<Rating, string | null>> | null;"), "The typed snapshot must carry optional ISO due-time previews");
assert(runtime.includes("const preview=scheduler.repeat(card,new Date());"), "Preview values must come from FSRS repeat, not hand-authored intervals");
assert(runtime.includes("preview?.[Rating[ratingName]]?.card?.due"), "Previews must use the scheduler's existing rating enum mapping");
assert(runtime.includes("rating=Rating[which]"), "The live review flow must keep the canonical Rating mapping");
assert(runtime.includes("scheduleWithAuthority({scheduler,card:rec.card,now,rating})"), "The live review flow must continue through the scheduling authority");
assert(boundary.includes("bridge.previewLearningRatings()"), "The boundary must request read-only previews from the review runtime");
assert(contract.includes("const ratingPreviews=source.ratingPreviews&&typeof source.ratingPreviews==='object'"), "The view-model boundary must validate preview data");
assert(contract.includes("Again:previewDue(source.ratingPreviews.Again)"), "All rating preview timestamps must be sanitized before presentation");

console.log("Learning-card hierarchy and FSRS presentation contract passed.");
