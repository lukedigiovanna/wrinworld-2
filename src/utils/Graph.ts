interface Vertex<S, T> {
    data?: T;
    neighbors: S[];
}

// Represents an undirected graph.
class Graph<S, T = undefined> {
    private vertices: Map<S, Vertex<S, T>>;

    constructor() {
        this.vertices = new Map();
    }

    private forceGetVertex(vertexKey: S): Vertex<S, T> {
        const vertex = this.vertices.get(vertexKey);
        if (vertex === undefined) {
            throw Error("Graph has no vertex: " + vertexKey);
        }
        return vertex;
    }

    public addEdge(vertexKey1: S, vertexKey2: S) {
        const vertex1 = this.forceGetVertex(vertexKey1);
        const vertex2 = this.forceGetVertex(vertexKey2);
        vertex1.neighbors.push(vertexKey2);
        vertex2.neighbors.push(vertexKey1);
    }

    public addVertex(vertexKey: S, vertexData: T): void;
    public addVertex(vertexKey: S): void;

    public addVertex(vertexKey: S, vertexData?: T) {
        this.vertices.set(vertexKey, {
            data: vertexData,
            neighbors: []
        })
    }

    public hasVertex(vertex: S): boolean {
        return this.vertices.has(vertex);
    }

    public getVertexNeighbors(vertexKey: S): S[] {
        return this.forceGetVertex(vertexKey).neighbors;
    }

    public getVertexData(vertexKey: S): T {
        return this.forceGetVertex(vertexKey).data!;
    }

    // Returns a random vertex key from this graph
    public getVertexKeys(): S[] {
        return Array.from(this.vertices.entries()).map((v) => v[0]);
    }

    public dfsSearch(startVertexKey: S, endVertexKey: S) {
        if (!this.hasVertex(startVertexKey)) {
            throw Error("Cannot perform dfs on vertex not in graph: " + startVertexKey);
        }
        if (!this.hasVertex(endVertexKey)) {
            throw Error("Cannot perform dfs on vertex not in graph: " + startVertexKey);
        }
        const stack = [startVertexKey];
        const visited = new Set<S>();
        visited.add(startVertexKey);
        const parents = new Map<S, S>();
        while (stack.length > 0) {
            const node = stack.pop()!;
            for (const neighbor of this.getVertexNeighbors(node)) {
                if (neighbor === endVertexKey) {
                    const path = [endVertexKey];
                    let curr = node;
                    while (curr !== startVertexKey) {
                        path.push(curr);
                        curr = parents.get(curr)!;
                    }
                    path.push(curr);
                    console.log(curr);
                    return path;
                }
                if (!visited.has(neighbor)) {
                    parents.set(neighbor, node);
                    stack.push(neighbor);
                    visited.add(neighbor);
                }
            }
        }
        return undefined;
    }

    public bfsIterate(startVertexKey: number, func: (key: S, neighbors: S[], data?: T) => void) {
        // unimplemented (not currently used)
    }
}

export { Graph };
