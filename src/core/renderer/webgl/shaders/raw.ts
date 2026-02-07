/**
 * Raw GLSL Shaders (unminified source)
 * Edit these shaders directly. They are minified at build time.
 */

export const SKIN_VERTEX_SHADER_RAW = `#version 300 es

precision highp float;

// Vertex attributes
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec2 a_uv;
layout(location = 2) in vec3 a_normal;
layout(location = 3) in float a_boneIndex;

// Uniforms
uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjectionMatrix;
uniform mat4 u_boneMatrices[24];

// Outputs to fragment shader
out vec2 v_uv;

// [PLUGIN_VERTEX_DECLARATIONS]

void main() {
    // Get bone transform
    int boneIdx = int(a_boneIndex);
    mat4 boneMatrix = u_boneMatrices[boneIdx];

    // Transform position by bone
    vec4 localPos = boneMatrix * vec4(a_position, 1.0);

    // Transform to world space
    vec4 worldPos = u_modelMatrix * localPos;

    // Pass UV to fragment shader
    v_uv = a_uv;

    // [PLUGIN_VERTEX_MAIN]

    // Final position
    gl_Position = u_viewProjectionMatrix * worldPos;
}
`;

export const SKIN_FRAGMENT_SHADER_RAW = `#version 300 es

precision highp float;

// Inputs from vertex shader
in vec2 v_uv;

// [PLUGIN_FRAGMENT_DECLARATIONS]

// Uniforms
uniform sampler2D u_skinTexture;
uniform float u_alphaTest;

// Output
out vec4 fragColor;

void main() {
    // Sharp bilinear: smooth texel edges while preserving pixel art
    // NOTE: Use intermediate variables to prevent shader minifier from dropping parentheses
    vec2 texSize = vec2(textureSize(u_skinTexture, 0));
    vec2 texelCoord = v_uv * texSize;
    vec2 texelFloor = floor(texelCoord - 0.5) + 0.5;
    vec2 texelFrac = texelCoord - texelFloor;
    vec2 fw = fwidth(texelCoord);
    vec2 fracShifted = texelFrac - 0.5;
    vec2 sharpFrac = clamp(fracShifted / fw + 0.5, vec2(0.0), vec2(1.0));
    vec2 sharpCoord = texelFloor + sharpFrac;
    vec2 sharpUV = sharpCoord / texSize;

    vec4 texColor = texture(u_skinTexture, sharpUV);

    // Alpha test (discard fully transparent pixels)
    if (texColor.a < u_alphaTest) {
        discard;
    }

    // Default output (will be replaced if lighting plugin is active)
    fragColor = texColor;

    // [PLUGIN_FRAGMENT_OUTPUT]
}
`;

/** Simple shader without bones (for testing) */
export const SIMPLE_VERTEX_SHADER_RAW = `#version 300 es

precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec2 a_uv;
layout(location = 2) in vec3 a_normal;

uniform mat4 u_mvpMatrix;
uniform mat4 u_modelMatrix;

out vec2 v_uv;
out vec3 v_normal;

void main() {
    v_uv = a_uv;
    v_normal = mat3(u_modelMatrix) * a_normal;
    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
}
`;

export const SIMPLE_FRAGMENT_SHADER_RAW = `#version 300 es

precision highp float;

in vec2 v_uv;
in vec3 v_normal;

uniform sampler2D u_texture;
uniform float u_alphaTest;

out vec4 fragColor;

void main() {
    vec4 texColor = texture(u_texture, v_uv);

    if (texColor.a < u_alphaTest) {
        discard;
    }

    // Basic lighting
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
    float ndotl = max(dot(normalize(v_normal), lightDir), 0.0);
    float light = 0.4 + 0.6 * ndotl;

    fragColor = vec4(texColor.rgb * light, texColor.a);
}
`;
