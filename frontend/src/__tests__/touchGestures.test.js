import { describe, it, expect } from 'vitest';

// Euclidean distance gesture detection (AGENTS.md compliant)
function detectGesture(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;

  // Euclidean distance < 10 → TAP
  if (Math.hypot(dx, dy) < 10) {
    return 'tap';
  }

  // Horizontal swipe threshold > 50px
  if (Math.abs(dx) > 50) {
    return dx > 0 ? 'swipe-right' : 'swipe-left';
  }

  return 'none';
}

describe('Touch Gesture Detection (Euclidean)', () => {
  it('should detect a tap when distance < 10', () => {
    expect(detectGesture(100, 200, 103, 204)).toBe('tap');
    expect(detectGesture(100, 200, 100, 200)).toBe('tap');
  });

  it('should not detect a tap when distance >= 10', () => {
    expect(detectGesture(100, 200, 115, 200)).not.toBe('tap');
  });

  it('should detect swipe-left', () => {
    expect(detectGesture(300, 200, 200, 210)).toBe('swipe-left');
  });

  it('should detect swipe-right', () => {
    expect(detectGesture(100, 200, 200, 210)).toBe('swipe-right');
  });

  it('should return none for small vertical drags', () => {
    expect(detectGesture(100, 200, 110, 280)).toBe('none');
  });

  it('should handle diagonal movement correctly', () => {
    // Diagonal movement > 10 but dx < 50 → none
    expect(detectGesture(100, 100, 130, 130)).toBe('none');
  });

  it('should handle exact boundary (distance = 10)', () => {
    // Math.hypot(6, 8) = 10, which is NOT < 10, so not a tap
    expect(detectGesture(100, 100, 106, 108)).not.toBe('tap');
  });
});
