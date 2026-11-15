import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createExtractionRegistry,
  LAB_REGISTRY_VERSION
} from '../src/lab-registry.mjs';

function makeDefinition(overrides = {}) {
  return {
    id: 'test.shape.area',
    title: 'Test area',
    category: 'outline_morphometrics',
    version: '1.0.0',
    requiredInputs: ['mask'],
    outputs: { area: 'number' },
    settings: {},
    run: (context) => ({ area: context.mask.length })
  };
}

function makeContext() {
  return {
    specimenId: 'specimen-test',
    specimenRevision: 3,
    side: 'exterior',
    sourceArchiveChecksum: 'abc123',
    imageDimensions: { width: 100, height: 80 },
    calibration: { unit: 'mm', pixelsPerMm: 10 },
    mask: [1, 2, 3]
  };
}

test('registers and runs a valid extraction', () => {
  const registry = createExtractionRegistry();
  const definition = registry.register(makeDefinition());
  const result = registry.run(definition.id, makeContext());

  assert.equal(result.status, 'completed');
  assert.equal(result.reviewState, 'candidate');
  assert.equal(result.results.area, 3);
  assert.equal(result.provenance.registryVersion, LAB_REGISTRY_VERSION);
  assert.equal(result.provenance.extractionId, 'test.shape.area');
  assert.equal(result.provenance.specimenRevision, 3);
});

test('rejects duplicate extraction ids', () => {
  const registry = createExtractionRegistry();
  registry.register(makeDefinition());
  assert.throws(() => registry.register(makeDefinition()), /already registered/);
});

test('rejects incomplete extraction definitions', () => {
  const registry = createExtractionRegistry();
  assert.throws(() => registry.register({ id: 'broken' }), /must be an object|must provide/);
  assert.throws(() => registry.register(makeDefinition({ run: undefined })), /must provide a run function/);
  assert.throws(() => registry.register(makeDefinition({ requiredInputs: undefined })), /must declare requiredInputs/);
});

test('reports missing prerequisites without running the extraction', () => {
  const registry = createExtractionRegistry();
  const definition = registry.register(makeDefinition());
  const context = makeContext();
  delete context.mask;

  assert.throws(
    () => registry.run(definition.id, context),
    (error) => error.code === 'MISSING_INPUTS' && error.missing.includes('mask')
  );
});

test('freezes provenance and result objects', () => {
  const registry = createExtractionRegistry();
  const definition = registry.register(makeDefinition());
  const result = registry.run(definition.id, makeContext());

  assert.throws(() => {
    result.provenance.reviewState = 'reviewed';
  });
  assert.throws(() => {
    result.results.area = 99;
  });
});
