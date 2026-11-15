/* Shell Field advanced colour and spatial organization.
 * Image-derived colour analysis. Photographic colour is uncalibrated.
 */

export const LAB_COLOUR_ADVANCED_VERSION = '1.0.0';

function srgbToLinear(value) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function labRgbToCielab(r, g, b) {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  const x = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) / 0.95047;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl;
  const z = (0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl) / 1.08883;
  const f = (value) => value > 0.008856 ? Math.cbrt(value) : (7.787 * value + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

export function labCielabDeltaE76(first, second) {
  return Math.hypot(first.l - second.l, first.a - second.a, first.b - second.b);
}

function regionKey(r, g, b, bins) {
  const width = 256 / bins;
  return `${Math.min(bins - 1, Math.floor(r / width))}-${Math.min(bins - 1, Math.floor(g / width))}-${Math.min(bins - 1, Math.floor(b / width))}`;
}

export function labColourSegmentation(rgba, mask, width, height, options = {}) {
  const bins = options.bins || 8;
  const minimumPixels = options.minimumPixels || 16;
  const maximumRegions = options.maximumRegions || 32;

  if (!rgba || !mask || !(width > 0) || !(height > 0)) {
    return { status: 'unavailable', reason: 'Image pixels, mask, and dimensions are required' };
  }

  const labels = new Int32Array(width * height).fill(-1);
  const queue = [];
  const regions = [];
  let nextLabel = 0;
  let maskedPixels = 0;
  for (let index = 0; index < mask.length; index++) if (mask[index]) maskedPixels++;

  for (let index = 0; index < mask.length; index++) {
    if (!mask[index] || labels[index] !== -1) continue;
    const key = regionKey(rgba[index * 4], rgba[index * 4 + 1], rgba[index * 4 + 2], bins);
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
        if (!mask[neighbour] || labels[neighbour] !== -1) continue;
        const neighbourKey = regionKey(rgba[neighbour * 4], rgba[neighbour * 4 + 1], rgba[neighbour * 4 + 2], bins);
        if (neighbourKey !== key) continue;
        labels[neighbour] = nextLabel;
        queue.push(neighbour);
      }
    }

    if (pixels.length >= minimumPixels) {
      let sumR = 0, sumG = 0, sumB = 0, sumX = 0, sumY = 0;
      let minX = width, minY = height, maxX = -1, maxY = -1;
      for (const pixel of pixels) {
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        sumR += rgba[pixel * 4];
        sumG += rgba[pixel * 4 + 1];
        sumB += rgba[pixel * 4 + 2];
        sumX += x;
        sumY += y;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
      const count = pixels.length;
      const meanLab = labRgbToCielab(sumR / count, sumG / count, sumB / count);
      regions.push({
        id: nextLabel,
        quantizationKey: key,
        pixelCount: count,
        areaFraction: maskedPixels ? count / maskedPixels : 0,
        centroid: [sumX / count / width, sumY / count / height],
        bounds: { minX: minX / width, minY: minY / height, maxX: maxX / width, maxY: maxY / height },
        meanRGB: [sumR / count, sumG / count, sumB / count],
        meanCIELAB: meanLab
      });
      nextLabel++;
    } else {
      for (const pixel of pixels) labels[pixel] = -2;
    }

    if (regions.length >= maximumRegions) break;
  }

  const retainedArea = regions.reduce((total, region) => total + region.pixelCount, 0);

  return {
    status: 'completed',
    binsPerChannel: bins,
    minimumPixels,
    maximumRegions,
    regionCount: regions.length,
    smallRegionCount: Math.max(0, nextLabel - regions.length),
    retainedAreaFraction: maskedPixels ? retainedArea / maskedPixels : 0,
    labels,
    regions
  };
}

