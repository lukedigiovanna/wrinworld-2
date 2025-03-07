class Vector {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public static zero() {
        return new Vector(0, 0);
    }

    public set(other: Vector): void {
        this.x = other.x;
        this.y = other.y;
    }

    public setComponents(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    // Adds the other vector to this one.
    public add(other: Vector): void {
        this.x += other.x;
        this.y += other.y;
    }

    public subtract(other: Vector): void {
        this.add(Vector.scaled(other, -1));
    }

    // component-wise multiplies
    public multiply(other: Vector): void {
        this.x *= other.x;
        this.y *= other.y;
    }

    // component-wise divides
    public divide(other: Vector): void {
        this.x /= other.x;
        this.y /= other.y;
    }

    public get magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public normalize(): void {
        const mag = this.magnitude;
        if (mag !== 0) {
            this.scale(1 / this.magnitude);
        }
    }

    public scale(num: number): void {
        this.x *= num;
        this.y *= num;
    }

    public dot(other: Vector): number {
        return this.x * other.x + this.y * other.y;
    }

    public copy(): Vector {
        return new Vector(this.x, this.y);
    }

    public isZero(): boolean {
        return this.x === 0 && this.y === 0;
    }

    public get angle(): number {
        return Math.atan2(this.y, this.x);
    }

    public static add(vec1: Vector, vec2: Vector): Vector {
        return new Vector(vec1.x + vec2.x, vec1.y + vec2.y);
    }

    public static subtract(vec1: Vector, vec2: Vector): Vector {
        return new Vector(vec1.x - vec2.x, vec1.y - vec2.y);
    }

    public static multiply(vec1: Vector, vec2: Vector) {
        return new Vector(vec1.x * vec2.x, vec1.y * vec2.y);
    }

    public static divide(vec1: Vector, vec2: Vector) {
        return new Vector(vec1.x / vec2.x, vec1.y / vec2.y);
    }

    public static scaled(vec: Vector, num: number): Vector {
        return new Vector(vec.x * num, vec.y * num);
    }

    public static rotated(vec: Vector, angle: number): Vector {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector(
            vec.x * cos - vec.y * sin, 
            vec.x * sin + vec.y * cos
        );
    }

    public static normalized(vec: Vector) {
        const ret = vec.copy();
        ret.normalize();
        return ret;
    }
}

class MathUtils {
    public static clamp(x: number, a: number, b: number) {
        return x < a ? a : (x > b) ? b : x;
    }

    // Rescale the given number from the range [a1, b1] to [a2, b2]
    public static rescale(x: number, a1: number, b1: number, a2: number, b2:number) {
        if (b1 < a1 || b2 < a2) {
            throw new Error("Lower bound of range must be less than upper bound");
        }
        return ((x - a1) / (b1 - a1)) * (b2 - a2) + a2;
    }

    // generates a random float in [a, b)
    public static random(a: number, b: number) {
        if (b < a) {
            throw new Error("Upper bound of range cannot be less than lower bound");
        }
        return Math.random() * (b - a) + a;
    }

    // generates a random integer in [a,b]
    public static randomInt(a: number, b: number) {
        if (b < a) {
            throw new Error("Upper bound of range cannot be less than lower bound")
        }
        return Math.floor(Math.random() * (b - a + 1) + a);
    }

    public static randomChoice(options: any[]) {
        return options[this.randomInt(0, options.length - 1)];
    }

    public static randomVector(magnitude: number): Vector {
        const angle = MathUtils.random(0, Math.PI * 2);
        return new Vector(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
    }

    // achieves the same effect as the following c code: (int) a
    public static int(a: number) {
        if (a > 0) return Math.floor(a);
        else return Math.ceil(a);
    }

    public static interpolate(p: number, a: number, b: number) {
        return a + p * (b - a);
    }
}

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
        const a = MathUtils.interpolate(sx, i0, i1);

        const j0 = dotGridGradient(this._seed, x0, y1, x, y);
        const j1 = dotGridGradient(this._seed, x1, y1, x, y);
        const b = MathUtils.interpolate(sx, j0, j1);

        return MathUtils.interpolate(sy, a, b) * 0.5 + 0.5;
    }
}

export { Vector, MathUtils, PerlinNoise };