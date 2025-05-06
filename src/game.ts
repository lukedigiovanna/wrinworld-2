import { getTexture } from "./assets/imageLoader";
import { GameObject, PlayerFactory } from "./gameObjects";
import { Vector, MathUtils, PerlinNoise, Color, Ease } from "./utils";
import input from "./input";
import { Particle, ParticleLayer } from "./components";
import { Tile, tileCodex, TileData, TileIndex } from "./tiles";
import { Level, levels, LevelIndex } from "./levels";
import settings from "./settings";
import statTracker from "./statTracker";
import { animationsCodex } from "./animations";
import { PriorityQueue } from "./utils/PriorityQueue";
import { Camera } from "./rendering/Camera";
import { ShaderShadow, MAX_SHADOWS } from "./rendering/ShaderProgram";
import { PostProcessingShaderIndex } from "./rendering/postProcessingShaders";
import { FrameBuffer } from "./rendering/FrameBuffer";
import { Matrix4 } from "./utils/Matrix4";

const CHUNK_SIZE = 8;
const TILES_PER_CHUNK = CHUNK_SIZE * CHUNK_SIZE;
const PIXELS_PER_TILE = 16;
const MAX_NUM_CHUNKS = 1024; // number of chunks along width and height of the world
const WORLD_SIZE = CHUNK_SIZE * MAX_NUM_CHUNKS;
const RENDER_DISTANCE = 3;
const PIXELATION_PERIOD = 3;

const getChunkIndex = (position: Vector) => {
    const c = Vector.add(Vector.scaled(position, 1 / PIXELS_PER_TILE), new Vector(WORLD_SIZE / 2, WORLD_SIZE / 2));
    c.scale(1 / CHUNK_SIZE);
    return Math.floor(c.x) * MAX_NUM_CHUNKS + Math.floor(c.y);
}

const getChunkWorldPosition = (chunkIndex: number) => {
    const x = Math.floor(chunkIndex / MAX_NUM_CHUNKS) * CHUNK_SIZE - WORLD_SIZE / 2;
    const y = (chunkIndex % MAX_NUM_CHUNKS) * CHUNK_SIZE - WORLD_SIZE / 2;
    return new Vector(x * PIXELS_PER_TILE, y * PIXELS_PER_TILE);
}

class Chunk {
    public objects: GameObject[];
    public tiles: Tile[];
    public dirty: boolean; // Marked true if the tileFramebuffer does not match the tiles
    public tileFramebuffer: FrameBuffer;
    private gl: WebGLRenderingContext;

    constructor(gl: WebGLRenderingContext, tiles: Tile[]) {
        this.gl = gl;
        this.tiles = tiles;
        this.objects = [];
        this.dirty = true;
        this.tileFramebuffer = new FrameBuffer(gl, CHUNK_SIZE * PIXELS_PER_TILE, CHUNK_SIZE * PIXELS_PER_TILE);
    }

    public renderFramebuffer() {
        if (!this.dirty) {
            return;
        }
        console.log("rendering chunk framebuffer");
        this.tileFramebuffer.bind();
        this.gl.viewport(0, 0, this.tileFramebuffer.width, this.tileFramebuffer.height);
        this.gl.clearColor(0, 0.1, 0.8, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.dirty = false;
    }
}

interface TimeoutRequest {
    func: () => void;
    timestamp: number;
    delay: number;
}

class Game {
    private timeoutQueue: PriorityQueue<TimeoutRequest>;
    private objectQueue: GameObject[] = []; // Queue of objects to add on the next frame
    private objectDeleteQueue: GameObject[] = [];
    private _totalObjects = 0;
    private activeObjects: GameObject[] = [];

    private particles: Particle[] = [];
    
    private chunks = new Map<number, Chunk>();
    
    private _camera: Camera;
    private _player: GameObject;
    private _gameTime: number = 0;
    private gameOverTime: number | undefined = undefined;

