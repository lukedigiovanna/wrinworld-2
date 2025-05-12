import { Vector } from "./Vector";
import { Rectangle } from "./Rectangle";

class MathUtils {
    // Computes a real modulus (as compared with the remainder operator - %)
    public static modulo(n: number, d: number) {
        return ((n % d) + d) % d;
    }      

    public static clamp(x: number, a: number, b: number) {
        return x < a ? a : (x > b) ? b : x;
    }

    // Rescale the given number from the range [a1, b1] to [a2, b2]
    public static rescale(x: number, a1: number, b1: number, a2: number, b2:number) {
        return ((x - a1) / (b1 - a1)) * (b2 - a2) + a2;
    }

    // generates a random float in [a, b)
    public static random(a: number, b: number) {
        return Math.random() * (b - a) + a;
    }

    // generates a random integer in [a,b]
    public static randomInt(a: number, b: number) {
        if (b < a) {
            throw new Error("Upper bound of range cannot be less than lower bound")
        }
        return Math.floor(Math.random() * (b - a + 1) + a);
    }

    public static randomChoice<T>(options: T[]) {
        if (options.length === 0) {
            throw Error("Cannot give empty array")
        }
        return options[this.randomInt(0, options.length - 1)];
    }

    public static randomWeightedChoice<T = any>(options: T[], weights: number[]): T {
        if (options.length !== weights.length) {
            throw Error("Options and chances must be the same size");
        }
        let sum = 0;
        for (let i = 0; i < weights.length; i++) sum += weights[i];
        const chances = weights.map(w => w / sum);
        const p = Math.random();
        let s = 0;
        for (let i = 0; i < options.length; i++) {
            s += chances[i];
            if (p < s) {
                return options[i];
            }
        }
        return options[options.length - 1];
    }

    public static randomVector(magnitude: number): Vector {
        const angle = MathUtils.random(0, Math.PI * 2);
        return new Vector(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
    }

    public static randomAngle() {
        return MathUtils.random(0, 2 * Math.PI);
    }

    // achieves the same effect as the following c code: (int) a
    public static int(a: number) {
        if (a > 0) return Math.floor(a);
        else return Math.ceil(a);
    }

    public static lerp(a: number, b: number, p: number) {
        return a + p * (b - a);
    }

    // Returns the distance to the target if it intersects and null if it never intersects
    public static raycast(origin: Vector, direction: Vector, target: Rectangle) {
        direction = Vector.normalized(direction);
        // Operate on a parameterized function: p(t) = origin + direction * t
        const p = (t: number) => Vector.add(origin, Vector.scaled(direction, t));
        const check = (side: keyof Rectangle) => {
            let axis;
            let altAxis;
            if (side === "left" || side === "right") {
                axis = "x";
                altAxis = "y";
            }
            else {
                axis = "y";
                altAxis = "x";
            }
            if ((direction as any)[axis] === 0) {
                return null;
            }
            let t = (target[side] - (origin as any)[axis]) / (direction as any)[axis];
            if (t >= 0) {
                let q = (p(t) as any)[altAxis];
                if (axis === "x") {
                    if (q >= target.bottom && q <= target.top) {
                        return t;
                    }
                }
                else {
                    if (q >= target.left && q <= target.right) {
                        return t;
                    }
                }
            }
            return null;
        }
        let min = Infinity;
        ["left", "right", "bottom", "top"].forEach(side => {
            const c = check(side as keyof Rectangle);
            if (c !== null && c < min) {
                min = c;
            }
        });

        return min;
    }
}

export { MathUtils };
