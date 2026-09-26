import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { kanjiSvgUrl, normalizeStrokeOrderCharacter, parseStrokePaths, type StrokePath } from "./stroke-order-core";
import { gradeHandwriting, type HandwritingFeedbackCode, type HandwritingPoint, type HandwritingStroke } from "./handwriting-grader";

const CANVAS_COORDINATE_SIZE = 109;
const USER_STROKE_WIDTH = 5;

function handwritingFeedback(code: HandwritingFeedbackCode, language: Language): string {
  switch (code) {
    case "stroke-count": return t("handwritingFeedbackStrokeCount", language);
    case "stroke-order": return t("handwritingFeedbackOrder", language);
    case "placement": return t("handwritingFeedbackPlacement", language);
    case "endpoints": return t("handwritingFeedbackEndpoints", language);
    case "length": return t("handwritingFeedbackLength", language);
    case "direction": return t("handwritingFeedbackDirection", language);
    case "curvature": return t("handwritingFeedbackCurvature", language);
    case "shape": return t("handwritingFeedbackShape", language);
    default: return "";
  }
}

function drawUserStrokes(ctx: CanvasRenderingContext2D, strokes: HandwritingStroke[], scale: number) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#1c1a17";
  ctx.lineWidth = USER_STROKE_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i += 1) ctx.lineTo(stroke[i].x, stroke[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawReferenceStrokes(ctx: CanvasRenderingContext2D, paths: StrokePath[], scale: number) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.strokeStyle = "rgba(116,109,97,.16)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const path of paths) {
    ctx.stroke(new Path2D(path.d));
  }
  ctx.restore();
}

