/* Shell Field texture, rhythm and feature-network analysis.
 * All feature outputs are image-derived candidates, not confirmed anatomy or damage.
 */

export const LAB_TEXTURE_FEATURES_VERSION = '1.0.0';

function grayscale(rgba, mask, width, height) {
  const values = new Float32Array(width * height);
  for (let index = 0; index < mask.length; index++) {
    if (!mask[index]) continue;
    const r = rgba[index * 4];
    const g = rgba[index * 4 + 1];
    const b = rgba[index * 4 + 2];
    values[index] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return values;
}

export function labLocalContrast(rgba, mask, width, height, radius = 2) {
  if (!rgba || !mask || !(width > 0) || !(height > 0) || radius < 1) {
    return { status: 'unavailable', reason: 'Image pixels, mask, dimensions and a positive radius are required' };
  }
  const gray = grayscale(rgba, mask, width, height);
  const contrast = new Float32Array(width * height);
  let count = 0, sum = 0, maximum = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (!mask[index]) continue;
      let n = 0, sumValue = 0, sumSquared = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const neighbour = ny * width + nx;
          if (!mask[neighbour]) continue;
          n++;
          sumValue += gray[neighbour];
          sumSquared += gray[neighbour] * gray[neighbour];
        }
      }
      if (n < 2) continue;
      const mean = sumValue / n;
      const variance = Math.max(0, sumSquared / n - mean * mean);
      const value = Math.sqrt(variance);
      contrast[index] = value;
      count++;
      sum += value;
      maximum = Math.max(maximum, value);
    }
  }

  return {
    status: 'completed',
    radius,
    method: 'local masked standard deviation of luminance',
    map: contrast,
    meanContrast: count ? sum / count : null,
    maximumContrast: count ? maximum : null,
    interpretation: 'Image texture, not a direct measure of physical surface roughness'
  };
}

export function labLocalDirection(rgba, mask, width, height) {
  if (!rgba || !mask || !(width > 0) || !(height > 0)) {
    return { status: 'unavailable', reason: 'Image pixels, mask, and dimensions are required' };
  }
  const gray = grayscale(rgba, mask, width, height);
  const direction = new Float32Array(width * height);
  const coherence = new Float32Array(width * height);
  let count = 0, sumCoherence = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      if (!mask[index] || !mask[index - 1] || !mask[index + 1] || !mask[index - width] || !mask[index + width]) continue;
      const gx = gray[index + 1] - gray[index - 1];
      const gy = gray[index + width] - gray[index - width];
      const magnitude = Math.hypot(gx, gy);
      if (magnitude < 1e-6) continue;
      direction[index] = Math.atan2(gy, gx);
      coherence[index] = magnitude / 255;
      count++;
      sumCoherence += coherence[index];
    }
  }

  return {
    status: 'completed',
    method: 'image-gradient orientation; not necessarily a physical ridge direction',
    directionMap: direction,
    coherenceMap: coherence,
    meanCoherence: count ? sumCoherence / count : null,
    interpretation: 'Local image-gradient orientation and strength, not a confirmed anatomical feature'
  };
}

export function labMultiscaleTexture(rgba, mask, width, height) {
  const scales = [1, 2, 4];
  const results = scales.map((radius) => labLocalContrast(rgba, mask, width, height, radius));
  if (results.some((result) => result.status !== 'completed')) {
    return { status: 'unavailable', reason: 'Multiscale texture requires a valid image mask and dimensions' };
  }
  return {
    status: 'completed',
    method: 'local luminance standard deviation at radii 1, 2 and 4 pixels',
    scales,
    results,
    interpretation: 'Multiscale image texture; physical roughness requires calibrated surface geometry'
  };
}

export function labRepetitionSpacing(rgba, mask, width, height, axis, samples = 50) {
  if (!Array.isArray(axis) || axis.length !== 2) {
    return { status: 'unavailable', reason: 'A base-tip axis is required' };
  }
  const gray = grayscale(rgba, mask, width, height);
  const values = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const x = Math.round(axis[0][0] + (axis[1][0] - axis[0][0]) * t);
    const y = Math.round(axis[0][1] + (axis[1][1] - axis[0][1]) * t);
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const index = y * width + x;
    if (!mask[index]) continue;
    values.push({ position: t, value: gray[index] });
  }
  if (values.length < 4) {
    return { status: 'unavailable', reason: 'Not enough valid samples along the chosen axis' };
  }

  const mean = values.reduce((total, sample) => total + sample.value, 0) / values.length;
  const centred = values.map((sample) => sample.value - mean);
  const autocorrelation = [];
  for (let lag = 1; lag < Math.floor(values.length / 2); lag++) {
    let numerator = 0, denominator = 0;
    for (let i = 0; i < values.length - lag; i++) numerator += centred[i] * centred[i + lag];
    for (let i = 0; i < values.length; i++) denominator += centred[i] * centred[i];
    autocorrelation.push({ lag, value: denominator ? numerator / denominator : null });
  }
  const peaks = autocorrelation.filter((item, index, array) => {
    const previous = index > 0 ? array[index - 1].value : -Infinity;
    const next = index < array.length - 1 ? array[index + 1].value : -Infinity;
    return item.value !== null && item.value > previous && item.value >= next;
  });

  return {
    status: 'completed',
    method: 'autocorrelation of luminance along saved base-tip axis; candidate rhythm only',
    samples: values.length,
    meanLuminance: mean,
    autocorrelation,
    candidateRepetitionLags: peaks.map((peak) => peak.lag),
    interpretation: 'Image rhythm candidates; not validated growth increments or biological periodicity'
  };
}

