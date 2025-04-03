import { Color, Vector } from "./utils";
import { Matrix4 } from "./matrixutils";

class ShaderProgram {
    private _program: WebGLProgram;
    private gl: WebGLRenderingContext;

    constructor(gl: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
        this.gl = gl;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (!vertexShader) throw Error("Failed to create vertex shader");
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            gl.deleteShader(vertexShader);
            throw Error(gl.getShaderInfoLog(vertexShader) as string);
        } 

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragmentShader) throw Error("Failed to create vertex shader");
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            gl.deleteShader(fragmentShader);
            throw Error(gl.getShaderInfoLog(fragmentShader) as string);
        }

        this._program = gl.createProgram();

        gl.attachShader(this._program, vertexShader);
        gl.attachShader(this._program, fragmentShader);
        gl.linkProgram(this._program);
    }

    public use() {
        this.gl.useProgram(this._program);
    }

    public getAttribLocation(name: string) {
        return this.gl.getAttribLocation(this._program, name);
    }

    public get program() {
        return this._program;
    }

    private loc(name: string) {
        return this.gl.getUniformLocation(this._program, name);
    }

    public setUniformMatrix4(name: string, matrix: Matrix4) {
        this.gl.uniformMatrix4fv(this.loc(name), false, matrix.values);
    }
    
    public setUniform4f(name: string, v0: number, v1: number, v2: number, v3: number) {
        this.gl.uniform4f(this.loc(name), v0, v1, v2, v3);
    }

    public setUniformColor(name: string, color: Color) {
        this.setUniform4f(name, color.r, color.g, color.b, color.a);
    }

    public setUniform2f(name: string, v0: number, v1: number) {
        this.gl.uniform2f(this.loc(name), v0, v1); 
    }

    public setUniformVector(name: string, vector: Vector) {
        this.setUniform2f(name, vector.x, vector.y);
    }
}

export { ShaderProgram };
