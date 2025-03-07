import { BulletFactory, GameObject, PlayerFactory, AnimalFactory } from "./gameObjects";
import { Vector, MathUtils, PerlinNoise } from "./utils";
import input from "./input";
import { Camera } from "./camera";
import { getImage } from "./imageLoader";
import { rectangleRenderer, spriteRenderer } from "./renderers";
import { PhysicalCollider, Particle } from "./components";
import settings from "./settings";

const CHUNK_SIZE = 16;
const TILES_PER_CHUNK = CHUNK_SIZE * CHUNK_SIZE;
const MAX_NUM_CHUNKS = 1024; // number of chunks along width and height of the world
const WORLD_SIZE = CHUNK_SIZE * MAX_NUM_CHUNKS;
const RENDER_DISTANCE = 2;

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

interface Tile {
    spriteID: string;
    canGrowPlants: boolean;
}

const tileCodex: Tile[] = [
    {
        spriteID: "grass",
        canGrowPlants: true
    },
    {
        spriteID: "water",
        canGrowPlants: false
    }
];

interface Chunk {
    objects: GameObject[];
    tiles: number[];
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
        this.player = PlayerFactory(Vector.zero());
        this.addGameObject(this.player);
        this.camera.target = this.player.position;
    }

    private generateChunk(chunkIndex: number): void {
        const pos = getChunkWorldPosition(chunkIndex);

        const tiles: number[] = [];
        for (let i = 0; i < TILES_PER_CHUNK; i++) {
            const noise = this.noise.get(
                (pos.x + 1000 + Math.floor(i / CHUNK_SIZE)) * 0.1, 
                (pos.y + 1000 +  (i % CHUNK_SIZE)) * 0.1
            );
            tiles.push(noise < 0.6 ? 0 : 1);
        }

        for (let i = 0; i < 20; i++) {
            const x = MathUtils.randomInt(0, CHUNK_SIZE - 1);
            const y = MathUtils.randomInt(0, CHUNK_SIZE - 1);
            const tilePositionIndex = x * CHUNK_SIZE + y;
            const tileIndex = tiles[tilePositionIndex];
            const tile = tileCodex[tileIndex];
            console.log(tilePositionIndex, tileIndex, tile);
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
            tree.position.setComponents(x + pos.x + 0.5, y + pos.y + 1.5);
            this.addGameObject(tree);
        }
        if (Math.random() < 0.0) {
            const center = new Vector(MathUtils.random(pos.x, pos.x + CHUNK_SIZE), MathUtils.random(pos.y, pos.y + CHUNK_SIZE));
            for (let j = 0; j < 20; j++) {
                const diff = new Vector(MathUtils.random(-3, 3), MathUtils.random(-3, 3));
                diff.add(center);
                const flower = new GameObject();
                flower.position.set(diff);
                const footX = Math.floor(flower.position.x - pos.x);
                const footY = Math.floor(flower.position.y - pos.y);
                const tilePositionIndex = footX * CHUNK_SIZE + footY;
                if (tilePositionIndex < 0 || tilePositionIndex >= TILES_PER_CHUNK) {
                    continue;
                }
                const tileIndex = tiles[tilePositionIndex];
                const tile = tileCodex[tileIndex];
                if (!tile.canGrowPlants) {
                    continue;
                }
                flower.renderer = spriteRenderer("rose");
                this.addGameObject(flower);
            }
        }
        if (Math.random() < 0.0) {
            for (let i = 0; i < 15; i++) {
                this.addGameObject(
                    AnimalFactory(
                        new Vector(MathUtils.random(pos.x, pos.x + CHUNK_SIZE), MathUtils.random(pos.y, pos.y + CHUNK_SIZE)), 
                        "chicken"
                    )
                )
            }
        }
        
        this.chunks.set(chunkIndex, { objects: [], tiles });
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
            const ci = obj.chunkIndex;
            this.addToChunk(obj, ci);
            obj.start();
            this._totalObjects++;
        }

        while (this.objectDeleteQueue.length > 0) {
            const obj = this.objectDeleteQueue.pop();
            if (!obj) {
                throw Error("Cannot remove undefined object from game");
            }
            const ci = obj.lastFrameChunkIndex;
            const chunk = this.chunks.get(ci);
            if (chunk) {
                const objInd = chunk.objects.indexOf(obj);
                if (objInd < 0) {
                    throw Error("object to remove was not found in its respective chunk");
                }
                chunk.objects.splice(objInd, 1);
                this._totalObjects--;
            }
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
                    this.camera.drawImage(getImage(tile.spriteID), chunkPos.x + Math.floor(i / CHUNK_SIZE) + 0.5, chunkPos.y + i % CHUNK_SIZE + 0.5, 1, 1);
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
                    this.camera.strokeRect(chunkPos.x + xo * CHUNK_SIZE + CHUNK_SIZE / 2, chunkPos.y + yo * CHUNK_SIZE + CHUNK_SIZE / 2, CHUNK_SIZE, CHUNK_SIZE);
                    this.camera.setFillColor("red");
                    this.camera.fillRect(chunkPos.x + xo * CHUNK_SIZE, chunkPos.y + yo * CHUNK_SIZE, 0.5, 0.5);
                }
            }
        }
        if (settings.showCameraPosition) {
            this.camera.setFillColor("orange");
            this.camera.fillEllipse(this.camera.position.x, this.camera.position.y, 0.5, 0.5);
        }
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
}

export { Game, getChunkIndex };