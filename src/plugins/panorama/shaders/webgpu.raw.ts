/**
 * Raw WebGPU panorama shaders
 */

export const PANORAMA_WGSL_SHADER_RAW = `
// Uniform buffer matching the WebGPU renderer's layout (1680 bytes)
// viewProjectionMatrix is precomputed on CPU (projection * viewRotationOnly)
struct Uniforms {
    modelMatrix: mat4x4<f32>,
    viewProjectionMatrix: mat4x4<f32>,
    boneMatrices: array<mat4x4<f32>, 24>,
    alphaTest: f32,
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

    // viewProjectionMatrix = projection * viewRotation (translation already stripped on CPU)
    let pos = uniforms.viewProjectionMatrix * vec4<f32>(input.position, 1.0);

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
