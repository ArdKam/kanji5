export type MnemonicExample = { word?: string; reading?: string; meaning?: string };

export type MnemonicSupportInput = {
  character: string;
  meanings?: string[];
  on?: string[];
  kun?: string[];
  examples?: MnemonicExample[];
  components?: string[];
};

export type ReadingKeyword = {
  reading: string;
  keywordEn: string;
  keywordFa: string;
};

export type ComponentLabel = { fa: string; en: string };

export const READING_KEYWORDS: Readonly<Record<string, ReadingKeyword>> = Object.freeze({
  "シ": {
    "reading": "シ",
    "keywordEn": "sheep",
    "keywordFa": "گوسفند"
  },
  "コウ": {
    "reading": "コウ",
    "keywordEn": "cow",
    "keywordFa": "گاو"
  },
  "ジ": {
    "reading": "ジ",
    "keywordEn": "jeep",
    "keywordFa": "جیپ"
  },
  "セイ": {
    "reading": "セイ",
    "keywordEn": "sail",
    "keywordFa": "بادبان"
  },
  "ショウ": {
    "reading": "ショウ",
    "keywordEn": "show",
    "keywordFa": "نمایش"
  },
  "カイ": {
    "reading": "カイ",
    "keywordEn": "kite",
    "keywordFa": "کایت"
  },
  "トウ": {
    "reading": "トウ",
    "keywordEn": "toe",
    "keywordFa": "انگشت پا"
  },
  "キョウ": {
    "reading": "キョウ",
    "keywordEn": "Kyoto",
    "keywordFa": "کیوتو"
  },
  "カ": {
    "reading": "カ",
    "keywordEn": "car",
    "keywordFa": "ماشین"
  },
  "セン": {
    "reading": "セン",
    "keywordEn": "sand",
    "keywordFa": "شن"
  },
  "キン": {
    "reading": "キン",
    "keywordEn": "king",
    "keywordFa": "پادشاه"
  },
  "ダイ": {
    "reading": "ダイ",
    "keywordEn": "dye",
    "keywordFa": "رنگ"
  },
  "タイ": {
    "reading": "タイ",
    "keywordEn": "tie",
    "keywordFa": "کراوات"
  },
  "ジョウ": {
    "reading": "ジョウ",
    "keywordEn": "Joe",
    "keywordFa": "جو"
  },
  "チョウ": {
    "reading": "チョウ",
    "keywordEn": "chow",
    "keywordFa": "غذا"
  },
  "ケン": {
    "reading": "ケン",
    "keywordEn": "kennel",
    "keywordFa": "لانهٔ سگ"
  },
  "シン": {
    "reading": "シン",
    "keywordEn": "shin",
    "keywordFa": "ساق پا"
  },
  "キ": {
    "reading": "キ",
    "keywordEn": "key",
    "keywordFa": "کلید"
  },
  "シャ": {
    "reading": "シャ",
    "keywordEn": "shah",
    "keywordFa": "شاه"
  },
  "サン": {
    "reading": "サン",
    "keywordEn": "sun",
    "keywordFa": "خورشید"
  },
  "ク": {
    "reading": "ク",
    "keywordEn": "coop",
    "keywordFa": "مرغدانی"
  },
  "ゴ": {
    "reading": "ゴ",
    "keywordEn": "goal",
    "keywordFa": "دروازهٔ فوتبال"
  },
  "サイ": {
    "reading": "サイ",
    "keywordEn": "sigh",
    "keywordFa": "آه"
  },
  "カン": {
    "reading": "カン",
    "keywordEn": "can",
    "keywordFa": "قوطی"
  },
  "ホウ": {
    "reading": "ホウ",
    "keywordEn": "hoe",
    "keywordFa": "بیل"
  },
  "ケイ": {
    "reading": "ケイ",
    "keywordEn": "cake",
    "keywordFa": "کیک"
  },
  "ゲン": {
    "reading": "ゲン",
    "keywordEn": "Gen",
    "keywordFa": "جِن"
  },
  "サク": {
    "reading": "サク",
    "keywordEn": "sack",
    "keywordFa": "کیسه"
  },
  "ショ": {
    "reading": "ショ",
    "keywordEn": "shop",
    "keywordFa": "فروشگاه"
  },
  "コン": {
    "reading": "コン",
    "keywordEn": "cone",
    "keywordFa": "مخروط"
  },
  "ゴン": {
    "reading": "ゴン",
    "keywordEn": "gone",
    "keywordFa": "رفته"
  },
  "ニン": {
    "reading": "ニン",
    "keywordEn": "ninja",
    "keywordFa": "نینجا"
  },
  "ゲ": {
    "reading": "ゲ",
    "keywordEn": "get",
    "keywordFa": "گِت"
  },
  "サ": {
    "reading": "サ",
    "keywordEn": "saw",
    "keywordFa": "اره"
  },
  "ソク": {
    "reading": "ソク",
    "keywordEn": "sock",
    "keywordFa": "جوراب"
  },
  "エ": {
    "reading": "エ",
    "keywordEn": "egg",
    "keywordFa": "تخم‌مرغ"
  },
  "ホン": {
    "reading": "ホン",
    "keywordEn": "horn",
    "keywordFa": "شاخ"
  },
  "ドウ": {
    "reading": "ドウ",
    "keywordEn": "dough",
    "keywordFa": "خمیر"
  },
  "アン": {
    "reading": "アン",
    "keywordEn": "ant",
    "keywordFa": "مورچه"
  },
  "ブ": {
    "reading": "ブ",
    "keywordEn": "boot",
    "keywordFa": "چکمه"
  },
  "チ": {
    "reading": "チ",
    "keywordEn": "cheese",
    "keywordFa": "پنیر"
  },
  "ゴウ": {
    "reading": "ゴウ",
    "keywordEn": "goat",
    "keywordFa": "بز"
  },
  "ソウ": {
    "reading": "ソウ",
    "keywordEn": "sew",
    "keywordFa": "دوختن"
  },
  "テイ": {
    "reading": "テイ",
    "keywordEn": "tea",
    "keywordFa": "چای"
  },
  "イン": {
    "reading": "イン",
    "keywordEn": "inn",
    "keywordFa": "مهمانخانه"
  },
  "ケ": {
    "reading": "ケ",
    "keywordEn": "cape",
    "keywordFa": "شنل"
  },
  "イ": {
    "reading": "イ",
    "keywordEn": "eel",
    "keywordFa": "مارماهی"
  },
  "ハン": {
    "reading": "ハン",
    "keywordEn": "hand",
    "keywordFa": "دست"
  },
  "カク": {
    "reading": "カク",
    "keywordEn": "cook",
    "keywordFa": "آشپز"
  },
  "スイ": {
    "reading": "スイ",
    "keywordEn": "sweet",
    "keywordFa": "شیرین"
  },
  "ボク": {
    "reading": "ボク",
    "keywordEn": "box",
    "keywordFa": "جعبه"
  },
  "モク": {
    "reading": "モク",
    "keywordEn": "smoke",
    "keywordFa": "دود"
  },
  "ド": {
    "reading": "ド",
    "keywordEn": "door",
    "keywordFa": "در"
  },
  "ダン": {
    "reading": "ダン",
    "keywordEn": "dawn",
    "keywordFa": "سپیده‌دم"
  },
  "ナン": {
    "reading": "ナン",
    "keywordEn": "naan",
    "keywordFa": "نان"
  },
  "ゼン": {
    "reading": "ゼン",
    "keywordEn": "Zen",
    "keywordFa": "ذن"
  },
  "コク": {
    "reading": "コク",
    "keywordEn": "Coke",
    "keywordFa": "کوکاکولا"
  },
  "ジュウ": {
    "reading": "ジュウ",
    "keywordEn": "juice",
    "keywordFa": "آبمیوه"
  },
  "ゾウ": {
    "reading": "ゾウ",
    "keywordEn": "zoo",
    "keywordFa": "باغ‌وحش"
  },
  "ブン": {
    "reading": "ブン",
    "keywordEn": "boom",
    "keywordFa": "انفجار"
  },
  "ミン": {
    "reading": "ミン",
    "keywordEn": "mint",
    "keywordFa": "نعناع"
  },
  "ハツ": {
    "reading": "ハツ",
    "keywordEn": "hats",
    "keywordFa": "کلاه‌ها"
  },
  "キュウ": {
    "reading": "キュウ",
    "keywordEn": "cube",
    "keywordFa": "مکعب"
  },
  "ジュ": {
    "reading": "ジュ",
    "keywordEn": "jewel",
    "keywordFa": "جواهر"
  },
  "モン": {
    "reading": "モン",
    "keywordEn": "moon",
    "keywordFa": "ماه"
  },
  "メイ": {
    "reading": "メイ",
    "keywordEn": "mail",
    "keywordFa": "نامه"
  },
  "ミョウ": {
    "reading": "ミョウ",
    "keywordEn": "meow",
    "keywordFa": "میو"
  },
  "ケツ": {
    "reading": "ケツ",
    "keywordEn": "cats",
    "keywordFa": "گربه‌ها"
  },
  "ヒョウ": {
    "reading": "ヒョウ",
    "keywordEn": "pew",
    "keywordFa": "پیو"
  },
  "リ": {
    "reading": "リ",
    "keywordEn": "leaf",
    "keywordFa": "برگ"
  },
  "シュウ": {
    "reading": "シュウ",
    "keywordEn": "shoe",
    "keywordFa": "کفش"
  },
  "フ": {
    "reading": "フ",
    "keywordEn": "hoop",
    "keywordFa": "حلقه"
  },
  "ヨウ": {
    "reading": "ヨウ",
    "keywordEn": "yoyo",
    "keywordFa": "یویو"
  },
  "ワ": {
    "reading": "ワ",
    "keywordEn": "wall",
    "keywordFa": "دیوار"
  },
  "リョウ": {
    "reading": "リョウ",
    "keywordEn": "Rio",
    "keywordFa": "ریو"
  },
  "トク": {
    "reading": "トク",
    "keywordEn": "talk",
    "keywordFa": "صحبت"
  },
  "ツ": {
    "reading": "ツ",
    "keywordEn": "tsunami",
    "keywordFa": "سونامی"
  },
  "ジツ": {
    "reading": "ジツ",
    "keywordEn": "jets",
    "keywordFa": "جت‌ها"
  },
  "ゲツ": {
    "reading": "ゲツ",
    "keywordEn": "gets",
    "keywordFa": "می‌گیرد"
  },
  "ガツ": {
    "reading": "ガツ",
    "keywordEn": "guts",
    "keywordFa": "دل‌وجرأت"
  },
  "ジン": {
    "reading": "ジン",
    "keywordEn": "jean",
    "keywordFa": "شلوار جین"
  },
  "チュウ": {
    "reading": "チュウ",
    "keywordEn": "chew",
    "keywordFa": "جویدن"
  },
  "ウ": {
    "reading": "ウ",
    "keywordEn": "woo",
    "keywordFa": "وای / ذوق"
  },
  "ユウ": {
    "reading": "ユウ",
    "keywordEn": "ewe",
    "keywordFa": "گوسفند ماده"
  },
  "デン": {
    "reading": "デン",
    "keywordEn": "den",
    "keywordFa": "لانه"
  },
  "リキ": {
    "reading": "リキ",
    "keywordEn": "leaky",
    "keywordFa": "چکه‌کننده"
  },
  "リイ": {
    "reading": "リイ",
    "keywordEn": "leek",
    "keywordFa": "تره‌فرنگی"
  },
  "ジョ": {
    "reading": "ジョ",
    "keywordEn": "joke",
    "keywordFa": "شوخی"
  },
  "ガク": {
    "reading": "ガク",
    "keywordEn": "gawk",
    "keywordFa": "خیره‌شدن"
  },
  "ネン": {
    "reading": "ネン",
    "keywordEn": "neon",
    "keywordFa": "نئون"
  },
  "ホク": {
    "reading": "ホク",
    "keywordEn": "hawk",
    "keywordFa": "شاهین"
  },
  "イチ": {
    "reading": "イチ",
    "keywordEn": "itch",
    "keywordFa": "خارش"
  },
  "イツ": {
    "reading": "イツ",
    "keywordEn": "eats",
    "keywordFa": "می‌خورد"
  },
  "ニ": {
    "reading": "ニ",
    "keywordEn": "knee",
    "keywordFa": "زانو"
  },
  "シュツ": {
    "reading": "シュツ",
    "keywordEn": "shoots",
    "keywordFa": "شلیک می‌کند"
  },
  "フン": {
    "reading": "フン",
    "keywordEn": "fun",
    "keywordFa": "تفریح"
  },
  "ギ": {
    "reading": "ギ",
    "keywordEn": "gear",
    "keywordFa": "چرخ‌دنده"
  },
  "レン": {
    "reading": "レン",
    "keywordEn": "wren",
    "keywordFa": "پرندهٔ ریز"
  },
  "ツイ": {
    "reading": "ツイ",
    "keywordEn": "tweet",
    "keywordFa": "توییت"
  },
  "ガッ": {
    "reading": "ガッ",
    "keywordEn": "got",
    "keywordFa": "گرفت"
  },
  "カッ": {
    "reading": "カッ",
    "keywordEn": "cat",
    "keywordFa": "گربه"
  },
  "ナイ": {
    "reading": "ナイ",
    "keywordEn": "nice",
    "keywordFa": "خوب"
  },
  "ニュウ": {
    "reading": "ニュウ",
    "keywordEn": "new",
    "keywordFa": "جدید"
  },
  "リツ": {
    "reading": "リツ",
    "keywordEn": "Ritz",
    "keywordFa": "ریتز"
  },
  "ベイ": {
    "reading": "ベイ",
    "keywordEn": "bay",
    "keywordFa": "خلیج"
  },
  "マイ": {
    "reading": "マイ",
    "keywordEn": "mice",
    "keywordFa": "موش‌ها"
  },
  "シツ": {
    "reading": "シツ",
    "keywordEn": "sheets",
    "keywordFa": "ملحفه‌ها"
  },
  "エン": {
    "reading": "エン",
    "keywordEn": "end",
    "keywordFa": "پایان"
  },
  "ツウ": {
    "reading": "ツウ",
    "keywordEn": "two",
    "keywordFa": "دو"
  },
  "ガイ": {
    "reading": "ガイ",
    "keywordEn": "guy",
    "keywordFa": "مرد"
  },
  "ハチ": {
    "reading": "ハチ",
    "keywordEn": "hatch",
    "keywordFa": "بیرون‌آمدن"
  },
  "ロク": {
    "reading": "ロク",
    "keywordEn": "lock",
    "keywordFa": "قفل"
  },
  "リク": {
    "reading": "リク",
    "keywordEn": "Rick",
    "keywordFa": "ریک"
  },
  "ヤク": {
    "reading": "ヤク",
    "keywordEn": "yuck",
    "keywordFa": "اَه"
  },
  "ハッ": {
    "reading": "ハッ",
    "keywordEn": "hut",
    "keywordFa": "کلبه"
  },
  "ホッ": {
    "reading": "ホッ",
    "keywordEn": "hot",
    "keywordFa": "داغ"
  },
  "フラン": {
    "reading": "フラン",
    "keywordEn": "flan",
    "keywordFa": "فلن"
  },
  "ライ": {
    "reading": "ライ",
    "keywordEn": "lie",
    "keywordFa": "دروغ"
  },
  "テキ": {
    "reading": "テキ",
    "keywordEn": "tech",
    "keywordFa": "فناوری"
  },
  "タク": {
    "reading": "タク",
    "keywordEn": "taco",
    "keywordFa": "تاکو"
  },
  "ム": {
    "reading": "ム",
    "keywordEn": "moo",
    "keywordFa": "می‌گوید مو"
  },
  "シチ": {
    "reading": "シチ",
    "keywordEn": "city",
    "keywordFa": "شهر"
  },
  "ヤ": {
    "reading": "ヤ",
    "keywordEn": "yak",
    "keywordFa": "یاک"
  },
  "オ": {
    "reading": "オ",
    "keywordEn": "oar",
    "keywordFa": "پاروی قایق"
  },
  "ヘイ": {
    "reading": "ヘイ",
    "keywordEn": "hay",
    "keywordFa": "یونجه"
  },
  "セ": {
    "reading": "セ",
    "keywordEn": "say",
    "keywordFa": "بگو"
  },
  "オウ": {
    "reading": "オウ",
    "keywordEn": "oak",
    "keywordFa": "درخت بلوط"
  },
  "ショク": {
    "reading": "ショク",
    "keywordEn": "shock",
    "keywordFa": "شوک"
  },
  "セツ": {
    "reading": "セツ",
    "keywordEn": "sets",
    "keywordFa": "می‌چیند"
  },
  "スウ": {
    "reading": "スウ",
    "keywordEn": "soup",
    "keywordFa": "سوپ"
  },
  "ケチ": {
    "reading": "ケチ",
    "keywordEn": "catchy",
    "keywordFa": "گرفتنی و به‌یادماندنی"
  },
  "ハ": {
    "reading": "ハ",
    "keywordEn": "hat",
    "keywordFa": "کلاه"
  },
  "テン": {
    "reading": "テン",
    "keywordEn": "ten",
    "keywordFa": "ده"
  },
  "カツ": {
    "reading": "カツ",
    "keywordEn": "cuts",
    "keywordFa": "می‌بُرد"
  },
  "ヨ": {
    "reading": "ヨ",
    "keywordEn": "yoga",
    "keywordFa": "یوگا"
  },
  "メン": {
    "reading": "メン",
    "keywordEn": "men",
    "keywordFa": "مردان"
  },
  "ベン": {
    "reading": "ベン",
    "keywordEn": "Ben",
    "keywordFa": "بن"
  },
  "タン": {
    "reading": "タン",
    "keywordEn": "tan",
    "keywordFa": "برنزه"
  },
  "ガン": {
    "reading": "ガン",
    "keywordEn": "gun",
    "keywordFa": "تفنگ"
  },
  "バン": {
    "reading": "バン",
    "keywordEn": "van",
    "keywordFa": "ون"
  },
  "バイ": {
    "reading": "バイ",
    "keywordEn": "bye",
    "keywordFa": "خداحافظ"
  },
  "トン": {
    "reading": "トン",
    "keywordEn": "tone",
    "keywordFa": "لحن"
  },
  "ベツ": {
    "reading": "ベツ",
    "keywordEn": "bets",
    "keywordFa": "شرط‌ها"
  },
  "ブツ": {
    "reading": "ブツ",
    "keywordEn": "boots",
    "keywordFa": "چکمه‌ها"
  },
  "モツ": {
    "reading": "モツ",
    "keywordEn": "moats",
    "keywordFa": "خندق‌ها"
  },
  "グ": {
    "reading": "グ",
    "keywordEn": "goo",
    "keywordFa": "مادهٔ چسبناک"
  },
  "ヒン": {
    "reading": "ヒン",
    "keywordEn": "hint",
    "keywordFa": "اشاره"
  },
  "ロン": {
    "reading": "ロン",
    "keywordEn": "Ron",
    "keywordFa": "رون"
  },
  "ヘン": {
    "reading": "ヘン",
    "keywordEn": "hen",
    "keywordFa": "مرغ"
  },
  "ダ": {
    "reading": "ダ",
    "keywordEn": "duck",
    "keywordFa": "اردک"
  },
  "チョク": {
    "reading": "チョク",
    "keywordEn": "choke",
    "keywordFa": "خفه‌شدن"
  },
});