    public noise = new PerlinNoise(MathUtils.randomInt(1000, 100000));

    private paused: boolean = false;

    private level?: Level;
    private dirtyLevel = false;
    private levelStartTime: number = -999;
    private pixelateLevelStart = false;

    constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
        this._camera = new Camera(this, canvas, gl);
        this._player = PlayerFactory(new Vector(0, 16 * PIXELS_PER_TILE));
        this.addGameObject(this._player);
        this._camera.target = this._player;

        this.switchLevel(LevelIndex.FOREST, false);

        this.timeoutQueue = new PriorityQueue<TimeoutRequest>(
            // The request with less time remaining should come before
            (req1: TimeoutRequest, req2: TimeoutRequest) => {
                const remaining1 = req1.delay - (this.time - req1.timestamp);
                const remaining2 = req2.delay - (this.time - req2.timestamp);
                return remaining1 < remaining2;
            });
    }

    public switchLevel(levelIndex: LevelIndex, pixelateLevelStart=true) {
        if (this.dirtyLevel) {
            return;
        }
        this.dirtyLevel = true;
        this.levelStartTime = this.time;
        this.pixelateLevelStart = pixelateLevelStart;
        this.level = levels[levelIndex];
    }

    private generateChunk(chunkIndex: number): void {
        const tiles: Tile[] = [];
        for (let i = 0; i < TILES_PER_CHUNK; i++) {
            tiles.push({ index: TileIndex.AIR, rotation: 0 });
        }
        this.chunks.set(chunkIndex, new Chunk(this.camera.gl, tiles));
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

    private checkTimeout(): boolean {
        const current = this.timeoutQueue.peek();
        if (!current) {
            return false;
        }
        if (this.time - current.timestamp >= current.delay) {
            current.func();
            this.timeoutQueue.dequeue();
            return true;
        }
        return false;
    }

    // Performs any boilerplate updates to the game such as removing dead objects
    // adding new objects, updating active chunks, and generating new chunks.
    public preUpdate() {
        if (this.paused) {
            return;
        }

        if (this.dirtyLevel && (!this.pixelateLevelStart || this.time - this.levelStartTime > PIXELATION_PERIOD / 2) && this.level) {
            // Unload everything if there was already a loaded level
            this.chunks = new Map<number, Chunk>();
            this.activeObjects = [];
            this.particles = [];
            this._totalObjects = 0;

            this.player.position.set(this.level.playerSpawnPosition);

            if (this.player.started) {
                const ci = this.player.chunkIndex;
                this.addToChunk(this.player, ci);
                this._totalObjects++;
            }

            this.level.generate(this);
            this._camera.bounds = this.level.cameraBounds;
            this.dirtyLevel = false;
        }
        
        if (this.level && this.player.hitboxCenter.y >= this.level.cameraBounds.top) {  
            this.switchLevel(LevelIndex.SCHOOL);
        }

        while (this.checkTimeout());

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

        const playerCI = getChunkIndex(this.player.position);
        // get all objects in the (n x n) chunk grid centered around the camera
        const listOfChunks = [];
        for (let i = -RENDER_DISTANCE; i <= RENDER_DISTANCE; i++) {
            for (let j = -RENDER_DISTANCE; j <= RENDER_DISTANCE; j++) {
                const ind = playerCI + j + i * MAX_NUM_CHUNKS;
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

        if (this.gameOver && this.gameOverTime === undefined) {
            this.gameOverTime = this.time;
            $("#death-screen").css("opacity", "100%");
            $("#death-screen").css("visibility", "visible");
            $("#score").text(statTracker.score);
        }

        if (this.gameOverTime !== undefined) {
            dt *= 0.5 * (1 - Ease.linear(0.25 * (this.time - this.gameOverTime)));
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
                particle.rotation += particle.angularVelocity * dt;
                if (particle.update)
                    particle.update(particle, dt);
            }
        }

        this._camera.update(dt);
    }

    private drawParticle(particle: Particle) {
        const pos = particle.position.copy();
        if (particle.useRelativePosition && particle.gameObject) {
            pos.add(particle.gameObject.position);
        }
        this._camera.color = particle.color;
        const texture = getTexture(particle.spriteID);
        this._camera.drawTexture(
            texture, 
            pos.x,
            pos.y,
            particle.scale * texture.width, 
            particle.scale * texture.height, 
            particle.rotation
        );
    }

    public draw() {
        if (this.paused) {
            return;
        }
        
        const pixelationTime = (this.time - this.levelStartTime) / PIXELATION_PERIOD;
        if (this.pixelateLevelStart && 0 <= pixelationTime && pixelationTime <= 1) {
            this._camera.enableShader(PostProcessingShaderIndex.PIXELATE);
            let factor = pixelationTime < 0.5 ? Ease.inOutSine(pixelationTime / 0.5) : Ease.inOutSine(1.0 - (pixelationTime - 0.5) / 0.5);
            this._camera.getPostProcessingShader(PostProcessingShaderIndex.PIXELATE)
                        .setUniformFloat("intensity", factor * 0.35);
            this._camera.getPostProcessingShader(PostProcessingShaderIndex.PIXELATE)
                        .setUniformVector("screenSize", new Vector(this._camera.canvas.width, this._camera.canvas.height));
                    }
        else {
            this._camera.disableShader(PostProcessingShaderIndex.PIXELATE);
        }

        const playerCI = getChunkIndex(this.player.position);

        for (let xo = -RENDER_DISTANCE; xo <= RENDER_DISTANCE; xo++) {
            for (let yo = -RENDER_DISTANCE; yo <= RENDER_DISTANCE; yo++) {
                const chunkIndex = playerCI + yo + xo * MAX_NUM_CHUNKS;
                const chunk = this.chunks.get(chunkIndex);
                if (!chunk) continue;
                chunk.renderFramebuffer();
            }
        }

        this._camera.clear();

        const shadows: ShaderShadow[] = [];
        const shadowCastingObjects = [];
        for (let i = 0; i < this.activeObjects.length; i++) {
            const object = this.activeObjects[i];
            if (object.castsShadow) {
                shadows.push({
                    position: Vector.add(object.position, new Vector(0, -object.scale.y/2)),
                    size: object.shadowSize,
                });
                shadowCastingObjects.push(object);
                if (shadows.length >= MAX_SHADOWS) break;
            }
        }
        this._camera.setShadows(shadows);

        // this._camera.setLights([
        //     {
        //         position: this.player.position,
        //         intensity: 1 + 0.2 * (Math.sin(6 * this.time) * 0.2 + Math.sin(2.4 * this.time) * 0.45 + Math.sin(8 * this.time) * 0.35),
        //         radius: 120,
        //         color: new Color(0.8, 0.6, 0.2, 1.0),
        //     }
        // ]);
        this._camera.setLights([]);

        this._camera.setPortals(this.getGameObjectsByFilter((obj) => obj.tag === "portal").map(portal =>
            ({
                position: portal.position,
                radius: portal.getComponent("portal-effects").data.radius + 8,
                strength: 5,
                age: portal.age
            })
        ));

        this._camera.color = Color.WHITE;
        for (let xo = -RENDER_DISTANCE; xo <= RENDER_DISTANCE; xo++) {
            for (let yo = -RENDER_DISTANCE; yo <= RENDER_DISTANCE; yo++) {
                const chunkIndex = playerCI + yo + xo * MAX_NUM_CHUNKS;
                const chunk = this.chunks.get(chunkIndex);
                const chunkPos = getChunkWorldPosition(chunkIndex);
                if (!chunk) continue;
                const texture = chunk.tileFramebuffer.texture;
                if (texture === null) continue;
                this._camera.drawTextureRaw(texture, undefined, Matrix4.transformation(chunkPos.x, chunkPos.y, 16, 16, 0, 0, 0, 0));
                // for (let i = 0; i < TILES_PER_CHUNK; i+=TILES_PER_CHUNK) {
                //     const pair = chunk.tiles[i];
                //     const tile = tileCodex[pair.index];
                //     let spriteID = tile.animationIndex !== undefined ?
                //                         animationsCodex[tile.animationIndex].getFrame(this.time) :
                //                         tile.spriteID;
                //     if (spriteID) {
                //         const tilePosition = new Vector(
                //             chunkPos.x + Math.floor(i / CHUNK_SIZE) * PIXELS_PER_TILE + PIXELS_PER_TILE / 2, 
                //             chunkPos.y + (i % CHUNK_SIZE) * PIXELS_PER_TILE + PIXELS_PER_TILE / 2
                //         );
                //         this._camera.drawTexture(
                //             getTexture(spriteID), 
                //             tilePosition.x, 
                //             tilePosition.y, 
                //             PIXELS_PER_TILE, PIXELS_PER_TILE,
                //             pair.rotation * Math.PI / 2
                //         );
                //     }
                // }
            }
        }

        for (const gameObject of shadowCastingObjects) {
            this._camera.color = new Color(0, 0, 0, 0.75);
            const pos = Vector.add(gameObject.position, gameObject.renderer!.data.offset);
            const h = Math.round(gameObject.scale.y * 0.35 * 2) / 2;
            this._camera.drawTexture(
                getTexture(gameObject.renderer!.data.spriteID), 
                pos.x, pos.y - gameObject.scale.y / 2 + h / 2, 
                gameObject.scale.x, h, gameObject.rotation, gameObject.rotationPointOffset, 1);
        }

        this._camera.setShadows([]);
        
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].layer === ParticleLayer.BELOW_OBJECTS)
                this.drawParticle(this.particles[i]);
        }

