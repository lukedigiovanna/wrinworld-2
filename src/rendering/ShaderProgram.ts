import { Color, Vector } from "../utils";
import { Matrix4 } from "../utils/Matrix4";

interface ShaderShadow {
    position: Vector;
    size: number;
}

interface ShaderLight {
    position: Vector;
    radius: number;
    intensity: number;
    color: Color;
}

interface ShaderPortal {
    position: Vector;
    radius: number;
    strength: number;
    age: number;
}

const MAX_SHADOWS = 120;
const MAX_LIGHTS = 120;
const MAX_PORTALS = 12;

class ShaderProgram {
    private _program: WebGLProgram;
    private gl: WebGLRenderingContext;

    public readonly vertexSrc;
    public readonly fragmentSrc;

    constructor(gl: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
        this.gl = gl;
        this.vertexSrc = vertexShaderSource;
        this.fragmentSrc = fragmentShaderSource;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (!vertexShader) throw Error("Failed to create vertex shader");
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw Error(gl.getShaderInfoLog(vertexShader) as string);
        } 

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragmentShader) throw Error("Failed to create vertex shader");
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            throw Error(gl.getShaderInfoLog(fragmentShader) as string);
        }

        this._program = gl.createProgram();

        gl.attachShader(this._program, vertexShader);
        gl.attachShader(this._program, fragmentShader);
        gl.linkProgram(this._program);
    }

    public delete() {
        this.gl.deleteProgram(this._program);
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
        this.use();
        return this.gl.getUniformLocation(this._program, name);
    }

    public setUniformMatrix4(name: string, matrix: Matrix4) {
        this.gl.uniformMatrix4fv(this.loc(name), false, matrix.values);
    }
    
    public setUniformFloat(name: string, f0: number) {
        this.gl.uniform1f(this.loc(name), f0);
    }

    public setUniform2f(name: string, v0: number, v1: number) {
        this.gl.uniform2f(this.loc(name), v0, v1); 
    }

    public setUniform3f(name: string, v0: number, v1: number, v2: number) {
        this.gl.uniform3f(this.loc(name), v0, v1, v2);
    }

    public setUniform4f(name: string, v0: number, v1: number, v2: number, v3: number) {
        this.gl.uniform4f(this.loc(name), v0, v1, v2, v3);
    }

    public setUniformColor(name: string, color: Color) {
        this.setUniform4f(name, color.r, color.g, color.b, color.a);
    }

    public setUniformColorRGB(name: string, color: Color) {
        this.setUniform3f(name, color.r, color.g, color.b);
    }

    public setUniformVector(name: string, vector: Vector) {
        this.setUniform2f(name, vector.x, vector.y);
    }

    public setUniformInt(name: string, i0: number) {
        this.gl.uniform1i(this.loc(name), i0);
    }

    public setUniformShadow(name: string, shadow: ShaderShadow) {
        this.setUniformVector(`${name}.position`, shadow.position);
        this.setUniformFloat(`${name}.size`, shadow.size);
    }
    
    public setUniformLight(name: string, light: ShaderLight) {
        this.setUniformVector(`${name}.position`, light.position);
        this.setUniformFloat(`${name}.radius`, light.radius);
        this.setUniformFloat(`${name}.intensity`, light.intensity);
        this.setUniformColorRGB(`${name}.color`, light.color);
    }

    public setUniformPortal(name: string, portal: ShaderPortal) {
        this.setUniformVector(`${name}.position`, portal.position);
        this.setUniformFloat(`${name}.radius`, portal.radius);
        this.setUniformFloat(`${name}.strength`, portal.strength);
        this.setUniformFloat(`${name}.age`, portal.age);
    }
}

export { ShaderProgram, MAX_SHADOWS, MAX_LIGHTS, MAX_PORTALS };
export type { ShaderShadow, ShaderLight, ShaderPortal };
