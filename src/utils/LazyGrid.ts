
function zMap(x: number) {
    return x >= 0 ? x * 2 : -2 * x - 1;
}

function hash(x: number, y: number) {
    // perform cantor-pair mapping
    x = zMap(x);
    y = zMap(y);
    return (x + y) * (x + y + 1) / 2 + y;
} 

// Infinite grid that only stores values for positions that have been set.
class LazyGrid<T> {
    private cells: Map<number, T>;

    constructor() {
        this.cells = new Map<number, T>();
    }

    public has(x: number, y: number) {
        return this.cells.has(hash(x, y));
    }

    public set(x: number, y: number, value: T) {
        this.cells.set(hash(x, y), value);
    }

    public get(x: number, y: number) {
        return this.cells.get(hash(x, y));
    }
}

export { LazyGrid };
