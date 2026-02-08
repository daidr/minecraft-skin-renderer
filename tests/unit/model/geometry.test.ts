/**
 * BoxGeometry unit tests
 */

import { describe, it, expect } from "vitest";
import {
  createBoxGeometry,
  createCapeBoxGeometry,
  mergeGeometries,
} from "@/model/geometry/BoxGeometry";
import { createBoxUV } from "@/model/uv/common";
import { BoneIndex, VERTEX_STRIDE } from "@/model/types";

describe("BoxGeometry", () => {
  const headUV = createBoxUV(0, 0, 8, 8, 8);

  describe("createBoxGeometry", () => {
    it("should create geometry with correct vertex and index counts", () => {
      const geo = createBoxGeometry([8, 8, 8], headUV, BoneIndex.Head);
      // 6 faces × 4 vertices = 24 vertices
      expect(geo.vertexCount).toBe(24);
      // 6 faces × 2 triangles × 3 indices = 36
      expect(geo.indexCount).toBe(36);
      expect(geo.vertices.length).toBe(24 * VERTEX_STRIDE);
      expect(geo.indices.length).toBe(36);
    });

    it("should store correct bone index in vertex data", () => {
      const geo = createBoxGeometry([4, 12, 4], headUV, BoneIndex.LeftArm);
      // Bone index is at stride position 8 for each vertex
      for (let v = 0; v < geo.vertexCount; v++) {
        expect(geo.vertices[v * VERTEX_STRIDE + 8]).toBe(BoneIndex.LeftArm);
      }
    });

    it("should apply offset to vertex positions", () => {
      const geo = createBoxGeometry([2, 2, 2], headUV, BoneIndex.Head, [10, 20, 30]);
      // Check that vertices are centered around offset position
      let minX = Infinity,
        maxX = -Infinity;
      for (let v = 0; v < geo.vertexCount; v++) {
        const x = geo.vertices[v * VERTEX_STRIDE];
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
      expect(minX).toBeCloseTo(9); // 10 - 1 (half size)
      expect(maxX).toBeCloseTo(11); // 10 + 1 (half size)
    });

    it("should apply inflation to vertex positions", () => {
      const noInflate = createBoxGeometry([2, 2, 2], headUV, BoneIndex.Head, [0, 0, 0], 0);
      const inflated = createBoxGeometry([2, 2, 2], headUV, BoneIndex.Head, [0, 0, 0], 0.5);

      // Inflated geometry should be larger
      let maxNoInflate = -Infinity,
        maxInflated = -Infinity;
      for (let v = 0; v < noInflate.vertexCount; v++) {
        maxNoInflate = Math.max(maxNoInflate, Math.abs(noInflate.vertices[v * VERTEX_STRIDE]));
        maxInflated = Math.max(maxInflated, Math.abs(inflated.vertices[v * VERTEX_STRIDE]));
      }
      expect(maxInflated).toBeGreaterThan(maxNoInflate);
    });

    it("should generate valid triangle indices", () => {
      const geo = createBoxGeometry([4, 4, 4], headUV, BoneIndex.Head);
      for (let i = 0; i < geo.indexCount; i++) {
        expect(geo.indices[i]).toBeGreaterThanOrEqual(0);
        expect(geo.indices[i]).toBeLessThan(geo.vertexCount);
      }
    });
  });

  describe("createCapeBoxGeometry", () => {
    const capeUV = createBoxUV(0, 0, 10, 16, 1, "cape");

    it("should create geometry with 64x32 texture normalization", () => {
      const geo = createCapeBoxGeometry([10, 16, 1], capeUV, BoneIndex.Cape);
      expect(geo.vertexCount).toBe(24);
      expect(geo.indexCount).toBe(36);

      // UV values should be normalized to 64x32
      for (let v = 0; v < geo.vertexCount; v++) {
        const u = geo.vertices[v * VERTEX_STRIDE + 3];
        const vCoord = geo.vertices[v * VERTEX_STRIDE + 4];
        expect(u).toBeGreaterThanOrEqual(0);
        expect(u).toBeLessThanOrEqual(1);
        expect(vCoord).toBeGreaterThanOrEqual(0);
        expect(vCoord).toBeLessThanOrEqual(1);
      }
    });

    it("should support mirrorX for right elytra wing", () => {
      const normal = createCapeBoxGeometry(
        [10, 20, 2],
        capeUV,
        BoneIndex.LeftWing,
        [0, 0, 0],
        false,
      );
      const mirrored = createCapeBoxGeometry(
        [10, 20, 2],
        capeUV,
        BoneIndex.RightWing,
        [0, 0, 0],
        true,
      );

      // Mirrored geometry should have negated X positions
      for (let v = 0; v < normal.vertexCount; v++) {
        const normalX = normal.vertices[v * VERTEX_STRIDE];
        const mirroredX = mirrored.vertices[v * VERTEX_STRIDE];
        expect(mirroredX).toBeCloseTo(-normalX);
      }
    });

    it("should reverse triangle winding order when mirrorX is true", () => {
      const normal = createCapeBoxGeometry(
        [10, 20, 2],
        capeUV,
        BoneIndex.LeftWing,
        [0, 0, 0],
        false,
      );
      const mirrored = createCapeBoxGeometry(
        [10, 20, 2],
        capeUV,
        BoneIndex.RightWing,
        [0, 0, 0],
        true,
      );

      // For each face (6 indices per face = 2 triangles)
      for (let f = 0; f < 6; f++) {
        const base = f * 6;
        // Normal winding: [bv, bv+1, bv+2, bv+2, bv+3, bv]
        // Mirrored winding: [bv+2, bv+1, bv, bv, bv+3, bv+2]
        const ni = normal.indices;
        const mi = mirrored.indices;

        // First triangle: normal [0,1,2] → mirrored [2,1,0]
        expect(mi[base]).toBe(ni[base + 2]);
        expect(mi[base + 1]).toBe(ni[base + 1]);
        expect(mi[base + 2]).toBe(ni[base]);

        // Second triangle: normal [2,3,0] → mirrored [0,3,2]
        expect(mi[base + 3]).toBe(ni[base + 5]); // bv
        expect(mi[base + 4]).toBe(ni[base + 4]); // bv+3
        expect(mi[base + 5]).toBe(ni[base + 3]); // bv+2
      }
    });
  });

  describe("mergeGeometries", () => {
    it("should merge multiple geometries into one", () => {
      const g1 = createBoxGeometry([2, 2, 2], headUV, BoneIndex.Head);
      const g2 = createBoxGeometry([4, 4, 4], headUV, BoneIndex.Body);
      const merged = mergeGeometries([g1, g2]);

      expect(merged.vertexCount).toBe(g1.vertexCount + g2.vertexCount);
      expect(merged.indexCount).toBe(g1.indexCount + g2.indexCount);
    });

    it("should correctly offset indices for merged geometry", () => {
      const g1 = createBoxGeometry([2, 2, 2], headUV, BoneIndex.Head);
      const g2 = createBoxGeometry([4, 4, 4], headUV, BoneIndex.Body);
      const merged = mergeGeometries([g1, g2]);

      // Indices from second geometry should be offset by first geometry's vertex count
      for (let i = g1.indexCount; i < merged.indexCount; i++) {
        expect(merged.indices[i]).toBeGreaterThanOrEqual(g1.vertexCount);
      }
    });

    it("should handle single geometry", () => {
      const g = createBoxGeometry([2, 2, 2], headUV, BoneIndex.Head);
      const merged = mergeGeometries([g]);
      expect(merged.vertexCount).toBe(g.vertexCount);
      expect(merged.indexCount).toBe(g.indexCount);
    });
  });
});
