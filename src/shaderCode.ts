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

#define MAX_SHADOWS 120
#define SHADOW_STRENGTH 0.5
struct Shadow {
    vec2 position;
    float size;
};
uniform int numShadows;
uniform Shadow shadows[MAX_SHADOWS];

#define MAX_LIGHTS 120
struct Light {
    vec2 position;
    float radius;
    float intensity;
    vec3 color;
};
uniform int numLights;
uniform Light lights[MAX_LIGHTS];

uniform float ambientLightIntensity;

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
        float value = 1.0 / (1.0 + exp(0.2 * (distance - shadow.size)));
        shadowValue += value;
    }

    vec3 lightColor = vec3(ambientLightIntensity);
    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= numLights) {
            break;
        }
        Light light = lights[i];
        float dist = distance(fragPos, light.position);
        float attenuation = clamp(1.0 - dist / light.radius, 0.0, 1.0);
        lightColor += light.color * attenuation * attenuation * light.intensity; // quadratic falloff 
    }

    float shadowMultiplier = max(1.0 - shadowValue, SHADOW_STRENGTH);
    gl_FragColor = textureColor * color * vec4(shadowMultiplier, shadowMultiplier, shadowMultiplier, 1) * vec4(lightColor, 1);
}
`

export { vertexShaderCode, fragmentShaderCode };
