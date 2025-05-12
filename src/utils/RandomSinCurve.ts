import { MathUtils } from "./MathUtils";

interface SinParameters {
    amplitude: number;
    offset: number;
    period: number;
}

class RandomSinCurve {
    private functions: SinParameters[];

    // the period and amplitude 
    constructor(period: number, amplitude: number, K: number) {
        if (K < 1) {
            throw Error("Cannot generate a random sin curve with less than 1 function");
        }
        this.functions = [];
        for (let i = 0; i < K; i++) {
            const factor = (i + 1) / K;
            this.functions.push({
                amplitude: MathUtils.random(0.8, 1.2) * factor * amplitude,
                offset: MathUtils.random(0, period),
                period: MathUtils.random(0.8, 1.2) * factor * period,
            });
        }
    }

    public get(t: number) {
        return this.functions.reduce(
            (value, params) => value + Math.sin(t * 2 * Math.PI / params.period + params.offset) * params.amplitude, 
            0
        )
    }

    public prettyPrint() {
        let str = "";
        for (let i = 0; i < this.functions.length; i++) {
            const params = this.functions[i];
            str += `${params.amplitude} * sin(x * 2π / ${params.period} + ${params.offset})`;
            if (i < this.functions.length - 1) {
                str += " + ";
            }
        }
        console.log(str);
    }
}

export { RandomSinCurve };