function sampleReferenceStrokes(svgText: string, paths: StrokePath[], pointCount = 48): HandwritingStroke[] {
  if (typeof document === "undefined" || !svgText || !paths.length) return [];

  const SVG_NS = "http://www.w3.org/2000/svg";
  const holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = "position:absolute;left:-10000px;top:-10000px;width:109px;height:109px;visibility:hidden;";

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 109 109");
  svg.setAttribute("width", "109");
  svg.setAttribute("height", "109");

  const sourceByStroke = new Map<number, SVGPathElement>();
  const pattern = /<path\s+id="([^"]+-s(\d+))"[^>]*\bd="([^"]+)"/g;
  for (const match of svgText.matchAll(pattern)) {
    const strokeNumber = Number(match[2]);
    const d = String(match[3] || "").trim();
    if (!Number.isInteger(strokeNumber) || strokeNumber < 1 || !d) continue;
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("id", match[1]);
    path.setAttribute("d", d);
    svg.appendChild(path);
    sourceByStroke.set(strokeNumber, path);
  }

  if (!sourceByStroke.size) return [];

  holder.appendChild(svg);
  document.body.appendChild(holder);
  try {
    const count = Math.max(8, Math.min(96, Math.round(pointCount)));
    return paths.map(path => {
      const sourcePath = sourceByStroke.get(path.strokeNumber);
      if (!sourcePath) return [];
      const total = sourcePath.getTotalLength();
      if (!Number.isFinite(total) || total <= 0) return [];
      return Array.from({ length: count }, (_, index) => {
        const point = sourcePath.getPointAtLength((total * index) / Math.max(1, count - 1));
        return { x: point.x, y: point.y } as HandwritingPoint;
      });
    }).filter(stroke => stroke.length >= 2);
  } finally {
    holder.remove();
  }
}
export function HandwritingPractice({ character, language }: { character: string; language: Language }) {
  const normalized = normalizeStrokeOrderCharacter(character);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<HandwritingStroke[]>([]);
  const currentStrokeRef = useRef<HandwritingStroke>([]);
  const drawingPointerIdRef = useRef<number | null>(null);
  const [paths, setPaths] = useState<StrokePath[]>([]);
  const [referenceStrokes, setReferenceStrokes] = useState<HandwritingStroke[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof gradeHandwriting> | null>(null);
  const [expanded, setExpanded] = useState(false);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const size = Math.max(1, Math.round(rect.width));
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const expectedWidth = Math.round(size * ratio);
    const expectedHeight = Math.round(size * ratio);
    if (canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
      canvas.width = expectedWidth;
      canvas.height = expectedHeight;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const grid = size / 4;
    ctx.strokeStyle = "rgba(116,109,97,.13)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * grid, 0);
      ctx.lineTo(i * grid, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * grid);
      ctx.lineTo(size, i * grid);
      ctx.stroke();
    }
    if (paths.length) drawReferenceStrokes(ctx, paths, size / CANVAS_COORDINATE_SIZE);
    drawUserStrokes(ctx, strokesRef.current, size / CANVAS_COORDINATE_SIZE);
    if (currentStrokeRef.current.length >= 2) {
      drawUserStrokes(ctx, [currentStrokeRef.current], size / CANVAS_COORDINATE_SIZE);
    }
  }, [paths]);

  useEffect(() => {
    let active = true;
    setPaths([]);
    setReferenceStrokes([]);
    strokesRef.current = [];
    currentStrokeRef.current = [];
    drawingPointerIdRef.current = null;
    setStrokeCount(0);
    setResult(null);
    setError("");
    if (!normalized) return () => { active = false; };
    setLoading(true);
    fetch(kanjiSvgUrl(normalized), { cache: "force-cache" })
      .then(response => {
        if (!response.ok) throw new Error("KanjiVG request failed");
        return response.text();
      })
      .then(svg => {
        const next = parseStrokePaths(svg);
        if (!next.length) throw new Error("No stroke paths found");
        const sampled = sampleReferenceStrokes(svg, next);
        if (!sampled.length || sampled.length !== next.length) throw new Error("Reference sampling failed");
        if (active) {
          setPaths(next);
          setReferenceStrokes(sampled);
        }
      })
      .catch(() => {
        if (active) setError(t("handwritingUnavailable", language));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [language, normalized]);

  useEffect(() => {
    if (!expanded) return;
    redrawCanvas();
  }, [expanded, redrawCanvas]);

  useEffect(() => {
    if (!expanded || typeof ResizeObserver === "undefined") return;
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!container) return;
    const observer = new ResizeObserver(() => redrawCanvas());
    observer.observe(container);
    return () => observer.disconnect();
  }, [expanded, redrawCanvas]);

  const pointFromClient = useCallback((clientX: number, clientY: number, rect: DOMRect) => ({
    x: ((clientX - rect.left) / Math.max(1, rect.width)) * CANVAS_COORDINATE_SIZE,
    y: ((clientY - rect.top) / Math.max(1, rect.height)) * CANVAS_COORDINATE_SIZE,
  }), []);

  const appendPointerPoints = useCallback((event: PointerEvent<HTMLCanvasElement>): HandwritingPoint[] => {
    const nativeEvent = event.nativeEvent as globalThis.PointerEvent;
    const coalesced = typeof nativeEvent.getCoalescedEvents === "function" ? nativeEvent.getCoalescedEvents() : [];
    const events = coalesced.length ? [...coalesced, nativeEvent] : [nativeEvent];
    const rect = event.currentTarget.getBoundingClientRect();
    const points = events.map(point => pointFromClient(point.clientX, point.clientY, rect));
    const appended: HandwritingPoint[] = [];
    for (const point of points) {
      const previous = currentStrokeRef.current.at(-1);
      if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.25) continue;
      currentStrokeRef.current.push(point);
      appended.push(point);
    }
    return appended;
  }, [pointFromClient]);

  const startStroke = (event: PointerEvent<HTMLCanvasElement>) => {
    if (loading || error || !paths.length || !referenceStrokes.length) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingPointerIdRef.current = event.pointerId;
    setResult(null);
    currentStrokeRef.current = [];
    appendPointerPoints(event);
    redrawCanvas();
  };

  const moveStroke = (event: PointerEvent<HTMLCanvasElement>) => {
    if (drawingPointerIdRef.current !== event.pointerId || !currentStrokeRef.current.length) return;
    const previous = currentStrokeRef.current.at(-1);
    const appended = appendPointerPoints(event);
    if (!previous || !appended.length) return;

    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const size = Math.max(1, rect.width);
    const scale = size / CANVAS_COORDINATE_SIZE;
    const ratio = canvas.width / Math.max(1, size);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.strokeStyle = "#1c1a17";
    ctx.lineWidth = USER_STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    let from = previous;
    for (const point of appended) {
      if (from.x === point.x && from.y === point.y) continue;
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(point.x, point.y);
      from = point;
    }
    ctx.stroke();
    ctx.restore();
  };

  const finishStroke = (event: PointerEvent<HTMLCanvasElement>) => {
    if (drawingPointerIdRef.current !== event.pointerId) return;
    appendPointerPoints(event);
    const stroke = currentStrokeRef.current.slice();
    currentStrokeRef.current = [];
    drawingPointerIdRef.current = null;
    if (stroke.length > 1) {
      strokesRef.current.push(stroke);
      setStrokeCount(strokesRef.current.length);
    }
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
    redrawCanvas();
  };

  const clear = () => {
    strokesRef.current = [];
    currentStrokeRef.current = [];
    drawingPointerIdRef.current = null;
    setStrokeCount(0);
    setResult(null);
    redrawCanvas();
  };

  const grade = () => {
    const value = gradeHandwriting(strokesRef.current, referenceStrokes);
    setResult(value);
  };

  return (
    <section className={"handwriting-practice " + (expanded ? "is-expanded" : "is-collapsed")} aria-label={t("handwritingPractice", language)} data-handwriting-grader="vector-v1" data-stroke-count={String(strokeCount)} data-feedback-code={result?.feedbackCode ?? ""} data-feedback-stroke={result?.feedbackStroke == null ? "" : String(result.feedbackStroke + 1)}>
      <button
        className="handwriting-header"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}
      >
        <span className="handwriting-header-copy">
          <h3>{t("handwritingPractice", language)}</h3>
          <p>{t("handwritingHint", language)}</p>
        </span>
        <span className="handwriting-header-end">
          <span className="handwriting-stroke-count">{formatNumber(paths.length, language)} {t("strokesLabel", language)}</span>
          <span className="handwriting-toggle-icon" aria-hidden="true">{expanded ? "⌃" : "⌄"}</span>
        </span>
      </button>
      {expanded ? (
        <>
          {loading ? <div className="handwriting-status" role="status">{t("strokeOrderLoading", language)}</div> : null}
          {!loading && error ? <div className="handwriting-status handwriting-error" role="status">{error}</div> : null}
          {!loading && !error ? (
            <>
              <div className="handwriting-canvas-wrap">
                <canvas
                  ref={canvasRef}
                  className="handwriting-canvas"
                  aria-label={t("handwritingPractice", language)}
                  onPointerDown={startStroke}
                  onPointerMove={moveStroke}
                  onPointerUp={finishStroke}
                  onPointerCancel={finishStroke}
                />
              </div>
              <div className="handwriting-actions">
                <button className="button secondary" type="button" onClick={clear} disabled={!strokeCount}>{t("clearDrawing", language)}</button>
                <button className="button primary" type="button" onClick={grade} disabled={!strokeCount}>{t("gradeDrawing", language)}</button>
              </div>
              {result !== null ? (
                <div className={"handwriting-result " + (result.score >= 82 ? "great" : result.score >= 65 ? "good" : "retry")} role="status" data-score={String(result.score)}>
                  <strong>{t("handwritingSimilarity", language)} {formatNumber(result.score, language)}%</strong>
                  <span>
                    {result.score >= 82
                      ? t("handwritingGreat", language)
                      : result.score >= 65
                        ? t("handwritingGood", language)
                        : t("handwritingRetry", language)}
                  </span>
                  {result.feedbackCode !== "good" && result.feedbackCode !== "improve" && result.feedbackCode !== "empty" && result.feedbackCode !== "unavailable" ? (
                    <small className="handwriting-feedback-detail">
                      {result.feedbackStroke !== null
                        ? (language === "fa" ? "حرکت " : "Stroke ") + formatNumber(result.feedbackStroke + 1, language) + ": "
                        : ""}
                      {handwritingFeedback(result.feedbackCode, language)}
                    </small>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
