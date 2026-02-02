/**
 * UV mapping unit tests
 */

import { describe, it, expect } from "vitest";
import { createBoxUV } from "@/model/uv/common";

describe("UV Mapping", () => {
  describe("createBoxUV", () => {
    it("should create standard skin UV layout", () => {
      const uv = createBoxUV(0, 0, 8, 8, 8, "standard");

      // Verify all faces are defined
      expect(uv.right).toBeDefined();
      expect(uv.front).toBeDefined();
      expect(uv.left).toBeDefined();
      expect(uv.back).toBeDefined();
      expect(uv.top).toBeDefined();
      expect(uv.bottom).toBeDefined();
    });

    it("should calculate correct UV coordinates for standard layout", () => {
      // Head box: 8x8x8 at position (0, 0)
      const uv = createBoxUV(0, 0, 8, 8, 8, "standard");

      // Right face: x to x+depth
      expect(uv.right.u1).toBe(0);
      expect(uv.right.u2).toBe(8);

      // Front face: x+depth to x+depth+width
      expect(uv.front.u1).toBe(8);
      expect(uv.front.u2).toBe(16);

      // Left face: x+depth+width to x+depth+width+depth
      expect(uv.left.u1).toBe(16);
      expect(uv.left.u2).toBe(24);

      // Back face: x+depth+width+depth to x+depth+width+depth+width
      expect(uv.back.u1).toBe(24);
      expect(uv.back.u2).toBe(32);

      // Vertical coordinates
      expect(uv.right.v1).toBe(8); // y + depth
      expect(uv.right.v2).toBe(16); // y + depth + height
    });

    it("should handle offset position", () => {
      const uv = createBoxUV(32, 16, 4, 12, 4, "standard");

      expect(uv.right.u1).toBe(32);
      expect(uv.right.u2).toBe(36);
      expect(uv.front.u1).toBe(36);
      expect(uv.front.u2).toBe(40);
    });

    it("should create cape UV layout with swapped front/back", () => {
      const uv = createBoxUV(0, 0, 10, 16, 1, "cape");

      // Cape swaps front and back
      // Front should use back coordinates
      expect(uv.front.u1).toBe(12); // backU1 = depth + width + depth = 1 + 10 + 1
      expect(uv.front.u2).toBe(22); // backU2 = backU1 + width

      // Back should use front coordinates
      expect(uv.back.u1).toBe(1); // frontU1 = depth
      expect(uv.back.u2).toBe(11); // frontU2 = depth + width
    });

    it("should create elytra UV layout with swapped u1/u2", () => {
      const uv = createBoxUV(0, 0, 10, 20, 2, "elytra");

      // Elytra swaps u1/u2 for side faces
      // Left face uses swapped right coordinates
      expect(uv.left.u1).toBe(2); // rightU2
      expect(uv.left.u2).toBe(0); // rightU1

      // Front swapped
      expect(uv.front.u1).toBe(12); // frontU2
      expect(uv.front.u2).toBe(2); // frontU1
    });

    it("should default to standard layout", () => {
      const uvWithLayout = createBoxUV(0, 0, 8, 8, 8, "standard");
      const uvDefault = createBoxUV(0, 0, 8, 8, 8);

      expect(uvDefault).toEqual(uvWithLayout);
    });

    it("should calculate top and bottom faces correctly", () => {
      const uv = createBoxUV(0, 0, 8, 12, 4, "standard");

      // Top face
      expect(uv.top.u1).toBe(4); // frontU1 = depth
      expect(uv.top.u2).toBe(12); // frontU2 = depth + width
      expect(uv.top.v1).toBe(0); // y
      expect(uv.top.v2).toBe(4); // y + depth

      // Bottom face
      expect(uv.bottom.u1).toBe(12); // leftU1
      expect(uv.bottom.u2).toBe(20); // leftU1 + width
    });
  });
});
