import { MathUtils } from "./";
import { Optional } from "./types";

class Grid<T> {
    private cells: T[];
    public readonly width: number;
    public readonly height: number;

    constructor(width: number, height: number, defaultValue: T) {
        this.width = width;
        this.height = height;
        this.cells = Array.from({ length: width * height }, () => defaultValue);
    }

    public drawHorizontalLine(row: number, c0: number, c1: number, value: T) {
        c0 = MathUtils.clamp(c0, 0, this.width - 1);
        c1 = MathUtils.clamp(c1, 0, this.width - 1);
        let d = Math.sign(c1 - c0);
        while (c0 !== c1) {
            // Allow draw if drawing on an existing cell or the sides are clear
            if (this.getOptional(row, c0) || (!this.getOptional(row + 1, c0) && !this.getOptional(row - 1, c0))) {
                this.set(row, c0, value);
                c0 += d;
            }
            else {
                return;
            }
        }
        this.set(row, c0, value);
    }
    
    public drawVerticalLine(col: number, r0: number, r1: number, value: T) {
        r0 = MathUtils.clamp(r0, 0, this.height - 1);
        r1 = MathUtils.clamp(r1, 0, this.height - 1);
        let d = Math.sign(r1 - r0);
        while (r0 !== r1) {
            if (this.getOptional(r0, col) || (!this.getOptional(r0, col + 1) && !this.getOptional(r0, col - 1))) {
                this.set(r0, col, value);
                r0 += d;
            }
            else {
                return;
            }
        }
        this.set(r0, col, value);
    }

    public set(row: number, col: number, value: T) {
        this.cells[row * this.width + col] = value;
    }

    public get(row: number, col: number): T {
        if (!this.validCoord(row, col)) {
            throw Error(`Invalid coordinate: row=${row} col=${col}`);
        }
        return this.cells[row * this.width + col];
    }

    public getOptional(row: number, col: number): Optional<T> {
        if (!this.validCoord(row, col)) {
            return undefined;
        }
        return this.cells[row * this.width + col];
    }

    public validCoord(row: number, col: number): boolean {
        return row >= 0 && row < this.height && col >= 0 && col < this.width;
    }

    // Applies the given function over the grid.
    public iterate(func: (self: Grid<T>, row: number, col: number) => void) {
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                func(this, r, c);
            }
        }
    }

    public static from<T>(array: T[], width: number, height: number) {
        if (array.length < width * height) {
            throw Error("Cannot generate a grid with an array smaller than the target dimension");
        }
        const grid = new Grid<T>(width, height, array[0]);
        grid.iterate((self, r, c) => {
            self.set(r, c, array[r * width + c]);
        });
        return grid;
    }

    public copy(): Grid<T> {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }

    public prettyPrint() {
        let out = "";
        for (let r = this.height - 1; r >= 0; r--) {
            let rowStr = "|";
            for (let c = 0; c < this.width; c++) {
                rowStr += this.get(r, c) ? this.get(r, c) + " " : "  ";
            }
            out += rowStr + "|\n";
        }
        console.log(out);
    }
}

interface GridPosition {
    row: number;
    col: number;
}

export { Grid, GridPosition };
