import { Vector } from "./Vector";

interface Rectangle {
    right: number;
    left: number;
    bottom: number;
    top: number;
}

class Rectangle {
    constructor(left: number, right: number, bottom: number, top: number) {
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
    }

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

export { Rectangle };
