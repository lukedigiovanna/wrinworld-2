import { Vector } from "./Vector";
import { MathUtils } from "./MathUtils";

const randomGradient = (seed: number, x: number, y: number) => {
    const w = 32, s = 16;
    let a = Math.imul(x, seed), b = Math.imul(y, seed);
    a = Math.imul(a, 3284157433);
    b ^= a << s | a >>> w - s;
    b = Math.imul(b, 1911520717); 
    a ^= b << s | b >>> w - s;
    a = Math.abs(Math.imul(a, 2048419325)) / (2147483648) * 2 * Math.PI;
    return new Vector(Math.cos(a), Math.sin(a));
}

const dotGridGradient = (seed: number, ix: number, iy: number, x: number, y: number) => {
    const gradient = randomGradient(seed, ix, iy);
    const dx = x - ix;
    const dy = y - iy;
    return dx * gradient.x + dy * gradient.y;
}

// infinite perlin-noise generator that uses a set seed
class PerlinNoise {
    private _seed;

    constructor(seed: number) {
        this._seed = seed;
    }

    public get seed() {
        return this._seed;
    }

    public get(x: number, y: number): number {
        const x0 = Math.trunc(x), x1 = x0 + 1;
        const y0 = Math.trunc(y), y1 = y0 + 1;

        const sx = x - x0;
        const sy = y - y0;

        const i0 = dotGridGradient(this._seed, x0, y0, x, y);
        const i1 = dotGridGradient(this._seed, x1, y0, x, y);
        const a = MathUtils.lerp(i0, i1, sx);

        const j0 = dotGridGradient(this._seed, x0, y1, x, y);
        const j1 = dotGridGradient(this._seed, x1, y1, x, y);
        const b = MathUtils.lerp(j0, j1, sx);

        return MathUtils.lerp(a, b, sy) * 0.5 + 0.5;
    }
}

export { PerlinNoise };
