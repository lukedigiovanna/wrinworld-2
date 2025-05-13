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
uniform vec2 clipOffset;
uniform vec2 clipSize;
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

float computeLightFalloff(vec2 fragPos, Light light) {
    float dist = distance(fragPos, light.position);
    float attenuation = clamp(1.0 - dist / light.radius, 0.0, 1.0);
    return attenuation * attenuation * light.intensity; // quadratic falloff 
}

#define MAX_PORTALS 12
struct Portal {
    vec2 position;
    float radius;
    float strength;
    float age;
};
uniform int numPortals;
uniform Portal portals[MAX_PORTALS];

vec2 swirlUV(vec2 uv, vec2 frag, Portal portal) {
    vec2 offset = frag - portal.position;
    float dist = length(offset);

    if (dist > portal.radius) return uv;

    float angle = portal.strength * (portal.radius - dist) / portal.radius + portal.age * 1.5;
    float s = sin(angle);
    float c = cos(angle);

    vec2 rotated = vec2(
        offset.x * c - offset.y * s,
        offset.x * s + offset.y * c
    );

    vec2 newOffset = rotated;
    vec2 newFrag = portal.position + newOffset;

    float strength = (1.0 - dist / portal.radius) * sin(rotated.x / 20.0) * sin(rotated.y / 20.0);
    vec2 delta = normalize(newFrag - frag) * 0.5 * strength;
    return uv + delta; // offset UV based on the distortion
}

vec3 computeShimmerColor(vec2 frag, Portal portal) {
    vec2 offset = frag - portal.position;
    float dist = length(offset);
    if (dist > portal.radius) return vec3(0.0);
    
    float factor = 1.0 - dist / portal.radius;
    
    float t = portal.age;
    float s = sin(t);
    float c = cos(t);
    vec2 rotated = vec2(
        offset.x * c - offset.y * s,
        offset.x * s + offset.y * c
    );
    // Color shift using sin-based shimmer
    float shimmer = (
        sin(rotated.x / 22.0) * 
        sin(rotated.y / 22.0) * 
        sin(t + portal.position.x + portal.position.y)
    ) * 0.5 + 0.5;
    vec3 tint = vec3(0.6, 0.3, 0.8) * shimmer; // a bluish shimmer

    return tint * factor; // fade out toward the edge
}

void main() {
    vec2 distortedUV = texCoord;

    vec3 shimmerColor = vec3(0.0);
    for (int i = 0; i < MAX_PORTALS; i++) {
        if (i >= numPortals) break;
        distortedUV = swirlUV(distortedUV, fragPos, portals[i]);
        shimmerColor += computeShimmerColor(fragPos, portals[i]);
    }

    vec4 textureColor = texture2D(texture, distortedUV * clipSize + clipOffset);

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
        float falloff = computeLightFalloff(fragPos, light);
        vec3 lightEffect = light.color * falloff;
        lightColor += clamp(lightEffect, 0.0, 1.0);
    }

    float shadowMultiplier = max(1.0 - shadowValue, SHADOW_STRENGTH);
    float alpha = textureColor.a * color.a;
    vec3 baseColor = textureColor.rgb * color.rgb * color.a;

    baseColor += shimmerColor;

    baseColor *= shadowMultiplier;
    baseColor *= lightColor;

    gl_FragColor = vec4(baseColor, alpha);
}
`

const chunkVertexShaderCode = `
attribute vec2 a_position;
attribute vec2 a_textureCoord;

varying vec2 texCoord;
varying vec2 fragPos;

uniform float chunkSize;
uniform vec2 position;
uniform int rotation;

void main() {
    float tileWidth = 2.0 / chunkSize;
    vec2 offset = position * tileWidth;
    gl_Position = vec4(vec2(-1.0) + a_position * tileWidth + offset, 0, 1);

    vec2 flippedCoord = vec2(a_textureCoord.x, 1.0 - a_textureCoord.y);
    vec2 rotatedCoord = flippedCoord;
    if (rotation == 1) {
        rotatedCoord = vec2(1.0 - flippedCoord.y, flippedCoord.x);
    }
    else if (rotation == 2) {        
        rotatedCoord = vec2(1.0 - flippedCoord.x, 1.0 - flippedCoord.y);
    }
    else if (rotation == 3) {       
        rotatedCoord = vec2(flippedCoord.y, 1.0 - flippedCoord.x);
    }
    texCoord = rotatedCoord;
}
`

const chunkFragmentShaderCode = `
precision mediump float;

