/**
 * Easing functions for animations
 */

import type { EasingFunction } from "./types";

/** Linear interpolation (no easing) */
export const linear: EasingFunction = (t) => t;

/** Ease in quadratic */
export const easeInQuad: EasingFunction = (t) => t * t;

/** Ease out quadratic */
export const easeOutQuad: EasingFunction = (t) => t * (2 - t);

/** Ease in-out quadratic */
export const easeInOutQuad: EasingFunction = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

/** Ease in cubic */
export const easeInCubic: EasingFunction = (t) => t * t * t;

/** Ease out cubic */
export const easeOutCubic: EasingFunction = (t) => {
  const t1 = t - 1;
  return t1 * t1 * t1 + 1;
};

/** Ease in-out cubic */
export const easeInOutCubic: EasingFunction = (t) =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

/** Ease in sine */
export const easeInSine: EasingFunction = (t) => 1 - Math.cos((t * Math.PI) / 2);

/** Ease out sine */
export const easeOutSine: EasingFunction = (t) => Math.sin((t * Math.PI) / 2);

/** Ease in-out sine */
export const easeInOutSine: EasingFunction = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Smooth sine wave (for looping animations) */
export const sineWave: EasingFunction = (t) => Math.sin(t * Math.PI * 2);

/** Half sine wave (0 to 1 to 0) */
export const halfSine: EasingFunction = (t) => Math.sin(t * Math.PI);

/** Bounce effect */
export const bounce: EasingFunction = (t) => {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  } else if (t < 2 / 2.75) {
    const t2 = t - 1.5 / 2.75;
    return 7.5625 * t2 * t2 + 0.75;
  } else if (t < 2.5 / 2.75) {
    const t2 = t - 2.25 / 2.75;
    return 7.5625 * t2 * t2 + 0.9375;
  } else {
    const t2 = t - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  }
};

/** Elastic bounce */
export const elastic: EasingFunction = (t) => {
  if (t === 0 || t === 1) return t;
  const p = 0.3;
  const s = p / 4;
  return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
};
