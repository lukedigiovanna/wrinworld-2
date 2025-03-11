// Simple wrapper that does not allow invalid reads
// useful for "codex" systems, hence the name.

class Codex<S, T> {
    private map: Map<S, T>;

    constructor() {
        this.map = new Map<S, T>();
    }

    public set(key: S, value: T) {
        this.map.set(key, value);
    }

    public get(key: S) {
        const value = this.map.get(key);
        if (!value) {
            throw Error("Tried getting from a codex with an invalid key: " + key);
        }
        return value;
    }
}

export { Codex };
