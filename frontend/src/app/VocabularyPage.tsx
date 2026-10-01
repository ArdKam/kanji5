import { useMemo, useState } from "react";

type VocabularyItem = {
  contentId: string;
  written: string;
  reading: string;
  glosses: string[];
  linkedKanji: string[];
  state: "unseen" | "introduced" | "retrievable" | "stable";
  status: "new" | "learning" | "retrievable" | "stable";
  contentStage: "introduction" | "guided" | "retrieval";
  accuracy: number | null;
  errorRate: number;
  evidence: { practiceCount: number; correctCount: number; wrongCount: number; currentStreak: number };
};
export type VocabularyContract = { items: VocabularyItem[]; summary: { total: number; states: Record<string, number>; stages: Record<string, number>; status: Record<string, number> }; total: number; hasMore: boolean };

export function VocabularyPage({ contract, language = "fa", onSelect }: { contract: VocabularyContract; language?: "fa" | "en"; onSelect?: (contentId: string) => void }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<"all" | VocabularyItem["contentStage"]>("all");
  const isFa = language === "fa";
  const items = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return contract.items.filter((item) => {
      if (stage !== "all" && item.contentStage !== stage) return false;
      if (!normalized) return true;
      return [item.written, item.reading, ...item.glosses].some((value) => value.toLocaleLowerCase().includes(normalized));
    });
  }, [contract.items, query, stage]);
  const labels = isFa
    ? { title: "واژه‌ها", subtitle: "واژه‌ها را ببینید و وضعیت یادگیری آن‌ها را پیگیری کنید.", search: "جست‌وجوی واژه یا معنی", all: "همه", intro: "معرفی", guided: "یادگیری", retrieval: "بازیابی", empty: "واژه‌ای با این فیلتر پیدا نشد.", practice: "تمرین", accuracy: "دقت", new: "جدید", learning: "در حال یادگیری", retrievable: "قابل بازیابی", stable: "پایدار" }
    : { title: "Vocabulary", subtitle: "Browse vocabulary and track its learning state.", search: "Search word or meaning", all: "All", intro: "Introduction", guided: "Guided", retrieval: "Retrieval", empty: "No vocabulary matches these filters.", practice: "Practice", accuracy: "Accuracy", new: "New", learning: "Learning", retrievable: "Retrievable", stable: "Stable" };
  return (
    <section className="vocabulary-page" aria-labelledby="vocabulary-page-title" dir={isFa ? "rtl" : "ltr"}>
      <header className="vocabulary-page__header">
        <div><p className="eyebrow">{isFa ? "یادگیری واژه" : "VOCABULARY LEARNING"}</p><h2 id="vocabulary-page-title">{labels.title}</h2><p>{labels.subtitle}</p></div>
        <div className="vocabulary-page__summary"><strong>{contract.summary.total}</strong><span>{isFa ? "واژه" : "items"}</span></div>
      </header>
      <div className="vocabulary-page__toolbar">
        <label className="vocabulary-page__search"><span className="sr-only">{labels.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.search} type="search" /></label>
        <div className="vocabulary-page__filters" role="group" aria-label={isFa ? "مرحله یادگیری" : "Learning stage"}>
          {(["all", "introduction", "guided", "retrieval"] as const).map((value) => <button key={value} className={stage === value ? "is-active" : ""} type="button" aria-pressed={stage === value} onClick={() => setStage(value)}>{value === "all" ? labels.all : value === "introduction" ? labels.intro : value === "guided" ? labels.guided : labels.retrieval}</button>)}
        </div>
      </div>
      <div className="vocabulary-page__list" role="list">
        {items.map((item) => <button key={item.contentId} className="vocabulary-item" type="button" role="listitem" onClick={() => onSelect?.(item.contentId)} aria-label={`${item.written} ${item.reading}`}>
          <span className="vocabulary-item__word" lang="ja">{item.written}</span><span className="vocabulary-item__reading" lang="ja">{item.reading}</span><span className="vocabulary-item__gloss">{item.glosses[0] ?? "—"}</span>
          <span className={`vocabulary-item__status status-${item.status}`}>{labels[item.status]}</span>
          <span className="vocabulary-item__meta">{labels.practice}: {item.evidence.practiceCount}{item.accuracy != null ? ` · ${labels.accuracy}: ${Math.round(item.accuracy * 100)}%` : ""}</span>
        </button>)}
      </div>
      {!items.length ? <p className="vocabulary-page__empty" role="status">{labels.empty}</p> : null}
      {contract.hasMore ? <p className="vocabulary-page__more">{isFa ? "واژه‌های بیشتری برای نمایش وجود دارد." : "More vocabulary is available."}</p> : null}
    </section>
  );
}
