import test from 'node:test';
import assert from 'node:assert/strict';
import {
  labRgbToCielab,
  labCielabDeltaE76,
  labColourSegmentation,
  labCentreMarginComparison,
  labRepeatingBands
} from '../src/lab-colour-advanced.mjs';

test('white and black have expected CIELAB lightness', () => {
  const white = labRgbToCielab(255, 255, 255);
  const black = labRgbToCielab(0, 0, 0);
  assert.ok(Math.abs(white.l - 100) < 0.1);
  assert.ok(Math.abs(black.l) < 0.1);
});

test('delta E is zero for identical colours', () => {
  const colour = labRgbToCielab(120, 80, 40);
  assert.equal(labCielabDeltaE76(colour, colour), 0);
});

test('segmentation separates disconnected colour regions', () => {
  const width = 4;
  const height = 2;
  const rgba = new Uint8ClampedArray(width * height * 4);
  const mask = new Uint8Array(width * height);
  for (let x = 0; x < 2; x++) {
    rgba[(x * 4)] = 255;
    mask[x] = 1;
  }
  for (let x = 2; x < 4; x++) {
    rgba[(x * 4) + 2] = 255;
    mask[x] = 1;
  }
  const result = labColourSegmentation(rgba, mask, width, height);
  assert.equal(result.status, 'completed');
  assert.equal(result.regionCount, 2);
  assert.equal(result.regions[0].pixelCount, 2);
  assert.equal(result.regions[1].pixelCount, 2);
});

test('segmentation excludes regions below the minimum size', () => {
  const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]);
  const mask = new Uint8Array([1, 1]);
  const result = labColourSegmentation(rgba, mask, 2, 1, { minimumPixels: 2 });
  assert.equal(result.status, 'completed');
  assert.equal(result.regionCount, 0);
});

test('centre and margin comparison reports a colour difference', () => {
  const width = 5;
  const height = 5;
  const rgba = new Uint8ClampedArray(width * height * 4);
  const mask = new Uint8Array(width * height).fill(1);
  for (let index = 0; index < mask.length; index++) {
    const x = index % width;
    const y = Math.floor(index / width);
    const value = Math.hypot(x - 2, y - 2) < 1 ? 255 : 0;
    rgba[index * 4] = value;
    rgba[index * 4 + 1] = value;
    rgba[index * 4 + 2] = value;
  }
  const result = labCentreMarginComparison(rgba, mask, width, height);
  assert.equal(result.status, 'completed');
  assert.ok(result.centreMarginDeltaE76 > 0);
});

test('repeating bands require an axis', () => {
  const rgba = new Uint8ClampedArray(16);
  const mask = new Uint8Array(4).fill(1);
  assert.equal(labRepeatingBands(rgba, mask, 2, 2, null).status, 'unavailable');
});

test('repeating bands detect alternating lightness', () => {
  const width = 10;
  const height = 1;
  const rgba = new Uint8ClampedArray(width * height * 4);
  const mask = new Uint8Array(width * height).fill(1);
  for (let x = 0; x < width; x++) {
    const value = x % 2 === 0 ? 255 : 0;
    rgba[x * 4] = value;
    rgba[x * 4 + 1] = value;
    rgba[x * 4 + 2] = value;
  }
  const result = labRepeatingBands(rgba, mask, width, height, [[0, 0], [width - 1, 0]], width);
  assert.equal(result.status, 'completed');
  assert.ok(result.candidateBandCount > 0);
});
