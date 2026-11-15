import test from 'node:test';
import assert from 'node:assert/strict';
import {
  labMeshValidity,
  labMeshArea,
  labMeshVolume,
  labMeshNormalsAndSlope,
  labMeshCurvature,
  labMeshCrossSection
} from '../src/lab-geometry-analysis.mjs';

const tetrahedronPositions = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
];
const tetrahedronIndices = [
  [0, 2, 1],
  [0, 1, 3],
  [0, 3, 2],
  [1, 2, 3]
];

test('validates a closed tetrahedron', () => {
  const result = labMeshValidity(tetrahedronPositions, tetrahedronIndices);
  assert.equal(result.status, 'completed');
  assert.equal(result.boundaryEdgeCount, 0);
  assert.equal(result.closedCandidate, true);
});

test('computes tetrahedron surface area', () => {
  const result = labMeshArea(tetrahedronPositions, tetrahedronIndices);
  assert.equal(result.status, 'completed');
  assert.ok(Math.abs(result.surfaceArea - 2.3660254) < 1e-6);
});

test('computes enclosed tetrahedron volume', () => {
  const result = labMeshVolume(tetrahedronPositions, tetrahedronIndices);
  assert.equal(result.status, 'completed');
  assert.ok(Math.abs(result.signedVolume - 1 / 6) < 1e-9);
});

test('volume is unavailable for an open mesh', () => {
  const result = labMeshVolume(tetrahedronPositions, [[0, 1, 2]]);
  assert.equal(result.status, 'unavailable');
});

test('computes normals and slopes', () => {
  const result = labMeshNormalsAndSlope(tetrahedronPositions, tetrahedronIndices);
  assert.equal(result.status, 'completed');
  assert.equal(result.normals.length, 4);
  assert.ok(result.meanSlope >= 0 && result.meanSlope <= Math.PI);
});

test('computes discrete curvature', () => {
  const result = labMeshCurvature(tetrahedronPositions, tetrahedronIndices);
  assert.equal(result.status, 'completed');
  assert.equal(result.curvatureMap.length, 4);
});

test('cross-section intersects a tetrahedron', () => {
  const result = labMeshCrossSection(tetrahedronPositions, tetrahedronIndices, 'y', 0.25);
  assert.equal(result.status, 'completed');
  assert.ok(result.segmentCount > 0);
});

test('rejects invalid geometry', () => {
  assert.equal(labMeshValidity([[0, 0, 0]], []).status, 'unavailable');
});
