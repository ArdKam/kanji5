/** @typedef {{x:number,y:number}} Point */
/** @typedef {Point[]} Stroke */

/**
 * Deterministic, DOM-free handwriting grader.
 * Scores geometry of ordered stroke polylines rather than raster overlap.
 */

const EPSILON = 1e-6;
const DEFAULTS = Object.freeze({
  resamplePoints: 32,
  minPointDistance: 0.25,
  smoothing: 0.12,
  sizeTolerance: 0.42,
});

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lerpPoint = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function cleanStroke(stroke, minDistance) {
  if (!Array.isArray(stroke)) return [];
  const clean = [];
  for (const point of stroke) {
    const x = Number(point?.x);
    const y = Number(point?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const next = { x, y };
    if (!clean.length || distance(clean[clean.length - 1], next) >= minDistance) clean.push(next);
  }
  if (clean.length === 1 && stroke.length > 1) {
    const last = stroke.at(-1);
    const x = Number(last?.x);
    const y = Number(last?.y);
    if (Number.isFinite(x) && Number.isFinite(y)) clean.push({ x, y });
  }
  return clean;
}

function pathLength(stroke) {
  let total = 0;
  for (let i = 1; i < stroke.length; i += 1) total += distance(stroke[i - 1], stroke[i]);
  return total;
}

function resampleStroke(stroke, count) {
  if (!stroke.length) return [];
  if (stroke.length === 1) return Array.from({ length: count }, () => ({ ...stroke[0] }));
  const total = pathLength(stroke);
  if (total < EPSILON) return Array.from({ length: count }, () => ({ ...stroke[0] }));

  const result = [{ ...stroke[0] }];
  let segmentIndex = 1;
  let segmentStart = stroke[0];
  let traversed = 0;

  for (let targetIndex = 1; targetIndex < count - 1; targetIndex += 1) {
    const targetDistance = (total * targetIndex) / (count - 1);
    while (segmentIndex < stroke.length && traversed + distance(segmentStart, stroke[segmentIndex]) < targetDistance) {
      traversed += distance(segmentStart, stroke[segmentIndex]);
      segmentStart = stroke[segmentIndex];
      segmentIndex += 1;
    }
    const end = stroke[Math.min(segmentIndex, stroke.length - 1)];
    const segmentLength = Math.max(EPSILON, distance(segmentStart, end));
    const t = clamp((targetDistance - traversed) / segmentLength);
    result.push(lerpPoint(segmentStart, end, t));
  }
  result.push({ ...stroke.at(-1) });
  return result;
}

function smoothStroke(stroke, amount) {
  if (stroke.length < 4 || amount <= 0) return stroke.map(point => ({ ...point }));
  return stroke.map((point, index) => {
    if (index === 0 || index === stroke.length - 1) return { ...point };
    const prev = stroke[index - 1];
    const next = stroke[index + 1];
    return {
      x: point.x * (1 - amount) + (prev.x + next.x) * amount / 2,
      y: point.y * (1 - amount) + (prev.y + next.y) * amount / 2,
    };
  });
}

export function preprocessStrokes(strokes, options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const count = Math.max(8, Math.min(96, Math.round(settings.resamplePoints)));
  return (Array.isArray(strokes) ? strokes : [])
    .map(stroke => cleanStroke(stroke, Math.max(0, Number(settings.minPointDistance) || 0)))
    .filter(stroke => stroke.length >= 2)
    .map(stroke => smoothStroke(resampleStroke(stroke, count), clamp(Number(settings.smoothing) || 0, 0, 0.35)));
}

function getBounds(strokes) {
  const points = strokes.flat();
  if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, cx: 0, cy: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);
  return { minX, minY, maxX, maxY, width, height, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

function transformToReference(strokes, reference) {
  const userBounds = getBounds(strokes);
  const refBounds = getBounds(reference);
  if (!strokes.length || !reference.length) return strokes.map(stroke => stroke.map(point => ({ ...point })));

  const userHeight = Math.max(userBounds.height, 1);
  const refHeight = Math.max(refBounds.height, 1);
  const rawScale = refHeight / userHeight;
  const scale = clamp(rawScale, 0.82, 1.22);
  const tx = refBounds.cx - (userBounds.cx * scale);
  const ty = refBounds.cy - (userBounds.cy * scale);
  return strokes.map(stroke => stroke.map(point => ({
    x: point.x * scale + tx,
    y: point.y * scale + ty,
  })));
}

function turningAngles(stroke) {
  const angles = [];
  for (let i = 1; i < stroke.length - 1; i += 1) {
    const a = Math.atan2(stroke[i].y - stroke[i - 1].y, stroke[i].x - stroke[i - 1].x);
    const b = Math.atan2(stroke[i + 1].y - stroke[i].y, stroke[i + 1].x - stroke[i].x);
    let delta = b - a;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    angles.push(delta);
  }
  return angles;
}

function directionVector(stroke, fromStart) {
  const count = Math.max(1, Math.min(4, Math.floor(stroke.length / 4)));
  const index = fromStart ? count : stroke.length - 1 - count;
  const a = fromStart ? stroke[0] : stroke[index];
  const b = fromStart ? stroke[index] : stroke.at(-1);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  return length < EPSILON ? null : { x: dx / length, y: dy / length };
}

function directionScore(user, reference) {
  const scores = [];
  for (const fromStart of [true, false]) {
    const a = directionVector(user, fromStart);
    const b = directionVector(reference, fromStart);
    if (!a || !b) continue;
    scores.push(clamp((a.x * b.x + a.y * b.y + 1) / 2));
  }
  return scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0.5;
}

function curvatureScore(user, reference) {
  const a = turningAngles(user);
  const b = turningAngles(reference);
  if (!a.length || !b.length) return 0.5;
  const count = Math.min(a.length, b.length);
  if (!count) return 0.5;
  let error = 0;
  for (let i = 0; i < count; i += 1) error += Math.abs(a[Math.floor(i * a.length / count)] - b[Math.floor(i * b.length / count)]);
  error /= count;
  return clamp(1 - error / Math.PI);
}

function shapeScore(user, reference, diagonal) {
  const count = Math.min(user.length, reference.length);
  if (!count) return 0;
  let error = 0;
  for (let i = 0; i < count; i += 1) error += distance(user[i], reference[i]);
  error /= count;
  const normalizedError = error / Math.max(diagonal, 1);
  return Math.exp(-normalizedError * 6.5);
}

function endpointScore(user, reference, diagonal) {
  if (!user.length || !reference.length) return 0;
  const start = distance(user[0], reference[0]) / Math.max(diagonal, 1);
  const end = distance(user.at(-1), reference.at(-1)) / Math.max(diagonal, 1);
  return (Math.exp(-start * 5) + Math.exp(-end * 5)) / 2;
}

function lengthScore(user, reference) {
  const userLength = Math.max(EPSILON, pathLength(user));
  const referenceLength = Math.max(EPSILON, pathLength(reference));
  return Math.exp(-Math.abs(Math.log(userLength / referenceLength)) / 0.34);
}

function strokeGeometryScore(user, reference, diagonal) {
  const shape = shapeScore(user, reference, diagonal);
  const endpoints = endpointScore(user, reference, diagonal);
  const length = lengthScore(user, reference);
  const direction = directionScore(user, reference);
  const curvature = curvatureScore(user, reference);
  return {
    shape,
    endpoints,
    length,
    direction,
    curvature,
    score: clamp(
      shape * 0.45 +
      endpoints * 0.20 +
      length * 0.10 +
      direction * 0.10 +
      curvature * 0.15,
    ),
  };
}

function placementScore(user, reference, options) {
  const userBounds = getBounds(user);
  const refBounds = getBounds(reference);
  const diagonal = Math.max(EPSILON, Math.hypot(refBounds.width, refBounds.height));

  const centerDistance = Math.hypot(userBounds.cx - refBounds.cx, userBounds.cy - refBounds.cy) / diagonal;
  const centerScore = Math.exp(-centerDistance * 3.1);

  const widthRatio = Math.max(EPSILON, userBounds.width / Math.max(refBounds.width, 1));
  const heightRatio = Math.max(EPSILON, userBounds.height / Math.max(refBounds.height, 1));
  const widthPenalty = Math.abs(Math.log(widthRatio));
  const heightPenalty = Math.abs(Math.log(heightRatio));
  const tolerance = Math.max(0.15, Number(options.sizeTolerance) || DEFAULTS.sizeTolerance);
  const sizeScore = (Math.exp(-widthPenalty / tolerance) + Math.exp(-heightPenalty / tolerance)) / 2;

  return clamp(centerScore * 0.60 + sizeScore * 0.40);
}

function orderScore(user, reference) {
  if (!user.length || !reference.length) return 0;
  const n = Math.max(user.length, reference.length);
  const diagonal = Math.max(1, Math.hypot(getBounds(reference).width, getBounds(reference).height));
  const rows = [];
  for (let i = 0; i < Math.min(user.length, reference.length); i += 1) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let j = 0; j < reference.length; j += 1) {
      const score = shapeScore(user[i], reference[j], diagonal);
      const penalty = Math.abs(i - j) / Math.max(1, n - 1);
      const cost = (1 - score) + penalty * 0.35;
      if (cost < bestDistance) {
        bestDistance = cost;
        bestIndex = j;
      }
    }
    const positionError = Math.abs(i - bestIndex) / Math.max(1, n - 1);
    rows.push(Math.exp(-positionError * 3.2));
  }
  return rows.reduce((sum, value) => sum + value, 0) / rows.length;
}

