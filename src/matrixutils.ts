
// Stores values of a matrix in COLUMN-MAJOR ordering!
class Matrix4 {
    private _values: number[];

    constructor(values: number[]) {
        if (values.length !== 16) {
            throw Error("Matrix 4 must have exactly 16 values in column-major order");
        }
        this._values = values;
    }

    public get values() {
        return this._values;
    }

    public get(row: number, col: number) {
        return this._values[row + col * 4];
    }

    public static multiply(matrix1: Matrix4, matrix2: Matrix4) {
        const values = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += matrix1.get(j, k) * matrix2.get(k, i);
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

    public static rotation(angle: number, aboutX=0, aboutY=0) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Matrix4([
            cos, sin, 0, 0,
            -sin, cos, 0, 0,
            0, 0, 1, 0,
            -cos * aboutX + sin * aboutY + aboutX, -sin * aboutX - cos * aboutY + aboutY, 0, 1,
        ]);
    }

    public static verticalShear(factor: number) {
        return new Matrix4([
            1, 0, 0, 0,
            factor, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    // Construct a transformation matrix from translation, scaling, and rotation.
    public static transformation(tx: number, ty: number, sx: number, sy: number, rot: number, rotX: number, rotY: number, shearK: number) {
        const rotation = Matrix4.rotation(rot, rotX, rotY);
        const scale = Matrix4.scale(sx, sy);
        const translation = Matrix4.translation(tx, ty);
        const shear = Matrix4.verticalShear(shearK);
        return Matrix4.multiply(translation, Matrix4.multiply(shear, Matrix4.multiply(rotation, scale)));
        // const cos = Math.cos(rot);
        // const sin = Math.sin(rot);
        // return new Matrix4([
        //     cos * sx, sin * sx, 0, 0,
        //     -sin * sy, cos * sy, 0, 0,
        //     0, 0, 1, 0,
        //     tx - rotX * cos + rotY * sin + rotX, ty - rotX * sin - rotY * cos + rotY, 0, 1,
        // ]);
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