export const COMPONENT_LABELS: Readonly<Record<string, ComponentLabel>> = Object.freeze({
  "一": { fa: "یک", en: "one" },
  "二": { fa: "دو", en: "two" },
  "三": { fa: "سه", en: "three" },
  "十": { fa: "ده", en: "ten" },
  "口": { fa: "دهان", en: "mouth" },
  "日": { fa: "خورشید / روز", en: "sun / day" },
  "月": { fa: "ماه", en: "moon" },
  "木": { fa: "درخت", en: "tree" },
  "本": { fa: "ریشه / پایه", en: "base / origin" },
  "水": { fa: "آب", en: "water" },
  "氵": { fa: "آب", en: "water" },
  "火": { fa: "آتش", en: "fire" },
  "灬": { fa: "آتش / شعله", en: "fire / flames" },
  "土": { fa: "خاک", en: "earth" },
  "山": { fa: "کوه", en: "mountain" },
  "川": { fa: "رود", en: "river" },
  "田": { fa: "مزرعه", en: "field" },
  "人": { fa: "انسان", en: "person" },
  "亻": { fa: "انسان", en: "person" },
  "大": { fa: "بزرگ / آدم", en: "big / person" },
  "小": { fa: "کوچک", en: "small" },
  "女": { fa: "زن", en: "woman" },
  "子": { fa: "کودک", en: "child" },
  "手": { fa: "دست", en: "hand" },
  "扌": { fa: "دست", en: "hand" },
  "足": { fa: "پا", en: "foot" },
  "力": { fa: "نیرو", en: "power" },
  "心": { fa: "قلب", en: "heart" },
  "忄": { fa: "قلب / احساس", en: "heart / feeling" },
  "言": { fa: "گفتار", en: "speech" },
  "訁": { fa: "گفتار", en: "speech" },
  "目": { fa: "چشم", en: "eye" },
  "見": { fa: "دیدن", en: "see" },
  "耳": { fa: "گوش", en: "ear" },
  "刀": { fa: "چاقو", en: "knife" },
  "刂": { fa: "تیغه", en: "blade" },
  "文": { fa: "نوشتار", en: "writing" },
  "寸": { fa: "اندازهٔ کوچک", en: "small measure" },
  "斤": { fa: "تبر", en: "axe" },
  "攵": { fa: "ضربه / عمل", en: "action / strike" },
  "辶": { fa: "مسیر / حرکت", en: "path / movement" },
  "糸": { fa: "نخ", en: "thread" },
  "貝": { fa: "صدف / پول", en: "shell / money" },
  "車": { fa: "چرخ / وسیله", en: "vehicle / wheel" },
  "門": { fa: "دروازه", en: "gate" },
  "宀": { fa: "سقف", en: "roof" },
  "阝": { fa: "نشانهٔ مکان / تپه", en: "place / mound marker" },
  "王": { fa: "پادشاه", en: "king" },
  "玉": { fa: "جواهر", en: "jewel" },
  "石": { fa: "سنگ", en: "stone" },
  "雨": { fa: "باران", en: "rain" },
  "竹": { fa: "بامبو", en: "bamboo" },
  "艹": { fa: "گیاه", en: "plant" },
  "米": { fa: "برنج", en: "rice" },
  "禾": { fa: "غله", en: "grain" },
  "魚": { fa: "ماهی", en: "fish" },
  "鳥": { fa: "پرنده", en: "bird" },
  "隹": { fa: "پرنده", en: "bird" },
  "馬": { fa: "اسب", en: "horse" },
  "牛": { fa: "گاو", en: "cow" },
  "犬": { fa: "سگ", en: "dog" },
  "犭": { fa: "حیوان", en: "animal" },
  "虫": { fa: "حشره", en: "insect" },
  "立": { fa: "ایستادن", en: "stand" },
  "早": { fa: "زود / صبح", en: "early / morning" },
  "方": { fa: "جهت", en: "direction" },
  "正": { fa: "درست", en: "correct" },
  "交": { fa: "اختلاط /交", en: "mix / interact" },
  "父": { fa: "پدر", en: "father" },
  "母": { fa: "مادر", en: "mother" },
  "兄": { fa: "برادر بزرگ‌تر", en: "older brother" },
  "共": { fa: "باهم", en: "together" },
  "也": { fa: "نیز", en: "also" },
  "充": { fa: "پر / کامل", en: "fill / complete" },
  "各": { fa: "هرکدام", en: "each" },
  "且": { fa: "و نیز", en: "moreover" },
  "其": { fa: "آن / بخش", en: "that / part" },
  "巳": { fa: "جزء دیداری", en: "visual cue" },
  "用": { fa: "استفاده", en: "use" },
  "勿": { fa: "علامت دیداری", en: "visual cue" },
  "冂": { fa: "قاب", en: "frame" },
  "广": { fa: "ساختار سقف‌مانند", en: "shelter-like shape" },
  "冖": { fa: "پوشش", en: "cover" },
  "夂": { fa: "گام", en: "step" }
});

