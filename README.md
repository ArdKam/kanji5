# Kanji 5

یک PWA شخصی برای یادگیری ۲۱۳۶ کانجی Jōyō ژاپنی، روزانه ۵ کانجی جدید، با مرور فاصله‌دار تطبیقی بر پایهٔ FSRS.

## ویژگی‌ها
- پوشش هر ۲۱۳۶ کانجی Jōyō بر اساس رتبهٔ newspaper frequency
- ۵ کانجی جدید در روز (قابل تنظیم)
- مرورهای due قبل/در کنار کانجی‌های جدید
- چهار امتیاز Again / Hard / Good / Easy
- FSRS با retention هدف 90% و fuzzing
- نگهداری پیشرفت در localStorage
- Active Recall برای معنی یا خوانش
- انتخاب adaptive بین تمرین meaning و reading بر اساس عملکرد قبلی
- ثبت جداگانهٔ عملکرد meaning/reading برای هر کانجی
- نمایش On'yomi / Kun'yomi، معنی، تعداد stroke و رتبهٔ فراوانی
- بارگذاری تنبل نمونه‌های واژگانی از kanjiapi.dev
- قابلیت نصب به‌صورت PWA

## منابع
- Jōyō/KANJIDIC2 dataset: jkindrix/japanese-language-data
- KANJIDIC2/EDRDG license: CC BY-SA 4.0
- FSRS: ts-fsrs (MIT)
- Example words: kanjiapi.dev / EDRDG-based data

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
