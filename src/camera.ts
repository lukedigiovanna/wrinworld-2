import input from "./input";
import { Vector, MathUtils, Color, Ease } from "./utils";
import { MAX_LIGHTS, MAX_PORTALS, MAX_SHADOWS, ShaderLight, ShaderPortal, 
         ShaderProgram, ShaderShadow } from "./rendering/ShaderProgram";
import { FrameBuffer } from "./rendering/FrameBuffer";
import { getOrthographicProjection, Matrix4 } from "./utils/Matrix4";
import { Texture, getTexture } from "./assets/imageLoader";
import { Game } from "./game";
import { GameObject } from "./gameObjects";
import * as ShaderCode from "./rendering/shaderCode";
import { postProcessingFragmentShaderCodes, PostProcessingShaderIndex } from "./rendering/postProcessingShaders";

const quadVertices = new Float32Array([
    0, 0,  0, 1, // Bottom-left
    1, 0,  1, 1, // Bottom-right
    0, 1,  0, 0, // Top-left
    1, 1,  1, 0  // Top-right
]);

class Camera {
    private game: Game;

    public position: Vector; // center of camera view
    public height: number;

    public readonly canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    // The buffer we are actively drawing to
    private sceneFramebuffer: FrameBuffer;
    // Used to swap with sceneFramebuffer when applying multiple postprocessing effects
    private backSceneFramebuffer: FrameBuffer;
    private sceneShader: ShaderProgram;
    private postProcessingShaders: Map<PostProcessingShaderIndex, ShaderProgram>;
    private shaderPipeline: PostProcessingShaderIndex[] = [PostProcessingShaderIndex.PIXELATE, PostProcessingShaderIndex.VIGNETTE];

    public color: Color = Color.WHITE;
    public strokeWidth: number = 1;
    public ambientLightIntensity: number = 1;

    public target?: GameObject;

    public verticalBoundary: [number, number] = [-99999, 99999];

    private quadVBO: WebGLBuffer;

    private shakeDuration: number = 0;
    private shakeIntensity: number = 0;
    private shakeStartTime: number = 0;

    constructor(game: Game, canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
        this.game = game;
        this.canvas = canvas;
        this.gl = gl;
        this.sceneShader = new ShaderProgram(this.gl, ShaderCode.vertexShaderCode, ShaderCode.fragmentShaderCode);
        this.postProcessingShaders = new Map<PostProcessingShaderIndex, ShaderProgram>();
        this.sceneFramebuffer = new FrameBuffer(gl, canvas);
        this.backSceneFramebuffer = new FrameBuffer(gl, canvas);
        
        this.position = Vector.zero();
        this.height = 200;

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);  

        let posAttribLocation, texCoordAttribLocation;
        this.quadVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
        
        this.sceneShader.use();
        posAttribLocation = this.sceneShader.getAttribLocation("a_position");
        gl.enableVertexAttribArray(posAttribLocation);
        gl.vertexAttribPointer(posAttribLocation, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
        texCoordAttribLocation = this.sceneShader.getAttribLocation("a_textureCoord");
        gl.enableVertexAttribArray(texCoordAttribLocation);
        gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
    }

    public getPostProcessingShader(index: PostProcessingShaderIndex) {
        if (!this.postProcessingShaders.has(index)) {
            this.postProcessingShaders.set(index, new ShaderProgram(this.gl, ShaderCode.postProcessingVertexShaderCode, postProcessingFragmentShaderCodes[index]))
        }
        return this.postProcessingShaders.get(index)!;
    }

    public setPostProcessingShaderPipeline(pipeline: PostProcessingShaderIndex[]) {
        this.shaderPipeline = pipeline;
    }

    public applyShake(duration: number, intensity: number) {
        this.shakeDuration = duration;
        this.shakeIntensity = intensity;
        this.shakeStartTime = this.game.time;
    }

    public update(dt: number) {
        // const diff = Vector.subtract(this.target, this.position);
        // const threshold = this.height / 4;
        // if (diff.magnitude > threshold) {
        //     diff.subtract(Vector.scaled(Vector.normalized(diff), threshold));
        //     diff.scale(dt * 4);
        //     if (diff.magnitude > 0.025)
        //         this.position.add(diff);
        // }
        if (this.target)
            this.position.set(this.target.position);
        // this.position.y = MathUtils.clamp(this.position.y, this.verticalBoundary[0], this.verticalBoundary[1]);

        if (input.isKeyDown("Equal")) {
            this.height *= 0.95;
        }
        if (input.isKeyDown("Minus")) {
            this.height *= 1 / 0.95;
        }
        this.height = MathUtils.clamp(this.height, 1, 3000);
    }

