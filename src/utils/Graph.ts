import { MathUtils } from "./";
import { DefaultMap } from "./DefaultMap";

interface Vertex<S, T> {
    data: T;
    neighbors: S[];
}

// Represents an undirected graph.
class Graph<S, T> {
    private vertices: Map<S, Vertex<S, T>>;

    constructor() {
        this.vertices = new Map();
    }

    private forceGetVertex(vertexKey: S): Vertex<S, T> {
        const vertex = this.vertices.get(vertexKey);
        if (vertex === undefined) {
            throw Error("Graph has no vertex: " + vertex);
        }
        return vertex;
    }

    public addEdge(vertexKey1: S, vertexKey2: S) {
        const vertex1 = this.forceGetVertex(vertexKey1);
        const vertex2 = this.forceGetVertex(vertexKey2);
        vertex1.neighbors.push(vertexKey2);
        vertex2.neighbors.push(vertexKey1);
    }

    public addVertex(vertexKey: S, vertexData: T) {
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
        return this.forceGetVertex(vertexKey).data;
    }

    // Returns a random vertex key from this graph
    public getVertexKeys(): S[] {
        return Array.from(this.vertices.entries()).map((v) => v[0]);
    }
}

export { Graph };