export function labCentreMarginComparison(rgba, mask, width, height) {
  if (!rgba || !mask || !(width > 0) || !(height > 0)) {
    return { status: 'unavailable', reason: 'Image pixels, mask, and dimensions are required' };
  }

  let count = 0, sumX = 0, sumY = 0;
  for (let index = 0; index < mask.length; index++) {
    if (!mask[index]) continue;
    count++;
    sumX += index % width;
    sumY += Math.floor(index / width);
  }
  if (!count) return { status: 'unavailable', reason: 'The mask contains no analysed pixels' };

  const centroid = [sumX / count, sumY / count];
  const distances = [];
  for (let index = 0; index < mask.length; index++) {
    if (!mask[index]) continue;
    distances.push(Math.hypot(index % width - centroid[0], Math.floor(index / width) - centroid[1]));
  }
  distances.sort((a, b) => a - b);
  const centreRadius = distances[Math.floor(distances.length * 0.33)];
  const marginRadius = distances[Math.floor(distances.length * 0.67)];

  const accumulate = (predicate) => {
    let n = 0, l = 0, a = 0, b = 0;
    for (let index = 0; index < mask.length; index++) {
      if (!mask[index]) continue;
      const distance = Math.hypot(index % width - centroid[0], Math.floor(index / width) - centroid[1]);
      if (!predicate(distance)) continue;
      const sample = labRgbToCielab(rgba[index * 4], rgba[index * 4 + 1], rgba[index * 4 + 2]);
      n++; l += sample.l; a += sample.a; b += sample.b;
    }
    return n ? { pixelCount: n, meanCIELAB: { l: l / n, a: a / n, b: b / n } } : null;
  };

  const centre = accumulate((distance) => distance <= centreRadius);
  const margin = accumulate((distance) => distance >= marginRadius);
  if (!centre || !margin) {
    return { status: 'unavailable', reason: 'Not enough masked pixels for centre and margin regions' };
  }

  return {
    status: 'completed',
    method: 'radial centroid-distance terciles; image-space, not anatomical zones',
    centroid: [centroid[0] / width, centroid[1] / height],
    centreRadius: centreRadius / Math.min(width, height),
    marginRadius: marginRadius / Math.min(width, height),
    centre,
    margin,
    centreMarginDeltaE76: labCielabDeltaE76(centre.meanCIELAB, margin.meanCIELAB)
  };
}

export function labRepeatingBands(rgba, mask, width, height, axis, samples = 50) {
  if (!Array.isArray(axis) || axis.length !== 2) {
    return { status: 'unavailable', reason: 'A base-tip axis is required' };
  }

  const values = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const x = Math.round(axis[0][0] + (axis[1][0] - axis[0][0]) * t);
    const y = Math.round(axis[0][1] + (axis[1][1] - axis[0][1]) * t);
    if (x < 0 || y < 0 || x >= width || y >= height) {
      values.push(null);
      continue;
    }
    const index = y * width + x;
    if (!mask[index]) {
      values.push(null);
      continue;
    }
    const sample = labRgbToCielab(rgba[index * 4], rgba[index * 4 + 1], rgba[index * 4 + 2]);
    values.push({ position: t, cielab: sample });
  }

  const valid = values.filter(Boolean);
  if (valid.length < 4) {
    return { status: 'unavailable', reason: 'Not enough valid samples along the chosen axis' };
  }

  const lightness = valid.map((sample) => sample.cielab.l);
  const mean = lightness.reduce((a, b) => a + b, 0) / lightness.length;
  const crossings = [];
  for (let i = 1; i < lightness.length; i++) {
    const previous = lightness[i - 1] - mean;
    const current = lightness[i] - mean;
    if ((previous < 0 && current >= 0) || (previous >= 0 && current < 0)) {
      crossings.push(valid[i].position);
    }
  }

  const spacings = crossings.slice(1).map((value, index) => value - crossings[index]);
  return {
    status: 'completed',
    method: 'lightness mean-crossing candidates along saved base-tip axis; not growth-ring validation',
    samples,
    validSamples: valid.length,
    crossingPositions: crossings,
    candidateBandCount: Math.max(0, crossings.length - 1),
    meanSpacing: spacings.length ? spacings.reduce((a, b) => a + b, 0) / spacings.length : null,
    spacingValues: spacings
  };
}
