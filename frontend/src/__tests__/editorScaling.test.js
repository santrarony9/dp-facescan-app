import { describe, it, expect } from 'vitest';

// Canvas scale synchronization logic
function computeScaleFactor(srcW, srcH, containerW, containerH) {
  return Math.min(containerW / srcW, containerH / srcH);
}

function computeDrawBounds(srcW, srcH, scaleFactor) {
  return {
    drawW: srcW * scaleFactor,
    drawH: srcH * scaleFactor,
  };
}

// AI pre-scaling logic
function preScaleDimensions(width, height, maxDim = 1024) {
  if (width <= maxDim && height <= maxDim) return { width, height };
  const ratio = Math.min(maxDim / width, maxDim / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

describe('Editor Canvas Scaling', () => {
  it('should compute correct scale factor for landscape image', () => {
    const sf = computeScaleFactor(1920, 1080, 800, 600);
    expect(sf).toBeCloseTo(800 / 1920);
  });

  it('should compute correct scale factor for portrait image', () => {
    const sf = computeScaleFactor(1080, 1920, 800, 600);
    expect(sf).toBeCloseTo(600 / 1920);
  });

  it('should maintain symmetric draw bounds', () => {
    const sf = computeScaleFactor(2000, 1500, 800, 600);
    const { drawW, drawH } = computeDrawBounds(2000, 1500, sf);
    expect(drawW / drawH).toBeCloseTo(2000 / 1500);
  });

  it('should not upscale small images beyond container', () => {
    const sf = computeScaleFactor(400, 300, 800, 600);
    expect(sf).toBeLessThanOrEqual(2);
  });
});

describe('AI Pre-scaling (max 1024px)', () => {
  it('should not change dimensions under 1024', () => {
    const { width, height } = preScaleDimensions(800, 600);
    expect(width).toBe(800);
    expect(height).toBe(600);
  });

  it('should scale down large landscape image', () => {
    const { width, height } = preScaleDimensions(4000, 3000);
    expect(width).toBeLessThanOrEqual(1024);
    expect(height).toBeLessThanOrEqual(1024);
  });

  it('should scale down large portrait image', () => {
    const { width, height } = preScaleDimensions(3000, 4000);
    expect(width).toBeLessThanOrEqual(1024);
    expect(height).toBeLessThanOrEqual(1024);
  });

  it('should maintain aspect ratio', () => {
    const { width, height } = preScaleDimensions(4000, 2000);
    expect(width / height).toBeCloseTo(4000 / 2000, 1);
  });
});
