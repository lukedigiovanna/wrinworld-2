import * as ShaderCode from "./shaderCode";

enum PostProcessingShaderIndex {
    NO_EFFECT,
    INVERT,
    PIXELATE,
    VIGNETTE,
}

const postProcessingFragmentShaderCodes: Record<PostProcessingShaderIndex, string> = {
[PostProcessingShaderIndex.NO_EFFECT]: ShaderCode.noEffectPostProcessingFragmentShader,
[PostProcessingShaderIndex.INVERT]: ShaderCode.invertColorsPostProcessingFragmentShader,
[PostProcessingShaderIndex.PIXELATE]: ShaderCode.pixelatePostProcessingFragmentShader,
[PostProcessingShaderIndex.VIGNETTE]: ShaderCode.vignettePostProcessingFragmentShader
}

export { PostProcessingShaderIndex, postProcessingFragmentShaderCodes };
