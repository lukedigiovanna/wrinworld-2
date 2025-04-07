const vertexShaderCode = `
attribute vec2 a_position;
attribute vec2 a_textureCoord;
varying vec2 texCoord;
varying vec2 fragPos;
uniform mat4 projection;
uniform mat4 model;

void main() {
    vec4 worldPos = model * vec4(a_position, 0.0, 1.0);
    gl_Position = projection * worldPos;
    texCoord = a_textureCoord;
    fragPos = worldPos.xy;
}
`

const fragmentShaderCode = `
precision mediump float;
varying vec2 texCoord;
varying vec2 fragPos;

uniform sampler2D texture;
uniform vec4 color;

#define MAX_SHADOWS 255
#define SHADOW_STRENGTH 0.01
struct Shadow {
    vec2 position;
    float size;
};
uniform int numShadows;
uniform Shadow shadows[MAX_SHADOWS];

void main() {
    vec4 textureColor = texture2D(texture, texCoord);
    // if (textureColor.a < 0.1) discard;

    float shadowValue = 0.0;
    for (int i = 0; i < MAX_SHADOWS; i++) {
        if (i >= numShadows) {
            break;
        }
        Shadow shadow = shadows[i];
        float distance = length(shadow.position - fragPos);
        shadowValue += min(shadow.size / distance, 1.0);
    }

    float shadowMultiplier = max(1.0 - shadowValue, SHADOW_STRENGTH);

    gl_FragColor = textureColor * color * vec4(shadowMultiplier, shadowMultiplier, shadowMultiplier, 1);
}
`

export { vertexShaderCode, fragmentShaderCode };
