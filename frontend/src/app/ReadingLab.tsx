import { useEffect, useMemo, useRef, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { getVocabulary, type KanjiCatalogItem, type VocabularyItem } from "./engine";
import "./reading-lab-focus.css";
import "./reading-lab-playback.css";

const isKanji = (value: string) => /\p{Script=Han}/u.test(value);
const READING_LAB_STORAGE_KEY = "kanji5-reading-lab-session-v1";
const MAX_READING_TEXT = 24000;
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

export type ReadingSentence = { index: number; text: string };
export type SubtitleCue = ReadingSentence & { start: number; end: number };
export type ReadingWordSelection = { item: VocabularyItem; context: string; start: number; end: number; sentenceIndex: number };

type SavedReadingSession = {
  version: 1;
  text: string;
  activeSentenceIndex: number;
  speechRate: number;
  subtitleCues: SubtitleCue[];
  audioName: string;
  updatedAt: number;
};

function clampSpeechRate(value: unknown) {
  const rate = Number(value);
  return [0.7, 0.85, 1, 1.15].includes(rate) ? rate : 0.85;
}

function parseTimestamp(value: string) {
  const match = String(value).trim().match(/^(?:(\d+):)?(\d{1,2}):([\d]+(?:[\.,]\d{1,3})?)$/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(String(match[3]).replace(",", "."));
  if (![hours, minutes, seconds].every(Number.isFinite) || minutes > 59 || seconds >= 60) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

export function parseSubtitleCues(raw: string): SubtitleCue[] {
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const timingIndex = lines.findIndex(line => line.includes("-->"));
    if (timingIndex < 0) continue;
    const timing = lines[timingIndex].match(/^\s*(\S+)\s+-->\s+(\S+)/);
    if (!timing) continue;
    const start = parseTimestamp(timing[1]);
    const end = parseTimestamp(timing[2]);
    if (start === null || end === null || end <= start) continue;
    const text = lines.slice(timingIndex + 1).join(" ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) cues.push({ index: cues.length, start, end, text });
  }
  return cues;
}

export function splitReadingSentences(value: string): ReadingSentence[] {
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

function readSavedReadingSession(): SavedReadingSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(READING_LAB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedReadingSession>;
    if (parsed.version !== 1 || typeof parsed.text !== "string" || !parsed.text.trim()) return null;
    const subtitleCues = Array.isArray(parsed.subtitleCues)
      ? parsed.subtitleCues.filter(cue => cue && Number.isFinite(Number(cue.start)) && Number.isFinite(Number(cue.end))
        && Number(cue.end) > Number(cue.start) && typeof cue.text === "string" && cue.text.trim())
        .slice(0, 500).map((cue, index) => ({ index, start: Number(cue.start), end: Number(cue.end), text: String(cue.text).trim() }))
      : [];
    return {
      version: 1,
      text: parsed.text.slice(0, MAX_READING_TEXT),
      activeSentenceIndex: Math.max(0, Math.floor(Number(parsed.activeSentenceIndex) || 0)),
      speechRate: clampSpeechRate(parsed.speechRate),
      subtitleCues,
      audioName: typeof parsed.audioName === "string" ? parsed.audioName.slice(0, 180) : "",
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

function findLongestVocabularyMatch(text: string, characterIndex: number, items: VocabularyItem[]) {
  const chars = Array.from(text);
  const clickedCharacter = chars[characterIndex] ?? "";
  let best: { item: VocabularyItem; start: number; end: number } | null = null;
  for (const item of items) {
    const word = String(item.word || "").trim();
    if (!word || !word.includes(clickedCharacter)) continue;
    let from = 0;
    while (from < text.length) {
      const unitStart = text.indexOf(word, from);
      if (unitStart < 0) break;
      const unitEnd = unitStart + word.length;
      const start = Array.from(text.slice(0, unitStart)).length;
      const end = Array.from(text.slice(0, unitEnd)).length;
      if (start <= characterIndex && characterIndex < end) {
        if (!best || end - start > best.end - best.start) best = { item, start, end };
      }
      from = unitEnd;
    }
  }
  return best;
}

export function ReadingLab({ catalog, language, onSelectKanji, onSelectWord }: {
  catalog: KanjiCatalogItem[];
  language: Language;
  onSelectKanji: (item: KanjiCatalogItem) => void;
  onSelectWord: (selection: ReadingWordSelection) => void;
}) {
  const initialSession = useMemo(() => readSavedReadingSession(), []);
  const [value, setValue] = useState(initialSession?.text ?? "");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState(initialSession?.audioName ?? "");
  const [speechRate, setSpeechRate] = useState(initialSession?.speechRate ?? 0.85);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(initialSession?.activeSentenceIndex ?? 0);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>(initialSession?.subtitleCues ?? []);
  const [wordLookupKey, setWordLookupKey] = useState<string | null>(null);
  const [showRestoreNotice, setShowRestoreNotice] = useState(Boolean(initialSession?.text));
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [sentenceAutoplay, setSentenceAutoplay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sentenceRefs = useRef<Array<HTMLDivElement | null>>([]);
  const vocabularyCacheRef = useRef(new Map<string, VocabularyItem[]>());
  const readerKanjiRefs = useRef(new Map<string, HTMLButtonElement>());
  const focusCursorRef = useRef<{ sentenceIndex:number; characterIndex:number } | null>(null);
  const sentenceAutoplayRef = useRef(false);
  const skipSentenceResetRef = useRef(Boolean(initialSession?.text));

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

  const counts = useMemo(() => {
    const result = { familiar: 0, learning: 0, attention: 0, new: 0 };
    for (const item of extracted) result[getMasteryBucket(item)]++;
    return result;
  }, [extracted]);

  const sentences = useMemo(() => subtitleCues.length ? subtitleCues.map(cue => ({ index: cue.index, text: cue.text })) : splitReadingSentences(value), [subtitleCues, value]);

  const coverage = extracted.length ? Math.round((counts.familiar / extracted.length) * 100) : 0;
  const occurrenceCoverage = useMemo(() => {
    let total = 0;
    let familiar = 0;
    for (const sentence of sentences) {
      for (const character of Array.from(sentence.text)) {
        if (!isKanji(character)) continue;
        const item = catalogByCharacter.get(character);
        if (!item) continue;
        total++;
        if (getMasteryBucket(item) === "familiar") familiar++;
      }
    }
    return { total, familiar, percentage: total ? Math.round((familiar / total) * 100) : 0 };
  }, [catalogByCharacter, sentences]);

  const attentionItems = useMemo(
    () => extracted.filter(item => getMasteryBucket(item) === "attention"),
    [extracted],
  );

  const activeSentence = sentences[activeSentenceIndex] ?? sentences[0];
  const syncReady = Boolean(audioUrl && subtitleCues.length);
  const activeCue = syncReady ? subtitleCues[activeSentenceIndex] : undefined;

  useEffect(() => {
    if (skipSentenceResetRef.current) {
      skipSentenceResetRef.current = false;
      return;
    }
    setActiveSentenceIndex(0);
    sentenceRefs.current = [];
  }, [value]);

  useEffect(() => {
    if (!sentences.length) return;
    sentenceRefs.current[activeSentenceIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeSentenceIndex, sentences.length]);

  const importTextFile = async (file: File) => {
    const raw = await file.text();
    const cues = parseSubtitleCues(raw);
    setShowRestoreNotice(false);
    if (cues.length) {
      setSubtitleCues(cues);
      setValue(cues.map(cue => cue.text).join("\n"));
    } else {
      setSubtitleCues([]);
      const cleaned = raw
        .replace(/^\uFEFF/, "")
        .replace(/^WEBVTT(?:\s+.*)?$/gim, "")
        .replace(/^\s*\d+\s*$/gm, "")
        .replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3}\s+-->.*$/gm, "")
        .replace(/<[^>]+>/g, "")
        .split(/\r?\n/).map(line => line.trim()).filter(Boolean).join("\n");
      setValue(cleaned);
    }
    skipSentenceResetRef.current = false;
  };

  const importAudioFile = (file: File) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setAudioName(file.name);
    setShowRestoreNotice(false);
  };

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, [audioUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    sentenceAutoplayRef.current = false;
    setSentenceAutoplay(false);
  }, [value]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!value.trim()) {
      window.localStorage.removeItem(READING_LAB_STORAGE_KEY);
      return;
    }
    try {
      window.localStorage.setItem(READING_LAB_STORAGE_KEY, JSON.stringify({
        version: 1,
        text: value.slice(0, MAX_READING_TEXT),
        activeSentenceIndex,
        speechRate,
        subtitleCues: subtitleCues.slice(0, 500),
        audioName: audioName.slice(0, 180),
        updatedAt: Date.now(),
      } satisfies SavedReadingSession));
    } catch {
      // Reading Lab remains usable when storage is unavailable or full.
    }
  }, [activeSentenceIndex, audioName, speechRate, subtitleCues, value]);

  useEffect(() => {
    sentenceAutoplayRef.current = sentenceAutoplay;
  }, [sentenceAutoplay]);

  useEffect(() => {
    if (!showRestoreNotice) return;
    const timer = window.setTimeout(() => setShowRestoreNotice(false), 4500);
    return () => window.clearTimeout(timer);
  }, [showRestoreNotice]);

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

  function speakSentenceAtIndex(index: number) {
    const sentence = sentences[index];
    if (!speechSupported || !sentence?.text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sentence.text.trim());
    utterance.lang = "ja-JP";
    utterance.rate = speechRate;
    utterance.onstart = () => {
      setActiveSentenceIndex(index);
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      if (!sentenceAutoplayRef.current) return;
      const nextIndex = index + 1;
      if (nextIndex >= sentences.length) {
        sentenceAutoplayRef.current = false;
        setSentenceAutoplay(false);
        return;
      }
      setActiveSentenceIndex(nextIndex);
      window.setTimeout(() => {
        if (sentenceAutoplayRef.current) speakSentenceAtIndex(nextIndex);
      }, 90);
    };
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  const speakCurrentSentence = () => {
    if (activeSentence) speakSentenceAtIndex(activeSentenceIndex);
  };

  const repeatCurrentSentence = () => {
    if (!activeSentence) return;
    if (syncReady) {
      playCurrentSyncedSentence();
      return;
    }
    speakSentenceAtIndex(activeSentenceIndex);
  };

  const stopSpeech = () => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    sentenceAutoplayRef.current = false;
    setSentenceAutoplay(false);
  };

  const seekAudioToSentence = (nextIndex: number, play = false) => {
    const cue = subtitleCues[nextIndex];
    const element = audioRef.current;
    if (!cue || !element || !audioUrl) return;
    const apply = () => {
      element.currentTime = cue.start;
      if (play) void element.play().catch(() => undefined);
    };
    if (element.readyState >= 1) apply();
    else element.addEventListener("loadedmetadata", apply, { once: true });
  };

  const selectSentence = (nextIndex: number, seekAudio = true) => {
    if (!sentences.length) return;
    const clamped = Math.max(0, Math.min(sentences.length - 1, nextIndex));
    setActiveSentenceIndex(clamped);
    if (seekAudio && syncReady) seekAudioToSentence(clamped, sentenceAutoplayRef.current);
    else if (sentenceAutoplayRef.current) speakSentenceAtIndex(clamped);
  };

  const playCurrentSyncedSentence = () => {
    if (!syncReady || !activeCue || !audioRef.current) return;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    seekAudioToSentence(activeSentenceIndex, true);
  };

  const stopSyncedAudio = () => {
    audioRef.current?.pause();
    setIsAudioPlaying(false);
    sentenceAutoplayRef.current = false;
    setSentenceAutoplay(false);
  };

  const handleAudioTimeUpdate = () => {
    if (!syncReady || !audioRef.current) return;
    const time = audioRef.current.currentTime;
    const nextIndex = subtitleCues.findIndex(cue => time >= cue.start && time < cue.end);
    if (nextIndex >= 0 && nextIndex !== activeSentenceIndex) setActiveSentenceIndex(nextIndex);
  };

  const handleReaderKanjiClick = async (sentenceIndex: number, characterIndex: number, item: KanjiCatalogItem) => {
    const sentence = sentences[sentenceIndex];
    if (!sentence) {
      onSelectKanji(item);
      return;
    }
    const character = Array.from(sentence.text)[characterIndex];
    if (!character || !isKanji(character)) {
      onSelectKanji(item);
      return;
    }
    const lookupKey = sentenceIndex + ":" + characterIndex;
    setWordLookupKey(lookupKey);
    try {
      let items = vocabularyCacheRef.current.get(character);
      if (!items) {
        const result = await getVocabulary(character);
        items = result.items ?? [];
        vocabularyCacheRef.current.set(character, items);
      }
      const matched = findLongestVocabularyMatch(sentence.text, characterIndex, items);
      if (matched) {
        onSelectWord({ item: matched.item, context: sentence.text, start: matched.start, end: matched.end, sentenceIndex });
        return;
      }
    } catch {
      // Fall through to the canonical Kanji dictionary.
    } finally {
      setWordLookupKey(null);
    }
    onSelectKanji(item);
  };

  const clearText = () => {
    setSentenceAutoplay(false);
    sentenceAutoplayRef.current = false;
    setValue("");
    setSubtitleCues([]);
    setAudioName("");
    setIsAudioPlaying(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const inputCharacters = Array.from(value).length;

  const focusableTargets = useMemo(() => {
    const targets: Array<{ sentenceIndex: number; characterIndex: number; item: KanjiCatalogItem }> = [];
    sentences.forEach((sentence, sentenceIndex) => {
      Array.from(sentence.text).forEach((character, characterIndex) => {
        const item = catalogByCharacter.get(character);
        if (item && getMasteryBucket(item) !== "familiar") targets.push({ sentenceIndex, characterIndex, item });
      });
    });
    return targets;
  }, [catalogByCharacter, sentences]);

  const unknownTargets = useMemo(
    () => focusableTargets.filter(target => getMasteryBucket(target.item) === "new"),
    [focusableTargets],
  );

  const hardestSentence = useMemo<{ index: number; score: number; targetCount: number } | null>(() => {
    let best: { index: number; score: number; targetCount: number } | null = null;
    sentences.forEach((sentence, sentenceIndex) => {
      let score = 0;
      let targetCount = 0;
      for (const character of Array.from(sentence.text)) {
        const item = catalogByCharacter.get(character);
        if (!item) continue;
        const bucket = getMasteryBucket(item);
        if (bucket === "attention") score += 2;
        else if (bucket === "learning" || bucket === "new") score += 1;
        if (bucket !== "familiar") targetCount++;
      }
      if (!targetCount) return;
      if (!best || score > best.score) best = { index: sentenceIndex, score, targetCount };
    });
    return best;
  }, [catalogByCharacter, sentences]);

  const focusHardestSentence = () => {
    if (!hardestSentence) return;
    const sentenceIndex = hardestSentence.index;
    const target = focusableTargets.find(item => item.sentenceIndex === sentenceIndex);
    selectSentence(sentenceIndex, false);
    if (!target) return;
    const key = target.sentenceIndex + ":" + target.characterIndex;
    focusCursorRef.current = { sentenceIndex: target.sentenceIndex, characterIndex: target.characterIndex };
    window.requestAnimationFrame(() => {
      const button = readerKanjiRefs.current.get(key);
      if (!button) return;
      button.focus({ preventScroll: true });
    });
  };

  const focusNextTarget = (unknownOnly = false) => {
    const candidates = unknownOnly ? unknownTargets : focusableTargets;
    if (!candidates.length) return;
    const active = document.activeElement as HTMLElement | null;
    const activeButton = active?.matches?.(".reading-lab-reader-kanji") ? active : null;
    const currentSentenceIndex = activeButton?.dataset.readingLabSentenceIndex
      ? Number(activeButton.dataset.readingLabSentenceIndex)
      : focusCursorRef.current?.sentenceIndex ?? activeSentenceIndex;
    const currentCharacterIndex = activeButton?.dataset.readingLabCharacterIndex
      ? Number(activeButton.dataset.readingLabCharacterIndex)
      : focusCursorRef.current?.characterIndex ?? -1;
    const next = candidates.find(target =>
      target.sentenceIndex > currentSentenceIndex
      || (target.sentenceIndex === currentSentenceIndex && target.characterIndex > currentCharacterIndex)
    ) ?? candidates[0];
    const key = next.sentenceIndex + ":" + next.characterIndex;
    focusCursorRef.current = { sentenceIndex: next.sentenceIndex, characterIndex: next.characterIndex };
    selectSentence(next.sentenceIndex, false);
    window.requestAnimationFrame(() => {
      const button = readerKanjiRefs.current.get(key);
      if (!button) return;
      button.focus({ preventScroll: true });
    });
  };

  return (
    <section className="reading-lab">
      <section className="reading-lab-section reading-lab-source" aria-labelledby="reading-lab-source-title">
        <div className="reading-lab-section-heading">
          <div>
            <div className="reading-lab-heading-line">
              <div>
                <p className="eyebrow">{t("readingLabSource", language)}</p>
                <h3 id="reading-lab-source-title">{t("readingLabSourceTitle", language)}</h3>
              </div>
              {showRestoreNotice ? <span className="reading-lab-session-status" role="status">{t("readingLabSessionRestored", language)}</span> : null}
            </div>
            <p>{t("readingLabSourceHint", language)}</p>
          </div>
          <span className="reading-lab-step" aria-hidden="true">01</span>
        </div>
        <div className="reading-lab-input-wrap">
          <textarea
            className="reading-lab-input"
            value={value}
            onChange={event => { setValue(event.target.value.slice(0, MAX_READING_TEXT)); if (subtitleCues.length) setSubtitleCues([]); setShowRestoreNotice(false); }}
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
            <input ref={audioInputRef} type="file" accept="audio/*" onChange={event => {
              const file = event.currentTarget.files?.[0];
              if (file) importAudioFile(file);
            }} />
          </label>
        </div>
        {!speechSupported ? <p className="reading-lab-speech-status">{t("readingSpeechUnsupported", language)}</p> : null}
        {audioName && !audioUrl && subtitleCues.length ? <p className="reading-lab-speech-status">{t("readingLabSyncNeedsAudio", language)}</p> : null}
        {audioName ? <p className="reading-lab-audio-name" title={audioName}>{audioName}</p> : null}
        {audioUrl ? (
          <>
            <audio ref={audioRef} className="reading-lab-audio" controls preload="metadata" src={audioUrl} aria-label={t("readingAudio", language)}
              onTimeUpdate={handleAudioTimeUpdate}
              onPlay={() => setIsAudioPlaying(true)}
              onPause={() => setIsAudioPlaying(false)}
              onEnded={() => { setIsAudioPlaying(false); sentenceAutoplayRef.current = false; setSentenceAutoplay(false); }}
            />
            {syncReady ? <p className="reading-lab-sync-status" data-reading-lab-sync-ready="true">{t("readingLabSyncReady", language)} · {t("readingLabSyncHint", language)}</p> : null}
          </>
        ) : null}
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
              <p>{formatNumber(counts.familiar, language)} / {formatNumber(extracted.length, language)} {t("readingLabUniqueFamiliar", language)}</p>
              <p className="reading-lab-coverage-secondary">
                {formatNumber(occurrenceCoverage.familiar, language)} / {formatNumber(occurrenceCoverage.total, language)} · {formatNumber(occurrenceCoverage.percentage, language)}% {t("readingLabOccurrenceCoverage", language)}
              </p>
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
            {wordLookupKey ? <p className="reading-lab-word-status" role="status">{t("readingLabWordLoading", language)}</p> : null}
            <div className="reading-lab-reader-toolbar" aria-label={t("readingLabSentenceMode", language)}>
              <div className="reading-lab-focus-controls" aria-label={t("readingLabFocusControls", language)}>
                <button className="button secondary reading-lab-focus-button" type="button" disabled={!focusableTargets.length} onClick={() => focusNextTarget(false)}>{t("readingLabFocusNext", language)}</button>
                <button className="button secondary reading-lab-focus-button" type="button" disabled={!unknownTargets.length} onClick={() => focusNextTarget(true)}>{t("readingLabNextUnknown", language)}</button>
                <button className="button secondary reading-lab-focus-button" type="button" disabled={!hardestSentence} onClick={focusHardestSentence}>{t("readingLabFocusHardest", language)}</button>
              </div>
              <div className="reading-lab-sentence-position">
                <span>{t("readingLabSentence", language)}</span>
                <strong>{formatNumber(sentences.length ? activeSentenceIndex + 1 : 0, language)} / {formatNumber(sentences.length, language)}</strong>
              </div>
              <div className="reading-lab-sentence-controls">
                <button className="button secondary reading-lab-sentence-prev" type="button" disabled={activeSentenceIndex <= 0} onClick={() => selectSentence(activeSentenceIndex - 1)} aria-label={t("readingLabPreviousSentence", language)}>‹</button>
                {syncReady ? (
                  <button className="button secondary reading-lab-sentence-read" type="button" disabled={!activeCue} onClick={isAudioPlaying ? stopSyncedAudio : playCurrentSyncedSentence}>
                    {isAudioPlaying ? t("readingLabStopSynced", language) : t("readingLabPlaySynced", language)}
                  </button>
                ) : (
                  <button className="button secondary reading-lab-sentence-read" type="button" disabled={!speechSupported || !activeSentence} onClick={() => activeSentence && speakCurrentSentence()}>
                    {isSpeaking ? t("readingLabSentenceReading", language) : t("readingLabReadSentence", language)}
                  </button>
                )}
                <button className="button secondary reading-lab-sentence-repeat" type="button" disabled={!activeSentence || (syncReady ? !activeCue : !speechSupported)} onClick={repeatCurrentSentence} aria-label={t("readingLabRepeatSentence", language)}>
                  {t("readingLabRepeatSentence", language)}
                </button>
                <button className={"button secondary reading-lab-sentence-autoplay" + (sentenceAutoplay ? " is-active" : "")} type="button" disabled={!activeSentence || (syncReady ? !activeCue : !speechSupported)} aria-pressed={sentenceAutoplay} onClick={() => {
                  const next = !sentenceAutoplayRef.current;
                  sentenceAutoplayRef.current = next;
                  setSentenceAutoplay(next);
                  if (next) {
                    if (syncReady) playCurrentSyncedSentence();
                    else speakSentenceAtIndex(activeSentenceIndex);
                  } else {
                    if (syncReady) audioRef.current?.pause();
                    else window.speechSynthesis?.cancel();
                    setIsAudioPlaying(false);
                    setIsSpeaking(false);
                  }
                }}>
                  {t("readingLabAutoplay", language)}
                </button>
                <button className="button secondary reading-lab-sentence-next" type="button" disabled={activeSentenceIndex >= sentences.length - 1} onClick={() => selectSentence(activeSentenceIndex + 1)} aria-label={t("readingLabNextSentence", language)}>›</button>
              </div>
            </div>
            <div className="reading-lab-sentence-list" data-reading-lab-sync-cue-count={subtitleCues.length}>
              {sentences.map((sentence, sentenceIndex) => (
                <div
                  key={sentence.index}
                  ref={node => { sentenceRefs.current[sentenceIndex] = node; }}
                  className={"reading-lab-reader-sentence" + (sentenceIndex === activeSentenceIndex ? " active" : "")}
                  data-reading-lab-sentence-index={sentenceIndex}
                >
                  <span className="reading-lab-reader-sentence-index" aria-hidden="true">{formatNumber(sentenceIndex + 1, language)}</span>
                  <div className="reading-lab-reader-text" lang="ja">
                    {Array.from(sentence.text).map((character, index) => {
                      const item = isKanji(character) ? catalogByCharacter.get(character) : undefined;
                      return item ? (
                        <button key={character + "-" + index} ref={node => { const key = sentenceIndex + ":" + index; if (node) readerKanjiRefs.current.set(key, node); else readerKanjiRefs.current.delete(key); }} data-reading-lab-sentence-index={sentenceIndex} data-reading-lab-character-index={index} onFocus={() => { focusCursorRef.current = { sentenceIndex, characterIndex: index }; }} type="button" className={"reading-lab-reader-kanji " + getMasteryBucket(item)} onClick={() => void handleReaderKanjiClick(sentenceIndex, index, item)} title={t("readingLabWordLookupHint", language)} aria-label={character + " — " + t("readingLabWordLookupHint", language)} aria-busy={wordLookupKey === sentenceIndex + ":" + index}>
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
