import { t, type Language } from "./i18n";

export function DictionaryAudio({ value, label }: { value: string; label: string }) {
  const unsupported = typeof window.speechSynthesis?.speak !== "function" || typeof window.SpeechSynthesisUtterance !== "function";
  return (
    <button
      className="audio-button dictionary-audio-button"
      type="button"
      disabled={unsupported}
      aria-label={unsupported ? t("audioUnavailable") : label}
      onClick={() => {
        if (unsupported) return;
        const utterance = new SpeechSynthesisUtterance(value);
        utterance.lang = "ja-JP";
        utterance.rate = 0.85;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }}
    >
      🔊
    </button>
  );
}

export function DictionaryReading({ title, values, language }: { title: string; values: string[]; language: Language }) {
  const first = values[0];
  return (
    <div className="reading dictionary-reading">
      <span>{title}</span>
      <strong lang="ja">{values.length ? values.join(" · ") : "—"}</strong>
      {first ? <DictionaryAudio value={first} label={t("playReading", language) + " " + title} /> : null}
    </div>
  );
}
