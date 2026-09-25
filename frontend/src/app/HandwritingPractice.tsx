import { useEffect, useRef, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { kanjiSvgUrl, normalizeStrokeOrderCharacter, parseStrokePaths, type StrokePath } from "./stroke-order-core";

type Point = { x: number; y: number };

function drawUserStrokes(ctx: CanvasRenderingContext2D, strokes: Point[][], scale: number) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#1c1a17";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i += 1) ctx.lineTo(stroke[i].x, stroke[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

function scoreDrawing(strokes: Point[][], paths: StrokePath[], size: number): number {
  if (!strokes.length || !paths.length) return 0;
  const target = document.createElement("canvas");
  const user = document.createElement("canvas");
  target.width = target.height = user.width = user.height = size;
  const targetCtx = target.getContext("2d");
  const userCtx = user.getContext("2d");
  if (!targetCtx || !userCtx) return 0;

  targetCtx.fillStyle = "#1c1a17";
  const scale = size / 109;
  targetCtx.save();
  targetCtx.scale(scale, scale);
  for (const path of paths) targetCtx.fill(new Path2D(path.d));
  targetCtx.restore();

  drawUserStrokes(userCtx, strokes, scale);

  const targetPixels = targetCtx.getImageData(0, 0, size, size).data;
  const userPixels = userCtx.getImageData(0, 0, size, size).data;
  let targetCount = 0;
  let userCount = 0;
  let intersection = 0;
  for (let i = 3; i < targetPixels.length; i += 4) {
    const targetInk = targetPixels[i] > 20;
    const userInk = userPixels[i] > 20;
    if (targetInk) targetCount += 1;
    if (userInk) userCount += 1;
    if (targetInk && userInk) intersection += 1;
  }
  if (!targetCount || !userCount || !intersection) return 0;
  return Math.round((2 * intersection / (targetCount + userCount)) * 100);
}

export function HandwritingPractice({ character, language }: { character: string; language: Language }) {
  const normalized = normalizeStrokeOrderCharacter(character);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paths, setPaths] = useState<StrokePath[]>([]);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setPaths([]);
    setStrokes([]);
    setCurrentStroke([]);
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
        if (active) setPaths(next);
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const size = Math.max(1, Math.round(rect.width));
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(ratio, ratio);
    const grid = size / 4;
    ctx.strokeStyle = "rgba(116,109,97,.13)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath(); ctx.moveTo(i * grid, 0); ctx.lineTo(i * grid, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * grid); ctx.lineTo(size, i * grid); ctx.stroke();
    }
    if (paths.length) {
      const scale = size / 109;
      ctx.save();
      ctx.scale(scale, scale);
      ctx.fillStyle = "rgba(116,109,97,.12)";
      for (const path of paths) ctx.fill(new Path2D(path.d));
      ctx.restore();
    }
    drawUserStrokes(ctx, strokes, size / 109);
    if (currentStroke.length) drawUserStrokes(ctx, [currentStroke], size / 109);
  }, [currentStroke, paths, strokes]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 109;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 109;
    return { x, y };
  };

  const startStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (loading || error || !paths.length) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setResult(null);
    setCurrentStroke([pointFromEvent(event)]);
  };

  const moveStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStroke.length) return;
    const point = pointFromEvent(event);
    setCurrentStroke(previous => previous.concat(point));
  };

  const finishStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStroke.length) return;
    const stroke = currentStroke.slice();
    if (stroke.length > 1) setStrokes(previous => previous.concat([stroke]));
    setCurrentStroke([]);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
  };

  const clear = () => { setStrokes([]); setCurrentStroke([]); setResult(null); };

  const grade = () => {
    const value = scoreDrawing(strokes, paths, 220);
    setResult(value);
  };

  return (
    <section className="handwriting-practice" aria-label={t("handwritingPractice", language)}>
      <div className="handwriting-header">
        <div>
          <h3>{t("handwritingPractice", language)}</h3>
          <p>{t("handwritingHint", language)}</p>
        </div>
        <span className="handwriting-stroke-count">{formatNumber(paths.length, language)} {t("strokesLabel", language)}</span>
      </div>
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
            <button className="button secondary" type="button" onClick={clear} disabled={!strokes.length && !currentStroke.length}>{t("clearDrawing", language)}</button>
            <button className="button primary" type="button" onClick={grade} disabled={!strokes.length}>{t("gradeDrawing", language)}</button>
          </div>
          {result !== null ? (
            <div className={"handwriting-result " + (result >= 82 ? "great" : result >= 65 ? "good" : "retry")} role="status">
              <strong>{formatNumber(result, language)}%</strong>
              <span>{result >= 82 ? t("handwritingGreat", language) : result >= 65 ? t("handwritingGood", language) : t("handwritingRetry", language)}</span>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
