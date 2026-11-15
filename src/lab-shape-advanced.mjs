/* Shell Field advanced outline analysis.
 * Image-derived geometric descriptors. These are not biological diagnoses.
 */

export const LAB_SHAPE_ADVANCED_VERSION = '1.0.0';

function closedPolygon(points) {
  if (!Array.isArray(points) || points.length < 3) return null;
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return points.slice(0, -1);
  return points;
}

function polygonPerimeter(points) {
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}

function resampleClosedPolygon(points, samples) {
  const closed = closedPolygon(points);
  if (!closed || samples < 4) return null;
  const perimeter = polygonPerimeter(closed);
  if (!(perimeter > 0)) return null;

  const spacing = perimeter / samples;
  const output = [];
  let travelled = 0;
  let nextTarget = 0;

  for (let i = 0; i < closed.length; i++) {
    const a = closed[i];
    const b = closed[(i + 1) % closed.length];
    const segment = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (nextTarget < samples && travelled + segment >= nextTarget * spacing) {
      const local = segment === 0 ? 0 : (nextTarget * spacing - travelled) / segment;
      output.push([a[0] + (b[0] - a[0]) * local, a[1] + (b[1] - a[1]) * local]);
      nextTarget++;
    }
    travelled += segment;
  }
  return output.length === samples ? output : null;
}

export function labBoundaryCurvature(points, samples = 64, sharpThreshold = 0.6) {
  const sampled = resampleClosedPolygon(points, samples);
  if (!sampled) {
    return { status: 'unavailable', reason: 'A closed polygon with at least three points is required' };
  }

  const curvature = [];
  for (let i = 0; i < samples; i++) {
    const previous = sampled[(i - 1 + samples) % samples];
    const current = sampled[i];
    const next = sampled[(i + 1) % samples];
    const v1 = [current[0] - previous[0], current[1] - previous[1]];
    const v2 = [next[0] - current[0], next[1] - current[1]];
    const l1 = Math.hypot(v1[0], v1[1]);
    const l2 = Math.hypot(v2[0], v2[1]);
    if (l1 === 0 || l2 === 0) {
      curvature.push(null);
      continue;
    }
    const cross = v1[0] * v2[1] - v1[1] * v2[0];
    const dot = v1[0] * v2[0] + v1[1] * v2[1];
    curvature.push(Math.atan2(cross, dot));
  }

  const values = curvature.filter((value) => value !== null);
  const absValues = values.map(Math.abs);
  const candidates = curvature
    .map((value, index) => ({ index, value }))
    .filter((item) => item.value !== null && Math.abs(item.value) >= sharpThreshold)
    .map((item) => ({
      sampleIndex: item.index,
      position: sampled[item.index],
      signedCurvature: item.value,
      kind: item.value > 0 ? 'convex_candidate' : 'concave_candidate'
    }));

  return {
    status: 'completed',
    samples,
    method: 'discrete turning angle on uniformly resampled closed outline',
    curvature,
    meanAbsoluteCurvature: absValues.length ? absValues.reduce((a, b) => a + b, 0) / absValues.length : null,
    maximumAbsoluteCurvature: absValues.length ? Math.max(...absValues) : null,
    edgeCandidates: candidates,
    interpretation: 'Geometric edge-character candidates only; not a biological or damage diagnosis'
  };
}

function polygonCentroid(points) {
  let area = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const cross = a[0] * b[1] - b[0] * a[1];
    area += cross;
    x += (a[0] + b[0]) * cross;
    y += (a[1] + b[1]) * cross;
  }
  area /= 2;
  if (Math.abs(area) < 1e-12) return null;
  return [x / (6 * area), y / (6 * area)];
}

function principalAxis(points) {
  const centroid = polygonCentroid(points);
  if (!centroid) return null;
  let xx = 0;
  let yy = 0;
  let xy = 0;
  for (const point of points) {
    const dx = point[0] - centroid[0];
    const dy = point[1] - centroid[1];
    xx += dx * dx;
    yy += dy * dy;
    xy += dx * dy;
  }
  const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
  return { centroid, angle };
}

export function labReflectionSymmetry(points, samples = 64) {
  const closed = closedPolygon(points);
  if (!closed) {
    return { status: 'unavailable', reason: 'A closed polygon with at least three points is required' };
  }

  const axis = principalAxis(closed);
  if (!axis) {
    return { status: 'unavailable', reason: 'A polygon with non-zero area is required' };
  }

  const sampled = resampleClosedPolygon(closed, samples);
  if (!sampled) {
    return { status: 'unavailable', reason: 'Outline could not be uniformly resampled' };
  }

  const cos = Math.cos(axis.angle);
  const sin = Math.sin(axis.angle);
  const asymmetry = sampled.map((point) => {
    const dx = point[0] - axis.centroid[0];
    const dy = point[1] - axis.centroid[1];
    const rx = dx * cos + dy * sin;
    const ry = -dx * sin + dy * cos;
    const mirrored = [axis.centroid[0] + rx * cos - ry * sin, axis.centroid[1] + rx * sin + ry * cos];
    return Math.hypot(point[0] - mirrored[0], point[1] - mirrored[1]);
  });

  const mean = asymmetry.reduce((a, b) => a + b, 0) / asymmetry.length;
  return {
    status: 'completed',
    samples,
    method: 'reflection across principal axis; geometric, not biological symmetry',
    axisAngle: axis.angle,
    centroid: axis.centroid,
    asymmetryMap: asymmetry,
    meanAsymmetry: mean,
    maximumAsymmetry: Math.max(...asymmetry)
  };
}

