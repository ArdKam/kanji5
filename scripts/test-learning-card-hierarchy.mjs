import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [app, copy, styles, engine, runtime, boundary, contract] = await Promise.all([
  read("../frontend/src/app/App.tsx"),
  read("../frontend/src/app/learning-copy.ts"),
  read("../frontend/src/app/learning-surface.css"),
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
  app.indexOf('aria-label={t("meaningAndStructure")}', pageStart),
  app.indexOf('aria-label={t("vocabularyExamples")}', pageStart),
  app.indexOf('aria-label={t("personalMnemonic")}', pageStart),
  app.indexOf('aria-label={t("strokeOrder")}', pageStart),
];
assert(pageOrder.every((position) => position > pageStart), "All four learning pages must remain present");
assert(pageOrder.every((position, index) => index === 0 || position > pageOrder[index - 1]), "Back-card order must stay meaning/structure → vocabulary → mnemonic → stroke order");

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
