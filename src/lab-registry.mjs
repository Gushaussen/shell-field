/* Shell Field Lab extraction registry.
 * Provides a stable, versioned contract for extraction tools.
 * Automatic results are candidates until explicitly reviewed.
 */

export const LAB_REGISTRY_VERSION = '1.0.0';

export const REVIEW_STATES = Object.freeze([
  'candidate',
  'reviewed',
  'rejected',
  'not_assessable'
]);

export const DATA_SOURCES = Object.freeze([
  'image_derived',
  'model_derived',
  'measured',
  'imported',
  'manual'
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
}

export function createExtractionRegistry() {
  const extractions = new Map();

  function register(definition) {
    if (!isPlainObject(definition)) {
      throw new Error('Extraction definition must be an object');
    }

    requireNonEmptyString(definition.id, 'Extraction id');
    requireNonEmptyString(definition.title, 'Extraction title');
    requireNonEmptyString(definition.category, 'Extraction category');
    requireNonEmptyString(definition.version, 'Extraction version');

    if (typeof definition.run !== 'function') {
      throw new Error(`Extraction ${definition.id} must provide a run function`);
    }

    if (!Array.isArray(definition.requiredInputs)) {
      throw new Error(`Extraction ${definition.id} must declare requiredInputs`);
    }

    if (!isPlainObject(definition.outputs)) {
      throw new Error(`Extraction ${definition.id} must declare an outputs schema`);
    }

    if (extractions.has(definition.id)) {
      throw new Error(`Extraction id already registered: ${definition.id}`);
    }

    const normalized = Object.freeze({
      id: definition.id,
      title: definition.title,
      category: definition.category,
      version: definition.version,
      description: definition.description || '',
      requiredInputs: Object.freeze([...definition.requiredInputs]),
      optionalInputs: Object.freeze([...(definition.optionalInputs || [])]),
      settings: Object.freeze({ ...(definition.settings || {}) }),
      outputs: Object.freeze({ ...definition.outputs }),
      run: definition.run
    });

    extractions.set(normalized.id, normalized);
    return normalized;
  }

  function get(id) {
    const extraction = extractions.get(id);
    if (!extraction) {
      throw new Error(`Unknown extraction: ${id}`);
    }
    return extraction;
  }

  function list() {
    return [...extractions.values()];
  }

  function checkPrerequisites(extraction, context) {
    if (!isPlainObject(context)) {
      throw new Error('Analysis context must be an object');
    }

    const missing = extraction.requiredInputs.filter((input) => {
      const value = context[input];
      return value === undefined || value === null;
    });

    if (missing.length) {
      const error = new Error(`Missing required inputs: ${missing.join(', ')}`);
      error.code = 'MISSING_INPUTS';
      error.missing = missing;
      throw error;
    }
  }

  function createProvenance(extraction, context) {
    return Object.freeze({
      registryVersion: LAB_REGISTRY_VERSION,
      extractionId: extraction.id,
      extractionVersion: extraction.version,
      method: 'automatic_candidate',
      reviewState: 'candidate',
      specimenId: context.specimenId || null,
      specimenRevision: context.specimenRevision || null,
      side: context.side || null,
      sourceArchiveChecksum: context.sourceArchiveChecksum || null,
      imageDimensions: context.imageDimensions || null,
      calibration: context.calibration || null,
      settings: Object.freeze({ ...extraction.settings }),
      generatedAt: new Date().toISOString()
    });
  }

  function run(id, context) {
    const extraction = get(id);
    checkPrerequisites(extraction, context);

    const provenance = createProvenance(extraction, context);
    const output = extraction.run(context, extraction.settings);

    if (!isPlainObject(output)) {
      throw new Error(`Extraction ${id} must return an object`);
    }

    return Object.freeze({
      extractionId: extraction.id,
      extractionVersion: extraction.version,
      status: 'completed',
      reviewState: 'candidate',
      provenance,
      results: Object.freeze({ ...output })
    });
  }

  return Object.freeze({
    version: LAB_REGISTRY_VERSION,
    register,
    get,
    list,
    run,
    checkPrerequisites,
    createProvenance
  });
}