export function getComponentLabel(component: string, language: "fa" | "en"): string {
  const label = COMPONENT_LABELS[String(component ?? "").trim()];
  return label ? label[language] : "";
}

function normalizeKatakana(value: string): string {
  return String(value ?? "")
    .trim()
    .replace(/[ぁ-ゖ]/g, char => String.fromCharCode(char.charCodeAt(0) + 0x60))
    .replace(/[・.]/g, "")
    .replace(/[ー]/g, "");
}

export function getReadingKeyword(reading: string): ReadingKeyword | null {
  const key = normalizeKatakana(reading);
  return READING_KEYWORDS[key] ?? null;
}

export type ConfusableBasis = "stroke" | "component" | "enclosure";

export type ConfusableCue = {
  pair: string;
  fa: string;
  en: string;
  basis: ConfusableBasis;
  groupId: string;
  peers: string[];
};

type ConfusableGroup = {
  id: string;
  basis: ConfusableBasis;
  members: string[];
  cues: Record<string, { fa: string; en: string }>;
};

export const CONFUSABLE_GROUPS: Readonly<ConfusableGroup[]> = Object.freeze([
  {
    id: "未末",
    basis: "stroke",
    members: ["未", "末"],
    cues: {
      "未": { fa: "در 未 خط بالایی کوتاه‌تر است؛ در 末 بخش بالایی کشیده‌تر می‌شود.", en: "In 未 the upper line is shorter; in 末 the upper part stretches farther." },
      "末": { fa: "در 末 بخش بالایی کشیده‌تر است؛ جای خط‌های 未 و 末 را قاطی نکن.", en: "In 末 the upper part is longer; keep its stroke positions distinct from 未." }
    }
  },
  {
    id: "土士",
    basis: "stroke",
    members: ["土", "士"],
    cues: {
      "土": { fa: "در 土 خط پایین بلندتر است؛ در 士 خط بالا بلندتر دیده می‌شود.", en: "土 has the longer lower line; 士 has the longer upper line." },
      "士": { fa: "در 士 خط بالا کشیده‌تر است و خط پایین کوتاه‌تر از 土 می‌ماند.", en: "In 士 the upper line is longer and the lower line is shorter than in 土." }
    }
  },
  {
    id: "人入",
    basis: "stroke",
    members: ["人", "入"],
    cues: {
      "人": { fa: "人 بازتر می‌ایستد و شکل سادهٔ یک آدم را می‌دهد؛ 入 جمع‌شونده‌تر به داخل می‌رود.", en: "人 opens more like a standing person; 入 funnels inward more sharply." },
      "入": { fa: "در 入 دو خط حس ورود به داخل می‌دهند؛ 人 بازتر می‌ایستد.", en: "In 入 the strokes funnel inward like entering; 人 opens more." }
    }
  },
  {
    id: "大犬太",
    basis: "stroke",
    members: ["大", "犬", "太"],
    cues: {
      "大": { fa: "大 بدون نقطه است؛ یک نقطهٔ اضافه تو را به 犬 یا 太 می‌برد.", en: "大 is dot-free; a single extra dot turns the comparison toward 犬 or 太." },
      "犬": { fa: "犬 تقریباً 大 است اما یک نقطهٔ اضافه دارد؛ همان نقطه را به‌عنوان علامت سگ قفل کن.", en: "犬 is almost 大 but adds one dot; lock onto that dot as the dog cue." },
      "太": { fa: "太 از 大 می‌آید و یک نقطهٔ اضافه پایین آن دارد؛ نقطه را پیدا کن.", en: "太 starts from 大 and adds one dot below; find that dot." }
    }
  },
  {
    id: "木本",
    basis: "component",
    members: ["木", "本"],
    cues: {
      "木": { fa: "木 درخت ساده است؛ 本 یک علامت مشخص روی پایهٔ درخت اضافه می‌کند.", en: "木 is the plain tree; 本 adds a clear mark at the tree's base." },
      "本": { fa: "در 本 دنبال علامت پایه بگرد؛ بدون آن، هستهٔ شکل همان 木 است.", en: "In 本, find the base mark; without it, the core shape is 木." }
    }
  },
  {
    id: "日目",
    basis: "component",
    members: ["日", "目"],
    cues: {
      "日": { fa: "日 یک قاب ساده است؛ 目 را به‌عنوان چشم با خطوط داخلی نگه دار.", en: "日 is a simple box; keep 目 as an eye with its internal lines." },
      "目": { fa: "目 چشم است: خطوط داخلی را حفظ کن تا به قاب سادهٔ 日 فرو نریزد.", en: "目 is the eye: keep its internal lines so it does not collapse into the simple 日 box." }
    }
  },
  {
    id: "口回",
    basis: "enclosure",
    members: ["口", "回"],
    cues: {
      "口": { fa: "口 فقط یک قاب خالی دارد؛ 回 یک قاب دوم را داخل خودش نگه می‌دارد.", en: "口 is one empty box; 回 contains a second box inside." },
      "回": { fa: "برای 回 اول 口 را ببین، بعد قاب دوم را داخل آن قفل کن.", en: "For 回, start with 口 and then lock in the second inner box." }
    }
  },
  {
    id: "間問",
    basis: "component",
    members: ["間", "問"],
    cues: {
      "間": { fa: "در 間 داخل 門 خورشید 日 را ببین؛ در 問 همان دروازه دهان 口 دارد.", en: "間 puts 日 inside 門; 問 uses the same gate with 口 instead." },
      "問": { fa: "در 問 دنبال دهان 口 داخل 門 بگرد؛ خورشید 日 مسیر را به 間 می‌برد.", en: "In 問, look for 口 inside 門; seeing 日 points to 間 instead." }
    }
  },
  {
    id: "白百",
    basis: "stroke",
    members: ["白", "百"],
    cues: {
      "白": { fa: "白 قاب روشنِ ساده است؛ 百 یک خط اضافه در بالای آن دارد.", en: "白 is the plain bright box; 百 adds an extra top line." },
      "百": { fa: "در 百 اول خط اضافهٔ بالا را پیدا کن؛ حذفش شکل را به 白 نزدیک می‌کند.", en: "In 百, find the extra top line; removing it leaves the simpler 白 shape." }
    }
  },
  {
    id: "王玉",
    basis: "stroke",
    members: ["王", "玉"],
    cues: {
      "王": { fa: "王 سه خط افقی دارد و نقطهٔ کناری ندارد؛ 玉 همان اسکلت را با یک نقطه کامل می‌کند.", en: "王 has three horizontal lines without a side dot; 玉 adds a dot to the same skeleton." },
      "玉": { fa: "玉 را با نقطهٔ کناری به خاطر بسپار؛ بدون آن، اسکلتش 王 است.", en: "Remember 玉 by its side dot; without it, the skeleton is 王." }
    }
  },
  {
    id: "牛午",
    basis: "stroke",
    members: ["牛", "午"],
    cues: {
      "牛": { fa: "牛 را با خط افقی بالاتر و فرم خمیدهٔ پایین نگه دار؛ 午 جای ضربه‌ها را کمی متفاوت می‌کند.", en: "Keep 牛 with its higher cross stroke and lower sweep; 午 shifts the stroke structure." },
      "午": { fa: "در 午 جای ضربهٔ میانی را با 牛 مقایسه کن؛ شکل کلی شبیه است اما ترتیب خطوط یکسان نیست.", en: "Compare the middle stroke of 午 with 牛; the silhouette is close but the stroke structure differs." }
    }
  },
  {
    id: "千干",
    basis: "stroke",
    members: ["千", "干"],
    cues: {
      "千": { fa: "千 یک خط مورب مشخص بالای تنه دارد؛干 ساختار افقی‌تری دارد.", en: "千 has a distinctive diagonal over its stem; 干 is more horizontally structured." },
      "干": { fa: "干 را با دو خط افقی و یک تنهٔ عمودی قفل کن؛ مورب 千 را اضافه نکن.", en: "Lock 干 to its horizontal bars and vertical stem; do not add 千's diagonal." }
    }
  },
  {
    id: "右石",
    basis: "component",
    members: ["右", "石"],
    cues: {
      "右": { fa: "در 右 دهان 口 زیر ضربهٔ مورب می‌آید؛ 石 هم 口 دارد اما سقفش شکل دیگری دارد.", en: "右 places 口 under a diagonal stroke; 石 also has 口 but uses a different top structure." },
      "石": { fa: "در 石 به قاب 口 و سقف افقی بالای آن دقت کن؛ مورب 右 همان جایگاه را ندارد.", en: "In 石, focus on 口 under its horizontal top; 右 uses a different diagonal lead-in." }
    }
  },
  {
    id: "友反",
    basis: "stroke",
    members: ["友", "反"],
    cues: {
      "友": { fa: "友 با ضربهٔ بالایی و فرم دست‌مانند به پایین می‌رسد؛ 反 کشش متفاوتی در نیمهٔ پایین دارد.", en: "友 descends from its upper strokes into a hand-like form; 反 has a different lower sweep." },
      "反": { fa: "در 反 نیمهٔ پایین را مثل یک برگشت قوسی ببین؛ شکل 友 را روی آن تحمیل نکن.", en: "In 反, see the lower half as a curved return; do not impose 友's structure on it." }
    }
  },
  {
    id: "夕外",
    basis: "component",
    members: ["夕", "外"],
    cues: {
      "夕": { fa: "夕 فقط فرم شبانهٔ ساده را دارد؛ 外 همان هسته را با یک علامت کناری کامل می‌کند.", en: "夕 is the simple evening form; 外 keeps that core and adds a side mark." },
      "外": { fa: "در 外 اول 夕 را پیدا کن و سپس علامت کناری را جدا کن؛ حذف آن تو را به 夕 می‌رساند.", en: "In 外, find 夕 first, then isolate the side mark; remove it and you return to 夕." }
    }
  },
  {
    id: "力刀",
    basis: "stroke",
    members: ["力", "刀"],
    cues: {
      "力": { fa: "力 را با شکست و قوس مخصوص خودش نگه دار؛刀 شکل تیغه را با انحنای متفاوت می‌سازد.", en: "Keep 力 by its distinctive bend; 刀 forms a blade with a different curved stroke." },
      "刀": { fa: "刀 را مثل تیغه‌ای با لبهٔ قوسی ببین؛ قوس آن را با 力 یکی نکن.", en: "See 刀 as a curved blade; keep its hook distinct from 力." }
    }
  },
  {
    id: "夫天",
    basis: "stroke",
    members: ["夫", "天"],
    cues: {
      "夫": { fa: "夫 یک ضربهٔ اضافه در پایینِ هستهٔ 天 دارد؛ خط پایین را چک کن.", en: "夫 adds a lower stroke relationship to the 天 skeleton; check the bottom line." },
      "天": { fa: "天 دو خط بالایی و یک تنهٔ تمیز دارد؛ جای ضربهٔ اضافی 夫 را اضافه نکن.", en: "天 keeps a clean upper structure; do not add 夫's extra lower-stroke pattern." }
    }
  },
  {
    id: "休体",
    basis: "component",
    members: ["休", "体"],
    cues: {
      "休": { fa: "هر دو با 亻 شروع می‌شوند؛ در 休 کنار آدم، 木 ساده است.", en: "Both start with 亻; in 休 the companion component is plain 木." },
      "体": { fa: "هر دو با 亻 شروع می‌شوند؛ در 体 کنار آدم، 本 با علامت پایه می‌آید.", en: "Both start with 亻; in 体 the companion is 本 with the base mark." }
    }
  },
  {
    id: "待持",
    basis: "component",
    members: ["待", "持"],
    cues: {
      "待": { fa: "待 را با 彳 در سمت چپ حفظ کن؛ 持 همان 寺 را با 扌 دست می‌آورد.", en: "待 keeps 彳 on the left; 持 pairs the same 寺 with 扌, the hand." },
      "持": { fa: "در 持 علامت دست 扌 در چپ را قفل کن؛ 彳 تو را به 待 می‌برد.", en: "In 持, lock onto the hand radical 扌 on the left; 彳 points to 待." }
    }
  },
  {
    id: "時寺",
    basis: "component",
    members: ["時", "寺"],
    cues: {
      "時": { fa: "時 = 日 + 寺؛ وجود خورشید 日 در چپ آن را از خودِ 寺 جدا می‌کند.", en: "時 = 日 + 寺; the added sun 日 on the left separates it from standalone 寺." },
      "寺": { fa: "寺 خودِ هسته را بدون 日 در چپ نگه می‌دارد؛ وقتی 日 اضافه شد، 時 است.", en: "寺 is the core without the left-side 日; add 日 and you get 時." }
    }
  },
  {
    id: "地池",
    basis: "component",
    members: ["地", "池"],
    cues: {
      "地": { fa: "地 در چپ 土 دارد؛池 همان 也 را با آب 氵 جفت می‌کند.", en: "地 has 土 on the left; 池 pairs the same 也 with water 氵." },
      "池": { fa: "در 池، آب 氵 در چپ را ببین؛ 土 همان نقطهٔ تفکیک برای 地 است.", en: "In 池, look for water 氵 on the left; 土 is the differentiator for 地." }
    }
  },
  {
    id: "清情晴",
    basis: "component",
    members: ["清", "情", "晴"],
    cues: {
      "清": { fa: "هر سه 青 را نگه می‌دارند؛ آب 氵 در چپ یعنی 清.", en: "All three share 青; water 氵 on the left identifies 清." },
      "情": { fa: "هر سه 青 را نگه می‌دارند؛ قلب/احساس 忄 در چپ یعنی 情.", en: "All three share 青; the heart/feeling radical 忄 on the left identifies 情." },
      "晴": { fa: "هر سه 青 را نگه می‌دارند؛ خورشید 日 در چپ یعنی 晴.", en: "All three share 青; the sun 日 on the left identifies 晴." }
    }
  },
  {
    id: "借惜",
    basis: "component",
    members: ["借", "惜"],
    cues: {
      "借": { fa: "借 سمت چپ 亻 دارد؛惜 همان هستهٔ 昔 را با قلب 忄 همراه می‌کند.", en: "借 has 亻 on the left; 惜 pairs the same 昔 core with the heart radical 忄." },
      "惜": { fa: "در 惜، 忄 سمت چپ را قفل کن؛ 亻 تو را به 借 می‌برد.", en: "In 惜, lock onto 忄 on the left; 亻 points you to 借." }
    }
  },
  {
    id: "計討",
    basis: "component",
    members: ["計", "討"],
    cues: {
      "計": { fa: "هر دو 言 را نگه می‌دارند؛ 寸 در سمت راست برای 計 است.", en: "Both share 言; 寸 on the right identifies 計." },
      "討": { fa: "هر دو 言 را نگه می‌دارند؛ 寸 در جایگاه مخصوص خود را با کل شکل مقایسه کن تا 討 قفل شود.", en: "Both share 言; use the right-side 寸 placement and whole silhouette to keep 討 distinct." }
    }
  },
  {
    id: "話活",
    basis: "component",
    members: ["話", "活"],
    cues: {
      "話": { fa: "هر دو 言 را در چپ دارند؛ 舌 سمت راست یعنی 話.", en: "Both start with 言 on the left; 舌 on the right identifies 話." },
      "活": { fa: "هر دو چپِ هم‌خانواده دارند؛ وقتی 氵 در چپ و 舌 در راست است، 活 را بخوان.", en: "Use the water 氵 on the left with 舌 on the right to lock in 活." }
    }
  },
  {
    id: "遠園",
    basis: "enclosure",
    members: ["遠", "園"],
    cues: {
      "遠": { fa: "遠 قاب 辶 را در اطراف یک هستهٔ عمودی‌تر می‌کشد؛園 قاب 囗 را دور خوشهٔ مرکزی می‌بندد.", en: "遠 carries the movement radical 辶; 園 encloses its center with 囗." },
      "園": { fa: "در 園 قاب کامل 囗 را دور هسته ببین؛ وجود 辶 مسیر را به 遠 می‌برد.", en: "In 園, the full 囗 enclosure surrounds the core; 辶 signals 遠 instead." }
    }
  },
  {
    id: "衣依",
    basis: "component",
    members: ["衣", "依"],
    cues: {
      "衣": { fa: "衣 شکل مستقل لباس را دارد؛ 依 همان هسته را بعد از 亻 می‌آورد.", en: "衣 is the standalone clothing shape; 依 places the same core after 亻." },
      "依": { fa: "در 依 اول 亻 را ببین، بعد هستهٔ 衣 را اضافه کن.", en: "In 依, first spot 亻, then the 衣 core beside it." }
    }
  },
  {
    id: "昔借",
    basis: "component",
    members: ["昔", "借"],
    cues: {
      "昔": { fa: "昔 خودش هستهٔ ساده است؛ 借 همین هسته را بعد از 亻 می‌آورد.", en: "昔 is the standalone core; 借 places that same core after 亻." },
      "借": { fa: "در 借، 亻 را به‌عنوان علامت جداکنندهٔ سریع ببین؛ بدون آن هستهٔ 昔 می‌ماند.", en: "In 借, use 亻 as the quick differentiator; without it, the core is 昔." }
    }
  },
  {
    id: "免色",
    basis: "stroke",
    members: ["免", "色"],
    cues: {
      "免": { fa: "免 و 色 فرم بالایی نزدیک دارند؛ در免 به بخش پایین و چرخش نهایی دقت کن.", en: "免 and 色 share a similar upper silhouette; focus on the lower finish in 免." },
      "色": { fa: "色 را با قلاب پایانی و فرم جمع‌شدهٔ پایین قفل کن؛ آن را با پایان 免 یکی نکن.", en: "Lock 色 by its hooked lower finish; do not merge it with 免's ending." }
    }
  }
]);