function feedbackForStroke(stroke, index) {
  if (stroke.endpoints < 0.65) return { code: "endpoints", stroke: index };
  if (stroke.length < 0.65) return { code: "length", stroke: index };
  if (stroke.direction < 0.65) return { code: "direction", stroke: index };
  if (stroke.curvature < 0.60) return { code: "curvature", stroke: index };
  if (stroke.shape < 0.65) return { code: "shape", stroke: index };
  return null;
}

export function gradeHandwriting(userStrokes, referenceStrokes, options = {}) {
  const settings = { ...DEFAULTS, ...(options || {}) };
  const user = preprocessStrokes(userStrokes, settings);
  const reference = preprocessStrokes(referenceStrokes, settings);
  if (!reference.length) {
    return {
      score: 0,
      scoreReliability: "low",
      strokeCount: { user: user.length, reference: 0, ratio: 0, missing: 0, extra: user.length },
      orderScore: 0,
      placementScore: 0,
      perStroke: [],
      feedbackCode: "unavailable",
      feedbackStroke: null,
    };
  }
  if (!user.length) {
    return {
      score: 0,
      scoreReliability: "low",
      strokeCount: { user: 0, reference: reference.length, ratio: 0, missing: reference.length, extra: 0 },
      orderScore: 0,
      placementScore: 0,
      perStroke: [],
      feedbackCode: "empty",
      feedbackStroke: null,
    };
  }

  const diagonal = Math.max(1, Math.hypot(getBounds(reference).width, getBounds(reference).height));
  const alignedUser = transformToReference(user, reference);
  const perStroke = [];
  const matched = Math.min(alignedUser.length, reference.length);

  for (let i = 0; i < matched; i += 1) {
    perStroke.push({
      index: i,
      ...strokeGeometryScore(alignedUser[i], reference[i], diagonal),
    });
  }

  const matchedAverage = perStroke.length
    ? perStroke.reduce((sum, row) => sum + row.score, 0) / perStroke.length
    : 0;
  const ratio = matched / Math.max(alignedUser.length, reference.length);
  const countFactor = Math.pow(ratio, 1.8);
  const order = orderScore(alignedUser, reference);
  const placement = placementScore(user, reference, settings);

  const rawScore =
    matchedAverage * 0.72 +
    order * 0.13 +
    placement * 0.15;

  const score = Math.round(clamp(rawScore * countFactor) * 100);
  const weakest = [...perStroke].sort((a, b) => a.score - b.score)[0];
  const localFeedback = weakest ? feedbackForStroke(weakest, weakest.index) : null;
  const feedbackCode =
    ratio < 1 ? "stroke-count" :
    order < 0.70 ? "stroke-order" :
    placement < 0.60 ? "placement" :
    localFeedback?.code || (score >= 85 ? "good" : score >= 65 ? "improve" : "shape");

  const pointCount = user.flat().length;
  const scoreReliability =
    user.length < 2 || pointCount < user.length * 4 ? "low" :
    user.length === reference.length ? "high" : "medium";

  return {
    score,
    scoreReliability,
    strokeCount: {
      user: user.length,
      reference: reference.length,
      ratio,
      missing: Math.max(0, reference.length - user.length),
      extra: Math.max(0, user.length - reference.length),
    },
    orderScore: order,
    placementScore: placement,
    perStroke,
    feedbackCode,
    feedbackStroke: localFeedback?.stroke ?? (weakest?.index ?? null),
  };
}
