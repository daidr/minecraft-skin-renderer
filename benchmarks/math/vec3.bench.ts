import { bench, group, run } from "mitata";
import {
  vec3Zero,
  vec3,
  vec3Clone,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Mul,
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3LengthSq,
  vec3Normalize,
  vec3Negate,
  vec3Lerp,
  vec3Distance,
  vec3Equals,
  vec3TransformMat4,
  vec3ToFloat32Array,
  vec3AddMut,
  vec3SubMut,
  vec3ScaleMut,
  vec3LerpMut,
  vec3NormalizeMut,
  vec3CrossMut,
  vec3CopyMut,
  vec3ZeroMut,
} from "../../src/core/math/vec3";
import { mat4Identity } from "../../src/core/math/mat4";
import type { Vec3 } from "../../src/core/math/vec3";

// Pre-allocated data
const a: Vec3 = [1.5, 2.3, -3.7];
const b: Vec3 = [4.1, -0.8, 2.9];
const out: Vec3 = [0, 0, 0];
const m = mat4Identity();

// -- Creation --

group("vec3 creation", () => {
  bench("vec3Zero", () => vec3Zero());
  bench("vec3(x, y, z)", () => vec3(1.5, 2.3, -3.7));
  bench("vec3Clone", () => vec3Clone(a));
});

// -- Arithmetic (immutable) --

group("vec3 arithmetic (immutable)", () => {
  bench("vec3Add", () => vec3Add(a, b));
  bench("vec3Sub", () => vec3Sub(a, b));
  bench("vec3Scale", () => vec3Scale(a, 2.5));
  bench("vec3Mul", () => vec3Mul(a, b));
  bench("vec3Negate", () => vec3Negate(a));
});

// -- Arithmetic (mutable) --

group("vec3 arithmetic (mutable)", () => {
  bench("vec3AddMut", () => vec3AddMut(out, a, b));
  bench("vec3SubMut", () => vec3SubMut(out, a, b));
  bench("vec3ScaleMut", () => vec3ScaleMut(out, a, 2.5));
  bench("vec3CopyMut", () => vec3CopyMut(out, a));
  bench("vec3ZeroMut", () => vec3ZeroMut(out));
});

// -- Immutable vs Mutable comparison --

group("vec3Add: immutable vs mutable", () => {
  bench("vec3Add (immutable)", () => vec3Add(a, b));
  bench("vec3AddMut (mutable)", () => vec3AddMut(out, a, b));
});

group("vec3Sub: immutable vs mutable", () => {
  bench("vec3Sub (immutable)", () => vec3Sub(a, b));
  bench("vec3SubMut (mutable)", () => vec3SubMut(out, a, b));
});

group("vec3Scale: immutable vs mutable", () => {
  bench("vec3Scale (immutable)", () => vec3Scale(a, 2.5));
  bench("vec3ScaleMut (mutable)", () => vec3ScaleMut(out, a, 2.5));
});

group("vec3Normalize: immutable vs mutable", () => {
  bench("vec3Normalize (immutable)", () => vec3Normalize(a));
  bench("vec3NormalizeMut (mutable)", () => vec3NormalizeMut(out, a));
});

group("vec3Cross: immutable vs mutable", () => {
  bench("vec3Cross (immutable)", () => vec3Cross(a, b));
  bench("vec3CrossMut (mutable)", () => vec3CrossMut(out, a, b));
});

group("vec3Lerp: immutable vs mutable", () => {
  bench("vec3Lerp (immutable)", () => vec3Lerp(a, b, 0.5));
  bench("vec3LerpMut (mutable)", () => vec3LerpMut(out, a, b, 0.5));
});

// -- Products & metrics --

group("vec3 products & metrics", () => {
  bench("vec3Dot", () => vec3Dot(a, b));
  bench("vec3Cross", () => vec3Cross(a, b));
  bench("vec3Length", () => vec3Length(a));
  bench("vec3LengthSq", () => vec3LengthSq(a));
  bench("vec3Distance", () => vec3Distance(a, b));
  bench("vec3Normalize", () => vec3Normalize(a));
});

// -- Interpolation & comparison --

group("vec3 interpolation & comparison", () => {
  bench("vec3Lerp", () => vec3Lerp(a, b, 0.5));
  bench("vec3Equals", () => vec3Equals(a, b));
});

// -- Transform & conversion --

group("vec3 transform & conversion", () => {
  bench("vec3TransformMat4", () => vec3TransformMat4(a, m));
  bench("vec3ToFloat32Array", () => vec3ToFloat32Array(a));
});

await run();
