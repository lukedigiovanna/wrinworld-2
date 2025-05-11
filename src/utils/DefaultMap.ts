class DefaultMap<S, T> {
    private map: Map<S, T>;
    private initializer: () => T;

    constructor(initializer: () => T) {
        this.map = new Map();
        this.initializer = initializer;
    }

    public get(key: S): T {
        const value = this.map.get(key);
        if (value === undefined) {
            const newValue = this.initializer();
            this.map.set(key, newValue);
            return newValue;
        }
        return value;
    }

    public set(key: S, value: T) {
        this.map.set(key, value);
    }

    public entries() {
        return this.map.entries();
    }

    public has(key: S): boolean {
        return this.map.has(key);
    }
}

export { DefaultMap };
