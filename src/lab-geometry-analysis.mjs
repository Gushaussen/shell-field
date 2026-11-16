/* Shell Field geometry analysis.
 * Model-derived analysis requires an explicit geometry snapshot.
 * It does not independently verify that a reconstructed mesh matches the physical shell.
 */

export const LAB_GEOMETRY_ANALYSIS_VERSION = '1.0.0';

function validateGeometry(positions, indices) {
  if (!Array.isArray(positions) || positions.length < 4) {
    return { valid: false, errors: ['At least four positions are required'] };
  }
  if (!Array.isArray(indices) || indices.length < 1) {
    return { valid: false, errors: ['At least one triangle is required'] };
  }

  const errors = [];
  let nonFinitePositions = 0;
  for (const position of positions) {
    if (!Array.isArray(position) || position.length !== 3 || position.some((value) => !Number.isFinite(value))) {
      nonFinitePositions++;
    }
  }
  if (nonFinitePositions) errors.push(`${nonFinitePositions} positions are invalid or non-finite`);

  let invalidIndices = 0;
  let degenerateTriangles = 0;
  for (const triangle of indices) {
    if (!Array.isArray(triangle) || triangle.length !== 3 || triangle.some((index) => !Number.isInteger(index) || index < 0 || index >= positions.length)) {
      invalidIndices++;
      continue;
    }
    const [a, b, c] = triangle.map((index) => positions[index]);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cross = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    ];
    if (Math.hypot(...cross) < 1e-12) degenerateTriangles++;
  }
  if (invalidIndices) errors.push(`${invalidIndices} triangles have invalid indices`);
  if (degenerateTriangles) errors.push(`${degenerateTriangles} triangles are degenerate`);

  return { valid: errors.length === 0, errors };
}

export function labMeshValidity(positions, indices) {
  const validation = validateGeometry(positions, indices);
  if (!validation.valid) {
    return { status: 'unavailable', reason: validation.errors.join('; ') };
  }

  const edgeCounts = new Map();
  for (const [a, b, c] of indices) {
    for (const [first, second] of [[a, b], [b, c], [c, a]]) {
      const key = first < second ? `${first}-${second}` : `${second}-${first}`;
      edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
    }
  }
  const boundaryEdges = [...edgeCounts.values()].filter((count) => count === 1).length;
  const manifoldEdges = [...edgeCounts.values()].filter((count) => count === 2).length;
  const nonManifoldEdges = [...edgeCounts.values()].filter((count) => count > 2).length;

  return {
    status: 'completed',
    positionCount: positions.length,
    triangleCount: indices.length,
    uniqueEdgeCount: edgeCounts.size,
    boundaryEdgeCount: boundaryEdges,
    manifoldEdgeCount: manifoldEdges,
    nonManifoldEdgeCount: nonManifoldEdges,
    closedCandidate: boundaryEdges === 0 && nonManifoldEdges === 0,
    interpretation: 'Topology indicators from the supplied snapshot; not a complete print-readiness certification'
  };
}

export function labMeshArea(positions, indices) {
  const validation = validateGeometry(positions, indices);
  if (!validation.valid) {
    return { status: 'unavailable', reason: validation.errors.join('; ') };
  }
  let area = 0;
  for (const [a, b, c] of indices) {
    const p = positions[a];
    const q = positions[b];
    const r = positions[c];
    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
    const cross = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    ];
    area += Math.hypot(...cross) / 2;
  }
  return {
    status: 'completed',
    method: 'sum of triangle areas',
    surfaceArea: area,
    interpretation: 'Geometric surface area of the supplied mesh snapshot'
  };
}

export function labMeshVolume(positions, indices) {
  const validity = labMeshValidity(positions, indices);
  if (validity.status !== 'completed') return validity;
  if (!validity.closedCandidate) {
    return {
      status: 'unavailable',
      reason: 'Enclosed-volume analysis requires a closed, edge-manifold triangle mesh',
      topology: validity
    };
  }

  let signedVolume = 0;
  for (const [a, b, c] of indices) {
    const p = positions[a];
    const q = positions[b];
    const r = positions[c];
    signedVolume += (
      p[0] * (q[1] * r[2] - q[2] * r[1]) -
      p[1] * (q[0] * r[2] - q[2] * r[0]) +
      p[2] * (q[0] * r[1] - q[1] * r[0])
    ) / 6;
  }

  return {
    status: 'completed',
    method: 'divergence-theorem signed volume of a closed triangle mesh',
    signedVolume: Math.abs(signedVolume),
    orientation: signedVolume >= 0 ? 'outward' : 'inward',
    interpretation: 'Conditional geometric volume; validity depends on the supplied snapshot and does not certify physical accuracy'
  };
}