const CONFUSABLE_CUES: Readonly<Record<string, ConfusableCue>> = Object.freeze(
  Object.fromEntries(
    CONFUSABLE_GROUPS.flatMap(group =>
      group.members.map(character => {
        const peers = group.members.filter(peer => peer !== character);
        const cue = group.cues[character];
        return [
          character,
          {
            pair: group.members.join(" ↔ "),
            fa: cue?.fa ?? "این کانجی را با همتای نزدیکش از نظر شکل مقایسه کن.",
            en: cue?.en ?? "Compare this kanji with its nearest visual neighbors.",
            basis: group.basis,
            groupId: group.id,
            peers
          }
        ];
      })
    )
  )
);

export function getConfusableCue(character: string): ConfusableCue | null {
  return CONFUSABLE_CUES[String(character ?? "").trim()] ?? null;
}

export function getConfusableNetwork(character: string): {
  groupId: string;
  basis: ConfusableBasis;
  members: string[];
  peers: string[];
} | null {
  const cue = getConfusableCue(character);
  if (!cue) return null;
  return {
    groupId: cue.groupId,
    basis: cue.basis,
    members: cue.pair.split(" ↔ "),
    peers: [...cue.peers]
  };
}


function normalizeKana(value: string): string {
  return String(value ?? "")
    .trim()
    .replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[・.]/g, "")
    .replace(/[ー]/g, "");
}

