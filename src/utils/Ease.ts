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
}

export { Ease };
