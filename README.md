# Kanji 5

یک PWA شخصی برای یادگیری ۲۱۳۶ کانجی Jōyō ژاپنی، روزانه ۵ کانجی جدید، با مرور فاصله‌دار تطبیقی بر پایهٔ FSRS.

## ویژگی‌ها
- پوشش هر ۲۱۳۶ کانجی Jōyō بر اساس رتبهٔ newspaper frequency
- ۵ کانجی جدید در روز (قابل تنظیم)
- مرورهای due قبل/در کنار کانجی‌های جدید
- چهار امتیاز Again / Hard / Good / Easy
- FSRS با retention هدف 90% و fuzzing
- نگهداری پیشرفت در localStorage
- Active Recall برای معنی و خوانش
- تمرین آموزشی تطبیقی برای Meaning، Reading، Production، Vocabulary و Context
- انتخاب adaptive بین کانجی‌های دیده‌شده بر اساس weakness، stage، recency و coverage
- انتخاب adaptive نوع تمرین بر اساس عملکرد قبلی
- ثبت جداگانهٔ عملکرد هر mode برای هر کانجی
- Smart distractors بر پایهٔ شباهت خوانش و معنی، stroke، grade، frequency و سابقهٔ خطا
- تمرین Context مبتنی بر جملهٔ ژاپنی و ترجمهٔ انگلیسی، با cache و fallback ایمن
- نمایش On'yomi / Kun'yomi، معنی، تعداد stroke و رتبهٔ فراوانی
- بارگذاری lazy نمونه‌های واژگانی از kanjiapi.dev فقط هنگام نیاز
- قابلیت نصب به‌صورت PWA
- همگام‌سازی اختیاری پیشرفت با Supabase

## Education v1.4
- مدل state آموزشی شامل `new`، `exposed`، `learning`، `reinforcing` و `mastered`
- ثبت `exposedAt` برای اولین مواجهه بدون نیاز به پاسخ دادن
- grading جداگانه برای معنی و خوانش با پشتیبانی Hiragana / Romaji
- تولید Romaji canonical برای مقایسهٔ پایدار خوانش‌ها
- انتخاب adaptive کانجی از بین موارد دیده‌شده و جلوگیری از تکرار فوری مورد قبلی
- fallback ایمن به تمرین‌های محلی Meaning / Reading / Production در صورت در دسترس نبودن APIهای خارجی
- Cache محلی برای Vocabulary و Context

## v1.5
- Active Recall با یادگیری component-level و scheduler اختصاصی
- جداسازی pure recall core از UI/orchestration
- persistence مبتنی بر snapshot و transaction با recovery/reconciliation
- sync چندلایه برای education، FSRS و state با merge/replay قطعی
- Supabase sync با optimistic concurrency، locking و retry
- network adapter مستقل برای KanjiAPI/Tatoeba و coalescing در service worker
- تست‌های architecture، persistence، sync lifecycle، network و browser smoke

## v1.6 — Adaptive Session Intelligence
v1.6 لایهٔ session را از یک dashboard صرف به یک چرخهٔ adaptive کامل تبدیل می‌کند:

- **Session Dashboard:** شمارنده‌های due/new/mastered، goal progress، streak، review count، active mode plan و session summary
- **Session Persistence & Resume:** شناسهٔ پایدار session، snapshot طرح، `remainingModes` و status برای resume بعد از reload یا خروج ناخواسته
- **Adaptive Session Engine:** ساخت plan اولیه، انتخاب mode بعدی بر اساس وضعیت جلسه و مصرف mode فقط پس از موفقیت در resolve شدن محتوای تمرین
- **Live Rebalancing:** تغییر plan در میانهٔ جلسه بر اساس feedback همان session، بدون از دست دادن remainder اصلی
- **Session-scoped Feedback:** ثبت نتیجهٔ educational و اتصال authoritative feedback به session؛ نتیجهٔ `نمی‌دانم` همچنان outcome آموزشی است و rating مستقیم FSRS نیست
- **Session Analytics:** خلاصهٔ session و تاریخچهٔ mode-level برای تحلیل عملکرد و trend
- **Long-term Skill Profile:** تجمیع sessionهای کامل برای پنج مهارت Meaning، Reading، Production، Vocabulary و Context
- **Temporal Skill Profile:** نگهداری `recentAttempts`، `recentAccuracy` و `momentum` بر پایهٔ سه session اخیر
- **Profile-aware Planning:** استفاده از accuracy، recent accuracy و momentum در امتیازدهی modeها و اولویت‌بندی plan بعدی
- **Durable Sync Core:** merge/replay لایهٔ v1.6 برای session history، component state و profile-aware state بدون انتقال منطق merge به transport
- **Offline Runtime Contract:** تمام runtimeهای v1.6 در service worker precache شده‌اند و CI عدم mutation در checkout را بررسی می‌کند