function readingMatchScore(exampleReading: string, targetReading: string): number {
  const example = normalizeKana(exampleReading);
  const target = normalizeKana(targetReading);
  if (!example || !target) return 0;
  if (example === target) return 4;
  if (example.startsWith(target)) return 3;
  if (example.includes(target)) return 2;
  return 0;
}

function pickVocabularyExample(
  examples: MnemonicExample[] | undefined,
  character: string,
  preferredReadings: string[] = []
): MnemonicExample | null {
  if (!Array.isArray(examples)) return null;
  const candidates = examples
    .map(example => {
      const word = String(example?.word ?? "").trim();
      const reading = String(example?.reading ?? "").trim();
      const wordStartsWithCharacter = word.startsWith(character);
      const rawReadingScore = Math.max(
        0,
        ...preferredReadings.map(target => readingMatchScore(reading, target))
      );
      const readingScore = rawReadingScore + (rawReadingScore > 0 && wordStartsWithCharacter ? 1 : 0);
      return {
        word,
        reading,
        meaning: String(example?.meaning ?? "").trim(),
        readingScore
      };
    })
    .filter(example => {
      if (!example.word || !example.word.includes(character)) return false;
      if (preferredReadings.length > 0) return example.word.startsWith(character);
      return true;
    })
    .sort((a, b) =>
      b.readingScore - a.readingScore ||
      a.word.length - b.word.length ||
      a.word.localeCompare(b.word)
    );
  const best = candidates[0] ?? null;
  if (preferredReadings.length > 0 && (!best || best.readingScore === 0)) return null;
  return best;
}

