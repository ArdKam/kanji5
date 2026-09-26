import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { kanjiSvgUrl, normalizeStrokeOrderCharacter, parseStrokePaths, type StrokePath } from "./stroke-order-core";
import { gradeHandwriting, type HandwritingPoint, type HandwritingStroke } from "./handwriting-grader";

const CANVAS_COORDINATE_SIZE = 109;
const USER_STROKE_WIDTH = 5;

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
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const source = doc.documentElement;
  if (!source || source.nodeName.toLowerCase() !== "svg") return [];

  const holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = "position:absolute;left:-10000px;top:-10000px;width:109px;height:109px;visibility:hidden;";
  const svg = document.importNode(source, true);
  holder.appendChild(svg);
  document.body.appendChild(holder);

  try {
    const byStroke = new Map(
      [...holder.querySelectorAll("path[id]")]
        .map(node => {
          const id = node.getAttribute("id") || "";
          const match = id.match(/-s(\d+)$/);
          return match ? [Number(match[1]), node as SVGPathElement] as const : null;
        })
        .filter((entry): entry is readonly [number, SVGPathElement] => Boolean(entry)),
    );

    return paths.map(path => {
      const sourcePath = byStroke.get(path.strokeNumber);
      if (!sourcePath) return [];
      const total = sourcePath.getTotalLength();
      if (!Number.isFinite(total) || total <= 0) return [];
      const count = Math.max(8, Math.min(96, Math.round(pointCount)));
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

  const pointFromEvent = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * CANVAS_COORDINATE_SIZE;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * CANVAS_COORDINATE_SIZE;
    return { x, y };
  }, []);

  const appendPointerPoints = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const events = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
    const points = events.map(pointFromEvent);
    for (const point of points) {
      const previous = currentStrokeRef.current.at(-1);
      if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.25) continue;
      currentStrokeRef.current.push(point);
    }
  }, [pointFromEvent]);

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
    appendPointerPoints(event);
    const next = currentStrokeRef.current.at(-1);
    if (!previous || !next || previous === next) return;

    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(1, rect.width);
    const scale = size / CANVAS_COORDINATE_SIZE;
    const ratio = event.currentTarget.width / Math.max(1, size);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.strokeStyle = "#1c1a17";
    ctx.lineWidth = USER_STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(next.x, next.y);
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
    <section className={"handwriting-practice " + (expanded ? "is-expanded" : "is-collapsed")} aria-label={t("handwritingPractice", language)}>
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
                <div className={"handwriting-result " + (result.score >= 82 ? "great" : result.score >= 65 ? "good" : "retry")} role="status">
                  <strong>{formatNumber(result.score, language)}%</strong>
                  <span>{result.feedbackCode === "stroke-count"
                    ? t("handwritingRetry", language)
                    : result.score >= 82
                      ? t("handwritingGreat", language)
                      : result.score >= 65
                        ? t("handwritingGood", language)
                        : t("handwritingRetry", language)}</span>
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
