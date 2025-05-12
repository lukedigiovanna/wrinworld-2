function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Gives a bijective map Z -> Z_{>=0} (i.e. maps the number line of integers 1-1 to
// positive numbers)
function zMap(x: number) {
    return x >= 0 ? x * 2 : -2 * x - 1;
}

function cantorPairIndex(x: number, y: number) {
    // perform cantor-pair mapping
    x = zMap(x);
    y = zMap(y);
    return (x + y) * (x + y + 1) / 2 + y;
}

export { sleep, cantorPairIndex };
export * from "./Color";
export * from "./DefaultMap";
export * from "./Ease";
export * from "./Graph";
export * from "./Grid";
export * from "./LazyGrid";
export * from "./MathUtils";
export * from "./Matrix4";
export * from "./NumberRange";
export * from "./ParametricCurve";
export * from "./PerlinNoise";
export * from "./Permutation";
export * from "./Point";
export * from "./PriorityQueue";
export * from "./Rectangle";
export * from "./Vector";
