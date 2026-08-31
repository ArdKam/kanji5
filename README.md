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
