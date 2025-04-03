class Matrix4 {
    private _values: number[];

    constructor(values: number[]) {
        if (values.length !== 16) {
            throw Error("Matrix 4 must have exactly 16 values in row-major order");
        }
        this._values = values;
    }

    public get values() {
        return this._values;
    }

    public static identity() {
        return new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }
}

function getOrthographicProjection(left: number, right: number, bottom: number, top: number, far: number, near: number) {
    return new Matrix4([
        2 / (right - left), 0, 0, -(right + left) / (right - left),
        0, 2 / (top - bottom), 0, -(top + bottom) / (top - bottom),
        0, 0, -2 / (far - near), -(far + near) / (far - near),
        0, 0, 0, 1
    ]);
}

export { Matrix4, getOrthographicProjection };
