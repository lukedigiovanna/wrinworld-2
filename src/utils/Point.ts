import { Vector } from "./Vector";

class Point {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        if (!Number.isInteger(x) || !Number.isInteger(y)) {
            throw Error(`Point must be integer valued: x=${x} y=${y}`)
        }
        this.x = x;
        this.y = y;
    }

    public equals(other: Point) {
        return this.x === other.x && this.y === other.y;
    }

    public copy() {
        return new Point(this.x, this.y);
    }

    public static from(vector: Vector) {
        return new Point(Math.floor(vector.x), Math.floor(vector.y));
    }
}

export { Point };