export function buildMnemonicSupport(input: MnemonicSupportInput) {
  const character = String(input?.character ?? "").trim();
  const meaning = String(input?.meanings?.find(value => String(value ?? "").trim()) ?? "").trim();
  const components = [...new Set((input?.components ?? []).map(value => String(value ?? "").trim()).filter(Boolean))].slice(0, 6);
  const componentAnchors = components
    .map(component => ({ component, labelFa: getComponentLabel(component, "fa"), labelEn: getComponentLabel(component, "en") }))
    .filter(item => item.labelFa || item.labelEn);

  const readings = [...new Set([...(input?.on ?? []), ...(input?.kun ?? [])].map(value => String(value ?? "").trim()).filter(Boolean))].slice(0, 4);
  const primaryReading = readings[0] ?? "";
  const readingExample = primaryReading
    ? pickVocabularyExample(input?.examples, character, [primaryReading])
    : null;
  const vocabularyExample = pickVocabularyExample(input?.examples, character, []) ?? readingExample;

  const readingKeyword = getReadingKeyword(primaryReading);
  const readingMnemonic = primaryReading
    ? {
        reading: primaryReading,
        keywordEn: readingKeyword?.keywordEn ?? "",
        keywordFa: readingKeyword?.keywordFa ?? "",
        word: readingExample?.word ?? "",
        wordReading: readingExample?.reading ?? "",
        meaning: readingExample?.meaning ?? "",
        fa: readingKeyword
          ? `قلاب آوایی «${primaryReading}» = «${readingKeyword.keywordFa}»: ${meaning ? `این کلمه را در صحنهٔ «${meaning}» تصور کن؛ صدای آن باید ${primaryReading} را برگرداند.` : `همان کلمه را با صدای کانجی جفت کن.`}${readingExample ? ` برای تقویت، واژهٔ واقعی «${readingExample.word}» (${readingExample.reading}) را هم به همان صدا وصل کن.` : ""}`
          : readingExample
            ? `خوانش «${primaryReading}» را به واژهٔ «${readingExample.word}» گره بزن؛ اول واژه را به یاد بیاور، بعد همان صدا را به خود کانجی برگردان.`
            : `خوانش «${primaryReading}» را کنار شکل این کانجی نگه دار و هنگام دیدنش با صدای بلند بازیابی کن.`,
        en: readingKeyword
          ? `Phonetic hook for “${primaryReading}”: “${readingKeyword.keywordEn}”. Picture that keyword inside the scene of “${meaning || "this kanji's meaning"}”; the sound should bring the reading back.${readingExample ? ` Reinforce it with “${readingExample.word}” (${readingExample.reading}).` : ""}`
          : readingExample
            ? `Anchor the reading “${primaryReading}” to “${readingExample.word}”; recall the familiar word first, then pull that sound back to the kanji.`
            : `Keep the reading “${primaryReading}” attached to the kanji shape and retrieve it aloud when you see the character.`
      }
    : null;

  const vocabularyBridge = vocabularyExample
    ? {
        word: vocabularyExample.word,
        reading: vocabularyExample.reading ?? "",
        meaning: vocabularyExample.meaning ?? "",
        fa: `یک واژهٔ واقعی کنار این کانجی داشته باش: «${vocabularyExample.word}» (${vocabularyExample.reading || "خوانش"}) = ${vocabularyExample.meaning || "معنی واژه"}؛ کانجی را در یک کاربرد واقعی ببین.`,
        en: `Keep one real word beside this kanji: “${vocabularyExample.word}” (${vocabularyExample.reading || "reading"}) = ${vocabularyExample.meaning || "word meaning"}; see the character in lexical context.`
      }
    : null;

  return {
    character,
    componentAnchors,
    readingMnemonic,
    vocabularyBridge,
    confusableCue: getConfusableCue(character),
    confusableNetwork: getConfusableNetwork(character)
  };
}

