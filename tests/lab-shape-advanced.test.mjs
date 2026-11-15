import test from 'node:test';
import assert from 'node:assert/strict';
import {
  labBoundaryCurvature,
  labReflectionSymmetry,
  labEllipticFourier,
  labLandmarkMeasurements
} from '../src/lab-shape-advanced.mjs';

const square = [[0, 0], [100, 0], [100, 100], [0, 100]];
const ends = [[50, 0], [50, 100]];

test('curvature identifies square corners as candidates', () => {
  const result = labBoundaryCurvature(square, 64, 0.5);
  assert.equal(result.status, 'completed');
  assert.equal(result.curvature.length, 64);
  assert.ok(result.edgeCandidates.length > 0);
});

test('curvature is unavailable for an invalid outline', () => {
  assert.equal(labBoundaryCurvature([], 64).status, 'unavailable');
});

test('symmetric rectangle has low mean asymmetry', () => {
  const result = labReflectionSymmetry(square, 64);
  assert.equal(result.status, 'completed');
  assert.ok(result.meanAsymmetry < 1e-6);
});

test('asymmetric outline has measurable asymmetry', () => {
  const asymmetric = [[0, 0], [100, 0], [100, 100], [20, 100]];
  const result = labReflectionSymmetry(asymmetric, 64);
  assert.equal(result.status, 'completed');
  assert.ok(result.meanAsymmetry > 0);
});

test('elliptic Fourier descriptors compute coefficients', () => {
  const result = labEllipticFourier(square, 12);
  assert.equal(result.status, 'completed');
  assert.equal(result.coefficients.length, 12);
  assert.ok(result.normalization.scale > 0);
});

test('EFD rejects invalid harmonic count', () => {
  assert.equal(labEllipticFourier(square, 0).status, 'unavailable');
  assert.equal(labEllipticFourier(square, 65).status, 'unavailable');
});

test('landmarks use calibration when supplied', () => {
  const result = labLandmarkMeasurements(square, ends, 2);
  assert.equal(result.status, 'completed');
  assert.equal(result.unit, 'mm');
  assert.equal(result.baseTipLength, 50);
});

test('landmarks use pixels without calibration', () => {
  const result = labLandmarkMeasurements(square, ends);
  assert.equal(result.status, 'completed');
  assert.equal(result.unit, 'px');
  assert.equal(result.baseTipLength, 100);
});