        [...this.activeObjects].sort((a: GameObject, b: GameObject) => (b.position.y - b.scale.y / 2 - b.zIndex) - (a.position.y - a.scale.y / 2 - a.zIndex))
            .forEach((gameObject: GameObject) => {
                gameObject.render(this._camera);
            });

        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].layer === ParticleLayer.ABOVE_OBJECTS)
                this.drawParticle(this.particles[i]);
        }
        
        if (settings.showChunks) {
            this._camera.color = Color.GREEN;
            const chunkPos = getChunkWorldPosition(getChunkIndex(this._camera.position));
            for (let xo = -RENDER_DISTANCE; xo <= RENDER_DISTANCE; xo++) {
                for (let yo = -RENDER_DISTANCE; yo <= RENDER_DISTANCE; yo++) {
                    const chunkIndex = getChunkIndex(new Vector(chunkPos.x + xo * CHUNK_SIZE, chunkPos.y + yo * CHUNK_SIZE));
                    if (this.chunks.has(chunkIndex)) {
                        this._camera.strokeRect(
                            chunkPos.x + (xo * CHUNK_SIZE + CHUNK_SIZE / 2) * PIXELS_PER_TILE, 
                            chunkPos.y + (yo * CHUNK_SIZE + CHUNK_SIZE / 2) * PIXELS_PER_TILE, 
                            CHUNK_SIZE * PIXELS_PER_TILE, 
                            CHUNK_SIZE * PIXELS_PER_TILE
                        );
                    }
                }
            }
        }
        if (settings.showCameraPosition) {
            this._camera.color = Color.ORANGE;
            this._camera.fillRect(this._camera.position.x, this._camera.position.y, 8, 8);
        }

        this._camera.renderToScreen();
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

    public getNearestGameObjectWithFilter(source: Vector, filter: (gameObject: GameObject) => boolean): 
                    {object: GameObject, distance: number} | undefined {
        let minDistance = 999999;
        let object = undefined;
        for (let i = 0; i < this.activeObjects.length; i++) {
            if (filter(this.activeObjects[i])) {
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

    public getGameObjectsByFilter(predicate: (gameObject: GameObject) => boolean) {
        return this.activeObjects.filter(predicate);
    }

    public addParticle(particle: Particle) {
        this.particles.push(particle);
    }

    public addPartialParticle(particle: Partial<Particle>) {
        this.addParticle({
            angularVelocity: 0,
            birthTime: this.time,
            color: Color.WHITE,
            layer: ParticleLayer.BELOW_OBJECTS,
            lifetime: 1,
            position: Vector.zero(),
            rotation: 0,
            scale: 1,
            spriteID: "square",
            useRelativePosition: false,
            velocity: Vector.zero(),
            ...particle
        });
    }

    public addParticleExplosion(position: Vector, color: Color, radius: number, numberOfParticles: number, spriteID="square", scaleBound=2) {
        for (let i = 0; i < numberOfParticles; i++) {
            const f = MathUtils.random(-0.2, 0.2);
            this.addPartialParticle(
                {
                    spriteID: spriteID,
                    position: position.copy(),
                    lifetime: MathUtils.random(0.5, 1.5),
                    layer: ParticleLayer.ABOVE_OBJECTS,
                    scale: MathUtils.random(1, scaleBound),
                    velocity: MathUtils.randomVector(MathUtils.random(2, radius)),
                    angularVelocity: MathUtils.random(-6, 6),
                    color: new Color(color.r + f, color.g + f, color.b + f, color.a),
                }
            )
        }
    }

    private getTileCoordinate(position: Vector): { chunkIndex: number, tilePositionIndex: number } {
        const chunkIndex = getChunkIndex(position);
        const chunkPosition = getChunkWorldPosition(chunkIndex);
        const offset = Vector.scaled(Vector.subtract(position, chunkPosition), 1 / PIXELS_PER_TILE);
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
    public setTile(position: Vector, tileIndex: TileIndex, rotation: 0 | 1 | 2 | 3 = 0) {
        const { chunkIndex, tilePositionIndex } = this.getTileCoordinate(position);
        if (!this.chunks.has(chunkIndex)) {
            this.generateChunk(chunkIndex);
        }
        const chunk = this.chunks.get(chunkIndex);
        if (!chunk) throw Error("something went wrong");
        chunk.tiles[tilePositionIndex] = {
            index: tileIndex,
            rotation: rotation
        };
    }

    public setTileWithTilemapCoordinate(position: Vector, tileIndex: TileIndex, rotation: 0 | 1 | 2 | 3 = 0) {
        this.setTile(Vector.scaled(position, PIXELS_PER_TILE), tileIndex, rotation);
    }

    public getTileIndex(position: Vector): TileIndex {
        const { chunkIndex, tilePositionIndex } = this.getTileCoordinate(position);
        if (!this.chunks.has(chunkIndex)) {
            this.generateChunk(chunkIndex);
        }
        const chunk = this.chunks.get(chunkIndex);
        if (!chunk) throw Error("something went wrong");
        return chunk.tiles[tilePositionIndex].index;
    }

    // Get the tile object from the tilemap stored at the given world position
    // will generate the chunk there if necessary.
    public getTile(position: Vector): TileData {
        const tileIndex = this.getTileIndex(position);
        return tileCodex[tileIndex];
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
    public isTileWithPropertyInArea(position: Vector, radius: number, property: keyof TileData, value: any): boolean {
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

    public get gameOver() {
        return this._player.destroyed;
    }

    // Pauses the game
    public pause() {
        if (this.gameOver) {
            return;
        }
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

    // Schedule a function to run after a certain game time delay.
    public setTimeout(func: () => void, delay: number) {
        this.timeoutQueue.enqueue({
            func,
            delay,
            timestamp: this.time,
        })
    }
}

export { Game, getChunkIndex, PIXELS_PER_TILE };