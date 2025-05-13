import { Vector } from "./Vector";

class Rectangle {
    readonly right: number;
    readonly left: number;
    readonly bottom: number;
    readonly top: number;

    constructor(left: number, right: number, bottom: number, top: number) {
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
    }

    public get center(): Vector {
        return new Vector((this.left + this.right) / 2, (this.bottom + this.top) / 2);
    }

    public get width(): number {
        return this.right - this.left;
    }

    public get height(): number {
        return this.top - this.bottom;
    }

    public static from(position: Vector, scale: Vector): Rectangle {
        const width2 = Math.abs(scale.x) / 2;
        const height2 = Math.abs(scale.y) / 2;
        return new Rectangle(
            position.x + width2,
            position.x - width2,
            position.y + height2,
            position.y - height2,
        );
    }
}

export { Rectangle };
