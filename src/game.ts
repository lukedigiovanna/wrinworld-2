import { GameObject, PlayerFactory, PortalFactory, EnemyFactory, EnemyIndex, PortalProperties } from "./gameObjects";
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
    private _camera: Camera;
    private _player: GameObject;
    private _gameTime: number = 0;
    private particles: Particle[] = [];

    private noise = new PerlinNoise(MathUtils.randomInt(1000, 100000));

    private paused: boolean = false;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this._camera = new Camera(canvas, ctx);
        this._player = PlayerFactory(new Vector(0, 16));
        this.addGameObject(this._player);
        this._camera.target = this._player.position;

        this.generateLevelOne();
        this._camera.verticalBoundary = [16, 24 + 8 + 96];

        this.addGameObject(EnemyFactory(new Vector(0, 20), EnemyIndex.SLIME));
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

        // 3. Add ponds
        for (let x = left; x <= right; x++) {
            for (let y = marginTrail; y <= height + marginTrail; y++) {
                if (this.noise.get(x / 16.32 + 1000, y / 16.543 + 1000) > 0.6) {
                    if (!this.isTileInArea(new Vector(x, y), 2, TileIndex.PATH)) {
                        this.setTile(new Vector(x, y), TileIndex.WATER);
                    }
                }
            }
        }

        // 4. Put rock wall in trail margined areas.
        for (let x = left; x <= right; x++) {
            const offset = this.noise.get(x / 8 + 1000, 1000.342) * 4;
            for (let y = 0; y < marginTrail - 4 + offset; y++) {
                const xoff = this.noise.get(1000.632, y / 8 + 1000) * 4;
                if (Math.abs(x) + xoff <= 7) {
                    continue;
                }
                this.setTile(new Vector(x, y), TileIndex.ROCKS);
                this.setTile(new Vector(x, top - y), TileIndex.ROCKS);
            }
        }

        // 5. Put rock wall in side margins
        for (let y = bottom; y <= top; y++) {
            const offset = this.noise.get(0.342, y / 4) * 12 - 12;
            for (let x = offset; x <= marginSidesRocks; x++) {
                this.setTile(new Vector(left - 1 - x, y), TileIndex.ROCKS);
                this.setTile(new Vector(right + 1 + x, y), TileIndex.ROCKS);
            }
        }

        // 6. Place portals
        const portalPositions = [];
        for (let i = 0; i < 10; i++) {
            let position;
            do {
                position = new Vector(
                    MathUtils.randomInt(left, right) + 0.5,
                    MathUtils.randomInt(bottom, top) + 0.5
                );
            } while (this.isTileWithPropertyInArea(position, 2, "canSpawnPortal", false));
            const properties: PortalProperties = {
                lowerBoundCooldown: 12,
                upperBoundCooldown: 20,
                maxEnemies: 4,
                packs: [
                    {
                        enemyIndex: EnemyIndex.ZOMBIE,
                        lowerBound: 1,
                        upperBound: 3
                    },
                    {
                        enemyIndex: EnemyIndex.MINION,
                        lowerBound: 2,
                        upperBound: 5
                    },
                    {
                        enemyIndex: EnemyIndex.SLIME,
                        lowerBound: 1,
                        upperBound: 4
                    },
                    {
                        enemyIndex: EnemyIndex.REVENANT_EYE,
                        lowerBound: 1,
                        upperBound: 2
                    },
                ]
            }
            this.addGameObject(PortalFactory(properties, position));
            portalPositions.push(position);
        }

        // 7. Place trees
        const TREE_RATE = 0.3;
        for (let x = left; x <= right; x++) {
            for (let y = bottom; y <= top; y++) {
                if (Math.random() > TREE_RATE) {
                    continue;
                }
                const position = new Vector(x, y);
                let tooCloseToPortal = false;
                for (let j = 0; j < portalPositions.length; j++) {
                    if (Vector.subtract(portalPositions[j], position).magnitude < 3) {
                        tooCloseToPortal = true;
                        break;
                    }
                }
                if (tooCloseToPortal) {
                    continue;
                }
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

        const cameraChunkIndex = getChunkIndex(this._camera.position);
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
        if (this.paused) {
            if (input.isKeyPressed("Escape")) {
                this.unpause();
            }
            return;
        }

        if (input.isKeyPressed("Escape")) {
            this.pause();
        }

        this._gameTime += dt;

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

        this._camera.update(dt);
    }

    public draw() {
        this._camera.setFillColor("black");
        this._camera.clear();

        const cameraCI = getChunkIndex(this._camera.position);

        for (let xo = -RENDER_DISTANCE; xo <= RENDER_DISTANCE; xo++) {
            for (let yo = -RENDER_DISTANCE; yo <= RENDER_DISTANCE; yo++) {
                const chunkIndex = cameraCI + yo + xo * MAX_NUM_CHUNKS;
                const chunk = this.chunks.get(chunkIndex);
                const chunkPos = getChunkWorldPosition(chunkIndex);
                if (!chunk) continue;
                for (let i = 0; i < TILES_PER_CHUNK; i++) {
                    const tileIndex = chunk.tiles[i];
                    const tile = tileCodex.get(tileIndex);
                    if (tile.spriteID) {
                        let spriteID = tile.spriteID;
                        const tilePosition = new Vector(chunkPos.x + Math.floor(i / CHUNK_SIZE) + 0.5, chunkPos.y + i % CHUNK_SIZE + 0.5);
                        // if (tileIndex === TileIndex.PATH) {
                        //     const rightTile = this.getTileIndex(Vector.add(tilePosition, Vector.right()));
                        //     if (rightTile === TileIndex.GRASS) {
                        //         spriteID = "edge_merge_path_grass";
                        //     }
                        // }
                        this._camera.drawImage(getImage(spriteID), tilePosition.x, tilePosition.y, 1, 1, 0);
                    }
                }
            }
        }

        

        [...this.activeObjects].sort((a: GameObject, b: GameObject) => (b.position.y - b.scale.y / 2) - (a.position.y - a.scale.y / 2))
            .forEach((gameObject: GameObject) => {
                gameObject.render(this._camera);
            });

        this.particles.forEach((particle: Particle) => {
            const pos = particle.position.copy();
            if (particle.useRelativePosition && particle.gameObject) {
                pos.add(particle.gameObject.position);
            }
            this._camera.drawImage(
                getImage(particle.spriteID), 
                pos.x,
                pos.y,
                particle.size.x, 
                particle.size.y, 
                particle.rotation
            );
        });
        
        if (settings.showChunks) {
            this._camera.setStrokeColor("lime");
            const chunkPos = getChunkWorldPosition(getChunkIndex(this._camera.position));
            for (let xo = -RENDER_DISTANCE; xo <= RENDER_DISTANCE; xo++) {
                for (let yo = -RENDER_DISTANCE; yo <= RENDER_DISTANCE; yo++) {
                    const chunkIndex = getChunkIndex(new Vector(chunkPos.x + xo * CHUNK_SIZE, chunkPos.y + yo * CHUNK_SIZE));
                    if (this.chunks.has(chunkIndex)) {
                        this._camera.strokeRect(chunkPos.x + xo * CHUNK_SIZE + CHUNK_SIZE / 2, chunkPos.y + yo * CHUNK_SIZE + CHUNK_SIZE / 2, CHUNK_SIZE, CHUNK_SIZE);
                        this._camera.setFillColor("red");
                        this._camera.fillRect(chunkPos.x + xo * CHUNK_SIZE, chunkPos.y + yo * CHUNK_SIZE, 0.5, 0.5);
                    }
                }
            }
        }
        if (settings.showCameraPosition) {
            this._camera.setFillColor("orange");
            this._camera.fillEllipse(this._camera.position.x, this._camera.position.y, 0.5, 0.5);
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

    public getNearestGameObjectWithTag(source: Vector, tag: string): 
                    {object: GameObject, distance: number} | undefined {
        let minDistance = 999999;
        let object = undefined;
        for (let i = 0; i < this.activeObjects.length; i++) {
            if (this.activeObjects[i].tag === tag) {
                const distance = Vector.subtract(source, this.activeObjects[i].position).magnitude;
                if (distance < minDistance) {
                    object = this.activeObjects[i];
                    minDistance = distance;
                }
            }
        }
        return !object ? undefined : {
            object,
            distance: minDistance
        };
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
        return tileCodex.get(tileIndex);
    }

    // Returns true if any tile in the given radius around the given position is
    // the given tileIndex.
    public isTileInArea(position: Vector, radius: number, tileIndex: TileIndex): boolean {
        for (let xo = -radius; xo <= radius; xo++) {
            for (let yo = -radius; yo <= radius; yo++) {
                if (this.getTileIndex(Vector.add(position, new Vector(xo, yo))) === tileIndex) {
                    return true;
                }
            }
        }
        return false;
    }

    // Returns true if any tile in the given radius around the given position 
    // has the given property-value pair.
    public isTileWithPropertyInArea(position: Vector, radius: number, property: keyof Tile, value: any): boolean {
        for (let xo = -radius; xo <= radius; xo++) {
            for (let yo = -radius; yo <= radius; yo++) {
                if (this.getTile(Vector.add(position, new Vector(xo, yo)))[property] === value) {
                    return true;
                }
            }
        }
        return false;
    }

    public get player() {
        return this._player;
    }

    public get camera() {
        return this._camera;
    }

    // Pauses the game
    public pause() {
        console.log("[paused]");
        this.paused = true;
        $("#pause-screen").css("opacity", "100%");
        $("#pause-screen").css("visibility", "visible");
    }
    
    public unpause() {
        console.log("[unpaused]");
        this.paused = false;
        $("#pause-screen").css("opacity", "0%");
        $("#pause-screen").css("visibility",  "hidden");
    }
}

export { Game, getChunkIndex };