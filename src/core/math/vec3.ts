/**
 * 3D Vector operations
 * All functions are immutable and return new arrays
 */

export type Vec3 = [number, number, number];

/** Create a zero vector */
export function vec3Zero(): Vec3 {
  return [0, 0, 0];
}

/** Create a vector from components */
export function vec3(x: number, y: number, z: number): Vec3 {
  return [x, y, z];
}

/** Clone a vector */
export function vec3Clone(v: Vec3): Vec3 {
  return [v[0], v[1], v[2]];
}

/** Add two vectors */
export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Subtract two vectors */
export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Multiply vector by scalar */
export function vec3Scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

/** Multiply two vectors component-wise */
export function vec3Mul(a: Vec3, b: Vec3): Vec3 {
  return [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
}

/** Dot product of two vectors */
export function vec3Dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Cross product of two vectors */
export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Length (magnitude) of a vector */
export function vec3Length(v: Vec3): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/** Squared length of a vector (avoids sqrt) */
export function vec3LengthSq(v: Vec3): number {
  return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
}

/** Normalize a vector */
export function vec3Normalize(v: Vec3): Vec3 {
  const len = vec3Length(v);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

/** Negate a vector */
export function vec3Negate(v: Vec3): Vec3 {
  return [-v[0], -v[1], -v[2]];
}

/** Linear interpolation between two vectors */
export function vec3Lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Distance between two vectors */
export function vec3Distance(a: Vec3, b: Vec3): number {
  return vec3Length(vec3Sub(a, b));
}

/** Check if two vectors are equal (within epsilon) */
export function vec3Equals(a: Vec3, b: Vec3, epsilon = 0.000_001): boolean {
  return (
    Math.abs(a[0] - b[0]) < epsilon &&
    Math.abs(a[1] - b[1]) < epsilon &&
    Math.abs(a[2] - b[2]) < epsilon
  );
}

/** Transform a vec3 by a 4x4 matrix (assumes w=1) */
export function vec3TransformMat4(v: Vec3, m: Float32Array): Vec3 {
  const x = v[0];
  const y = v[1];
  const z = v[2];
  const w = m[3] * x + m[7] * y + m[11] * z + m[15];
  return [
    (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
    (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
    (m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
  ];
}

/** Convert Vec3 to Float32Array */
export function vec3ToFloat32Array(v: Vec3): Float32Array {
  return new Float32Array(v);
}

// ============================================================================
// Mutable versions (for performance-critical paths)
// These functions modify the output parameter instead of creating new objects
// ============================================================================

/** Add two vectors (mutable) */
export function vec3AddMut(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}

/** Subtract two vectors (mutable) */
export function vec3SubMut(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}

/** Multiply vector by scalar (mutable) */
export function vec3ScaleMut(out: Vec3, v: Vec3, s: number): Vec3 {
  out[0] = v[0] * s;
  out[1] = v[1] * s;
  out[2] = v[2] * s;
  return out;
}

/** Linear interpolation between two vectors (mutable) */
export function vec3LerpMut(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3 {
  out[0] = a[0] + (b[0] - a[0]) * t;
  out[1] = a[1] + (b[1] - a[1]) * t;
  out[2] = a[2] + (b[2] - a[2]) * t;
  return out;
}

/** Normalize a vector (mutable) */
export function vec3NormalizeMut(out: Vec3, v: Vec3): Vec3 {
  const len = vec3Length(v);
  if (len === 0) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  } else {
    out[0] = v[0] / len;
    out[1] = v[1] / len;
    out[2] = v[2] / len;
  }
  return out;
}

/** Cross product of two vectors (mutable) */
export function vec3CrossMut(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out[0] = a[1] * b[2] - a[2] * b[1];
  out[1] = a[2] * b[0] - a[0] * b[2];
  out[2] = a[0] * b[1] - a[1] * b[0];
  return out;
}

/** Copy vector (mutable) */
export function vec3CopyMut(out: Vec3, v: Vec3): Vec3 {
  out[0] = v[0];
  out[1] = v[1];
  out[2] = v[2];
  return out;
}

/** Set vector to zero (mutable) */
export function vec3ZeroMut(out: Vec3): Vec3 {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  return out;
}
