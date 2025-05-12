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

export { Vector };
