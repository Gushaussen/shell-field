import test from 'node:test';
import assert from 'node:assert/strict';
import {
  labLocalContrast,
  labLocalDirection,
  labMultiscaleTexture,
  labRepetitionSpacing,
  labFeatureCandidates,
  labFeatureGraph
} from '../src/lab-texture-features.mjs';

function makeImage(width, height, value) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  const mask = new Uint8Array(width * height).fill(1);
  for (let index = 0; index < mask.length; index++) {
    rgba[index * 4] = value;
    rgba[index * 4 + 1] = value;
    rgba[index * 4 + 2] = value;
    rgba[index * 4 + 3] = 255;
  }
  return { rgba, mask };
}

test('uniform image has zero local contrast', () => {
  const { rgba, mask } = makeImage(5, 5, 128);
  const result = labLocalContrast(rgba, mask, 5, 5, 1);
  assert.equal(result.status, 'completed');
  assert.equal(result.meanContrast, 0);
});

test('direction requires image gradients', () => {
  const { rgba, mask } = makeImage(3, 3, 128);
  const result = labLocalDirection(rgba, mask, 3, 3);
  assert.equal(result.status, 'completed');
  assert.equal(result.meanCoherence, 0);
});

test('multiscale texture returns all requested scales', () => {
  const { rgba, mask } = makeImage(10, 10, 100);
  const result = labMultiscaleTexture(rgba, mask, 10, 10);
  assert.equal(result.status, 'completed');
  assert.deepEqual(result.scales, [1, 2, 4]);
  assert.equal(result.results.length, 3);
});

test('repetition spacing requires an axis', () => {
  const { rgba, mask } = makeImage(4, 4, 100);
  assert.equal(labRepetitionSpacing(rgba, mask, 4, 4, null).status, 'unavailable');
});

test('feature candidates identify dark patches without calling them holes', () => {
  const width = 5;
  const height = 5;
  const rgba = new Uint8ClampedArray(width * height * 4);
  const mask = new Uint8Array(width * height).fill(1);
  for (let index = 0; index < mask.length; index++) {
    const value = index === 12 ? 0 : 200;
    rgba[index * 4] = value;
    rgba[index * 4 + 1] = value;
    rgba[index * 4 + 2] = value;
  }
  const result = labFeatureCandidates(rgba, mask, width, height, { darkThreshold: 60, gradientThreshold: 100 });
  assert.equal(result.status, 'completed');
  assert.ok(result.features.some((feature) => feature.kind === 'dark_patch_candidate'));
  assert.ok(!result.features.some((feature) => feature.kind === 'confirmed_hole'));
});

test('feature graph creates proximity edges', () => {
  const graph = labFeatureGraph([
    { id: 'a', kind: 'dark_patch_candidate', centroid: [0, 0] },
    { id: 'b', kind: 'dark_patch_candidate', centroid: [0.1, 0] }
  ], 0.2);
  assert.equal(graph.status, 'completed');
  assert.equal(graph.edgeCount, 1);
});
