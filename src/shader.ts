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

    public setUniformMatrix4(name: string, matrix: Matrix4) {
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this._program, name), false, matrix.values);
    }
}

export { ShaderProgram };
