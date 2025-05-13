import * as ShaderCode from "./shaderCode";

enum PostProcessingShaderIndex {
    NO_EFFECT,
    INVERT,
    PIXELATE,
    VIGNETTE,
    END_LEVEL,
}

const postProcessingFragmentShaderCodes: Record<PostProcessingShaderIndex, string> = {
[PostProcessingShaderIndex.NO_EFFECT]: ShaderCode.noEffectPostProcessingFragmentShader,
[PostProcessingShaderIndex.INVERT]: ShaderCode.invertColorsPostProcessingFragmentShader,
[PostProcessingShaderIndex.PIXELATE]: ShaderCode.pixelatePostProcessingFragmentShader,
[PostProcessingShaderIndex.VIGNETTE]: ShaderCode.vignettePostProcessingFragmentShader,
[PostProcessingShaderIndex.END_LEVEL]: ShaderCode.endLevelPostProcessingFragmentShader,
}

export { PostProcessingShaderIndex, postProcessingFragmentShaderCodes };
