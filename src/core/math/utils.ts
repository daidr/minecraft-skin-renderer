/**
 * Math utility functions
 */

/** Convert degrees to radians */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Convert radians to degrees */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Smooth step interpolation */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Check if a number is approximately zero */
export function isZero(value: number, epsilon = 0.000_001): boolean {
  return Math.abs(value) < epsilon;
}

/** Check if two numbers are approximately equal */
export function approxEquals(a: number, b: number, epsilon = 0.000_001): boolean {
  return isZero(a - b, epsilon);
}

/** Map a value from one range to another */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/** Wrap a value to stay within a range (like modulo but handles negatives) */
export function wrap(value: number, min: number, max: number): number {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}

/** Check if a value is a power of two */
export function isPowerOfTwo(value: number): boolean {
  return value > 0 && (value & (value - 1)) === 0;
}

/** Get the next power of two >= value */
export function nextPowerOfTwo(value: number): number {
  return value <= 1 ? 1 : 1 << (32 - Math.clz32(value - 1));
}

/** Sign of a number (-1, 0, or 1) */
export function sign(value: number): number {
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}

/** Fractional part of a number */
export function fract(value: number): number {
  return value - Math.floor(value);
}

/** Generate a pseudo-random number using a seed */
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** PI constant */
export const PI = Math.PI;

/** Two PI (full circle) */
export const TWO_PI = Math.PI * 2;

/** Half PI (quarter circle) */
export const HALF_PI = Math.PI / 2;

/** Small number for floating point comparisons */
export const EPSILON = 0.000_001;
