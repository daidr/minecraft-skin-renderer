import { bench, group, run } from "mitata";
import {
  mat4Identity,
  mat4Zero,
  mat4Clone,
  mat4Copy,
  mat4Multiply,
  mat4FromTranslation,
  mat4FromScaling,
  mat4FromRotationX,
  mat4FromRotationY,
  mat4FromRotationZ,
  mat4Translate,
  mat4Scale,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
  mat4Perspective,
  mat4Ortho,
  mat4LookAt,
  mat4Invert,
  mat4Transpose,
  mat4GetTranslation,
  mat4GetScaling,
  mat4IdentityMut,
  mat4MultiplyMut,
  mat4TranslateMut,
  mat4ScaleMut,
  mat4FromTranslationMut,
} from "../../src/core/math/mat4";
import type { Vec3 } from "../../src/core/math/vec3";

// Pre-allocated data
const identity = mat4Identity();
const matA = mat4FromRotationX(0.7);
const matB = mat4FromRotationY(1.2);
const out = mat4Zero();
const v: Vec3 = [3.0, -1.5, 2.0];
const eye: Vec3 = [0, 0, 5];
const center: Vec3 = [0, 0, 0];
const up: Vec3 = [0, 1, 0];

// -- Creation --

group("mat4 creation", () => {
  bench("mat4Identity", () => mat4Identity());
  bench("mat4Zero", () => mat4Zero());
  bench("mat4Clone", () => mat4Clone(identity));
  bench("mat4Copy", () => mat4Copy(out, identity));
});

// -- From* constructors --

group("mat4 constructors", () => {
  bench("mat4FromTranslation", () => mat4FromTranslation(v));
  bench("mat4FromScaling", () => mat4FromScaling(v));
  bench("mat4FromRotationX", () => mat4FromRotationX(0.7));
  bench("mat4FromRotationY", () => mat4FromRotationY(1.2));
  bench("mat4FromRotationZ", () => mat4FromRotationZ(0.3));
});

// -- Multiplication --

group("mat4Multiply: immutable vs mutable", () => {
  bench("mat4Multiply (immutable)", () => mat4Multiply(matA, matB));
  bench("mat4MultiplyMut (mutable)", () => mat4MultiplyMut(out, matA, matB));
});

// -- Transform operations (immutable) --

group("mat4 transforms (immutable)", () => {
  bench("mat4Translate", () => mat4Translate(identity, v));
  bench("mat4Scale", () => mat4Scale(identity, v));
  bench("mat4RotateX", () => mat4RotateX(identity, 0.7));
  bench("mat4RotateY", () => mat4RotateY(identity, 1.2));
  bench("mat4RotateZ", () => mat4RotateZ(identity, 0.3));
});

// -- Transform operations (mutable) --

group("mat4 transforms (mutable)", () => {
  bench("mat4TranslateMut", () => mat4TranslateMut(out, identity, v));
  bench("mat4ScaleMut", () => mat4ScaleMut(out, identity, v));
  bench("mat4FromTranslationMut", () => mat4FromTranslationMut(out, v));
  bench("mat4IdentityMut", () => mat4IdentityMut(out));
});

// -- Translate: immutable vs mutable --

group("mat4Translate: immutable vs mutable", () => {
  bench("mat4Translate (immutable)", () => mat4Translate(identity, v));
  bench("mat4TranslateMut (mutable)", () => mat4TranslateMut(out, identity, v));
});

// -- Scale: immutable vs mutable --

group("mat4Scale: immutable vs mutable", () => {
  bench("mat4Scale (immutable)", () => mat4Scale(identity, v));
  bench("mat4ScaleMut (mutable)", () => mat4ScaleMut(out, identity, v));
});

// -- Projection matrices --

group("mat4 projection", () => {
  bench("mat4Perspective", () => mat4Perspective(Math.PI / 4, 16 / 9, 0.1, 100));
  bench("mat4Ortho", () => mat4Ortho(-1, 1, -1, 1, 0.1, 100));
  bench("mat4LookAt", () => mat4LookAt(eye, center, up));
});

// -- Inversion & transpose --

group("mat4 invert & transpose", () => {
  bench("mat4Invert", () => mat4Invert(matA));
  bench("mat4Transpose", () => mat4Transpose(matA));
});

// -- Extraction --

group("mat4 extraction", () => {
  bench("mat4GetTranslation", () => mat4GetTranslation(matA));
  bench("mat4GetScaling", () => mat4GetScaling(matA));
});

await run();