export function labEllipticFourier(points, harmonics = 12) {
  const closed = closedPolygon(points);
  if (!closed || closed.length < 4) {
    return { status: 'unavailable', reason: 'A closed polygon with at least four points is required' };
  }
  if (!Number.isInteger(harmonics) || harmonics < 1 || harmonics > 64) {
    return { status: 'unavailable', reason: 'harmonics must be an integer from 1 to 64' };
  }

  const n = closed.length;
  const distances = [];
  let perimeter = 0;
  for (let i = 0; i < n; i++) {
    const a = closed[i];
    const b = closed[(i + 1) % n];
    const distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
    distances.push(distance);
    perimeter += distance;
  }
  if (!(perimeter > 0)) {
    return { status: 'unavailable', reason: 'A polygon with non-zero perimeter is required' };
  }

  const t = [0];
  for (let i = 0; i < n; i++) t.push(t[i] + distances[i]);
  const T = perimeter;
  const coefficients = [];

  for (let k = 1; k <= harmonics; k++) {
    let ax = 0, bx = 0, ay = 0, by = 0;
    for (let i = 0; i < n; i++) {
      const p = closed[i];
      const q = closed[(i + 1) % n];
      const dt = distances[i];
      if (dt === 0) continue;
      const phase = 2 * Math.PI * k * t[i] / T;
      const phaseNext = 2 * Math.PI * k * t[i + 1] / T;
      const dPhase = phaseNext - phase;
      const cosine = (Math.cos(phaseNext) - Math.cos(phase)) / dPhase;
      const sine = (Math.sin(phaseNext) - Math.sin(phase)) / dPhase;
      ax += (q[0] - p[0]) / dt * cosine;
      ay += (q[1] - p[1]) / dt * cosine;
      bx += (q[0] - p[0]) / dt * sine;
      by += (q[1] - p[1]) / dt * sine;
    }
    coefficients.push({ harmonic: k, ax, ay, bx, by });
  }

  const first = coefficients[0];
  const normalizationScale = Math.hypot(first.ax, first.ay);
  const normalized = normalizationScale > 0 ? coefficients.map((c) => ({
    harmonic: c.harmonic,
    ax: c.ax / normalizationScale,
    ay: c.ay / normalizationScale,
    bx: c.bx / normalizationScale,
    by: c.by / normalizationScale
  })) : [];

  return {
    status: 'completed',
    harmonics,
    perimeter,
    normalization: {
      method: 'first-harmonic magnitude',
      scale: normalizationScale,
      rotation: 'not removed',
      startingPoint: 'polygon vertex order'
    },
    coefficients,
    normalizedCoefficients: normalized
  };
}

export function labLandmarkMeasurements(points, ends, pixelsPerMm = null) {
  const closed = closedPolygon(points);
  if (!closed || !Array.isArray(ends) || ends.length !== 2) {
    return { status: 'unavailable', reason: 'A closed polygon and two base-tip endpoints are required' };
  }

  const centroid = polygonCentroid(closed);
  if (!centroid) {
    return { status: 'unavailable', reason: 'A polygon with non-zero area is required' };
  }

  const base = ends[0];
  const tip = ends[1];
  const baseTipLength = Math.hypot(tip[0] - base[0], tip[1] - base[1]);
  const boundaryDistances = closed.map((point) => Math.hypot(point[0] - centroid[0], point[1] - centroid[1]));
  const unit = pixelsPerMm && pixelsPerMm > 0 ? 'mm' : 'px';
  const scale = pixelsPerMm && pixelsPerMm > 0 ? 1 / pixelsPerMm : 1;

  return {
    status: 'completed',
    unit,
    base,
    tip,
    centroid,
    baseTipLength: baseTipLength * scale,
    centroidToBase: Math.hypot(centroid[0] - base[0], centroid[1] - base[1]) * scale,
    centroidToTip: Math.hypot(centroid[0] - tip[0], centroid[1] - tip[1]) * scale,
    meanCentroidBoundaryDistance: boundaryDistances.reduce((a, b) => a + b, 0) / boundaryDistances.length * scale,
    maximumCentroidBoundaryDistance: Math.max(...boundaryDistances) * scale
  };
}
