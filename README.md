# Kanji 5

یک PWA شخصی برای یادگیری ۲۰۰۰ کانجی مهم ژاپنی، روزانه ۵ کانجی جدید، با مرور فاصله‌دار تطبیقی بر پایهٔ FSRS.

## ویژگی‌ها
- انتخاب ۲۰۰۰ مورد از Jōyō 2136 بر اساس رتبهٔ newspaper frequency
- ۵ کانجی جدید در روز (قابل تنظیم)
- مرورهای due قبل/در کنار کانجی‌های جدید
- چهار امتیاز Again / Hard / Good / Easy
- FSRS با retention هدف 90% و fuzzing
- نگهداری پیشرفت در localStorage
- نمایش On'yomi / Kun'yomi، معنی، تعداد stroke و رتبهٔ فراوانی
- بارگذاری تنبل نمونه‌های واژگانی از kanjiapi.dev
- قابلیت نصب به‌صورت PWA

## اجرا
چون ES modules و fetch روی `file://` محدودیت مرورگر دارند، از یک static server استفاده کن:

```bash
python -m http.server 8000
```

بعد برو به:

http://localhost:8000

یا کل پوشه را در GitHub Pages / Cloudflare Pages / Netlify قرار بده.

## منابع
- Jōyō/KANJIDIC2 dataset: jkindrix/japanese-language-data
- KANJIDIC2/EDRDG license: CC BY-SA 4.0
- FSRS: ts-fsrs (MIT)
- Example words: kanjiapi.dev / EDRDG-based data

نسخهٔ بعدی را می‌توان به‌راحتی با stroke-order animation، تست recall به‌جای self-rating، سینک ابری و آمار retention توسعه داد.