export type MnemonicSupport = ReturnType<typeof buildMnemonicSupport>;

export type MnemonicHintStage = "new" | "recovery" | "early" | "stable" | "mastered";

export type MnemonicHintFocus = "meaning" | "reading" | "both";

type MnemonicLearnerSkill = {
  state?: string;
  accuracy?: number;
  recentAccuracy?: number;
  confidence?: number;
  momentum?: number;
  errorStreak?: number;
  repeatedFailure?: boolean;
};

export type MnemonicHintContext = {
  character?: string;
  isNew?: boolean;
  recentOutcomes?: Array<{ character?: string; correct?: boolean; outcome?: string; at?: string }>;
  learner?: Record<string, MnemonicLearnerSkill>;
};

function numericSignal(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : null;
}

function stateIsMastered(value: unknown): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "mastered" || normalized === "mature";
}

function isWeakSkill(skill?: MnemonicLearnerSkill): boolean {
  const normalizedState = String(skill?.state ?? "").trim().toLowerCase();
  if (normalizedState === "unseen" || normalizedState === "introduced" || normalizedState === "mastered" || normalizedState === "stable") return false;
  if (normalizedState === "weak" || normalizedState === "recovering") return true;
  if (skill?.repeatedFailure === true || Number(skill?.errorStreak ?? 0) >= 2) return true;

  const accuracy = numericSignal(skill?.accuracy);
  const recentAccuracy = numericSignal(skill?.recentAccuracy);
  const confidence = numericSignal(skill?.confidence);
  const momentum = Number.isFinite(Number(skill?.momentum)) ? Number(skill?.momentum) : null;
  if (accuracy === null && recentAccuracy === null && confidence === null && momentum === null) return false;

  // Keep the fallback aligned with v1.9's own semantic thresholds:
  // weak accuracy < 0.60, recovery-range recent accuracy < 0.75,
  // mastery/stability confidence floor 0.50; negative momentum signals deterioration.
  if (accuracy !== null && accuracy < 0.60) return true;
  if (recentAccuracy !== null && recentAccuracy < 0.75) return true;
  if (confidence !== null && confidence < 0.50) return true;
  if (momentum !== null && momentum < 0) return true;
  return false;
}

