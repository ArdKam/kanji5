# Kanji Starting-Point Assessment v2

Status: implemented in the assessment/placement-blueprint-v2 candidate; empirical validation remains required before Public Beta.

## Purpose and limits

This is a **Kanji starting-point diagnostic**, not a JLPT examination and not an assessment of overall Japanese proficiency. JLPT labels in the source dataset are used to stratify Kanji items, not to certify a learner's JLPT level.

The assessment checks English-gloss recognition of isolated Kanji. It does not independently assess reading recall, vocabulary production, sentence comprehension, handwriting, listening, or grammar. Those skills must remain separate in the learner model.

## Current blueprint

- 20 scored items total: five each from N5, N4, N3, and N2 Kanji pools.
- Within each band, items are sampled across five frequency-order strata. Each retake uses a seed to choose a different candidate from each stratum while keeping the same blueprint and making the questionnaire reproducible when onboarding is resumed.
- Only items tagged to the four supported bands are used. Sparse or missing bands are not filled with items of an unrelated level; the result is marked limited instead.
- Each item has four unique English gloss options and exactly one keyed option.
- The answer key uses the shared learner-priority meaning projection, not simply the first raw dictionary gloss. Other primary/secondary glosses for that Kanji are excluded from the wrong-answer pool. Candidate distractors are screened for strong lexical overlap.
- Correct-answer position is shuffled independently from item sampling. A new attempt changes the item sample as well as answer order.
- The item identity and seed are persisted through the existing onboarding progress adapter so reload/resume cannot silently pair stored answers with a different questionnaire.

## Decision rule

Each band has five items. A band is considered provisionally demonstrated at 4/5 (80%) or better. The suggested study band is the **first band not provisionally demonstrated when moving upward from N5**, so an N2 score cannot jump over a failed N4 or N5 band.

The result reports a per-band score profile and a conservative recommendation:
- If N5 is not provisionally demonstrated, start with N5.
- If N5 is demonstrated, assess N4 next; continue upward while each band meets the threshold.
- If all four bands meet the threshold, recommend the N2 entry point and explicitly disclose that N1 is outside this diagnostic's range.

A complete score is still labelled a provisional estimate. Results close to the pass threshold (3/5 or 4/5 in any band) are labelled boundary. Missing questions, incomplete bands, or unanswered items produce limited confidence.

The 4/5 cutoff and 20-item blueprint are implementation heuristics, not psychometrically validated cut scores.

## Assessment design issues corrected

1. Retakes previously repeated the same Kanji and changed only the option order.
2. A tiny four-item sample made one answer worth 25 percentage points in a band.
3. The prior descending-level selection could recommend N2 despite a failed lower band.
4. A low score could be labelled high-confidence even though confidence was derived from item count, not calibration.
5. Sparse-band fallback could pull in Kanji from unrelated bands and corrupt per-level interpretation.
6. The key used the first raw source gloss, which could conflict with learner-priority meanings.
7. Distractor selection sliced a small frequency-sorted window, sometimes produced fewer than four options, and did not consistently exclude alternative meanings of the target.
8. The onboarding persistence contract did not retain the item-sampling seed, risking a resumed assessment whose questions no longer matched saved answers after sampling became randomized.

## Required validation before Public Beta

- Collect anonymized or locally aggregated repeated-attempt data on representative users; review score and recommendation stability without retaining raw answer text.
- Independently review the sampled production item sets for gloss ambiguity, distractor plausibility, item difficulty, and band coverage.
- Analyze correct-answer position distribution across many seeds and use the same candidate pool as the shipped runtime.
- Test boundary and inconsistent profiles explicitly (for example, strong N2 results with weak N4 performance).
- Keep the interface honest: this remains a recognition-only Kanji starting-point estimate until broader modalities and empirical calibration exist.

Do not claim that this assessment estimates overall Japanese proficiency or certifies JLPT readiness.
