# Kanji 5

یک PWA شخصی برای یادگیری ۲۱۳۶ کانجی Jōyō ژاپنی، با مرور فاصله‌دار تطبیقی بر پایهٔ FSRS و مجموعه‌ای از تمرین‌های فعال برای تقویت معنی، خوانش و کاربرد کانجی.

## ویژگی‌های اصلی

- پوشش هر ۲۱۳۶ کانجی Jōyō بر اساس رتبهٔ newspaper frequency
- برنامهٔ روزانهٔ کانجی جدید، با امکان تنظیم تعداد کانجی‌های جدید
- مرور کانجی‌های due با چهار امتیاز `Again / Hard / Good / Easy`
- FSRS با retention هدف ۹۰٪ و fuzzing
- نگهداری پیشرفت و وضعیت کارت‌ها در `localStorage`
- Active Recall برای معنی و خوانش
- انتخاب adaptive بین Meaning و Reading بر اساس عملکرد قبلی
- تمرین‌های آموزشی برای `Meaning / Reading / Production / Vocabulary / Context`
- ثبت جداگانهٔ عملکرد آموزشی برای هر کانجی
- انتخاب هوشمند distractorها بر اساس شباهت خوانش/معنی، تعداد stroke، grade، frequency و سابقهٔ خطا
- نمایش On'yomi / Kun'yomi، معنی، تعداد stroke و رتبهٔ فراوانی
- بارگذاری lazy نمونه‌های واژگانی از `kanjiapi.dev` و cache محلی آن‌ها
- تلفظ با Web Speech API
- آمار مرور، دقت، مرورهای اخیر و streak روزانه
- تشخیص Leech با آستانهٔ قابل تنظیم
- میان‌برهای صفحه‌کلید برای مرور
- قابلیت نصب و اجرای offline به‌صورت PWA
- استفاده از نسخهٔ local و vendored کتابخانهٔ FSRS برای جلوگیری از وابستگی runtime به CDN
- Service Worker با cacheهای versioned برای shell، dataset و API vocabulary
- همگام‌سازی اختیاری پیشرفت بین دستگاه‌ها با Supabase و RLS

## نسخهٔ ۱.۳

نسخهٔ ۱.۳ تمرکز اصلی را از یک فلش‌کارت صرف به سمت **تمرین آموزشی فعال** برده است.

### سیستم تمرین آموزشی

- تمرین Meaning Recall با پاسخ متنی
- تمرین Reading Recall با Hiragana یا Romaji
- تمرین Production برای تشخیص کانجی مناسب از روی معنی
- تمرین Vocabulary برای بازیابی کانجی در واژه
- تمرین Context برای بازیابی کانجی در زمینهٔ واژگانی
- دکمهٔ `نمی‌دانم` و ثبت نتیجهٔ آموزشی
- انتخاب adaptive تمرین بر اساس سابقهٔ عملکرد
- نگهداری جداگانهٔ knowledge برای هر نوع تمرین
- distractorهای شخصی‌سازی‌شده بر اساس خطاهای قبلی
- برای کانجی‌های جدید، ابتدا exposure و معرفی انجام می‌شود و تمرین آموزشی روی کانجی‌های دیده‌شده متمرکز است.

### بهبودهای فنی

- dataset runtime سبک و جدا از دیتاست خام
- پیش‌بارگذاری و lazy loading برای کاهش زمان شروع برنامه
- جلوگیری از race condition هنگام بازشدن تب تمرین قبل از آماده‌شدن dataset
- Service Worker با cache invalidation نسخه‌ای
- FSRS به‌صورت local/vendor شده
- اعتبارسنجی dataset و syntax در GitHub Actions
- smoke test برای wiring و اجزای اصلی v1.3

### تنظیمات آموزشی

از بخش تنظیمات می‌توان تمرین‌های زیر را کنترل کرد:

- Production
- Vocabulary
- Context

## منابع و مجوزها

- Jōyō / KANJIDIC2 dataset: `jkindrix/japanese-language-data`
- KANJIDIC2 / EDRDG license: CC BY-SA 4.0
- FSRS (`ts-fsrs`): MIT
- Example words: `kanjiapi.dev` / EDRDG-based data

## وضعیت نسخه‌ها

### نسخهٔ ۱.۳
نسخهٔ پایدار فعلی این شاخه با تمرکز بر بهبود performance، offline behavior و تمرین‌های آموزشی مستقل از مرور FSRS.

### نسخهٔ ۱.۴
قرار است توسعهٔ آموزشی را یک مرحله جلوتر ببرد: مدل دانش آموزشی مستقل، mastery برای هر مهارت، انتخاب تطبیقی عمیق‌تر و در مراحل بعد اتصال کنترل‌شدهٔ این اطلاعات به scheduling.

## اجرا

پروژه یک PWA است و برای اجرای محلی می‌توان آن را با یک static server ساده اجرا کرد. برای استفادهٔ کامل از Service Worker و قابلیت نصب، اجرای برنامه روی `localhost` یا HTTPS توصیه می‌شود.
