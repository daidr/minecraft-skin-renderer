/**
 * Quaternion operations for rotations
 * Stored as [x, y, z, w]
 */

import type { Mat4 } from "./mat4";
import type { Vec3 } from "./vec3";

export type Quat = [number, number, number, number];

/** Create an identity quaternion */
export function quatIdentity(): Quat {
  return [0, 0, 0, 1];
}

/** Create a quaternion from components */
export function quat(x: number, y: number, z: number, w: number): Quat {
  return [x, y, z, w];
}

/** Clone a quaternion */
export function quatClone(q: Quat): Quat {
  return [q[0], q[1], q[2], q[3]];
}

/** Create quaternion from axis and angle */
export function quatFromAxisAngle(axis: Vec3, rad: number): Quat {
  const halfAngle = rad / 2;
  const s = Math.sin(halfAngle);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(halfAngle)];
}

/** Create quaternion from Euler angles (XYZ order) */
export function quatFromEuler(x: number, y: number, z: number): Quat {
  const halfX = x / 2;
  const halfY = y / 2;
  const halfZ = z / 2;

  const sx = Math.sin(halfX);
  const cx = Math.cos(halfX);
  const sy = Math.sin(halfY);
  const cy = Math.cos(halfY);
  const sz = Math.sin(halfZ);
  const cz = Math.cos(halfZ);

  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz,
  ];
}

/** Multiply two quaternions */
export function quatMultiply(a: Quat, b: Quat): Quat {
  return quatMultiplyMut([0, 0, 0, 0], a, b);
}

/** Rotate quaternion around X axis */
export function quatRotateX(q: Quat, rad: number): Quat {
  const h = rad / 2;
  return quatMultiply(q, [Math.sin(h), 0, 0, Math.cos(h)]);
}

/** Rotate quaternion around Y axis */
export function quatRotateY(q: Quat, rad: number): Quat {
  const h = rad / 2;
  return quatMultiply(q, [0, Math.sin(h), 0, Math.cos(h)]);
}

/** Rotate quaternion around Z axis */
export function quatRotateZ(q: Quat, rad: number): Quat {
  const h = rad / 2;
  return quatMultiply(q, [0, 0, Math.sin(h), Math.cos(h)]);
}

/** Normalize a quaternion */
export function quatNormalize(q: Quat): Quat {
  return quatNormalizeMut([0, 0, 0, 0], q);
}

/** Invert (conjugate) a quaternion */
export function quatInvert(q: Quat): Quat {
  const dot = quatDot(q, q);
  if (dot === 0) return [0, 0, 0, 0];
  const invDot = 1.0 / dot;
  return [-q[0] * invDot, -q[1] * invDot, -q[2] * invDot, q[3] * invDot];
}

/** Spherical linear interpolation between two quaternions */
export function quatSlerp(a: Quat, b: Quat, t: number): Quat {
  return quatSlerpMut([0, 0, 0, 0], a, b, t);
}

/** Convert quaternion to 4x4 rotation matrix */
export function quatToMat4(q: Quat): Mat4 {
  return quatToMat4Mut(new Float32Array(16), q);
}

/** Rotate a vector by a quaternion */
export function quatRotateVec3(q: Quat, v: Vec3): Vec3 {
  const qx = q[0],
    qy = q[1],
    qz = q[2],
    qw = q[3];
  const x = v[0],
    y = v[1],
    z = v[2];

  // Calculate quat * vec
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;

  // Calculate result * inverse quat
  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx,
  ];
}

/** Get axis and angle from quaternion */
export function quatGetAxisAngle(q: Quat): { axis: Vec3; angle: number } {
  const rad = Math.acos(q[3]) * 2;
  const s = Math.sin(rad / 2);

  if (s > 0.000_001) {
    return {
      axis: [q[0] / s, q[1] / s, q[2] / s],
      angle: rad,
    };
  }

  // If s is close to zero, return arbitrary axis
  return {
    axis: [1, 0, 0],
    angle: rad,
  };
}

/** Check if two quaternions are equal (within epsilon) */
export function quatEquals(a: Quat, b: Quat, epsilon = 0.000_001): boolean {
  return (
    Math.abs(a[0] - b[0]) < epsilon &&
    Math.abs(a[1] - b[1]) < epsilon &&
    Math.abs(a[2] - b[2]) < epsilon &&
    Math.abs(a[3] - b[3]) < epsilon
  );
}

/** Dot product of two quaternions */
export function quatDot(a: Quat, b: Quat): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

/** Length (magnitude) of a quaternion */
export function quatLength(q: Quat): number {
  return Math.sqrt(quatDot(q, q));
}

/** Convert quaternion to Float32Array */
export function quatToFloat32Array(q: Quat): Float32Array {
  return new Float32Array(q);
}

// ============================================================================
// Mutable versions (for performance-critical paths)
// These functions modify the output parameter instead of creating new objects
// ============================================================================

/** Copy quaternion (mutable) */
export function quatCopyMut(out: Quat, q: Quat): Quat {
  out[0] = q[0];
  out[1] = q[1];
  out[2] = q[2];
  out[3] = q[3];
  return out;
}

/** Set quaternion to identity (mutable) */
export function quatIdentityMut(out: Quat): Quat {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}

/** Multiply two quaternions (mutable) */
export function quatMultiplyMut(out: Quat, a: Quat, b: Quat): Quat {
  const ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  const bx = b[0],
    by = b[1],
    bz = b[2],
    bw = b[3];

  out[0] = ax * bw + aw * bx + ay * bz - az * by;
  out[1] = ay * bw + aw * by + az * bx - ax * bz;
  out[2] = az * bw + aw * bz + ax * by - ay * bx;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;

  return out;
}

/** Normalize a quaternion (mutable) */
export function quatNormalizeMut(out: Quat, q: Quat): Quat {
  const len = quatLength(q);
  if (len === 0) {
    return quatIdentityMut(out);
  }
  const invLen = 1 / len;
  out[0] = q[0] * invLen; out[1] = q[1] * invLen;
  out[2] = q[2] * invLen; out[3] = q[3] * invLen;
  return out;
}

/** Spherical linear interpolation between two quaternions (mutable) */
export function quatSlerpMut(out: Quat, a: Quat, b: Quat, t: number): Quat {
  const ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  let bx = b[0],
    by = b[1],
    bz = b[2],
    bw = b[3];

  let cosom = ax * bx + ay * by + az * bz + aw * bw;

  // Adjust signs (if necessary)
  if (cosom < 0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }

  let scale0: number;
  let scale1: number;

  if (1 - cosom > 0.000_001) {
    // Standard case (slerp)
    const omega = Math.acos(cosom);
    const sinom = Math.sin(omega);
    scale0 = Math.sin((1 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    // "from" and "to" quaternions are very close, do linear interpolation
    scale0 = 1 - t;
    scale1 = t;
  }

  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;

  return out;
}

/** Convert quaternion to 4x4 rotation matrix (mutable) */
export function quatToMat4Mut(out: Mat4, q: Quat): Mat4 {
  const x = q[0], y = q[1], z = q[2], w = q[3];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, yx = y * x2, yy = y * y2;
  const zx = z * x2, zy = z * y2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;

  out.fill(0);
  out[0] = 1 - yy - zz; out[1] = yx + wz; out[2] = zx - wy;
  out[4] = yx - wz; out[5] = 1 - xx - zz; out[6] = zy + wx;
  out[8] = zx + wy; out[9] = zy - wx; out[10] = 1 - xx - yy;
  out[15] = 1;

  return out;
}
