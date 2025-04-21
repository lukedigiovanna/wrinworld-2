import input from "./input";
import { Vector, MathUtils, Color} from "./utils";
import { MAX_LIGHTS, MAX_SHADOWS, ShaderLight, ShaderProgram, ShaderShadow } from "./shader";
import { getOrthographicProjection, Matrix4 } from "./matrixutils";
import { Texture, getTexture } from "./imageLoader";

const squareVertices = new Float32Array([
    0, 0,  0, 1, // Bottom-left
    1, 0,  1, 1, // Bottom-right
    0, 1,  0, 0, // Top-left
    1, 1,  1, 0  // Top-right
]);

class Camera {
    public position: Vector; // center of camera view
    public height: number;

    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private shaderProgram: ShaderProgram;

    public color: Color = Color.WHITE;
    public strokeWidth: number = 1;
    public ambientLightIntensity: number = 0.9;

    public target: Vector = Vector.zero();

    public verticalBoundary: [number, number] = [-99999, 99999];

    private squareVBO: WebGLBuffer;

    constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, shaderProgram: ShaderProgram) {
        this.canvas = canvas;
        this.gl = gl;
        this.shaderProgram = shaderProgram;
        this.position = Vector.zero();
        this.height = 256;

        this.squareVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVBO);
        gl.bufferData(gl.ARRAY_BUFFER, squareVertices, gl.STATIC_DRAW);
        const posAttribLocation = shaderProgram.getAttribLocation("a_position");
        gl.enableVertexAttribArray(posAttribLocation);
        gl.vertexAttribPointer(posAttribLocation, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
        const texCoordAttribLocation = shaderProgram.getAttribLocation("a_textureCoord");
        gl.enableVertexAttribArray(texCoordAttribLocation);
        gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
    }

    public update(dt: number) {
        const diff = Vector.subtract(this.target, this.position);
        const threshold = this.height / 4;
        if (diff.magnitude > threshold) {
            diff.subtract(Vector.scaled(Vector.normalized(diff), threshold));
            diff.scale(dt * 4);
            if (diff.magnitude > 0.025)
                this.position.add(diff);
        }
        this.position.set(this.target);
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
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        // Apply a random shake
        // const shake = MathUtils.randomVector(MathUtils.random(1, 4));
        // Set the appropriate projection matrix
        const pixelsPerUnit = this.canvas.height / this.height;
        const modifiedPPU = Math.floor(pixelsPerUnit);
        const height = Math.round(this.canvas.height / modifiedPPU);
        const width = Math.round(this.canvas.width / modifiedPPU);
        // const x = Math.round(this.position.x + shake.x);
        // const y = Math.round(this.position.y + shake.y);
        const x = Math.round(this.position.x);
        const y = Math.round(this.position.y);
        const lw = Math.floor(width / 2), rw = Math.ceil(width / 2);
        const bh = Math.floor(height / 2), th = Math.ceil(height / 2);
        const projection = getOrthographicProjection(
            x - lw, x + rw,
            y - bh, y + th,
            0, 100
        );
        this.shaderProgram.setUniformMatrix4("projection", projection);
        this.shaderProgram.setUniformFloat("ambientLightIntensity", this.ambientLightIntensity);
    }

    public setShadows(shadows: ShaderShadow[]) {
        const numShadows = Math.min(MAX_SHADOWS, shadows.length);
        for (let i = 0; i < numShadows; i++) {
            this.shaderProgram.setUniformShadow(`shadows[${i}]`, shadows[i]);
        }
        this.shaderProgram.setUniformInt("numShadows", numShadows);
    }

    public setLights(lights: ShaderLight[]) {
        const numLights = Math.min(MAX_LIGHTS, lights.length);
        for (let i = 0; i < numLights; i++) {
            this.shaderProgram.setUniformLight(`lights[${i}]`, lights[i]);
        }
        this.shaderProgram.setUniformInt("numLights", numLights);
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

    public drawTexture(texture: Texture, x: number, y: number, w: number, h: number, angle: number=0, rotationPointOffset=Vector.zero()){ 
        const transformation = Matrix4.transformation(
            Math.round(x) - Math.floor(w / 2), Math.round(y) - Math.floor(h / 2), 
            w, h, 
            angle, w / 2 + rotationPointOffset.x, h / 2 + rotationPointOffset.y
        );
        this.shaderProgram.setUniformMatrix4("model", transformation);
        this.shaderProgram.setUniformColor("color", this.color);
        if (texture.clipRect) {
            this.shaderProgram.setUniform2f("clipOffset", texture.clipRect.left, texture.clipRect.bottom);
            this.shaderProgram.setUniform2f("clipSize", texture.clipRect.right - texture.clipRect.left, texture.clipRect.top - texture.clipRect.bottom);
        }
        else {
            this.shaderProgram.setUniform2f("clipOffset", 0, 0);
            this.shaderProgram.setUniform2f("clipSize", 1, 1);
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVBO);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
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