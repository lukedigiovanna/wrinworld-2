import { BulletFactory, GameObject, PlayerFactory, AnimalFactory } from "./gameObjects";
import { Vector, MathUtils, PerlinNoise, CatmullRomParametricCurve } from "./utils";
import input from "./input";
import { Camera } from "./camera";
import { getImage } from "./imageLoader";
import { rectangleRenderer, spriteRenderer } from "./renderers";
import { PhysicalCollider, Particle } from "./components";
import settings from "./settings";
import { Tile, tileCodex, TileIndex } from "./tiles";

const CHUNK_SIZE = 8;
const TILES_PER_CHUNK = CHUNK_SIZE * CHUNK_SIZE;
const MAX_NUM_CHUNKS = 1024; // number of chunks along width and height of the world
const WORLD_SIZE = CHUNK_SIZE * MAX_NUM_CHUNKS;
const RENDER_DISTANCE = 3;

const getChunkIndex = (position: Vector) => {
    const c = Vector.add(position, new Vector(WORLD_SIZE / 2, WORLD_SIZE / 2));
    c.divide(new Vector(CHUNK_SIZE, CHUNK_SIZE));
    return Math.floor(c.x) * MAX_NUM_CHUNKS + Math.floor(c.y);
}

const getChunkWorldPosition = (chunkIndex: number) => {
    const x = Math.floor(chunkIndex / MAX_NUM_CHUNKS) * CHUNK_SIZE - WORLD_SIZE / 2;
    const y = (chunkIndex % MAX_NUM_CHUNKS) * CHUNK_SIZE - WORLD_SIZE / 2;
    return new Vector(x, y);
}

interface Chunk {
    objects: GameObject[];
    tiles: TileIndex[];
}

class Game {
    // private _objects: GameObject[];
    private objectQueue: GameObject[] = []; // Queue of objects to add on the next frame
    private objectDeleteQueue: GameObject[] = [];
    private _totalObjects = 0;
    private chunks = new Map<number, Chunk>();
    private camera: Camera;
    private player: GameObject;
    private _gameTime: number = 0;
    private particles: Particle[] = [];

    private noise = new PerlinNoise(MathUtils.randomInt(1000, 100000));

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.camera = new Camera(canvas, ctx);
        this.player = PlayerFactory(new Vector(0, 16));
        this.addGameObject(this.player);
        this.camera.target = this.player.position;

