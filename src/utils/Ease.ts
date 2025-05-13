class Ease {
    public static outElastic(x: number) {
        const c4 = (2 * Math.PI) / 3;

        return x <= 0
             ? 0
             : x >= 1
             ? 1
             : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    public static inQuart(x: number): number {
        return this.linear(x * x * x * x);
    }

    public static easeInExpo(x: number): number {
        return x === 0 ? 0 : this.linear(Math.pow(2, 10 * x - 10));
    }
    
    public static linear(x: number) {
        return x < 0 ? 0 
             : x < 1 ? x 
             : 1;
    }

    public static inOutSine(x: number): number {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }

    public static outBounce(x: number): number {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (x < 1 / d1) {
            return n1 * x * x;
        } else if (x < 2 / d1) {
            return n1 * (x -= 1.5 / d1) * x + 0.75;
        } else if (x < 2.5 / d1) {
            return n1 * (x -= 2.25 / d1) * x + 0.9375;
        } else {
            return n1 * (x -= 2.625 / d1) * x + 0.984375;
        }
    }

    public static inOutBounce(x: number): number {
        return x < 0.5
            ? (1 - Ease.outBounce(1 - 2 * x)) / 2
            : (1 + Ease.outBounce(2 * x - 1)) / 2;
    }
}

export { Ease };
