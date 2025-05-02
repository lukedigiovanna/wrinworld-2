import { ShaderProgram } from "./ShaderProgram";
import * as ShaderCode from "./shaderCode";

enum PostProcessingShaderIndex {
    NO_EFFECT,
    INVERT,
}

const postProcessingFragmentShaderCodes: Record<PostProcessingShaderIndex, string> = {
[PostProcessingShaderIndex.NO_EFFECT]: ShaderCode.noEffectPostProcessingFragmentShader,
[PostProcessingShaderIndex.INVERT]: ShaderCode.invertColorsPostProcessingFragmentShader,
}

export { PostProcessingShaderIndex, postProcessingFragmentShaderCodes };
