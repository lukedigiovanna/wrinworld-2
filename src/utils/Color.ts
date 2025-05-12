import { MathUtils } from "./MathUtils";

class Color {
    private _r: number;
    private _g: number;
    private _b: number;
    private _a: number;

    constructor(r: number, g: number, b: number, a: number) {
        this._r = MathUtils.clamp(r, 0, 1);
        this._g = MathUtils.clamp(g, 0, 1);
        this._b = MathUtils.clamp(b, 0, 1);
        this._a = MathUtils.clamp(a, 0, 1);
    }

    public get r() {
        return this._r;
    }

    public get g() {
        return this._g;
    }

    public get b() {
        return this._b;
    }

    public get a() {
        return this._a;
    }

    public static add(color1: Color, color2: Color) {
        return new Color(color1.r + color2.r, color1.g + color2.g, color1.b + color2.b, Math.max(color1.a, color2.a));
    }

    public static lerp(color1: Color, color2: Color, p: number): Color {
        return new Color(
            MathUtils.lerp(color1.r, color2.r, p),
            MathUtils.lerp(color1.g, color2.g, p),
            MathUtils.lerp(color1.b, color2.b, p),
            Math.min(color1.a, color2.a),
        );
    }

    public static hex(hexString: string) {
        // Expect format #rrggbb
        if (hexString.charAt(0) !== '#' || hexString.length !== 7) {
            throw Error("Improperly formatted hex color string: " + hexString);
        }
        const rStr = hexString.substring(1, 3);
        const gStr = hexString.substring(3, 5);
        const bStr = hexString.substring(5, 7);
        const r = Number.parseInt(rStr, 16);
        const g = Number.parseInt(gStr, 16);
        const b = Number.parseInt(bStr, 16);
        return new Color(r / 255, g / 255, b / 255, 1.0);
    }

    public static WHITE = new Color(1, 1, 1, 1);
    public static GRAY = new Color(0.5, 0.5, 0.5, 1);
    public static BLACK = new Color(0, 0, 0, 1);
    public static RED = new Color(1, 0, 0, 1);
    public static ORANGE = new Color(1, 0.5, 0, 1);
    public static YELLOW = new Color(1, 1, 0, 1);
    public static GREEN = new Color(0, 1, 0, 1);
    public static BLUE = new Color(0, 0, 1, 1);
    public static MAGENTA = new Color(1, 0, 1, 1);
    public static CYAN = new Color(0, 1, 1, 1);
}

export { Color };
