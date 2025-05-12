import { Vector } from "./Vector";
import { MathUtils } from "./MathUtils";

class LinearParametricCurve {
    private points: Vector[];

    constructor(points: Vector[]) {
        this.points = points;
        if (this.points.length < 2) {
            throw Error("Cannot construct a LinearParametricCurve with less than 2 control points");
        }
    }

    getPosition(t: number): Vector {
        const p = MathUtils.clamp(t, 0, 1);
        const i = Math.floor(p * (this.points.length - 1));
        const startPoint = this.points[i];
        const nextPoint = this.points[Math.min(i + 1, this.points.length - 1)];
        const R = 1 / this.points.length;
        const localP = (p % R) / R;
        return Vector.add(startPoint, Vector.scaled(Vector.subtract(nextPoint, startPoint), localP));
    }

    getNormal(t: number): Vector {
        const p = MathUtils.clamp(t, 0, 1);
        const i = Math.floor(p * (this.points.length - 1));
        const startPoint = this.points[i];
        const nextPoint = this.points[Math.min(i + 1, this.points.length - 1)];
        const tangent = Vector.normalized(Vector.subtract(nextPoint, startPoint));   
        const normal = new Vector(-tangent.y, tangent.x);
        return normal;
    }
}

// Compute a point on the Catmull-Rom spline
function catmullRom(p0: Vector, p1: Vector, p2: Vector, p3: Vector, t: number): Vector {
    const t2 = t * t;
    const t3 = t2 * t;

    return new Vector(
        0.5 * (
            (2 * p1.x) + (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        ),
        0.5 * (
            (2 * p1.y) + (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        )
    );
}

// Compute the derivative (tangent) of the Catmull-Rom spline for normals
function catmullRomDerivative(p0: Vector, p1: Vector, p2: Vector, p3: Vector, t: number): Vector {
    const t2 = t * t;

    return new Vector(
        0.5 * (
            (-p0.x + p2.x) + (4 * p0.x - 10 * p1.x + 8 * p2.x - 2 * p3.x) * t +
            (-3 * p0.x + 9 * p1.x - 9 * p2.x + 3 * p3.x) * t2
        ),
        0.5 * (
            (-p0.y + p2.y) + (4 * p0.y - 10 * p1.y + 8 * p2.y - 2 * p3.y) * t +
            (-3 * p0.y + 9 * p1.y - 9 * p2.y + 3 * p3.y) * t2
        )
    );
}

class CatmullRomParametricCurve {
    private controlPoints: Vector[];

    constructor (controlPoints: Vector[]) {
        this.controlPoints = controlPoints;
        if (this.controlPoints.length < 2) {
            throw Error("Cannot construct a LinearParametricCurve with less than 2 control points");
        }
    }

    getPosition(t: number): Vector {
        const p = MathUtils.clamp(t, 0, 1);
        const i = Math.floor(p * (this.controlPoints.length - 1));
        const p0 = this.controlPoints[Math.max(0, i - 1)];
        const start = this.controlPoints[i];
        const next = this.controlPoints[Math.min(i + 1, this.controlPoints.length - 1)];
        const p3 = this.controlPoints[Math.min(i + 2, this.controlPoints.length - 1)];
        const R = 1 / this.controlPoints.length;
        const localP = (p % R) / R;
        return catmullRom(p0, start, next, p3, localP);
    }

    getNormal(t: number): Vector {
        const p = MathUtils.clamp(t, 0, 1);
        const i = Math.floor(p * (this.controlPoints.length - 1));
        const p0 = this.controlPoints[Math.max(0, i - 1)];
        const start = this.controlPoints[i];
        const next = this.controlPoints[Math.min(i + 1, this.controlPoints.length - 1)];
        const p3 = this.controlPoints[Math.min(i + 2, this.controlPoints.length - 1)];
        const R = 1 / this.controlPoints.length;
        const localP = (p % R) / R;
        const tangent = Vector.normalized(catmullRomDerivative(p0, start, next, p3, localP));
        const normal = new Vector(-tangent.y, tangent.x);
        return normal;
    }
}

export { LinearParametricCurve, CatmullRomParametricCurve };
