import { bench, group, run } from "mitata";
import {
  quatIdentity,
  quat,
  quatClone,
  quatFromAxisAngle,
  quatFromEuler,
  quatMultiply,
  quatRotateX,
  quatRotateY,
  quatRotateZ,
  quatNormalize,
  quatInvert,
  quatSlerp,
  quatToMat4,
  quatRotateVec3,
  quatGetAxisAngle,
  quatEquals,
  quatDot,
  quatLength,
  quatToFloat32Array,
  quatCopyMut,
  quatIdentityMut,
  quatMultiplyMut,
  quatNormalizeMut,
  quatSlerpMut,
  quatToMat4Mut,
} from "../../src/core/math/quat";
import { mat4Zero } from "../../src/core/math/mat4";
import type { Quat } from "../../src/core/math/quat";
import type { Vec3 } from "../../src/core/math/vec3";

// Pre-allocated data
const qa: Quat = [0.1, 0.2, 0.3, 0.9];
const qb: Quat = [0.5, -0.3, 0.1, 0.8];
const outQ: Quat = [0, 0, 0, 1];
const outMat = mat4Zero();
const axis: Vec3 = [0, 1, 0];
const v: Vec3 = [1.0, 2.0, 3.0];

// -- Creation --

group("quat creation", () => {
  bench("quatIdentity", () => quatIdentity());
  bench("quat(x, y, z, w)", () => quat(0.1, 0.2, 0.3, 0.9));
  bench("quatClone", () => quatClone(qa));
});

// -- From* constructors --

group("quat constructors", () => {
  bench("quatFromAxisAngle", () => quatFromAxisAngle(axis, 1.2));
  bench("quatFromEuler", () => quatFromEuler(0.5, 1.0, -0.3));
});

// -- Multiplication --

group("quatMultiply: immutable vs mutable", () => {
  bench("quatMultiply (immutable)", () => quatMultiply(qa, qb));
  bench("quatMultiplyMut (mutable)", () => quatMultiplyMut(outQ, qa, qb));
});

// -- Rotation --

group("quat rotation", () => {
  bench("quatRotateX", () => quatRotateX(qa, 0.5));
  bench("quatRotateY", () => quatRotateY(qa, 0.5));
  bench("quatRotateZ", () => quatRotateZ(qa, 0.5));
});

// -- Normalize: immutable vs mutable --

group("quatNormalize: immutable vs mutable", () => {
  bench("quatNormalize (immutable)", () => quatNormalize(qa));
  bench("quatNormalizeMut (mutable)", () => quatNormalizeMut(outQ, qa));
});

// -- Slerp: immutable vs mutable --

group("quatSlerp: immutable vs mutable", () => {
  bench("quatSlerp (immutable)", () => quatSlerp(qa, qb, 0.5));
  bench("quatSlerpMut (mutable)", () => quatSlerpMut(outQ, qa, qb, 0.5));
});

// -- Inversion --

group("quat inversion", () => {
  bench("quatInvert", () => quatInvert(qa));
});

// -- Conversion --

group("quatToMat4: immutable vs mutable", () => {
  bench("quatToMat4 (immutable)", () => quatToMat4(qa));
  bench("quatToMat4Mut (mutable)", () => quatToMat4Mut(outMat, qa));
});

// -- Vector rotation --

group("quat vector operations", () => {
  bench("quatRotateVec3", () => quatRotateVec3(qa, v));
});

// -- Extraction & query --

group("quat extraction & query", () => {
  bench("quatGetAxisAngle", () => quatGetAxisAngle(qa));
  bench("quatDot", () => quatDot(qa, qb));
  bench("quatLength", () => quatLength(qa));
  bench("quatEquals", () => quatEquals(qa, qb));
});

// -- Copy & conversion --

group("quat copy & conversion", () => {
  bench("quatCopyMut", () => quatCopyMut(outQ, qa));
  bench("quatIdentityMut", () => quatIdentityMut(outQ));
  bench("quatToFloat32Array", () => quatToFloat32Array(qa));
});

await run();
