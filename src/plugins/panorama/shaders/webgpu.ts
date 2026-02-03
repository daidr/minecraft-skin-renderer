/**
 * WebGPU panorama shaders
 *
 * Renders an equirectangular panorama texture on a skybox.
 * Uses the same bind group layout as the skin shader for compatibility.
 */

export const PANORAMA_WGSL_SHADER = `
// Uniform buffer matching the WebGPU renderer's layout
// We only use viewMatrix and projectionMatrix
struct Uniforms {
    modelMatrix: mat4x4<f32>,       // offset 0
    viewMatrix: mat4x4<f32>,        // offset 64
    projectionMatrix: mat4x4<f32>,  // offset 128
    boneMatrices: array<mat4x4<f32>, 24>, // offset 192
    alphaTest: f32,                 // offset 1728
}

// Group 0: Uniforms (matches WebGPU renderer)
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

// Group 1: Textures (matches WebGPU renderer)
@group(1) @binding(0) var panoramaSampler: sampler;
@group(1) @binding(1) var panoramaTexture: texture_2d<f32>;

struct VertexInput {
    @location(0) position: vec3<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) direction: vec3<f32>,
}

const PI: f32 = 3.14159265359;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    output.direction = input.position;

    // Remove translation from view matrix (only rotation)
    var viewRotation = uniforms.viewMatrix;
    viewRotation[3] = vec4<f32>(0.0, 0.0, 0.0, 1.0);

    let pos = uniforms.projectionMatrix * viewRotation * vec4<f32>(input.position, 1.0);

    // Set z = w so depth is always at far plane
    output.position = vec4<f32>(pos.xy, pos.w, pos.w);

    return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    let dir = normalize(input.direction);

    // Convert direction to equirectangular UV coordinates
    let u = atan2(dir.z, dir.x) / (2.0 * PI) + 0.5;
    let v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;

    // Flip V to match standard equirectangular orientation
    return textureSample(panoramaTexture, panoramaSampler, vec2<f32>(u, 1.0 - v));
}
`;