function recentFailureIsCurrent(item: { correct?: boolean; outcome?: string; at?: string }): boolean {
  const failed = item?.correct === false || /wrong|unknown|invalid|empty|near_miss/i.test(String(item?.outcome ?? ""));
  if (!failed) return false;
  const timestamp = Date.parse(String(item?.at ?? ""));
  if (!Number.isFinite(timestamp)) return false;
  const age = Date.now() - timestamp;
  return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
}

export function getMnemonicHintStage(context: MnemonicHintContext = {}): MnemonicHintStage {
  if (context.isNew) return "new";

  const character = String(context.character ?? "").trim();
  const recentForCharacter = (context.recentOutcomes ?? [])
    .filter(item => String(item?.character ?? "").trim() === character)
    .slice(0, 4);
  const currentFailures = recentForCharacter.filter(recentFailureIsCurrent);
  const latestWasWrong = recentForCharacter.length > 0 && recentFailureIsCurrent(recentForCharacter[0]);
  const repeatedRecentFailure = currentFailures.length >= 2;
  const meaning = context.learner?.meaning ?? {};
  const reading = context.learner?.reading ?? {};

  if (
    latestWasWrong ||
    repeatedRecentFailure ||
    Number(meaning.errorStreak ?? 0) >= 2 ||
    Number(reading.errorStreak ?? 0) >= 2 ||
    String(meaning.state ?? "").trim().toLowerCase() === "recovering" ||
    String(reading.state ?? "").trim().toLowerCase() === "recovering" ||
    meaning.repeatedFailure === true ||
    reading.repeatedFailure === true
  ) return "recovery";

  if (isWeakSkill(meaning) || isWeakSkill(reading)) return "early";

  const masteredMeaning = stateIsMastered(meaning.state);
  const masteredReading = stateIsMastered(reading.state);
  if (masteredMeaning && masteredReading) return "mastered";

  return "stable";
}

export function getMnemonicHintFocus(context: MnemonicHintContext = {}): MnemonicHintFocus {
  const meaning = context.learner?.meaning ?? {};
  const reading = context.learner?.reading ?? {};
  const meaningWeak = isWeakSkill(meaning);
  const readingWeak = isWeakSkill(reading);
  if (meaningWeak && readingWeak) return "both";
  if (meaningWeak) return "meaning";
  if (readingWeak) return "reading";
  return "both";
}

export type PreparedMnemonicPresentationMode = "expanded" | "collapsed" | "hidden";

export type MnemonicHintPlan = {
  stage: MnemonicHintStage;
  focus: MnemonicHintFocus;
  expandedByDefault: boolean;
  showReading: boolean;
  showVocabulary: boolean;
  showConfusable: boolean;
  preparedMode: PreparedMnemonicPresentationMode;
};

export function getMnemonicHintPlan(stage: MnemonicHintStage, focus: MnemonicHintFocus = "both"): MnemonicHintPlan {
  switch (stage) {
    case "new":
      return { stage, focus, expandedByDefault: true, showReading: true, showVocabulary: true, showConfusable: true, preparedMode: "expanded" };
    case "recovery":
      return {
        stage,
        focus,
        expandedByDefault: focus !== "meaning",
        showReading: focus !== "meaning",
        showVocabulary: false,
        showConfusable: focus !== "reading",
        preparedMode: focus === "reading" ? "collapsed" : "expanded"
      };
    case "early":
      return { stage, focus, expandedByDefault: focus !== "meaning", showReading: true, showVocabulary: false, showConfusable: true, preparedMode: focus === "reading" ? "collapsed" : "expanded" };
    case "stable":
      return { stage, focus, expandedByDefault: false, showReading: true, showVocabulary: false, showConfusable: false, preparedMode: "collapsed" };
    case "mastered":
      return { stage, focus, expandedByDefault: false, showReading: false, showVocabulary: false, showConfusable: false, preparedMode: "hidden" };
  }
}

export type MnemonicSupportPresentationMode = "expanded" | "compact";

export function getMnemonicSupportPresentationMode(isNew = false): MnemonicSupportPresentationMode {
  return isNew ? "expanded" : "compact";
}

