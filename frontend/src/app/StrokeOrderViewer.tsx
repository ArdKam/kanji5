import { useCallback, useEffect, useRef, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { kanjiSvgUrl, parseStrokePaths, type StrokePath } from "./stroke-order-core";

export function StrokeOrderViewer({ character, language }: { character: string; language: Language }) {
  const [paths, setPaths] = useState<StrokePath[]>([]);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  useEffect(() => {
    let active = true;
    stopPlayback();
    setPaths([]);
    setCompleted(0);
    setError("");
    const normalized = Array.from(String(character || "").trim()).slice(0, 1).join("");
    if (!normalized) return () => { active = false; };

    setLoading(true);
    void (async () => {
      const url = kanjiSvgUrl(normalized);
      if (!url) throw new Error("Invalid kanji");
      const response = await fetch(url, { cache: "force-cache" });
      if (!response.ok) throw new Error("KanjiVG request failed");
      const svg = await response.text();
      const next = parseStrokePaths(svg);
      if (!next.length) throw new Error("No stroke paths found");
      if (!active) return;
      setPaths(next);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setLoading(false);
      setError(t("strokeOrderUnavailable", language));
    });
    return () => { active = false; };
  }, [character, language, stopPlayback]);

  const play = useCallback(() => {
    if (!paths.length) return;
    stopPlayback();
    const start = completed >= paths.length ? 0 : completed;
    setCompleted(start);
    timerRef.current = window.setInterval(() => {
      setCompleted(current => {
        const next = current + 1;
        if (next >= paths.length) {
          stopPlayback();
          return paths.length;
        }
        return next;
      });
    }, 720);
  }, [completed, paths.length, stopPlayback]);

  const step = useCallback((delta: number) => {
    if (!paths.length) return;
    stopPlayback();
    setCompleted(current => Math.max(0, Math.min(paths.length, current + delta)));
  }, [paths.length, stopPlayback]);

  const reset = useCallback(() => {
    stopPlayback();
    setCompleted(0);
  }, [stopPlayback]);

  return (
    <section className="stroke-order-panel" aria-labelledby="stroke-order-title">
      <div className="stroke-order-header">
        <div>
          <h3 id="stroke-order-title">{t("strokeOrder", language)}</h3>
          <p>{t("strokeOrderHint", language)}</p>
        </div>
        {!loading && !error && paths.length ? (
          <span className="stroke-order-count">{formatNumber(paths.length, language)} {t("strokesLabel", language)}</span>
        ) : null}
      </div>

      {loading ? <div className="stroke-order-loading" role="status">{t("strokeOrderLoading", language)}</div> : null}
      {!loading && error ? (
        <div className="stroke-order-error" role="status">
          <span>{error}</span>
          <button className="button secondary" type="button" onClick={() => setCompleted(0)}>{t("close", language)}</button>
        </div>
      ) : null}

      {!loading && !error && paths.length ? (
        <>
          <div className="stroke-order-stage">
            <svg viewBox="0 0 109 109" role="img" aria-label={t("strokeOrderAria", language)}>
              {paths.map((path, index) => (
                <path
                  key={"ghost-" + path.strokeNumber}
                  className="stroke-order-ghost"
                  d={path.d}
                  pathLength={1}
                />
              ))}
              {paths.slice(0, completed).map(path => (
                <path
                  key={"done-" + path.strokeNumber}
                  className="stroke-order-done"
                  d={path.d}
                  pathLength={1}
                />
              ))}
              {completed < paths.length ? (
                <path
                  key={"active-" + paths[completed].strokeNumber}
                  className="stroke-order-active"
                  d={paths[completed].d}
                  pathLength={1}
                />
              ) : null}
            </svg>
            <div className="stroke-order-progress" aria-label={t("strokeOrderProgress", language)}>
              <span>{formatNumber(completed, language)} / {formatNumber(paths.length, language)}</span>
            </div>
          </div>
          <div className="stroke-order-controls">
            <button className="button secondary" type="button" onClick={() => step(-1)} disabled={completed === 0}>{t("previousStroke", language)}</button>
            <button className="button primary" type="button" onClick={play}>{completed >= paths.length ? t("replayStrokeOrder", language) : t("playStrokeOrder", language)}</button>
            <button className="button secondary" type="button" onClick={() => step(1)} disabled={completed >= paths.length}>{t("nextStroke", language)}</button>
            <button className="button secondary stroke-order-reset" type="button" onClick={reset} disabled={completed === 0}>{t("resetStrokeOrder", language)}</button>
          </div>
          <div className="stroke-order-source">KanjiVG · CC BY-SA 3.0</div>
        </>
      ) : null}
    </section>
  );
}
