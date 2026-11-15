/* Shell Field anatomy and condition review.
 * Templates provide review vocabulary; they do not impose anatomy or biological conclusions.
 */

export const LAB_ANATOMY_CONDITION_VERSION = '1.0.0';

export const REVIEW_STATES = Object.freeze(['candidate', 'reviewed', 'rejected', 'not_assessable']);

export const SHELL_TEMPLATES = Object.freeze({
  unidentified: {
    label: 'Unidentified',
    structures: [],
    landmarkVocabulary: ['custom landmark'],
    notes: 'Use only when anatomy cannot be reliably assigned.'
  },
  ostrea_edulis: {
    label: 'Ostrea edulis',
    structures: ['umbo/beak', 'ligament area', 'adductor scar', 'pallial line', 'margin'],
    landmarkVocabulary: ['umbo', 'ligament', 'adductor scar', 'pallial line', 'margin'],
    notes: 'Confirm structures against the specimen; do not assume fixed positions.'
  },
  magallana_gigas: {
    label: 'Magallana gigas',
    structures: ['umbo/beak', 'ligament area', 'adductor scar', 'pallial line', 'margin'],
    landmarkVocabulary: ['umbo', 'ligament', 'adductor scar', 'pallial line', 'margin'],
    notes: 'Confirm structures against the specimen; do not assume fixed positions.'
  },
  mytilus_edulis: {
    label: 'Mytilus edulis',
    structures: ['umbo/beak', 'hinge', 'ligament area', 'adductor scar', 'pallial line', 'margin'],
    landmarkVocabulary: ['umbo', 'hinge', 'ligament', 'adductor scar', 'pallial line', 'margin'],
    notes: 'Confirm structures against the specimen; do not assume fixed positions.'
  },
  cerastoderma_edule: {
    label: 'Cerastoderma edule',
    structures: ['umbo/beak', 'hinge', 'hinge teeth/sockets', 'ligament area', 'adductor scar', 'pallial line', 'margin'],
    landmarkVocabulary: ['umbo', 'hinge', 'hinge tooth', 'hinge socket', 'ligament', 'adductor scar', 'pallial line', 'margin'],
    notes: 'Confirm structures against the specimen; do not assume fixed positions.'
  },
  cerastoderma_glaucum: {
    label: 'Cerastoderma glaucum',
    structures: ['umbo/beak', 'hinge', 'hinge teeth/sockets', 'ligament area', 'adductor scar', 'pallial line', 'margin'],
    landmarkVocabulary: ['umbo', 'hinge', 'hinge tooth', 'hinge socket', 'ligament', 'adductor scar', 'pallial line', 'margin'],
    notes: 'Confirm structures against the specimen; do not assume fixed positions.'
  },
  unidentified_razor_clam: {
    label: 'Unidentified razor clam',
    structures: ['umbo/beak', 'hinge', 'ligament area', 'adductor scar', 'pallial line', 'margin'],
    landmarkVocabulary: ['umbo', 'hinge', 'ligament', 'adductor scar', 'pallial line', 'margin'],
    notes: 'Confirm structures against the specimen; do not assume fixed positions.'
  },
  other: {
    label: 'Other',
    structures: [],
    landmarkVocabulary: ['custom landmark'],
    notes: 'Use an appropriate external reference and record the basis for anatomical interpretation.'
  }
});

export const CONDITION_TYPES = Object.freeze([
  'edge_loss_or_fragmentation',
  'abrasion_or_erosion_candidate',
  'encrustation_candidate',
  'boring_like_opening_candidate',
  'boring_like_channel_candidate',
  'deposit_candidate',
  'repaired_damage_candidate',
  'preserved_region',
  'obscured_region'
]);

export function labAnatomyTemplate(shellType) {
  const template = SHELL_TEMPLATES[shellType];
  if (!template) {
    return { status: 'unavailable', reason: 'Unknown shell type' };
  }
  return {
    status: 'completed',
    shellType,
    ...template,
    reviewState: 'candidate'
  };
}