function connectedComponents(flags, width, height) {
  const labels = new Int32Array(flags.length).fill(-1);
  const components = [];
  const queue = [];
  let nextLabel = 0;
  for (let index = 0; index < flags.length; index++) {
    if (!flags[index] || labels[index] !== -1) continue;
    labels[index] = nextLabel;
    queue.push(index);
    const pixels = [];
    while (queue.length) {
      const current = queue.pop();
      pixels.push(current);
      const x = current % width;
      const y = Math.floor(current / width);
      const neighbours = [];
      if (x > 0) neighbours.push(current - 1);
      if (x < width - 1) neighbours.push(current + 1);
      if (y > 0) neighbours.push(current - width);
      if (y < height - 1) neighbours.push(current + width);
      for (const neighbour of neighbours) {
        if (!flags[neighbour] || labels[neighbour] !== -1) continue;
        labels[neighbour] = nextLabel;
        queue.push(neighbour);
      }
    }
    components.push({ id: nextLabel, pixels });
    nextLabel++;
  }
  return { labels, components };
}

export function labFeatureCandidates(rgba, mask, width, height, options = {}) {
  const darkThreshold = options.darkThreshold || 60;
  const gradientThreshold = options.gradientThreshold || 35;
  const maximumFeatures = options.maximumFeatures || 100;
  if (!rgba || !mask || !(width > 0) || !(height > 0)) {
    return { status: 'unavailable', reason: 'Image pixels, mask, and dimensions are required' };
  }

  const gray = grayscale(rgba, mask, width, height);
  const darkFlags = new Uint8Array(width * height);
  const gradientFlags = new Uint8Array(width * height);

  for (let index = 0; index < mask.length; index++) {
    if (!mask[index]) continue;
    if (gray[index] <= darkThreshold) darkFlags[index] = 1;
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      if (!mask[index] || !mask[index - 1] || !mask[index + 1] || !mask[index - width] || !mask[index + width]) continue;
      const gx = gray[index + 1] - gray[index - 1];
      const gy = gray[index + width] - gray[index - width];
      if (Math.hypot(gx, gy) >= gradientThreshold) gradientFlags[index] = 1;
    }
  }

  const dark = connectedComponents(darkFlags, width, height);
  const gradient = connectedComponents(gradientFlags, width, height);
  const features = [];

  for (const component of dark.components) {
    if (features.length >= maximumFeatures) break;
    let sumX = 0, sumY = 0;
    for (const pixel of component.pixels) {
      sumX += pixel % width;
      sumY += Math.floor(pixel / width);
    }
    features.push({
      id: `dark-patch-${component.id}`,
      kind: 'dark_patch_candidate',
      pixelCount: component.pixels.length,
      centroid: [sumX / component.pixels.length / width, sumY / component.pixels.length / height],
      reviewState: 'candidate'
    });
  }

  for (const component of gradient.components) {
    if (features.length >= maximumFeatures) break;
    let sumX = 0, sumY = 0, minX = width, minY = height, maxX = -1, maxY = -1;
    for (const pixel of component.pixels) {
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      sumX += x;
      sumY += y;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const count = component.pixels.length;
    const widthExtent = maxX - minX + 1;
    const heightExtent = maxY - minY + 1;
    const elongation = Math.max(widthExtent, heightExtent) / Math.max(1, Math.min(widthExtent, heightExtent));
    features.push({
      id: `gradient-feature-${component.id}`,
      kind: elongation >= 3 ? 'crack_or_ridge_candidate' : 'texture_feature_candidate',
      pixelCount: count,
      centroid: [sumX / count / width, sumY / count / height],
      bounds: { minX: minX / width, minY: minY / height, maxX: maxX / width, maxY: maxY / height },
      elongation,
      reviewState: 'candidate'
    });
  }

  return {
    status: 'completed',
    method: 'darkness and image-gradient connected components; candidates require review',
    settings: { darkThreshold, gradientThreshold, maximumFeatures },
    featureCount: features.length,
    features,
    interpretation: 'Dark patches are not holes; gradient features are not confirmed cracks or ridges without review'
  };
}

export function labFeatureGraph(features, maximumDistance = 0.15) {
  if (!Array.isArray(features)) {
    return { status: 'unavailable', reason: 'A feature array is required' };
  }
  const nodes = features.map((feature, index) => ({
    id: feature.id || `feature-${index}`,
    kind: feature.kind,
    position: feature.centroid,
    reviewState: feature.reviewState || 'candidate'
  }));
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const distance = Math.hypot(nodes[i].position[0] - nodes[j].position[0], nodes[i].position[1] - nodes[j].position[1]);
      if (distance <= maximumDistance) {
        edges.push({ source: nodes[i].id, target: nodes[j].id, distance, relationship: 'proximity' });
      }
    }
  }
  return {
    status: 'completed',
    method: 'proximity graph between candidate feature centroids',
    maximumDistance,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges,
    interpretation: 'Spatial relationship graph; not a biological interaction or anatomical network'
  };
}
