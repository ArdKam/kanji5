# C4 — Sampled Content QA Record

**Review date:** 2026-10-06  
**Implementation candidate reviewed:** merged PR #469 @ `81957a6065c7b271a3a697e0f41fd25f8bb048d8` (pre-merge candidate `917c40fd99edffbf806b9f426b487febdf5c67cb`)  
**Review type:** implementer/content review; this is evidence, not independent sign-off. Final pre-merge React presentation verification passed on workflow run `37363072127` (40/40 gates).

## Scope

Sampled the highest-frequency Kanji plus the 16 placement blueprint items, then checked learner-facing meaning priority, core/reference reading treatment, and mnemonic provenance against the actual `kanji-data.json` / prepared-mnemonic corpus.

### Findings

- The learner layer preserves source glosses and does not invent replacements.
- Reference/technical meanings such as `one radical (no.1)`, `counter for years`, `six` (陸), `counter for bows & stringed instruments`, and `counter for cupfuls` are now explicitly kept out of primary learner priority.
- High-frequency ambiguity cases including 日, 会, 生, 行, 中, 本, and related placement items have explicit learner-priority ordering.
- The first 40 frequency-ranked Kanji all currently have curated mnemonic entries; the wider placement sample contains a mix of curated and generated/scaffold content, so coverage is not being interpreted as quality.
- Sampled structural example fixtures use target-containing Japanese words with kana readings and glosses; invalid/duplicate/one-character fixtures are rejected by the deterministic example gate.
- Sampled context fixtures are natural beginner-level Japanese sentences with direct English translations and target-Kanji containment. The context validator still remains structural rather than a semantic/naturalness model.

## Benchmark content reviewed

### Vocabulary examples

- 学ぶ（まなぶ）— “to study; to learn”
- 学校（がっこう）— “school”
- 学年（がくねん）— “school year”
- 学生（がくせい）— “student”
- 日本（にほん）— “Japan”
- 毎日（まいにち）— “every day”
- 今日（きょう）— “today”
- 会議（かいぎ）— “meeting”

These are suitable as learner-facing benchmark examples for the sampled N5/N4 material.

### Context examples

- 私は学生です。 — “I am a student.”
- 学校へ行きます。 — “I go to school.”
- 毎日、日本語を学びます。 — “I study Japanese every day.”
- 今日は会議があります。 — “There is a meeting today.”

These are short, grammatical benchmark sentences with explicit target usage and low vocabulary burden.

## Remaining QA gap

This review does **not** constitute independent human approval of the remote kanjiapi.dev/Tatoeba result sets. The runtime still fetches those providers dynamically, so a full Public Beta gate needs a frozen sample from production providers and independent content review recorded against the final release candidate SHA. The current record therefore remains implementer evidence, not the required independent sign-off. The C4 code is merged into `main`; only the independent educational acceptance evidence remains outstanding.

