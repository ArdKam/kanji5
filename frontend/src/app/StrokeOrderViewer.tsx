import { useCallback, useEffect, useRef, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { kanjiSvgUrl, parseStrokePaths, type StrokePath } from "./stroke-order-core";

function ReplayIcon() {
  return (
    <svg className="stroke-order-replay-icon" viewBox="0 0 44 44" aria-hidden="true">
      <path className="stroke-order-replay-arc" d="M34.5 13.5A15 15 0 1 0 36.2 27" />
      <path className="stroke-order-replay-head" d="M34 8.5v7h-7" />
      <path className="stroke-order-replay-play" d="M18.5 16.5 28 22l-9.5 5.5z" />
    </svg>
  );
}

export function StrokeOrderViewer({ character, language, mode = "learning" }: { character: string; language: Language; mode?: "learning" | "dictionary-loop" }) {
  const [paths, setPaths] = useState<StrokePath[]>([]);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const compactLoop = mode === "dictionary-loop";
  const timerRef = useRef<number | null>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const scrollAfterExpandRef = useRef(false);

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
    (async () => {
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
    })().catch(() => {
      if (!active) return;
      setLoading(false);
      setError(t("strokeOrderUnavailable", language));
    });
    return () => { active = false; };
  }, [character, language, retryKey, stopPlayback]);

  useEffect(() => {
    if (!compactLoop || !paths.length) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setCompleted(paths.length);
      return;
    }
    stopPlayback();
    setCompleted(0);
    timerRef.current = window.setInterval(() => {
      setCompleted(current => (current >= paths.length - 1 ? 0 : current + 1));
    }, 720);
    return () => stopPlayback();
  }, [compactLoop, paths.length, stopPlayback]);

  const play = useCallback((fromStart = false) => {
    if (!paths.length) return;
    stopPlayback();
    const start = fromStart || completed >= paths.length ? 0 : completed;
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

  const scrollExpandedToolIntoView = useCallback(() => {
    const target = viewerRef.current;
    const scrollContainer = target?.closest<HTMLElement>(".learning-back-scroll");
    if (!target || !scrollContainer) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const edgePadding = 8;
    let delta = 0;

    if (targetRect.top < containerRect.top + edgePadding) {
      delta = targetRect.top - (containerRect.top + edgePadding);
    } else if (targetRect.bottom > containerRect.bottom - edgePadding) {
      delta = targetRect.bottom - (containerRect.bottom - edgePadding);
    }

    if (Math.abs(delta) < 1) return;

    const maxScrollTop = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
    const nextScrollTop = Math.max(0, Math.min(maxScrollTop, scrollContainer.scrollTop + delta));
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    scrollContainer.scrollTo({
      top: nextScrollTop,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, []);

  useEffect(() => {
    if (!expanded || !scrollAfterExpandRef.current) return;
    scrollAfterExpandRef.current = false;
    let frame = 0;
    let nextFrame = 0;
    frame = window.requestAnimationFrame(() => {
      nextFrame = window.requestAnimationFrame(() => {
        scrollExpandedToolIntoView();
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(nextFrame);
    };
  }, [expanded, scrollExpandedToolIntoView]);

  const openLearningTool = useCallback(() => {
    scrollAfterExpandRef.current = true;
    setExpanded(true);
    play(true);
  }, [play]);

  const closeLearningTool = useCallback(() => {
    stopPlayback();
    setExpanded(false);
  }, [stopPlayback]);

  const step = useCallback((delta: number) => {
    if (!paths.length) return;
    stopPlayback();
    setCompleted(current => Math.max(0, Math.min(paths.length, current + delta)));
  }, [paths.length, stopPlayback]);

  const reset = useCallback(() => {
    stopPlayback();
    setCompleted(0);
  }, [stopPlayback]);

  if (compactLoop) {
    return (
      <section
        className="stroke-order-panel dictionary-stroke-order"
        aria-label={t("strokeOrderAria", language)}
        data-stroke-order-completed={completed}
      >
        {loading ? <div className="stroke-order-loading" role="status">{t("strokeOrderLoading", language)}</div> : null}
        {!loading && error ? (
          <div className="stroke-order-error" role="status">
            <span>{error}</span>
            <button className="button secondary" type="button" onClick={() => setRetryKey(value => value + 1)}>{t("tryAgain", language)}</button>
          </div>
        ) : null}
        {!loading && !error && paths.length ? (
          <div className="stroke-order-stage">
            <svg viewBox="0 0 109 109" role="img" aria-label={t("strokeOrderAria", language)}>
              {paths.map(path => (
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
          </div>
        ) : null}
        <span className="sr-only">KanjiVG · CC BY-SA 3.0</span>
      </section>
    );
  }

  if (!expanded && paths.length && !compactLoop) {
    return (
      <section
        ref={viewerRef}
        className="stroke-order-tool"
        aria-label={t("strokeOrder", language)}
        data-stroke-order-open="false"
      >
        <button
          className="stroke-order-tool-trigger"
          type="button"
          aria-label={t("strokeOrder", language)}
          title={t("strokeOrder", language)}
          aria-expanded="false"
          onClick={openLearningTool}
        >
          <ReplayIcon />
        </button>
      </section>
    );
  }

  return (
    <section ref={viewerRef} className={"stroke-order-panel"+(expanded ? " is-expanded" : "")} aria-labelledby="stroke-order-title" data-stroke-order-open={expanded ? "true" : "false"}>
      <div className="stroke-order-header">
        <div>
          <h3 id="stroke-order-title">{t("strokeOrder", language)}</h3>
          <p>{t("strokeOrderHint", language)}</p>
        </div>
        <div className="stroke-order-header-actions">
          {!loading && !error && paths.length ? (
            <span className="stroke-order-count">{formatNumber(paths.length, language)} {t("strokesLabel", language)}</span>
          ) : null}
          {!loading && !error && paths.length ? (
            <button
              className="stroke-order-toggle"
              type="button"
              aria-expanded={expanded}
              aria-controls="stroke-order-content"
              onClick={expanded ? closeLearningTool : openLearningTool}
              title={expanded ? t("strokeOrder", language) : t("strokeOrder", language)}
            >
              <ReplayIcon />
              <span>{t("strokeOrder", language)}</span>
            </button>
          ) : null}
        </div>
      </div>

      {loading ? <div className="stroke-order-loading" role="status">{t("strokeOrderLoading", language)}</div> : null}
      {!loading && error ? (
        <div className="stroke-order-error" role="status">
          <span>{error}</span>
          <button className="button secondary" type="button" onClick={() => setRetryKey(value => value + 1)}>{t("tryAgain", language)}</button>
        </div>
      ) : null}

      {!loading && !error && paths.length && expanded ? (
        <div id="stroke-order-content">
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
            <button className="button primary" type="button" onClick={() => play()}>{completed >= paths.length ? t("replayStrokeOrder", language) : t("playStrokeOrder", language)}</button>
            <button className="button secondary" type="button" onClick={() => step(1)} disabled={completed >= paths.length}>{t("nextStroke", language)}</button>
            <button className="button secondary stroke-order-reset" type="button" onClick={reset} disabled={completed === 0}>{t("resetStrokeOrder", language)}</button>
          </div>
          <div className="stroke-order-source">KanjiVG · CC BY-SA 3.0</div>
        </div>
      ) : null}
    </section>
  );
}
