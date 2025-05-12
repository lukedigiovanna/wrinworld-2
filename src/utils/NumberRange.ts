import { MathUtils } from "./MathUtils";

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

export { NumberRange };