        this.generateLevelOne();
        this.camera.verticalBoundary = [16, 24 + 8 + 96];
    }

    private generateChunk(chunkIndex: number): void {
        const tiles: number[] = [];
        for (let i = 0; i < TILES_PER_CHUNK; i++) {
            tiles.push(TileIndex.AIR);
        }
        this.chunks.set(chunkIndex, {
            tiles,
            objects: []
        });
    }

    private generateLevelOne() {
        const width = 64;
        const height = 96;
        const marginTrail = 24;
        const marginSidesRocks = 32;
        const left = -width / 2, right = width / 2 - 1;
        const bottom = 0, top = height + marginTrail * 2;
        const start = new Vector(0, bottom);
        const end = new Vector(0, top);
        const N = 10;

        // 1. Set Grass Background
        for (let x = left; x <= right; x++) {
            for (let y = bottom; y < top; y++) {
                this.setTile(new Vector(x, y), TileIndex.GRASS);
            }
        }
        
        // 2. Fill a path from the bottom to top of the world
        const pathPoints = [];
        pathPoints.push(start);
        pathPoints.push(Vector.add(start, new Vector(0, marginTrail)))
        for (let i = 0; i < N; i++) {
            const ps = i / N;
            const pt = (i + 1) / N;
            const x = MathUtils.randomInt(left + 6, right - 6);
            const y = marginTrail + MathUtils.randomInt(ps * height, pt * height);
            pathPoints.push(new Vector(x, y));
        }
        pathPoints.push(Vector.subtract(end, new Vector(0, marginTrail)));
        pathPoints.push(end);

        const curve = new CatmullRomParametricCurve(pathPoints);
        for (let t = bottom; t < height; t+=0.1) {
            const p = t / height;
            const position = curve.getPosition(p);
            const normal = curve.getNormal(p);
            for (let d = -1; d <= 1; d++) {
                this.setTile(Vector.add(position, Vector.scaled(normal, d)), TileIndex.PATH);
            }
        }

        // 3. Put rock wall in trail margined areas.
        for (let x = left; x <= right; x++) {
            const offset = this.noise.get(x / 8, 0.342) * 4;
            for (let y = 0; y < marginTrail - 4 + offset; y++) {
                const xoff = this.noise.get(0.632, y / 8) * 4;
                if (Math.abs(x) + xoff <= 7) {
                    continue;
                }
                this.setTile(new Vector(x, y), TileIndex.ROCKS);
                this.setTile(new Vector(x, top - y), TileIndex.ROCKS);
            }
        }

        // 4. Put rock wall in side margins
        for (let y = bottom; y <= top; y++) {
            const offset = this.noise.get(0.342, y / 4) * 12 - 12;
            for (let x = offset; x <= marginSidesRocks; x++) {
                this.setTile(new Vector(left - 1 - x, y), TileIndex.ROCKS);
                this.setTile(new Vector(right + 1 + x, y), TileIndex.ROCKS);
            }
        }

        // 6. Place trees
        for (let i = 0; i < width * height / 4; i++) {
            const position = new Vector(
                MathUtils.randomInt(left, right),
                MathUtils.randomInt(bottom, top)
            );
            const tile = this.getTile(position); 
            if (!tile.canGrowPlants) {
                continue;
            }
            const tree = new GameObject();
            if (Math.random() < 0.9) {
                tree.scale.scale(3);
                tree.renderer = spriteRenderer("tree");
            }
            else {
                tree.scale.setComponents(2, 3);
                tree.renderer = spriteRenderer("evergreen");
            }
            const collider = tree.addComponent(PhysicalCollider);
            collider.data?.boxOffset.setComponents(0, -1.2);
            collider.data?.boxSize.setComponents(0.5, 0.6);
            tree.position.setComponents(position.x + 0.5, position.y + 1.5);
            this.addGameObject(tree);
        }
    }

    public get time() {
        return this._gameTime;
    }

    public get totalObjects() {
        return this._totalObjects;
    }

    public get totalActiveObjects() {
        return this.activeObjects.length;
    }

    private activeObjects: GameObject[] = [];

    // Performs any boilerplate updates to the game such as removing dead objects
    // adding new objects, updating active chunks, and generating new chunks.
    public preUpdate() {
        while (this.objectQueue.length > 0) {
            const obj = this.objectQueue.pop();
            if (!obj) {
                throw Error("Cannot add undefined object to game");
            }
            // determine chunk index based on position
            obj.start();
            const ci = obj.chunkIndex;
            this.addToChunk(obj, ci);
            this._totalObjects++;
        }

        while (this.objectDeleteQueue.length > 0) {
            const obj = this.objectDeleteQueue.pop();
            if (!obj) {
                throw Error("Cannot remove undefined object from game");
            }
            const chunk = this.chunks.get(obj.storedInChunkIndex);
            if (!chunk) {
                throw Error("Object was supposedly stored in a non-loaded chunk");
            }
            const objInd = chunk.objects.indexOf(obj);
            if (objInd < 0) {
                throw Error("object to remove was not found in its respective chunk");
            }
            chunk.objects.splice(objInd, 1);
            this._totalObjects--;
        }

        const cameraChunkIndex = getChunkIndex(this.camera.position);
        // get all objects in the (n x n) chunk grid centered around the camera
        const listOfChunks = [];
        for (let i = -RENDER_DISTANCE; i <= RENDER_DISTANCE; i++) {
            for (let j = -RENDER_DISTANCE; j <= RENDER_DISTANCE; j++) {
                const ind = cameraChunkIndex + j + i * MAX_NUM_CHUNKS;
                if (!this.chunks.has(ind)) {
                    this.generateChunk(ind);
                }
                const chunk = this.chunks.get(ind) as Chunk; // we know it will exist
                listOfChunks.push(chunk);
            }
        }

        this.activeObjects = [];
        for (const chunk of listOfChunks) this.activeObjects.push(...chunk.objects);
    }

    // Performs game-level updates such as updating game objects and managing
    // particles.
    public update(dt: number) {
        this._gameTime += dt;

        if (input.mousePressed) {
            const bullet = BulletFactory(this.player.position, this.camera.screenToWorldPosition(input.mousePosition));
            this.addGameObject(bullet);
        }

        this.activeObjects.forEach((object: GameObject) => {
            object.update(dt);
        });

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            if (this.time - particle.birthTime >= particle.lifetime) {
                this.particles.splice(i, 1);
                i--;
            }
            else {
                particle.position.add(Vector.scaled(particle.velocity, dt));
                particle.rotation += particle.angularVelocity;
                if (particle.update)
                    particle.update(particle, dt);
            }
        }

        this.camera.update(dt);
    }

    public draw() {
        this.camera.setFillColor("black");
        this.camera.clear();

        const cameraCI = getChunkIndex(this.camera.position);

        for (let xo = -RENDER_DISTANCE; xo <= RENDER_DISTANCE; xo++) {
            for (let yo = -RENDER_DISTANCE; yo <= RENDER_DISTANCE; yo++) {
                const chunkIndex = cameraCI + yo + xo * MAX_NUM_CHUNKS;
                const chunk = this.chunks.get(chunkIndex);
                const chunkPos = getChunkWorldPosition(chunkIndex);
                if (!chunk) continue;
                for (let i = 0; i < TILES_PER_CHUNK; i++) {
                    const tileIndex = chunk.tiles[i];
                    const tile = tileCodex[tileIndex];
                    if (tile.spriteID) {
                        let spriteID = tile.spriteID;
                        const tilePosition = new Vector(chunkPos.x + Math.floor(i / CHUNK_SIZE) + 0.5, chunkPos.y + i % CHUNK_SIZE + 0.5);
                        // if (tileIndex === TileIndex.PATH) {
                        //     const rightTile = this.getTileIndex(Vector.add(tilePosition, Vector.right()));
                        //     if (rightTile === TileIndex.GRASS) {
                        //         spriteID = "edge_merge_path_grass";
                        //     }
                        // }
                        this.camera.drawImage(getImage(spriteID), tilePosition.x, tilePosition.y, 1, 1, 0);
                    }
                }
            }
        }

        this.particles.forEach((particle: Particle) => {
            const pos = particle.position.copy();
            if (particle.useRelativePosition && particle.gameObject) {
                pos.add(particle.gameObject.position);
            }
            this.camera.drawImage(
                getImage(particle.spriteID), 
                pos.x,
                pos.y,
                particle.size.x, 
                particle.size.y, 
                particle.rotation
            );
        });

        [...this.activeObjects].sort((a: GameObject, b: GameObject) => (b.position.y - b.scale.y / 2) - (a.position.y - a.scale.y / 2))
            .forEach((gameObject: GameObject) => {
                gameObject.render(this.camera);
            });
        
        if (settings.showChunks) {
            this.camera.setStrokeColor("lime");
            const chunkPos = getChunkWorldPosition(getChunkIndex(this.camera.position));
            for (let xo = -RENDER_DISTANCE; xo <= RENDER_DISTANCE; xo++) {
                for (let yo = -RENDER_DISTANCE; yo <= RENDER_DISTANCE; yo++) {
                    const chunkIndex = getChunkIndex(new Vector(chunkPos.x + xo * CHUNK_SIZE, chunkPos.y + yo * CHUNK_SIZE));
                    if (this.chunks.has(chunkIndex)) {
                        this.camera.strokeRect(chunkPos.x + xo * CHUNK_SIZE + CHUNK_SIZE / 2, chunkPos.y + yo * CHUNK_SIZE + CHUNK_SIZE / 2, CHUNK_SIZE, CHUNK_SIZE);
                        this.camera.setFillColor("red");
                        this.camera.fillRect(chunkPos.x + xo * CHUNK_SIZE, chunkPos.y + yo * CHUNK_SIZE, 0.5, 0.5);
                    }
                }
            }
        }
        if (settings.showCameraPosition) {
            this.camera.setFillColor("orange");
            this.camera.fillEllipse(this.camera.position.x, this.camera.position.y, 0.5, 0.5);
        }
    }

    public addGameObject(obj: GameObject) {
        this.objectQueue.push(obj);
        obj.game = this;
    }

    public deleteGameObject(obj: GameObject) {
        if (obj.game !== this) {
            throw Error("cannot remove game object which is not in this game");
        }
        this.objectDeleteQueue.push(obj);
    }

    private addToChunk(obj: GameObject, chunkIndex: number) {
        if (!this.chunks.has(chunkIndex)) {
            this.generateChunk(chunkIndex);
        };
        this.chunks.get(chunkIndex)?.objects.push(obj);
        obj.storedInChunkIndex = chunkIndex;
    }

    public changeChunk(obj: GameObject, lastChunk: number) {
        // remove the object from "lastChunk"
        if (!this.chunks.has(lastChunk)) {
            throw Error("The supposed last chunk has never been loaded: " + lastChunk);
        }
        const chunk = this.chunks.get(lastChunk) as Chunk;
        const ind = chunk.objects.indexOf(obj);
        if (ind < 0) {
            throw Error("The given object was not found in its supposed last chunk: " + lastChunk);
        }
        chunk.objects.splice(ind, 1);
        this.addToChunk(obj, obj.chunkIndex);
    }

    // gets the adjacent objects to a position (those within a 1 chunk radius)
    public getAdjacentObjects(position: Vector) {
        const ci = getChunkIndex(position);
        const objs = [];
        for (let xo = -1; xo <= 1; xo++) {
            for (let yo = -1; yo <= 1; yo++) {
                const chunk = this.chunks.get(ci + yo + xo * MAX_NUM_CHUNKS);
                if (chunk) {
                    objs.push(...chunk.objects);
                }
            }
        }
        return objs;
    }

    public addParticle(particle: Particle) {
        this.particles.push(particle);
    }

    private getTileCoordinate(position: Vector): { chunkIndex: number, tilePositionIndex: number } {
        const chunkIndex = getChunkIndex(position);
        const chunkPosition = getChunkWorldPosition(chunkIndex);
        const offset = Vector.subtract(position, chunkPosition);
        const offsetX = Math.max(0, Math.floor(offset.x));
        const offsetY = Math.max(0, Math.floor(offset.y));
        const tilePositionIndex = offsetX * CHUNK_SIZE + offsetY;
        if (tilePositionIndex < 0) {
            console.error(`
                Bug report:
                position: ${position.x}, ${position.y}
                chunkIndex: ${chunkIndex}
                offset: ${offset.x}, ${offset.y}
                offsetX: ${offsetX}
                offsetY: ${offsetY}
                tilePositionIndex: ${tilePositionIndex}
            `)
            throw Error("Some bug occurred");
        }
        return {
            chunkIndex,
            tilePositionIndex
        };
    }

    // Set the tile at the integer tile coordinates to the given tileIndex.
    // will generate the chunk there if it is not generated already.
    public setTile(position: Vector, tileIndex: TileIndex) {
        const { chunkIndex, tilePositionIndex } = this.getTileCoordinate(position);
        if (!this.chunks.has(chunkIndex)) {
            this.generateChunk(chunkIndex);
        }
        const chunk = this.chunks.get(chunkIndex);
        if (!chunk) throw Error("something went wrong");
        chunk.tiles[tilePositionIndex] = tileIndex;
    }

    public getTileIndex(position: Vector): TileIndex {
        const { chunkIndex, tilePositionIndex } = this.getTileCoordinate(position);
        if (!this.chunks.has(chunkIndex)) {
            this.generateChunk(chunkIndex);
        }
        const chunk = this.chunks.get(chunkIndex);
        if (!chunk) throw Error("something went wrong");
        return chunk.tiles[tilePositionIndex];
    }

    // Get the tile object from the tilemap stored at the given world position
    // will generate the chunk there if necessary.
    public getTile(position: Vector): Tile {
        const tileIndex = this.getTileIndex(position);
        return tileCodex[tileIndex];
    }
}

export { Game, getChunkIndex };