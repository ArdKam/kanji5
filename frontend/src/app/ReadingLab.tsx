import { useEffect, useMemo, useRef, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import type { KanjiCatalogItem } from "./engine";

const isKanji = (value: string) => /[一-龯々]/u.test(value);

export function ReadingLab({ catalog, language, onSelectKanji }: {
  catalog: KanjiCatalogItem[];
  language: Language;
  onSelectKanji: (item: KanjiCatalogItem) => void;
}) {
  const [value, setValue] = useState("");
  const [readerOpen, setReaderOpen] = useState(true);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState("");
  const [speechRate, setSpeechRate] = useState(0.85);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const catalogByCharacter = useMemo(() => new Map(catalog.map(item => [item.character, item])), [catalog]);
  const extracted = useMemo(() => {
    const seen = new Set<string>();
    const result: KanjiCatalogItem[] = [];
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
      character,
      index,
      item: isKanji(character) ? catalogByCharacter.get(character) : undefined,
    })),
    [catalogByCharacter, value],
  );

  const importTextFile = async (file: File) => {
    const raw = await file.text();
    const cleaned = raw
      .replace(/^\uFEFF/, "")
      .replace(/^WEBVTT(?:\s+.*)?$/gim, "")
      .replace(/^\s*\d+\s*$/gm, "")
      .replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3}\s+-->.*$/gm, "")
      .replace(/<[^>]+>/g, "")
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .join("\n");
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

  const speakText = () => {
    if (!speechSupported || !value.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value.trim());
    utterance.lang = "ja-JP";
    utterance.rate = speechRate;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const clearText = () => {
    setValue("");
    setReaderOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const inputCharacters = Array.from(value).length;
  const uniqueKanji = new Set(Array.from(value).filter(isKanji)).size;
  const knownKanjiCount = extracted.length;

  return (
    <section className="reading-lab">
      <div className="reading-lab-header">
        <div>
          <h3>{t("readingLab", language)}</h3>
          <p>{t("readingLabHint", language)}</p>
        </div>
      </div>
      <textarea
        className="reading-lab-input"
        value={value}
        onChange={event => setValue(event.target.value)}
        placeholder={t("readingTextPlaceholder", language)}
        aria-label={t("readingTextPlaceholder", language)}
        rows={6}
      />
      <div className="reading-lab-import-row">
        <label className="reading-lab-import">
          <span>{t("importSubtitle", language)}</span>
          <input ref={fileInputRef} type="file" accept=".txt,.srt,.vtt,text/plain,text/vtt" onChange={event => {
            const file = event.currentTarget.files?.[0];
            if (file) void importTextFile(file);
          }} />
        </label>
        <button className="button secondary reading-lab-clear" type="button" onClick={clearText} disabled={!value}>{t("clearReadingText", language)}</button>
      </div>
      <div className="reading-lab-audio-row">
        <label className="reading-lab-import">
          <span>{t("importAudio", language)}</span>
          <input type="file" accept="audio/*" onChange={event => {
            const file = event.currentTarget.files?.[0];
            if (file) importAudioFile(file);
          }} />
        </label>
        {audioUrl ? <span className="reading-lab-audio-name" title={audioName}>{audioName}</span> : null}
      </div>
      <div className="reading-lab-speech-row" aria-label={t("readingSpeechControls", language)}>
        <button className="button secondary" type="button" disabled={!speechSupported || !value.trim()} onClick={speakText}>
          {isSpeaking ? t("readingSpeaking", language) : t("readingSpeakText", language)}
        </button>
        <button className="button secondary" type="button" disabled={!speechSupported || !isSpeaking} onClick={stopSpeech}>
          {t("readingStopSpeech", language)}
        </button>
        <label className="reading-lab-speech-rate">
          <span>{t("readingSpeechRate", language)}</span>
          <select value={speechRate} onChange={event => setSpeechRate(Number(event.target.value))}>
            <option value={0.7}>0.7×</option>
            <option value={0.85}>0.85×</option>
            <option value={1}>1×</option>
            <option value={1.15}>1.15×</option>
          </select>
        </label>
        {!speechSupported ? <span className="reading-lab-speech-status">{t("readingSpeechUnsupported", language)}</span> : null}
      </div>
      {audioUrl ? <audio className="reading-lab-audio" controls preload="metadata" src={audioUrl} aria-label={t("readingAudio", language)} /> : null}
      <div className="reading-lab-stats" aria-live="polite">
        <span>{t("readingLabCharacters", language)} <strong>{formatNumber(inputCharacters, language)}</strong></span>
        <span>{t("readingLabKanji", language)} <strong>{formatNumber(uniqueKanji, language)}</strong></span>
        <span>{t("readingLabKnownKanji", language)} <strong>{formatNumber(knownKanjiCount, language)}</strong></span>
      </div>
      {extracted.length ? (
        <div className="reading-lab-kanji-list" role="list" aria-label={t("readingLabKnownKanji", language)}>
          {extracted.map(item => (
            <button
              key={item.character}
              className="reading-lab-kanji"
              type="button"
              onClick={() => onSelectKanji(item)}
              title={t("lookupKanji", language)}
              aria-label={item.character + " — " + t("lookupKanji", language)}
            >
              <span lang="ja">{item.character}</span>
              <small>{item.jlpt ?? "—"}</small>
            </button>
          ))}
        </div>
      ) : value.trim() ? (
        <p className="reading-lab-empty">{t("readingLabNoKnownKanji", language)}</p>
      ) : null}
      {value.trim() ? (
        <div className="reading-lab-reader">
          <button
            className="reading-lab-reader-toggle"
            type="button"
            aria-expanded={readerOpen}
            onClick={() => setReaderOpen(open => !open)}
          >
            <span>{t("readingReader", language)}</span>
            <span aria-hidden="true">{readerOpen ? "⌃" : "⌄"}</span>
          </button>
          {readerOpen ? (
            <div className="reading-lab-reader-body" role="region" aria-label={t("readingReader", language)}>
              <p className="reading-lab-reader-hint">{t("readingReaderHint", language)}</p>
              <div className="reading-lab-reader-text" lang="ja">
                {readerCharacters.map(({ character, index, item }) => item ? (
                  <button
                    key={character + "-" + index}
                    type="button"
                    className={"reading-lab-reader-kanji " + (item.mastery >= 0.75 ? "strong" : item.mastery > 0 ? "learning" : "unseen")}
                    onClick={() => onSelectKanji(item)}
                    title={t("lookupKanji", language)}
                    aria-label={character + " — " + t("lookupKanji", language)}
                  >
                    {character}
                  </button>
                ) : (
                  <span key={character + "-" + index}>{character}</span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