export function labCreateAnatomyReview(specimenId, shellType, options = {}) {
  const template = labAnatomyTemplate(shellType);
  if (template.status !== 'completed') return template;

  return {
    status: 'completed',
    specimenId,
    shellType,
    templateVersion: LAB_ANATOMY_CONDITION_VERSION,
    reviewState: options.reviewState || 'candidate',
    structures: [],
    landmarks: [],
    conditionAnnotations: [],
    notes: options.notes || '',
    valveIdentification: options.valveIdentification || 'not_assessed',
    pairingProposal: options.pairingProposal || 'not_assessed'
  };
}

export function labAddLandmark(review, name, x, y, reviewState = 'reviewed') {
  if (!review || review.status !== 'completed') {
    return { status: 'unavailable', reason: 'A completed anatomy review is required' };
  }
  if (typeof name !== 'string' || !name.trim()) {
    return { status: 'unavailable', reason: 'A landmark name is required' };
  }
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
    return { status: 'unavailable', reason: 'Landmark coordinates must be normalized values from 0 to 1' };
  }
  if (!REVIEW_STATES.includes(reviewState)) {
    return { status: 'unavailable', reason: 'Invalid review state' };
  }

  review.landmarks.push({
    id: `landmark-${review.landmarks.length + 1}`,
    name: name.trim(),
    position: [x, y],
    reviewState,
    method: 'manual'
  });
  return { status: 'completed', landmarkCount: review.landmarks.length };
}

export function labAddCondition(review, conditionType, note = '', reviewState = 'candidate') {
  if (!review || review.status !== 'completed') {
    return { status: 'unavailable', reason: 'A completed anatomy review is required' };
  }
  if (!CONDITION_TYPES.includes(conditionType)) {
    return { status: 'unavailable', reason: 'Unknown condition type' };
  }
  if (!REVIEW_STATES.includes(reviewState)) {
    return { status: 'unavailable', reason: 'Invalid review state' };
  }

  review.conditionAnnotations.push({
    id: `condition-${review.conditionAnnotations.length + 1}`,
    conditionType,
    note: String(note || ''),
    reviewState,
    method: 'manual_observation',
    causalClaim: false
  });
  return { status: 'completed', conditionCount: review.conditionAnnotations.length };
}

export function labGrowthIncrements(positions, unit = 'px') {
  if (!Array.isArray(positions) || positions.length < 2) {
    return { status: 'unavailable', reason: 'At least two increment positions are required' };
  }
  const values = positions.filter(Number.isFinite);
  if (values.length < 2) {
    return { status: 'unavailable', reason: 'At least two finite increment positions are required' };
  }
  const spacings = [];
  for (let i = 1; i < values.length; i++) {
    spacings.push(Math.abs(values[i] - values[i - 1]));
  }
  return {
    status: 'completed',
    unit,
    method: 'spacing between user-supplied increment positions; visible bands are not automatically years',
    positions: values,
    spacings,
    meanSpacing: spacings.reduce((total, value) => total + value, 0) / spacings.length,
    minimumSpacing: Math.min(...spacings),
    maximumSpacing: Math.max(...spacings),
    interpretation: 'Candidate growth-increment spacing; chronological interpretation requires independent validation'
  };
}

export function labValidateAnatomyReview(review) {
  if (!review || review.status !== 'completed') {
    return { valid: false, errors: ['A completed anatomy review is required'] };
  }
  const errors = [];
  if (!review.specimenId) errors.push('Specimen ID is required');
  if (!SHELL_TEMPLATES[review.shellType]) errors.push('Unknown shell type');
  if (!REVIEW_STATES.includes(review.reviewState)) errors.push('Invalid review state');
  for (const landmark of review.landmarks || []) {
    if (!landmark.name) errors.push(`Landmark ${landmark.id} has no name`);
    if (!REVIEW_STATES.includes(landmark.reviewState)) errors.push(`Landmark ${landmark.id} has an invalid review state`);
  }
  for (const condition of review.conditionAnnotations || []) {
    if (!CONDITION_TYPES.includes(condition.conditionType)) errors.push(`Condition ${condition.id} has an unknown type`);
    if (!REVIEW_STATES.includes(condition.reviewState)) errors.push(`Condition ${condition.id} has an invalid review state`);
  }
  return { valid: errors.length === 0, errors };
}
