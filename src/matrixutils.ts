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

    public get(row: number, col: number) {
        return this._values[row * 4 + col];
    }

    public static multiply(matrix1: Matrix4, matrix2: Matrix4) {
        const values = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += matrix1.get(i, k) * matrix2.get(k, j);
                }
                values.push(sum);
            }
        }
        return new Matrix4(values);
    }

    public static identity() {
        return new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

    public static translation(tx: number, ty: number) {
        return new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx, ty, 0, 1,
        ]);
    }

    public static scale(sx: number, sy: number) {
        return new Matrix4([
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

    public static rotation(angle: number) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Matrix4([
            cos, sin, 0, 0,
            -sin, cos, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }
}

function getOrthographicProjection(left: number, right: number, bottom: number, top: number, near: number, far: number) {
    return new Matrix4([
        2 / (right - left), 0, 0, 0,
        0, 2 / (top - bottom), 0, 0,
        0, 0, -2 / (far - near), 0,
        -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(far + near) / (far - near), 1,
    ])
}

export { Matrix4, getOrthographicProjection };
