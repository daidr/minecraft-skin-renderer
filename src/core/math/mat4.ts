/**
 * 4x4 Matrix operations (column-major order, compatible with WebGL/WebGPU)
 * Stored as Float32Array for direct GPU upload
 */

import type { Vec3 } from "./vec3";

export type Mat4 = Float32Array;

/** Create an identity matrix */
export function mat4Identity(): Mat4 {
  // prettier-ignore
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ])
}

/** Create a zero matrix */
export function mat4Zero(): Mat4 {
  return new Float32Array(16);
}

/** Clone a matrix */
export function mat4Clone(m: Mat4): Mat4 {
  return new Float32Array(m);
}

/** Copy matrix a to matrix out */
export function mat4Copy(out: Mat4, a: Mat4): Mat4 {
  out.set(a);
  return out;
}

/** Multiply two matrices: out = a * b */
export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);

  const a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  const a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  const a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  const a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];

  let b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  return out;
}

/** Create a translation matrix */
export function mat4FromTranslation(v: Vec3): Mat4 {
  // prettier-ignore
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    v[0], v[1], v[2], 1,
  ])
}

/** Create a scaling matrix */
export function mat4FromScaling(v: Vec3): Mat4 {
  // prettier-ignore
  return new Float32Array([
    v[0], 0, 0, 0,
    0, v[1], 0, 0,
    0, 0, v[2], 0,
    0, 0, 0, 1,
  ])
}

/** Create a rotation matrix around X axis */
export function mat4FromRotationX(rad: number): Mat4 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  // prettier-ignore
  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ])
}

/** Create a rotation matrix around Y axis */
export function mat4FromRotationY(rad: number): Mat4 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  // prettier-ignore
  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ])
}

/** Create a rotation matrix around Z axis */
export function mat4FromRotationZ(rad: number): Mat4 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  // prettier-ignore
  return new Float32Array([
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ])
}

/** Translate a matrix by vector */
export function mat4Translate(m: Mat4, v: Vec3): Mat4 {
  const out = mat4Clone(m);
  const x = v[0],
    y = v[1],
    z = v[2];
  out[12] = m[0] * x + m[4] * y + m[8] * z + m[12];
  out[13] = m[1] * x + m[5] * y + m[9] * z + m[13];
  out[14] = m[2] * x + m[6] * y + m[10] * z + m[14];
  out[15] = m[3] * x + m[7] * y + m[11] * z + m[15];
  return out;
}

/** Scale a matrix by vector */
export function mat4Scale(m: Mat4, v: Vec3): Mat4 {
  const out = new Float32Array(16);
  const x = v[0],
    y = v[1],
    z = v[2];
  out[0] = m[0] * x;
  out[1] = m[1] * x;
  out[2] = m[2] * x;
  out[3] = m[3] * x;
  out[4] = m[4] * y;
  out[5] = m[5] * y;
  out[6] = m[6] * y;
  out[7] = m[7] * y;
  out[8] = m[8] * z;
  out[9] = m[9] * z;
  out[10] = m[10] * z;
  out[11] = m[11] * z;
  out[12] = m[12];
  out[13] = m[13];
  out[14] = m[14];
  out[15] = m[15];
  return out;
}

/** Rotate a matrix around X axis */
export function mat4RotateX(m: Mat4, rad: number): Mat4 {
  return mat4Multiply(m, mat4FromRotationX(rad));
}

/** Rotate a matrix around Y axis */
export function mat4RotateY(m: Mat4, rad: number): Mat4 {
  return mat4Multiply(m, mat4FromRotationY(rad));
}

/** Rotate a matrix around Z axis */
export function mat4RotateZ(m: Mat4, rad: number): Mat4 {
  return mat4Multiply(m, mat4FromRotationZ(rad));
}

/** Create a perspective projection matrix */
export function mat4Perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1.0 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);

  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