    // clears the camera view
    public clear() {
        this.sceneFramebuffer.checkResize();
        this.backSceneFramebuffer.checkResize();
        this.sceneFramebuffer.bind();
        this.sceneShader.use();
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        // Apply a random shake
        const shakeTime = this.game.time - this.shakeStartTime;
        const position = this.position.copy();
        if (shakeTime < this.shakeDuration) {
            const I = this.shakeIntensity * (1 - Ease.inQuart(shakeTime / this.shakeDuration))
            const shake = MathUtils.randomVector(MathUtils.random(0, I));
            position.add(shake);
        }
        // Set the appropriate projection matrix
        const pixelsPerUnit = this.canvas.height / this.height;
        const modifiedPPU = Math.floor(pixelsPerUnit);
        const height = Math.round(this.canvas.height / modifiedPPU);
        const width = Math.round(this.canvas.width / modifiedPPU);
        const x = Math.round(position.x);
        const y = Math.round(position.y);
        const lw = Math.floor(width / 2), rw = Math.ceil(width / 2);
        const bh = Math.floor(height / 2), th = Math.ceil(height / 2);
        const projection = getOrthographicProjection(
            x - lw, x + rw,
            y - bh, y + th,
            0, 100
        );
        this.sceneShader.setUniformMatrix4("projection", projection);
        this.sceneShader.setUniformFloat("ambientLightIntensity", this.ambientLightIntensity);
    }

    // Renders the framebuffer to the screen using the active postprocessing shader
    // should be called after drawing a frame.
    public renderToScreen() {
        // If there are no shaders in the pipeline, just use the NO_EFFECT shader.
        const pipeline = this.shaderPipeline.length === 0 ? [PostProcessingShaderIndex.NO_EFFECT] : 
                                                            this.shaderPipeline
        for (let i = 0; i < pipeline.length; i++) {
            // Swap the buffers
            [this.sceneFramebuffer, this.backSceneFramebuffer] = [this.backSceneFramebuffer, this.sceneFramebuffer];
            // The last shader should render directly to the screen
            if (i === pipeline.length - 1) {
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            }
            else {
                // Draw what is now the back scene to the main scene framebuffer
                this.sceneFramebuffer.bind();
            }
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.gl.clearColor(0, 0, 0, 1);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            const shader = this.getPostProcessingShader(pipeline[i]);
            shader.use();
            this.backSceneFramebuffer.bindTexture();
            shader.setUniformInt("texture", 0);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadVBO);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        }
    }

    public setShadows(shadows: ShaderShadow[]) {
        const numShadows = Math.min(MAX_SHADOWS, shadows.length);
        for (let i = 0; i < numShadows; i++) {
            this.sceneShader.setUniformShadow(`shadows[${i}]`, shadows[i]);
        }
        this.sceneShader.setUniformInt("numShadows", numShadows);
    }

    public setLights(lights: ShaderLight[]) {
        const numLights = Math.min(MAX_LIGHTS, lights.length);
        for (let i = 0; i < numLights; i++) {
            this.sceneShader.setUniformLight(`lights[${i}]`, lights[i]);
        }
        this.sceneShader.setUniformInt("numLights", numLights);
    }

    public setPortals(portals: ShaderPortal[]) {
        const numPortals = Math.min(MAX_PORTALS, portals.length);
        for (let i = 0; i < numPortals; i++) {
            this.sceneShader.setUniformPortal(`portals[${i}]`, portals[i]);
        }
        this.sceneShader.setUniformInt("numPortals", numPortals);
    }

    // Fills a rectangle using the given world coordinates where the x,y denotes the center of the rectangle
    public fillRect(x: number, y: number, w: number, h: number) {
        this.drawTexture(getTexture("square"), x, y, w, h);
    }

    public strokeRect(x: number, y: number, w: number, h: number) {
        const square = getTexture("square");
        this.drawTexture(square, x - w / 2, y, this.strokeWidth, h);
        this.drawTexture(square, x + w / 2, y, this.strokeWidth, h);
        this.drawTexture(square, x, y - h / 2, w, this.strokeWidth);
        this.drawTexture(square, x, y + h / 2, w, this.strokeWidth);
    }

    public drawTextureWithCustomTransformation(texture: Texture, transformation: Matrix4) {
        this.sceneShader.setUniformMatrix4("model", transformation);
        this.sceneShader.setUniformColor("color", this.color);
        if (texture.clipRect) {
            this.sceneShader.setUniform2f("clipOffset", texture.clipRect.left, texture.clipRect.bottom);
            this.sceneShader.setUniform2f("clipSize", texture.clipRect.right - texture.clipRect.left, texture.clipRect.top - texture.clipRect.bottom);
        }
        else {
            this.sceneShader.setUniform2f("clipOffset", 0, 0);
            this.sceneShader.setUniform2f("clipSize", 1, 1);
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadVBO);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    public drawTexture(texture: Texture, x: number, y: number, w: number, h: number, angle: number=0, rotationPointOffset=Vector.zero(), shear: number=0){ 
        const transformation = Matrix4.transformation(
            Math.round(x) - Math.floor(w / 2), Math.round(y) - Math.floor(h / 2), 
            w, h, 
            angle, w / 2 + rotationPointOffset.x, h / 2 + rotationPointOffset.y, shear
        );
        this.drawTextureWithCustomTransformation(texture, transformation);
    }

    public get width() {
        return this.canvas.width / this.canvas.height * this.height;
    }

    public screenToWorldPosition(pos: Vector) {
        const p = Vector.divide(pos, new Vector(this.canvas.width, this.canvas.height));
        p.multiply(new Vector(this.width, this.height));
        p.add(this.position);
        p.subtract(new Vector(this.width / 2, this.height / 2));
        p.y = 2 * this.position.y - p.y;
        return p;
    }
}

export { Camera };