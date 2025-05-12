import { MathUtils } from "./MathUtils";

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

export { Permutation };