/** Create an orthographic projection matrix */
export function mat4Ortho(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
): Mat4 {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);

  // prettier-ignore
  return new Float32Array([
    -2 * lr, 0, 0, 0,
    0, -2 * bt, 0, 0,
    0, 0, 2 * nf, 0,
    (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1,
  ])
}

/** Create a look-at view matrix */
export function mat4LookAt(eye: Vec3, center: Vec3, up: Vec3): Mat4 {
  const x0 = eye[0],
    x1 = eye[1],
    x2 = eye[2];
  const u0 = up[0],
    u1 = up[1],
    u2 = up[2];
  const c0 = center[0],
    c1 = center[1],
    c2 = center[2];

  let z0 = x0 - c0;
  let z1 = x1 - c1;
  let z2 = x2 - c2;
  let len = z0 * z0 + z1 * z1 + z2 * z2;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    z0 *= len;
    z1 *= len;
    z2 *= len;
  }

  let y0 = u1 * z2 - u2 * z1;
  let y1 = u2 * z0 - u0 * z2;
  let y2 = u0 * z1 - u1 * z0;
  len = y0 * y0 + y1 * y1 + y2 * y2;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  const w0 = z1 * y2 - z2 * y1;
  const w1 = z2 * y0 - z0 * y2;
  const w2 = z0 * y1 - z1 * y0;

  // prettier-ignore
  return new Float32Array([
    y0, w0, z0, 0,
    y1, w1, z1, 0,
    y2, w2, z2, 0,
    -(y0 * x0 + y1 * x1 + y2 * x2),
    -(w0 * x0 + w1 * x1 + w2 * x2),
    -(z0 * x0 + z1 * x1 + z2 * x2),
    1,
  ])
}

/** Invert a matrix */
export function mat4Invert(m: Mat4): Mat4 | null {
  const a00 = m[0],
    a01 = m[1],
    a02 = m[2],
    a03 = m[3];
  const a10 = m[4],
    a11 = m[5],
    a12 = m[6],
    a13 = m[7];
  const a20 = m[8],
    a21 = m[9],
    a22 = m[10],
    a23 = m[11];
  const a30 = m[12],
    a31 = m[13],
    a32 = m[14],
    a33 = m[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }
  det = 1.0 / det;

  // prettier-ignore
  return new Float32Array([
    (a11 * b11 - a12 * b10 + a13 * b09) * det,
    (a02 * b10 - a01 * b11 - a03 * b09) * det,
    (a31 * b05 - a32 * b04 + a33 * b03) * det,
    (a22 * b04 - a21 * b05 - a23 * b03) * det,
    (a12 * b08 - a10 * b11 - a13 * b07) * det,
    (a00 * b11 - a02 * b08 + a03 * b07) * det,
    (a32 * b02 - a30 * b05 - a33 * b01) * det,
    (a20 * b05 - a22 * b02 + a23 * b01) * det,
    (a10 * b10 - a11 * b08 + a13 * b06) * det,
    (a01 * b08 - a00 * b10 - a03 * b06) * det,
    (a30 * b04 - a31 * b02 + a33 * b00) * det,
    (a21 * b02 - a20 * b04 - a23 * b00) * det,
    (a11 * b07 - a10 * b09 - a12 * b06) * det,
    (a00 * b09 - a01 * b07 + a02 * b06) * det,
    (a31 * b01 - a30 * b03 - a32 * b00) * det,
    (a20 * b03 - a21 * b01 + a22 * b00) * det,
  ])
}

/** Transpose a matrix */
export function mat4Transpose(m: Mat4): Mat4 {
  // prettier-ignore
  return new Float32Array([
    m[0], m[4], m[8], m[12],
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15],
  ])
}

/** Get the translation component of a matrix */
export function mat4GetTranslation(m: Mat4): Vec3 {
  return [m[12], m[13], m[14]];
}

/** Get the scaling component of a matrix */
export function mat4GetScaling(m: Mat4): Vec3 {
  return [
    Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]),
    Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6]),
    Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10]),
  ];
}
