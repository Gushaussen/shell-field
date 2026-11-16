import test from 'node:test';
import assert from 'node:assert/strict';
import {
  labAnatomyTemplate,
  labCreateAnatomyReview,
  labAddLandmark,
  labAddCondition,
  labGrowthIncrements,
  labValidateAnatomyReview
} from '../src/lab-anatomy-condition.mjs';

test('provides an oyster template without fixed anatomy', () => {
  const template = labAnatomyTemplate('ostrea_edulis');
  assert.equal(template.status, 'completed');
  assert.ok(template.landmarkVocabulary.includes('umbo'));
  assert.match(template.notes, /do not assume fixed positions/);
});

test('unknown shell type is unavailable', () => {
  assert.equal(labAnatomyTemplate('not-a-shell').status, 'unavailable');
});

test('creates and validates a review', () => {
  const review = labCreateAnatomyReview('specimen-1', 'mytilus_edulis');
  assert.equal(review.status, 'completed');
  assert.equal(review.reviewState, 'candidate');
  assert.equal(labValidateAnatomyReview(review).valid, true);
});

test('adds normalized landmarks', () => {
  const review = labCreateAnatomyReview('specimen-1', 'mytilus_edulis');
  const result = labAddLandmark(review, 'umbo', 0.25, 0.4);
  assert.equal(result.status, 'completed');
  assert.equal(review.landmarks[0].method, 'manual');
});

test('rejects invalid landmark coordinates', () => {
  const review = labCreateAnatomyReview('specimen-1', 'mytilus_edulis');
  assert.equal(labAddLandmark(review, 'umbo', 2, 0.4).status, 'unavailable');
});

test('adds condition observations without causal claims', () => {
  const review = labCreateAnatomyReview('specimen-1', 'mytilus_edulis');
  const result = labAddCondition(review, 'abrasion_or_erosion_candidate', 'Observed smoothed margin');
  assert.equal(result.status, 'completed');
  assert.equal(review.conditionAnnotations[0].causalClaim, false);
});

test('measures increment spacing without equating bands with years', () => {
  const result = labGrowthIncrements([0, 4, 9, 15], 'mm');
  assert.equal(result.status, 'completed');
  assert.deepEqual(result.spacings, [4, 5, 6]);
  assert.match(result.interpretation, /not automatically years/);
});

test('rejects invalid increment input', () => {
  assert.equal(labGrowthIncrements([1]).status, 'unavailable');
});