## v1.7 — Adaptive Attribute Recall
v1.7 adaptive recall را از سطح card/session به سطح attribute یادگیری ارتقا می‌دهد، بدون جایگزین‌کردن FSRS یا شکستن جریان learning-first.

- **Adaptive Decision Core:** مدل‌سازی و رتبه‌بندی مستقل Meaning، Reading، Production، Vocabulary و Context بر اساس weakness و uncertainty
- **Adaptive Recall Integration:** انتخاب attribute ضعیف‌تر برای Active Recall با حفظ قرارداد backward-compatible فعلی
- **Session Continuity:** حفظ intent و plan تطبیقی در reload و اتصال آن به lifecycle موجود session
- **Learning UX:** نمایش attribute در حال تمرین و reason کوتاه و evidence-gated برای readingهای کمتر رایج
- **Evaluation & Tuning:** اندازه‌گیری accuracy/uncertainty/recovery، مقایسه با baseline پایدار و تولید توصیه‌های tuning فقط پس از کافی‌بودن evidence
- **Browser coverage:** پوشش E2E برای رفتار adaptive recall و session continuity

## v1.8 — Rich Learner-Facing Recall
v1.8 سه mode واقعی learner-facing را به جریان آموزشی اضافه می‌کند و adaptive planning را با شواهد عملکردی همان session تقویت می‌کند:

- **Production Recall:** تولید مستقیم Kanji از روی meaning با grader deterministic و آفلاین
- **Vocabulary Recall:** تولید واژهٔ کامل با grader deterministic؛ API فقط content provider است
- **Context Recall:** تکمیل Kanji حذف‌شده در جمله با grader deterministic و Tatoeba cache/fallback
- **Adaptive Recall 2.0:** اولویت‌بندی modeها با weakness، recent errors، recovery evidence و momentum؛ FSRS همچنان scheduler سطح card است
- **Longitudinal Evaluation:** نگهداری outcomeها به تفکیک attribute و مقایسهٔ adaptive/baseline فقط پس از کافی‌بودن evidence
- **Learner Model:** mastery، recent accuracy، trend، error و recovery signal برای هدایت planner
- **Learning UX:** feedback حداقلی و توضیح کوتاه دربارهٔ دلیل انتخاب تمرین، بدون dashboard پیچیده
- **Offline/runtime quality:** graderهای v1.8 و UX runtime در service worker precache شده‌اند و shell cache نسخه‌بندی شده است

## Mnemonic & memory-aid system

- **Comprehensive coverage:** every one of the ۲۱۳۶ Jōyō kanji receives a memory-aid entry.
- **Curated vs guided:** curated prepared mnemonics are kept separate from deterministic guided scaffolds; scaffolds are prompts for creating a personal cue, not personal mnemonics themselves.
- **Reading support:** phonetic keyword hooks are used when a curated sound anchor exists, with conservative vocabulary matching to avoid attaching an unrelated reading example.
- **Confusion network:** common lookalikes are represented as auditable bidirectional groups with target-specific visual contrasts.
- **Adaptive disclosure:** memory support expands for new/recovery states, collapses as recall stabilizes, and is hidden for sufficiently mastered meaning/reading.
- **Personal-first persistence:** curated prepared mnemonics can be adopted directly; generated scaffolds are labeled and route the learner toward creating their own mnemonic.
- **Offline support:** component data used by the memory-aid layer is included in the service-worker data cache.

## v2 — Presentation Layer

v2.0 replaces the legacy v1 presentation as the default browser experience while keeping the v1.9 learning engine authoritative.