uniform sampler2D texture;
uniform sampler2D mask;
varying vec2 texCoord;

void main() {
    vec4 maskColor = texture2D(mask, texCoord);
    gl_FragColor = maskColor * texture2D(texture, texCoord);
}
`

const postProcessingVertexShaderCode = `
attribute vec2 a_position;
attribute vec2 a_textureCoord;

varying vec2 texCoord;
varying vec2 fragPos;

void main() {
    gl_Position = vec4((a_position * 2.0 - 1.0) * vec2(1.0, -1.0), 0, 1);
    texCoord = a_textureCoord;
}
`

const noEffectPostProcessingFragmentShader = `
precision mediump float;

uniform sampler2D texture;
varying vec2 texCoord;

void main() {
    gl_FragColor = texture2D(texture, texCoord);
}
`

const invertColorsPostProcessingFragmentShader = `
precision mediump float;

uniform sampler2D texture;
varying vec2 texCoord;

void main() {
    vec4 color = texture2D(texture, texCoord);
    gl_FragColor = vec4(1.0 - color.rgb, 1.0);
}
`
const pixelatePostProcessingFragmentShader = `
precision mediump float;

varying vec2 texCoord;

uniform sampler2D texture;
uniform vec2 screenSize;
uniform float intensity; // 0 is no effect, 1 is full zoomed pixelation

float rescale(float x, float a0, float b0, float a1, float b1) {
    return (x - a0) / b0 * (b1 - a1) + a1;
}

void main() {
    float i2 = intensity / 2.0;
    vec2 zoomedTexCoord = vec2(rescale(texCoord.x, 0.0, 1.0, i2, 1.0 - i2), rescale(texCoord.y, 0.0, 1.0, i2, 1.0 - i2));
    float pixelSize = max(1.0, screenSize.y * intensity);
    vec2 screenPos = zoomedTexCoord * screenSize;
    vec2 blockPos = floor(screenPos / pixelSize + vec2(0.5)) * pixelSize;
    vec2 uv = blockPos / screenSize;
    gl_FragColor = texture2D(texture, uv);
}
`

const vignettePostProcessingFragmentShader = `
precision mediump float;

uniform sampler2D texture;
varying vec2 texCoord;

uniform vec3 color;

void main() {
    vec2 uv = texCoord * (1.0 - texCoord.yx);   //vec2(1.0)- uv.yx; -> 1.-u.yx; Thanks FabriceNeyret !
    
    float vig = uv.x*uv.y * 15.0; // multiply with sth for intensity
    
    vig = pow(vig, 0.25); // change pow for modifying the extend of the  vignette

    vec4 texColor = texture2D(texture, texCoord);
    gl_FragColor = vec4(mix(texColor.rgb, color, 1.0 - vig), texColor.a);
}
`

const endLevelPostProcessingFragmentShader = `
precision mediump float;

uniform sampler2D texture;
varying vec2 texCoord;

uniform float t;

void main() {
    vec4 texColor = texture2D(texture, texCoord);
    float cutoff = 1.0 - 1.35 * t + 0.35 * (sin(texCoord.x * 15.0) * 0.5 + 0.5);
    if (texCoord.y > cutoff) {
        gl_FragColor = vec4(0, 0, 0, 1);
    }
    else {
        gl_FragColor = texColor;
    }
}
`

export { vertexShaderCode, fragmentShaderCode, chunkVertexShaderCode, chunkFragmentShaderCode,
    postProcessingVertexShaderCode, invertColorsPostProcessingFragmentShader,
    noEffectPostProcessingFragmentShader, pixelatePostProcessingFragmentShader,
    vignettePostProcessingFragmentShader, endLevelPostProcessingFragmentShader };
