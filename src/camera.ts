import input from "./input";
import { Vector, MathUtils, Color} from "./utils";
import { ShaderProgram } from "./shader";
import { getOrthographicProjection, Matrix4 } from "./matrixutils";
import { Texture, getTexture } from "./imageLoader";

const squareVertices = new Float32Array([
    -0.5, -0.5,  0, 1, // Bottom-left
     0.5, -0.5,  1, 1, // Bottom-right
    -0.5,  0.5,  0, 0, // Top-left
     0.5,  0.5,  1, 0  // Top-right
]);

class Camera {
    public position: Vector; // center of camera view
    private alignedPosition: Vector;
    public height: number;

    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private shaderProgram: ShaderProgram;

    public color: Color = Color.WHITE;

    public target: Vector = Vector.zero();

    public verticalBoundary: [number, number] = [-99999, 99999];

    private squareVBO: WebGLBuffer;

    constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, shaderProgram: ShaderProgram) {
        this.canvas = canvas;
        this.gl = gl;
        this.shaderProgram = shaderProgram;
        this.position = Vector.zero();
        this.alignedPosition = Vector.zero();
        this.height = 18;

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
            diff.scale(dt * 3);
            if (diff.magnitude > 0.025)
                this.position.add(diff);
        }
        // this.position.set(this.target);
        this.position.y = MathUtils.clamp(this.position.y, this.verticalBoundary[0], this.verticalBoundary[1]);

        if (input.isKeyDown("Equal")) {
            this.height *= 0.95;
        }
        if (input.isKeyDown("Minus")) {
            this.height *= 1 / 0.95;
        }
        this.height = MathUtils.clamp(this.height, 1, 100);
    }

    // public setStrokeColor(color: string) {
    //     this.ctx.strokeStyle = color;
    // }

    // public setLineWidth(width: number) {
    //     this.ctx.lineWidth = width;
    // }

    // clears the camera view
    public clear() {
        const scale = 64;
        this.alignedPosition.setComponents(
            Math.round(this.position.x * scale) / scale, 
            Math.round(this.position.y * scale) / scale
        );
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        // Set the appropriate projection matrix again
        const width = this.width;
        const projection = getOrthographicProjection(
            this.alignedPosition.x - width / 2, this.alignedPosition.x + width / 2,
            this.alignedPosition.y - this.height / 2, this.alignedPosition.y + this.height / 2,
            0, 100
        );
        this.shaderProgram.setUniformMatrix4("projection", projection);
    }

    // Fills a rectangle using the given world coordinates where the x,y denotes the center of the rectangle
    public fillRect(x: number, y: number, w: number, h: number) {
        this.drawTexture(getTexture("square"), x, y, w, h);
    }

    // public strokeRect(x: number, y: number, w: number, h: number) {
    //     this.ctx.strokeRect(
    //         this.worldXToScreenX(x - w / 2),
    //         this.worldYToScreenY(y + h / 2),
    //         this.worldWidthToScreenWidth(w),
    //         this.worldHeightToScreenHeight(h),
    //     );
    // }

    // public fillEllipse(x: number, y: number, w: number, h: number) {
    //     this.ctx.beginPath();
    //     this.ctx.ellipse(
    //         this.worldXToScreenX(x), 
    //         this.worldYToScreenY(y), 
    //         this.worldWidthToScreenWidth(w / 2), 
    //         this.worldHeightToScreenHeight(h / 2), 
    //         0, 0, 2 * Math.PI
    //     );
    //     this.ctx.fill();
    // }

    public drawTexture(texture: Texture, x: number, y: number, w: number, h: number, angle: number=0, rotationPointOffset=Vector.zero()){ 
        this.shaderProgram.setUniformColor("color", Color.WHITE);
        const transformation = Matrix4.transformation(x, y, w, h, angle);
        this.shaderProgram.setUniformMatrix4("model", transformation);
        this.shaderProgram.setUniformColor("color", this.color);
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
        p.add(this.alignedPosition);
        p.subtract(new Vector(this.width / 2, this.height / 2));
        p.y = 2 * this.alignedPosition.y - p.y;
        return p;
    }
}

export { Camera };