### v2 highlights
- **Default v2 shell:** the root route renders the v2 presentation without a query-string opt-in.
- **Five-skill parity:** Meaning, Reading, Production, Vocabulary, and Context continue to use the existing deterministic graders and session/recovery boundaries.
- **Stable presentation boundary:** v2 consumes structured view models from the v1.9 boundary rather than storage or planner internals.
- **Accessibility & responsive UI:** keyboard-first interaction, semantic live regions, visible focus states, reduced-motion handling, and mobile/tablet/desktop layouts.
- **Offline release path:** the active v2 presentation modules are precached and the existing v1.9 offline/runtime contracts remain part of the release gate.

### Release status

**v2.0.0 — release-ready**

The v2 release gate requires syntax validation, the full contract/unit suite, legacy v1.7/v1.8/v1.9 compatibility coverage, v2 browser coverage, accessibility/responsive checks, offline/runtime checks, architecture boundaries, and the v2 release contract.

The legacy v1 presentation is retained only behind the explicit `?legacy=1` compatibility path for regression and migration verification; it is not the default user-facing experience.

## v1.9 — Learning Engine

v1.9 is the final pre-v2 learning-engine release. It keeps the five-skill model and FSRS while adding a versioned educational outcome contract, evidence-aware learner modeling, adaptive planning, bounded recovery, deterministic evaluation, content/data integrity, stronger offline reliability, and an explicit presentation boundary for v2.

### v1.9 highlights
- **Outcome Contract:** standardized, versioned outcomes across Meaning, Reading, Production, Vocabulary, and Context, including explicit `unknown` and recovery-aware metadata.
- **Learner Model 2.0:** per-attribute evidence, recency, momentum, confidence, mastery/weakness signals, and migration-safe persistence.
- **Adaptive Planner 3.0:** deterministic repair/reinforce/recover/maintain/explore planning with bounded anti-repetition behavior.
- **Recovery Engine:** bounded wrong/unknown/near-miss retry flows without turning recovery into a second scheduler.
- **Learning Evaluation 2.0:** deterministic metrics and baseline comparison without mutating learner state.
- **Data & Offline Reliability:** validation/deduplication/fallback for Vocabulary and Context plus offline-first grading and runtime hardening.
- **v2 Boundary:** stable view-model contracts separating the learning engine from the future presentation layer.

## Release status

**v1.9.0 — implementation P0 through P7 is complete on `main`.** The package version, documentation, release contract, v2 boundary, and active v1.9 workflow are aligned.

The release gate is defined by syntax validation, `npm test`, v1.7/v1.8 regressions, v1.9 browser flows, offline/runtime checks, architecture checks, and the v1.9 release contract.

## منابع
- Jōyō/KANJIDIC2 dataset: jkindrix/japanese-language-data
- KANJIDIC2/EDRDG license: CC BY-SA 4.0
- FSRS: ts-fsrs (MIT)
- Example words: kanjiapi.dev / EDRDG-based data
- Context sentences: Tatoeba API

## نسخهٔ ۱.۳
- بهبود performance، storage bridge و cache invalidation
- رفع مشکلات loading shell و wiring نسخهٔ PWA

## نسخهٔ ۱.۲
- 🧠 Active Recall قبل از نمایش پاسخ
- 🎯 انتخاب adaptive بین Meaning و Reading
- 📈 ثبت جداگانهٔ موفقیت در Meaning و Reading
- 🔄 Progressive reveal با examples اختیاری
- ♻️ invalidation خودکار dataset cache پس از تغییر نسخه

## نسخهٔ ۱.۱
- 🔊 تلفظ کانجی، On'yomi/Kun'yomi و واژه‌های نمونه با Web Speech API
- 📊 آمار: کل مرورها، دقت، مرورهای ۷ روز اخیر، وضعیت کارت‌ها
- 🔥 رشتهٔ روزانه (streak) با رکورد طولانی‌ترین رشته
- هدف تعداد مرور روزانه، قابل تنظیم، با نوار پیشرفت جدا
- تشخیص Leech (کانجی‌های پرخطا) با آستانهٔ قابل تنظیم و نشان روی کارت
- میان‌برهای صفحه‌کلید: Space برای نمایش پاسخ، ۱–۴ برای Again/Hard/Good/Easy