export function labMeshNormalsAndSlope(positions, indices) {
  const validation = validateGeometry(positions, indices);
  if (!validation.valid) {
    return { status: 'unavailable', reason: validation.errors.join('; ') };
  }

  const normals = positions.map(() => [0, 0, 0]);
  for (const [a, b, c] of indices) {
    const p = positions[a];
    const q = positions[b];
    const r = positions[c];
    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
    const cross = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    ];
    for (const index of [a, b, c]) {
      normals[index][0] += cross[0];
      normals[index][1] += cross[1];
      normals[index][2] += cross[2];
    }
  }

  const slopes = [];
  let count = 0, sumSlope = 0;
  const normalizedNormals = normals.map((normal) => {
    const length = Math.hypot(...normal);
    if (length < 1e-12) return null;
    const unit = normal.map((value) => value / length);
    const slope = Math.acos(Math.max(-1, Math.min(1, unit[1])));
    slopes.push(slope);
    count++;
    sumSlope += slope;
    return unit;
  });

  return {
    status: 'completed',
    method: 'area-weighted vertex normals; slope measured from the +Y viewer-up direction',
    normals: normalizedNormals,
    slopeMap: slopes,
    meanSlope: count ? sumSlope / count : null,
    interpretation: 'Mesh-derived orientation analysis; not a substitute for measured surface geometry'
  };
}

export function labMeshCurvature(positions, indices) {
  const validation = validateGeometry(positions, indices);
  if (!validation.valid) {
    return { status: 'unavailable', reason: validation.errors.join('; ') };
  }

  const angleSums = positions.map(() => 0);
  const neighbours = positions.map(() => new Set());
  for (const [a, b, c] of indices) {
    const p = positions[a];
    const q = positions[b];
    const r = positions[c];
    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
    const angle = Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v)))));
    angleSums[a] += angle;
    neighbours[a].add(b);
    neighbours[a].add(c);
  }

  const curvature = angleSums.map((sum, index) => {
    if (neighbours[index].size < 3) return null;
    return 2 * Math.PI - sum;
  });
  const values = curvature.filter((value) => value !== null);

  return {
    status: 'completed',
    method: 'angle-defect discrete curvature; sensitive to triangulation density',
    curvatureMap: curvature,
    meanCurvature: values.length ? values.reduce((total, value) => total + value, 0) / values.length : null,
    interpretation: 'Discrete geometric curvature of the supplied triangulation; not an independent physical measurement'
  };
}

export function labMeshCrossSection(positions, indices, axis = 'y', position = 0) {
  const validation = validateGeometry(positions, indices);
  if (!validation.valid) {
    return { status: 'unavailable', reason: validation.errors.join('; ') };
  }
  if (!['x', 'y', 'z'].includes(axis)) {
    return { status: 'unavailable', reason: 'Axis must be x, y, or z' };
  }

  const axisIndex = { x: 0, y: 1, z: 2 }[axis];
  const segments = [];
  for (const [a, b, c] of indices) {
    const points = [positions[a], positions[b], positions[c]];
    const distances = points.map((point) => point[axisIndex] - position);
    const intersections = [];
    for (let i = 0; i < 3; i++) {
      const first = points[i];
      const second = points[(i + 1) % 3];
      const firstDistance = distances[i];
      const secondDistance = distances[(i + 1) % 3];
      if ((firstDistance < 0 && secondDistance > 0) || (firstDistance > 0 && secondDistance < 0)) {
        const t = firstDistance / (firstDistance - secondDistance);
        intersections.push([
          first[0] + (second[0] - first[0]) * t,
          first[1] + (second[1] - first[1]) * t,
          first[2] + (second[2] - first[2]) * t
        ]);
      }
    }
    if (intersections.length === 2) segments.push(intersections);
  }

  return {
    status: 'completed',
    axis,
    position,
    method: 'triangle-plane intersection segments',
    segmentCount: segments.length,
    segments,
    interpretation: 'Geometric cross-section of the supplied mesh snapshot'
  };
}
