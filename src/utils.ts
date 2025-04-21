class Vector {
    private _x: number;
    private _y: number;

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    public static zero() {
        return new Vector(0, 0);
    }

    public static right() {
        return new Vector(1, 0);
    }

    public static left() {
        return new Vector(-1, 0);
    }

    public static up() {
        return new Vector(0, 1);
    }

    public static down() {
        return new Vector(0, -1);
    }

    public get x() {
        return this._x;
    }

    public get y() {
        return this._y;
    }

    public set(other: Vector): void {
        this.x = other.x;
        this.y = other.y;
    }

    public setComponents(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    public set x(num: number) {
        if (isNaN(num)) {
            throw Error("Vector x component cannot be NaN");
        }
        this._x = num;
    }
    
    public set y(num: number) {
        if (isNaN(num)) {
            throw Error("Vector y component cannot be NaN");
        }
        this._y = num;
    }

    // Adds the other vector to this one.
    public add(other: Vector): void {
        this.x += other.x;
        this.y += other.y;
    }

    public plus(other: Vector): Vector {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    public subtract(other: Vector): void {
        this.add(Vector.scaled(other, -1));
    }

    public minus(other: Vector): Vector {
        return new Vector(this.x - other.x, this.y - other.y);
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

    public normalized() {
        return Vector.normalized(this);
    }

    public scale(num: number): void {
        this.x *= num;
        this.y *= num;
    }

    public scaled(num: number) {
        return Vector.scaled(this, num);    
    }

    public dot(other: Vector): number {
        return this.x * other.x + this.y * other.y;
    }

    public scalarCross(other: Vector): number {
        return Vector.scalarCross(this, other);
    }

    public copy(): Vector {
        return new Vector(this._x, this._y);
    }

    public isZero(): boolean {
        return this._x === 0 && this._y === 0;
    }

    public rotate(angle: number) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = this._x * cos - this._y * sin;
        const newY = this._x * sin + this._y * cos;
        this.x = newX;
        this.y = newY;
    }

    public get angle(): number {
        return Math.atan2(this._y, this._x);
    }

    public toString(): string {
        return `(${this._x}, ${this._y})`;
    }

    public distanceTo(other: Vector): number {
        return Vector.subtract(this, other).magnitude;
    }

    public directionTowards(other: Vector): Vector {
        return Vector.subtract(other, this);
    }

    public getNormal(): Vector {
        return new Vector(-this.y, this.x);
    }

    public static add(vec1: Vector, vec2: Vector): Vector {
        return new Vector(vec1._x + vec2._x, vec1._y + vec2._y);
    }

    public static subtract(vec1: Vector, vec2: Vector): Vector {
        return new Vector(vec1._x - vec2._x, vec1._y - vec2._y);
    }

    public static multiply(vec1: Vector, vec2: Vector) {
        return new Vector(vec1._x * vec2._x, vec1._y * vec2._y);
    }

    public static divide(vec1: Vector, vec2: Vector) {
        return new Vector(vec1._x / vec2._x, vec1._y / vec2._y);
    }

    public static scaled(vec: Vector, num: number): Vector {
        return new Vector(vec._x * num, vec._y * num);
    }

    public static rotated(vec: Vector, angle: number): Vector {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector(
            vec._x * cos - vec._y * sin, 
            vec._x * sin + vec._y * cos
        );
    }

    public static normalized(vec: Vector) {
        const ret = vec.copy();
        ret.normalize();
        return ret;
    }

    // Returns the z component of the cross product of the two vectors.
    public static scalarCross(vec1: Vector, vec2: Vector): number {
        return vec1.x * vec2.y - vec1.y * vec2.x;
    }
}

interface Rectangle {
    right: number;
    left: number;
    bottom: number;
    top: number;
}

class Rectangle {
    public static from(position: Vector, scale: Vector): Rectangle {
        const width2 = Math.abs(scale.x) / 2;
        const height2 = Math.abs(scale.y) / 2;
        return {
            right: position.x + width2,
            left: position.x - width2,
            top: position.y + height2,
            bottom: position.y - height2,
        };
    }
}

class NumberRange {
    public low: number;
    public high: number;

    constructor(low: number, high: number) {
        this.low = low;
        this.high = high;
    }

    public random(): number {
        return MathUtils.random(this.low, this.high);
    }

    public randomInt(): number {
        return MathUtils.randomInt(this.low, this.high);
    }

    public static single(n: number) {
        return new NumberRange(n, n);
    }

    public static one() {
        return NumberRange.single(1);
    }
}

class MathUtils {
    // Computes a real modulus (as compared with the remainder operator - %)
    public static modulo(n: number, d: number) {
        return ((n % d) + d) % d;
    }      

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
        if (options.length === 0) {
            return undefined;
        }
        return options[this.randomInt(0, options.length - 1)];
    }

    public static randomWeightedChoice(options: any[], chances: number[]) {
        // Establish preconditions: chances must sum to 1 and the chances must correspond with the options
        if (options.length !== chances.length) {
            throw Error("Options and chances must be the same size");
        }
        let sumChance = 0;
        for (let i = 0; i < chances.length; i++) sumChance += chances[i];
        if (Math.abs(sumChance - 1) > 1e-4) {
            throw Error("Chances must sum to 1");
        }
        const p = Math.random();
        let s = 0;
        for (let i = 0; i < options.length; i++) {
            s += chances[i];
            if (p < s) {
                return options[i];
            }
        }
        return options[options.length - 1];
    }

    public static randomVector(magnitude: number): Vector {
        const angle = MathUtils.random(0, Math.PI * 2);
        return new Vector(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
    }

    public static randomAngle() {
        return MathUtils.random(0, 2 * Math.PI);
    }

    // achieves the same effect as the following c code: (int) a
    public static int(a: number) {
        if (a > 0) return Math.floor(a);
        else return Math.ceil(a);
    }

    public static interpolate(p: number, a: number, b: number) {
        return a + p * (b - a);
    }

    // Returns the distance to the target if it intersects and null if it never intersects
    public static raycast(origin: Vector, direction: Vector, target: Rectangle) {
        direction = Vector.normalized(direction);
        // Operate on a parameterized function: p(t) = origin + direction * t
        const p = (t: number) => Vector.add(origin, Vector.scaled(direction, t));
        const check = (side: keyof Rectangle) => {
            let axis;
            let altAxis;
            if (side === "left" || side === "right") {
                axis = "x";
                altAxis = "y";
            }
            else {
                axis = "y";
                altAxis = "x";
            }
            if ((direction as any)[axis] === 0) {
                return null;
            }
            let t = (target[side] - (origin as any)[axis]) / (direction as any)[axis];
            if (t >= 0) {
                let q = (p(t) as any)[altAxis];
                if (axis === "x") {
                    if (q >= target.bottom && q <= target.top) {
                        return t;
                    }
                }
                else {
                    if (q >= target.left && q <= target.right) {
                        return t;
                    }
                }
            }
            return null;
        }
        let min = Infinity;
        ["left", "right", "bottom", "top"].forEach(side => {
            const c = check(side as keyof Rectangle);
            if (c !== null && c < min) {
                min = c;
            }
        });

        return min;
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

// Note that a copy of the array is not made, so the given array should not be
// modified after creating and before using this permutation object.
class Permutation<T> {
    private array: T[];
    private permutation: number[];
    private currIndex: number = 0;

    constructor(array: T[]) {
        const max = array.length;
        this.array = array;
        this.permutation = Array.from({ length: max }, (_, v) => v) as number[];
        // Fisher yates shuffle
        for (let i = 0; i < max - 2; i++) {
            const j = MathUtils.randomInt(i, max - 1);
            const t = this.permutation[i];
            this.permutation[i] = this.permutation[j];
            this.permutation[j] = t;
        }
    }

    public get next(): T | undefined {
        if (this.currIndex >= this.permutation.length) {
            return undefined;
        }
        const value = this.array[this.permutation[this.currIndex]];
        this.currIndex++;
        return value;
    }
}

class LinearParametricCurve {
    private points: Vector[];

    constructor(points: Vector[]) {
        this.points = points;
        if (this.points.length < 2) {
            throw Error("Cannot construct a LinearParametricCurve with less than 2 control points");
        }
    }

    getPosition(t: number): Vector {
        const p = MathUtils.clamp(t, 0, 1);
        const i = Math.floor(p * (this.points.length - 1));
        const startPoint = this.points[i];
        const nextPoint = this.points[Math.min(i + 1, this.points.length - 1)];
        const R = 1 / this.points.length;
        const localP = (p % R) / R;
        return Vector.add(startPoint, Vector.scaled(Vector.subtract(nextPoint, startPoint), localP));
    }

    getNormal(t: number): Vector {
        const p = MathUtils.clamp(t, 0, 1);
        const i = Math.floor(p * (this.points.length - 1));
        const startPoint = this.points[i];
        const nextPoint = this.points[Math.min(i + 1, this.points.length - 1)];
        const tangent = Vector.normalized(Vector.subtract(nextPoint, startPoint));   
        const normal = new Vector(-tangent.y, tangent.x);
        return normal;
    }
}

// Compute a point on the Catmull-Rom spline
function catmullRom(p0: Vector, p1: Vector, p2: Vector, p3: Vector, t: number): Vector {
    const t2 = t * t;
    const t3 = t2 * t;

    return new Vector(
        0.5 * (
            (2 * p1.x) + (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        ),
        0.5 * (
            (2 * p1.y) + (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        )
    );
}

// Compute the derivative (tangent) of the Catmull-Rom spline for normals
function catmullRomDerivative(p0: Vector, p1: Vector, p2: Vector, p3: Vector, t: number): Vector {
    const t2 = t * t;

    return new Vector(
        0.5 * (
            (-p0.x + p2.x) + (4 * p0.x - 10 * p1.x + 8 * p2.x - 2 * p3.x) * t +
            (-3 * p0.x + 9 * p1.x - 9 * p2.x + 3 * p3.x) * t2
        ),
        0.5 * (
            (-p0.y + p2.y) + (4 * p0.y - 10 * p1.y + 8 * p2.y - 2 * p3.y) * t +
            (-3 * p0.y + 9 * p1.y - 9 * p2.y + 3 * p3.y) * t2
        )
    );
}

class CatmullRomParametricCurve {
    private controlPoints: Vector[];

    constructor (controlPoints: Vector[]) {
        this.controlPoints = controlPoints;
        if (this.controlPoints.length < 2) {
            throw Error("Cannot construct a LinearParametricCurve with less than 2 control points");
        }
    }

    getPosition(t: number): Vector {
        const p = MathUtils.clamp(t, 0, 1);
        const i = Math.floor(p * (this.controlPoints.length - 1));
        const p0 = this.controlPoints[Math.max(0, i - 1)];
        const start = this.controlPoints[i];
        const next = this.controlPoints[Math.min(i + 1, this.controlPoints.length - 1)];
        const p3 = this.controlPoints[Math.min(i + 2, this.controlPoints.length - 1)];
        const R = 1 / this.controlPoints.length;
        const localP = (p % R) / R;
        return catmullRom(p0, start, next, p3, localP);
    }

    getNormal(t: number): Vector {
        const p = MathUtils.clamp(t, 0, 1);
        const i = Math.floor(p * (this.controlPoints.length - 1));
        const p0 = this.controlPoints[Math.max(0, i - 1)];
        const start = this.controlPoints[i];
        const next = this.controlPoints[Math.min(i + 1, this.controlPoints.length - 1)];
        const p3 = this.controlPoints[Math.min(i + 2, this.controlPoints.length - 1)];
        const R = 1 / this.controlPoints.length;
        const localP = (p % R) / R;
        const tangent = Vector.normalized(catmullRomDerivative(p0, start, next, p3, localP));
        const normal = new Vector(-tangent.y, tangent.x);
        return normal;
    }
}

class Ease {
    public static outElastic(x: number) {
        const c4 = (2 * Math.PI) / 3;

        return x === 0
             ? 0
             : x === 1
             ? 1
             : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    public static inQuart(x: number): number {
        return x * x * x * x;
    }

    public static easeInExpo(x: number): number {
        return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
    }        
}

class Color {
    private _r: number;
    private _g: number;
    private _b: number;
    private _a: number;

    constructor(r: number, g: number, b: number, a: number) {
        this._r = MathUtils.clamp(r, 0, 1);
        this._g = MathUtils.clamp(g, 0, 1);
        this._b = MathUtils.clamp(b, 0, 1);
        this._a = MathUtils.clamp(a, 0, 1);
    }

    public get r() {
        return this._r;
    }

    public get g() {
        return this._g;
    }

    public get b() {
        return this._b;
    }

    public get a() {
        return this._a;
    }

    public static add(color1: Color, color2: Color) {
        return new Color(color1.r + color2.r, color1.g + color2.g, color1.b + color2.b, Math.max(color1.a, color2.a));
    }

    public static hex(hexString: string) {
        // Expect format #rrggbb
        if (hexString.charAt(0) !== '#' || hexString.length !== 7) {
            throw Error("Improperly formatted hex color string: " + hexString);
        }
        const rStr = hexString.substring(1, 3);
        const gStr = hexString.substring(3, 5);
        const bStr = hexString.substring(5, 7);
        const r = Number.parseInt(rStr, 16);
        const g = Number.parseInt(gStr, 16);
        const b = Number.parseInt(bStr, 16);
        return new Color(r / 255, g / 255, b / 255, 1.0);
    }

    public static WHITE = new Color(1, 1, 1, 1);
    public static GRAY = new Color(0.5, 0.5, 0.5, 1);
    public static BLACK = new Color(0, 0, 0, 1);
    public static RED = new Color(1, 0, 0, 1);
    public static ORANGE = new Color(1, 0.5, 0, 1);
    public static YELLOW = new Color(1, 1, 0, 1);
    public static GREEN = new Color(0, 1, 0, 1);
    public static BLUE = new Color(0, 0, 1, 1);
    public static MAGENTA = new Color(1, 0, 1, 1);
    public static CYAN = new Color(0, 1, 1, 1);
}

export { Vector, MathUtils, PerlinNoise, LinearParametricCurve, 
         CatmullRomParametricCurve, Ease, NumberRange, Rectangle, Permutation, Color };