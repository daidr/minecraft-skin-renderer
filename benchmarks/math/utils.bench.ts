import { bench, group, run } from "mitata";
import {
  degToRad,
  radToDeg,
  clamp,
  lerp,
  smoothstep,
  isZero,
  approxEquals,
  mapRange,
  wrap,
  isPowerOfTwo,
  nextPowerOfTwo,
  sign,
  fract,
  seededRandom,
} from "../../src/core/math/utils";

// -- Angle conversion --

group("angle conversion", () => {
  bench("degToRad", () => degToRad(180));
  bench("radToDeg", () => radToDeg(3.14159));
});

// -- Clamping & interpolation --

group("clamping & interpolation", () => {
  bench("clamp", () => clamp(1.5, 0, 1));
  bench("lerp", () => lerp(0, 100, 0.5));
  bench("smoothstep", () => smoothstep(0, 1, 0.5));
});

// -- Comparison --

group("comparison", () => {
  bench("isZero (zero)", () => isZero(0.0000001));
  bench("isZero (non-zero)", () => isZero(1.0));
  bench("approxEquals (equal)", () => approxEquals(1.0, 1.0000001));
  bench("approxEquals (not equal)", () => approxEquals(1.0, 2.0));
});

// -- Range mapping & wrapping --

group("range mapping & wrapping", () => {
  bench("mapRange", () => mapRange(5, 0, 10, 0, 100));
  bench("wrap (in range)", () => wrap(0.5, 0, 1));
  bench("wrap (out of range)", () => wrap(2.5, 0, 1));
});

// -- Power of two --

group("power of two", () => {
  bench("isPowerOfTwo (true)", () => isPowerOfTwo(256));
  bench("isPowerOfTwo (false)", () => isPowerOfTwo(255));
  bench("nextPowerOfTwo (small)", () => nextPowerOfTwo(100));
  bench("nextPowerOfTwo (large)", () => nextPowerOfTwo(10000));
});

// -- Misc numeric --

group("misc numeric", () => {
  bench("sign (positive)", () => sign(42));
  bench("sign (negative)", () => sign(-42));
  bench("sign (zero)", () => sign(0));
  bench("fract", () => fract(3.14159));
});

// -- Seeded random --

group("seeded random", () => {
  bench("seededRandom (create)", () => seededRandom(12345));

  const rng = seededRandom(12345);
  bench("seededRandom (call)", () => rng());
});

await run();
