import { useEffect, useMemo, useRef, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import type { KanjiCatalogItem } from "./engine";

const isKanji = (value: string) => /\p{Script=Han}/u.test(value);
type MasteryBucket = "familiar" | "learning" | "attention" | "new";

function getMasteryBucket(item: KanjiCatalogItem): MasteryBucket {
  switch (item.state) {
    case "mastered":
    case "stable": return "familiar";
    case "weak":
    case "recovering": return "attention";
    case "introduced":
    case "learning": return "learning";
    default: return "new";
  }
}

type ReadingSentence = { index: number; text: string };

function splitReadingSentences(value: string): ReadingSentence[] {
  const sentences: ReadingSentence[] = [];
  for (const line of value.split(/\r?\n/)) {
    let current = "";
    for (const character of Array.from(line)) {
      current += character;
      if (/[。！？!?]/u.test(character)) {
        const text = current.trim();
        if (text) sentences.push({ index: sentences.length, text });
        current = "";
      }
    }
    const remainder = current.trim();
    if (remainder) sentences.push({ index: sentences.length, text: remainder });
  }
  return sentences;
}

export function ReadingLab({ catalog, language, onSelectKanji }: {
  catalog: KanjiCatalogItem[];
  language: Language;
  onSelectKanji: (item: KanjiCatalogItem) => void;
}) {
  const [value, setValue] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState("");
  const [speechRate, setSpeechRate] = useState(0.85);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sentenceRefs = useRef<Array<HTMLDivElement | null>>([]);

  const catalogByCharacter = useMemo(() => new Map(catalog.map(item => [item.character, item])), [catalog]);
  const extracted = useMemo(() => {
    const seen = new Set<string>(), result: KanjiCatalogItem[] = [];
    for (const character of Array.from(value)) {
      if (!isKanji(character) || seen.has(character)) continue;
      seen.add(character);
      const item = catalogByCharacter.get(character);
      if (item) result.push(item);
    }
    return result;
  }, [catalogByCharacter, value]);

  const readerCharacters = useMemo(
    () => Array.from(value).map((character, index) => ({
      character, index, item: isKanji(character) ? catalogByCharacter.get(character) : undefined,
    })),
    [catalogByCharacter, value],
  );

  const counts = useMemo(() => {
    const result = { familiar: 0, learning: 0, attention: 0, new: 0 };
    for (const item of extracted) result[getMasteryBucket(item)]++;
    return result;
  }, [extracted]);

  const coverage = extracted.length ? Math.round((counts.familiar / extracted.length) * 100) : 0;
  const attentionItems = useMemo(
    () => extracted.filter(item => getMasteryBucket(item) === "attention"),
    [extracted],
  );

  const sentences = useMemo(() => splitReadingSentences(value), [value]);
  const activeSentence = sentences[activeSentenceIndex] ?? sentences[0];

  useEffect(() => {
    setActiveSentenceIndex(0);
    sentenceRefs.current = [];
  }, [value]);

  useEffect(() => {
    if (!sentences.length) return;
    sentenceRefs.current[activeSentenceIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeSentenceIndex, sentences.length]);

  const importTextFile = async (file: File) => {
    const raw = await file.text();
    const cleaned = raw
      .replace(/^\uFEFF/, "")
      .replace(/^WEBVTT(?:\s+.*)?$/gim, "")
      .replace(/^\s*\d+\s*$/gm, "")
      .replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3}\s+-->.*$/gm, "")
      .replace(/<[^>]+>/g, "")
      .split(/\r?\n/).map(line => line.trim()).filter(Boolean).join("\n");
    setValue(cleaned);
  };

  const importAudioFile = (file: File) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setAudioName(file.name);
  };

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, [audioUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, [value]);

  const speechSupported = typeof window !== "undefined"
    && typeof window.speechSynthesis?.speak === "function"
    && typeof window.SpeechSynthesisUtterance === "function";

  const speakUtterance = (text: string) => {
    if (!speechSupported || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = "ja-JP";
    utterance.rate = speechRate;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const speakText = () => speakUtterance(value);

  const speakCurrentSentence = () => {
    if (activeSentence) speakUtterance(activeSentence.text);
  };

  const stopSpeech = () => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const selectSentence = (nextIndex: number) => {
    if (!sentences.length) return;
    setActiveSentenceIndex(Math.max(0, Math.min(sentences.length - 1, nextIndex)));
  };

  const clearText = () => {
    setValue("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const inputCharacters = Array.from(value).length;

  return (
    <section className="reading-lab">
      <section className="reading-lab-section reading-lab-source" aria-labelledby="reading-lab-source-title">
        <div className="reading-lab-section-heading">
          <div>
            <p className="eyebrow">{t("readingLabSource", language)}</p>
            <h3 id="reading-lab-source-title">{t("readingLabSourceTitle", language)}</h3>
            <p>{t("readingLabSourceHint", language)}</p>
          </div>
          <span className="reading-lab-step" aria-hidden="true">01</span>
        </div>
        <div className="reading-lab-input-wrap">
          <textarea
            className="reading-lab-input"
            value={value}
            onChange={event => setValue(event.target.value)}
            placeholder={t("readingTextPlaceholder", language)}
            aria-label={t("readingTextPlaceholder", language)}
            rows={6}
          />
          {value ? <button className="reading-lab-inline-clear" type="button" onClick={clearText}>{t("clearReadingText", language)}</button> : null}
        </div>
        <div className="reading-lab-source-actions">
          <label className="reading-lab-action reading-lab-action-primary">
            <span>{t("importSubtitle", language)}</span>
            <input ref={fileInputRef} type="file" accept=".txt,.srt,.vtt,text/plain,text/vtt" onChange={event => {
              const file = event.currentTarget.files?.[0];
              if (file) void importTextFile(file);
            }} />
          </label>
          <span className="reading-lab-format-note">{t("readingLabImportHint", language)}</span>
        </div>
      </section>

      <section className="reading-lab-section reading-lab-listen" aria-labelledby="reading-lab-listen-title">
        <div className="reading-lab-section-heading reading-lab-section-heading-compact">
          <div>
            <p className="eyebrow">{t("readingLabListen", language)}</p>
            <h3 id="reading-lab-listen-title">{t("readingLabListenTitle", language)}</h3>
          </div>
          <span className="reading-lab-step" aria-hidden="true">02</span>
        </div>
        <div className="reading-lab-listen-controls" aria-label={t("readingSpeechControls", language)}>
          <div className="reading-lab-listen-primary reading-lab-speech-row">
            <button className="button secondary" type="button" disabled={!speechSupported || !value.trim()} onClick={speakText}>
              {isSpeaking ? t("readingSpeaking", language) : t("readingSpeakText", language)}
            </button>
            <button className="button secondary" type="button" disabled={!speechSupported || !isSpeaking} onClick={stopSpeech}>
              {t("readingStopSpeech", language)}
            </button>
          </div>
          <label className="reading-lab-speech-rate">
            <span>{t("readingSpeechRate", language)}</span>
            <select value={speechRate} onChange={event => setSpeechRate(Number(event.target.value))}>
              <option value={0.7}>0.7×</option>
              <option value={0.85}>0.85×</option>
              <option value={1}>1×</option>
              <option value={1.15}>1.15×</option>
            </select>
          </label>
          <label className="reading-lab-action reading-lab-action-audio">
            <span>{t("importAudio", language)}</span>
            <input type="file" accept="audio/*" onChange={event => {
              const file = event.currentTarget.files?.[0];
              if (file) importAudioFile(file);
            }} />
          </label>
        </div>
        {!speechSupported ? <p className="reading-lab-speech-status">{t("readingSpeechUnsupported", language)}</p> : null}
        {audioName ? <p className="reading-lab-audio-name" title={audioName}>{audioName}</p> : null}
        {audioUrl ? <audio className="reading-lab-audio" controls preload="metadata" src={audioUrl} aria-label={t("readingAudio", language)} /> : null}
      </section>

      {value.trim() ? (
        <>
          <section className="reading-lab-analysis" aria-live="polite" aria-labelledby="reading-lab-analysis-title">
            <div className="reading-lab-analysis-primary">
              <p className="eyebrow">{t("readingLabAnalysis", language)}</p>
              <div className="reading-lab-coverage-row">
                <strong id="reading-lab-analysis-title">{formatNumber(coverage, language)}%</strong>
                <span>{t("readingLabCoverage", language)}</span>
              </div>
              <p>{formatNumber(counts.familiar, language)} / {formatNumber(extracted.length, language)} {t("readingLabFamiliar", language)}</p>
            </div>
            <div className="reading-lab-analysis-stats">
              <div><strong>{formatNumber(inputCharacters, language)}</strong><span>{t("readingLabCharacters", language)}</span></div>
              <div><strong>{formatNumber(extracted.length, language)}</strong><span>{t("readingLabKanji", language)}</span></div>
              <div><strong>{formatNumber(counts.learning, language)}</strong><span>{t("readingLabLearning", language)}</span></div>
              <div><strong>{formatNumber(counts.attention, language)}</strong><span>{t("readingLabAttention", language)}</span></div>
              <div><strong>{formatNumber(counts.new, language)}</strong><span>{t("readingLabNew", language)}</span></div>
            </div>
          </section>

          {attentionItems.length ? (
            <section className="reading-lab-attention" aria-labelledby="reading-lab-attention-title">
              <div className="reading-lab-support-heading">
                <div>
                  <p className="eyebrow">{t("readingLabAttentionEyebrow", language)}</p>
                  <h3 id="reading-lab-attention-title">{t("readingLabNeedsAttention", language)}</h3>
                </div>
                <span>{formatNumber(attentionItems.length, language)}</span>
              </div>
              <div className="reading-lab-attention-list" role="list">
                {attentionItems.slice(0, 8).map(item => (
                  <button key={item.character} className="reading-lab-attention-item" type="button" onClick={() => onSelectKanji(item)} title={t("lookupKanji", language)} aria-label={item.character + " — " + t("lookupKanji", language)}>
                    <span lang="ja">{item.character}</span><small>{item.jlpt ?? "—"}</small>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="reading-lab-reader" aria-labelledby="reading-lab-reader-title">
            <div className="reading-lab-section-heading">
              <div>
                <p className="eyebrow">{t("readingLabReaderEyebrow", language)}</p>
                <h3 id="reading-lab-reader-title">{t("readingReader", language)}</h3>
                <p>{t("readingReaderHint", language)}</p>
              </div>
              <span className="reading-lab-step" aria-hidden="true">03</span>
            </div>
            <div className="reading-lab-reader-legend" aria-label={t("readingLabLegend", language)}>
              <span className="familiar"><i aria-hidden="true" />{t("readingLabLegendFamiliar", language)}</span>
              <span className="learning"><i aria-hidden="true" />{t("readingLabLegendLearning", language)}</span>
              <span className="attention"><i aria-hidden="true" />{t("readingLabLegendAttention", language)}</span>
              <span className="new"><i aria-hidden="true" />{t("readingLabLegendNew", language)}</span>
            </div>
            <div className="reading-lab-reader-toolbar" aria-label={t("readingLabSentenceMode", language)}>
              <div className="reading-lab-sentence-position">
                <span>{t("readingLabSentence", language)}</span>
                <strong>{formatNumber(sentences.length ? activeSentenceIndex + 1 : 0, language)} / {formatNumber(sentences.length, language)}</strong>
              </div>
              <div className="reading-lab-sentence-controls">
                <button className="button secondary reading-lab-sentence-prev" type="button" disabled={activeSentenceIndex <= 0} onClick={() => selectSentence(activeSentenceIndex - 1)} aria-label={t("readingLabPreviousSentence", language)}>‹</button>
                <button className="button secondary reading-lab-sentence-read" type="button" disabled={!speechSupported || !activeSentence} onClick={speakCurrentSentence}>
                  {isSpeaking ? t("readingLabSentenceReading", language) : t("readingLabReadSentence", language)}
                </button>
                <button className="button secondary reading-lab-sentence-next" type="button" disabled={activeSentenceIndex >= sentences.length - 1} onClick={() => selectSentence(activeSentenceIndex + 1)} aria-label={t("readingLabNextSentence", language)}>›</button>
              </div>
            </div>
            <div className="reading-lab-sentence-list">
              {sentences.map((sentence, sentenceIndex) => (
                <div
                  key={sentence.index}
                  ref={node => { sentenceRefs.current[sentenceIndex] = node; }}
                  className={"reading-lab-reader-sentence" + (sentenceIndex === activeSentenceIndex ? " active" : "")}
                >
                  <span className="reading-lab-reader-sentence-index" aria-hidden="true">{formatNumber(sentenceIndex + 1, language)}</span>
                  <div className="reading-lab-reader-text" lang="ja">
                    {Array.from(sentence.text).map((character, index) => {
                      const item = isKanji(character) ? catalogByCharacter.get(character) : undefined;
                      return item ? (
                        <button key={character + "-" + index} type="button" className={"reading-lab-reader-kanji " + getMasteryBucket(item)} onClick={() => onSelectKanji(item)} title={t("lookupKanji", language)} aria-label={character + " — " + t("lookupKanji", language)}>
                          {character}
                        </button>
                      ) : <span key={character + "-" + index}>{character}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="reading-lab-empty" aria-labelledby="reading-lab-empty-title">
          <div className="reading-lab-empty-icon" aria-hidden="true">読</div>
          <div>
            <p className="eyebrow">{t("readingLabEmptyEyebrow", language)}</p>
            <h3 id="reading-lab-empty-title">{t("readingLabEmptyTitle", language)}</h3>
            <p>{t("readingLabEmptyHint", language)}</p>
          </div>
        </section>
      )}
    </section>
  );
}
