/**
 * Raw WebGL panorama shaders (unminified source)
 * Edit these shaders directly. They are minified at build time.
 */

export const PANORAMA_VERTEX_SHADER_RAW = `#version 300 es

precision highp float;

layout(location = 0) in vec3 a_position;

uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

out vec3 v_direction;

void main() {
    v_direction = a_position;

    // Remove translation from view matrix (only rotation)
    mat4 viewRotation = u_viewMatrix;
    viewRotation[3] = vec4(0.0, 0.0, 0.0, 1.0);

    vec4 pos = u_projectionMatrix * viewRotation * vec4(a_position, 1.0);

    // Set z = w so depth is always at far plane
    gl_Position = pos.xyww;
}
`;

export const PANORAMA_FRAGMENT_SHADER_RAW = `#version 300 es

precision highp float;

in vec3 v_direction;

uniform sampler2D u_panorama;

out vec4 fragColor;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;

void main() {
    vec3 dir = normalize(v_direction);

    // Convert direction to equirectangular UV coordinates
    // atan(z, x) gives horizontal angle (-PI to PI)
    // asin(y) gives vertical angle (-PI/2 to PI/2)
    float u = atan(dir.z, dir.x) / TWO_PI + 0.5;
    float v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;

    // Flip V to match standard equirectangular orientation
    fragColor = texture(u_panorama, vec2(u, 1.0 - v));
}
`;
