import { getTexture } from "../assets/imageLoader";
import { EndZoneFactory, GameObject, PlayerFactory } from "../gameObjects";
import { Vector, MathUtils, Color, Ease, Point } from "../utils";
import input from "../input";
import { Particle, ParticleLayer } from "../components";
import { Tile, tileCodex, TileData, TileIndex, TileRotation } from "./tiles";
import { Level, levels, LevelIndex } from "../levels";
import settings from "../settings";
import statTracker from "../statTracker";
import { PriorityQueue } from "../utils/PriorityQueue";
import { Camera } from "../rendering/Camera";
import { ShaderShadow, MAX_SHADOWS, ShaderProgram } from "../rendering/ShaderProgram";
import { PostProcessingShaderIndex } from "../rendering/postProcessingShaders";
import { Matrix4 } from "../utils/Matrix4";
import * as ShaderCode from "../rendering/shaderCode";
import { Chunk, ChunkConstants } from "./Chunk";
import { Grid, GridPosition } from "../utils/Grid";
import { LazyGrid } from "../utils/LazyGrid";
import { Optional } from "../utils/types";

const RENDER_DISTANCE = 3;
const TRANSITION_TO_REGULAR_TIME = 3;
const TRANSITION_TO_BOSS_TIME = 7;

interface TimeoutRequest {
    func: () => void;
    timestamp: number;
    delay: number;
}

interface ChunkTilePair {
    chunkPosition: Point;
    // Position of tile in the chunk
    tilePosition: GridPosition;
}

enum GameState {
    GAME,
    TRANSITION_TO_REGULAR,
    TRANSITION_TO_BOSS,
}

class Game {
    private timeoutQueue: PriorityQueue<TimeoutRequest>;
    private objectQueue: GameObject[] = []; // Queue of objects to add on the next frame
    private objectDeleteQueue: GameObject[] = [];
    private _totalObjects = 0;
    private activeObjects: GameObject[] = [];
    // Special array to store references to all portals
    private _portals: GameObject[] = [];

    private particles: Particle[] = [];
    
    private chunks: LazyGrid<Chunk>;
    
    private _camera: Camera;
    private _player: GameObject;
    private _gameTime: number = 0;
    private gameOverTime: number | undefined = undefined;

    private paused: boolean = false;

    private level?: Level;
    private dirtyLevel = false;
    
    private _state: GameState;
    private stateStartTime: number;

    private chunkShader: ShaderProgram;

    constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
        this.chunks = new LazyGrid<Chunk>();
        
        this._camera = new Camera(this, canvas, gl);
        this._player = PlayerFactory(new Vector(0, 16 * ChunkConstants.PIXELS_PER_TILE));
        this.addGameObject(this._player);
        this._camera.target = this._player;

        this._state = GameState.GAME;
        this.stateStartTime = 0;

        this.switchLevel(LevelIndex.FOREST, true);

        this.timeoutQueue = new PriorityQueue<TimeoutRequest>(
            // The request with less time remaining should come before
            (req1: TimeoutRequest, req2: TimeoutRequest) => {
                const remaining1 = req1.delay - (this.time - req1.timestamp);
                const remaining2 = req2.delay - (this.time - req2.timestamp);
                return remaining1 < remaining2;
            });

        this.chunkShader = new ShaderProgram(gl, ShaderCode.chunkVertexShaderCode, ShaderCode.chunkFragmentShaderCode);
    }

    public switchLevel(levelIndex: LevelIndex, skipOutro=false) {
        if (this.dirtyLevel) {
            return;
        }
        this.dirtyLevel = true;
        this.level = levels[levelIndex];
        this.state = this.level.type === "regular" ? GameState.TRANSITION_TO_REGULAR 
                                                   : GameState.TRANSITION_TO_BOSS;
        if (skipOutro) {
            if (this.state === GameState.TRANSITION_TO_REGULAR) {
                this.stateStartTime -= TRANSITION_TO_REGULAR_TIME / 2;
            }
            else if (this.state === GameState.TRANSITION_TO_BOSS) {
                this.stateStartTime -= TRANSITION_TO_BOSS_TIME / 2;
            }
        }
    }

    public switchNextLevel() {
        if (!this.level) {
            throw Error();
        }
        if (this.level.nextLevels.length === 0) {
            alert("Congrats, you won!");
            return;
        }
        this.switchLevel(MathUtils.randomChoice(this.level.nextLevels));
    }

    public get stateTime() {
        return this.time - this.stateStartTime;
    }

    public set state(state: GameState) {
        this.stateStartTime = this.time;
        this._state = state;
    }

    public get state() {
        return this._state;
    }

    // Resets the entire world while maintaining the player.
    private clear(playerPosition: Vector) {
        // Unload everything if there was already a loaded level
        this.chunks = new LazyGrid();
        this.activeObjects = [];
        this._portals = [];
        this.particles = [];
        this._totalObjects = 0;

        this.player.position.set(playerPosition);

        if (this.player.started) {
            this.addToAppropriateChunk(this.player);
            this._totalObjects++;
        }

        this._camera.position.set(playerPosition);
    }

    // Performs any boilerplate updates to the game such as removing dead objects
    // adding new objects, updating active chunks, and generating new chunks.
    public preUpdate() {
        if (this.paused) {
            return;
        }

        if (this.dirtyLevel && this.level) {
            if (this.state === GameState.TRANSITION_TO_REGULAR && 
                this.stateTime >= TRANSITION_TO_REGULAR_TIME / 2 ||
                this.state === GameState.TRANSITION_TO_BOSS &&
                this.stateTime >= TRANSITION_TO_BOSS_TIME / 2
            ) {
                this.clear(this.level.playerSpawnPosition);
                this.level.generate(this);
                this._camera.bounds = this.level.cameraBounds;
                this.addGameObject(EndZoneFactory(this.level.endzone));
                this.dirtyLevel = false;
            }
        }

        while (this.checkTimeout());

        while (this.objectQueue.length > 0) {
            const obj = this.objectQueue.pop();
            if (!obj) {
                throw Error("Cannot add undefined object to game");
            }
            // determine chunk index based on position
            obj.start();
            this.addToAppropriateChunk(obj);
            if (obj.tag === "portal") {
                this._portals.push(obj);
            }
            this._totalObjects++;
        }

        while (this.objectDeleteQueue.length > 0) {
            const obj = this.objectDeleteQueue.pop()!;
            const chunkPos = obj.storedInChunkPosition;
            if (!chunkPos) {
                throw Error("Object was never added to a chunk");
            }
            const chunk = this.chunks.get(chunkPos.x, chunkPos.y);
            if (!chunk) {
                throw Error("Object was supposedly stored in a non-loaded chunk");
            }
            const objInd = chunk.objects.indexOf(obj);
            if (objInd < 0) {
                throw Error("object to remove was not found in its respective chunk");
            }
            if (obj.tag === "portal") {
                this._portals.splice(this._portals.indexOf(obj), 1);
            }
            chunk.objects.splice(objInd, 1);
            this._totalObjects--;
        }

        const playerChunkPosition = ChunkConstants.getChunkPositionFromWorldPosition(this.player.position);
        // get all objects in the (n x n) chunk grid centered around the camera
        const listOfChunks = [];
        for (let xo = -RENDER_DISTANCE; xo <= RENDER_DISTANCE; xo++) {
            for (let yo = -RENDER_DISTANCE; yo <= RENDER_DISTANCE; yo++) {
                const x = playerChunkPosition.x + xo;
                const y = playerChunkPosition.y + yo;
                if (!this.chunks.has(x, y)) {
                    this.generateChunk(x, y);
                }
                const chunk = this.chunks.get(x, y)!; // we know it will exist
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

        this._gameTime += dt;

        if (this.state === GameState.TRANSITION_TO_BOSS) {
            if (this.stateTime > TRANSITION_TO_BOSS_TIME) {
                this.state = GameState.GAME;
            }
            return;
        }
        else if (this.state === GameState.TRANSITION_TO_REGULAR) {
            if (this.stateTime >= TRANSITION_TO_REGULAR_TIME) {
                this.state = GameState.GAME;
            }
            return;
        }

        $("#portals-remaining").text(this._portals.length);

        if (input.isKeyPressed("Escape")) {
            this.pause();
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
                particle.rotation += particle.angularVelocity * dt;
                if (particle.update)
                    particle.update(particle, dt);
            }
        }

        this._camera.update(dt);
    }

    public draw() {
        if (this.paused) {
            return;
        }
        
        this._camera.disableShader(PostProcessingShaderIndex.PIXELATE);
        this._camera.disableShader(PostProcessingShaderIndex.END_LEVEL);
        if (this.state === GameState.TRANSITION_TO_REGULAR) {
            const pixelationTime = this.stateTime / TRANSITION_TO_REGULAR_TIME;
            this._camera.enableShader(PostProcessingShaderIndex.PIXELATE);
            let factor = pixelationTime < 0.5 ? Ease.inOutSine(pixelationTime / 0.5) : Ease.inOutSine(1.0 - (pixelationTime - 0.5) / 0.5);
            this._camera.getPostProcessingShader(PostProcessingShaderIndex.PIXELATE)
                        .setUniformFloat("intensity", factor * 0.35);
            this._camera.getPostProcessingShader(PostProcessingShaderIndex.PIXELATE)
                        .setUniformVector("screenSize", new Vector(this._camera.canvas.width, this._camera.canvas.height));
        }
        else if (this.state === GameState.TRANSITION_TO_BOSS) {
            let t = this.stateTime / TRANSITION_TO_BOSS_TIME;
            if (t < 0.4) t = t / 0.4;
            else if (t < 0.6) t = 1.0;
            else t = (1 - t) / 0.4;
            this._camera.enableShader(PostProcessingShaderIndex.END_LEVEL);
            this._camera.getPostProcessingShader(PostProcessingShaderIndex.END_LEVEL)
                        .setUniformFloat("t", Ease.inOutBounce(t));
        }

        const playerChunkPosition = ChunkConstants.getChunkPositionFromWorldPosition(this.player.position);

        for (let xo = -RENDER_DISTANCE; xo <= RENDER_DISTANCE; xo++) {
            for (let yo = -RENDER_DISTANCE; yo <= RENDER_DISTANCE; yo++) {
                const x = playerChunkPosition.x + xo;
                const y = playerChunkPosition.y + yo;
                const chunk = this.chunks.get(x, y);
                if (!chunk) continue;
                chunk.renderFramebuffer(this, this.camera, this.chunkShader);
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
                const x = playerChunkPosition.x + xo;
                const y = playerChunkPosition.y + yo;
                const chunk = this.chunks.get(x, y);
                if (!chunk) continue;
                const chunkPos = ChunkConstants.getChunkWorldPosition(x, y);
                const texture = chunk.tileFramebuffer.texture;
                if (texture === null) continue;
                this._camera.drawTextureRaw(texture, undefined, Matrix4.transformation(
                    chunkPos.x, 
                    chunkPos.y,
                    ChunkConstants.PIXELS_PER_CHUNK, ChunkConstants.PIXELS_PER_CHUNK, 
                    0, 0, 0, 0
                ));
            }
        }

        for (const gameObject of shadowCastingObjects) {
            this._camera.color = new Color(0, 0, 0, 0.75);
            const pos = Vector.add(gameObject.position, gameObject.renderer!.data.offset);
            const h = Math.round(gameObject.scale.y * 0.35 * 2) / 2;
            this._camera.drawTexture(
                getTexture(gameObject.renderer!.data.spriteID), 
                pos.x, pos.y - gameObject.scale.y / 2 + h / 2, 
                gameObject.scale.x, h, 0, Vector.zero(), 1);
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
            for (let xo = -RENDER_DISTANCE; xo <= RENDER_DISTANCE; xo++) {
                for (let yo = -RENDER_DISTANCE; yo <= RENDER_DISTANCE; yo++) {
                    const chunkX = playerChunkPosition.x + xo;
                    const chunkY = playerChunkPosition.y + yo;
                    const chunkPos = ChunkConstants.getChunkWorldPosition(chunkX, chunkY);
                    this._camera.strokeRect(
                        chunkPos.x + ChunkConstants.PIXELS_PER_CHUNK / 2, 
                        chunkPos.y + ChunkConstants.PIXELS_PER_CHUNK / 2, 
                        ChunkConstants.PIXELS_PER_CHUNK, 
                        ChunkConstants.PIXELS_PER_CHUNK
                    );
                }
            }
        }
        if (settings.showCameraPosition) {
            this._camera.color = Color.ORANGE;
            this._camera.fillRect(this._camera.position.x, this._camera.position.y, 8, 8);
        }
        if (settings.showMousePosition) {    
            this._camera.color = Color.WHITE;
            const mousePos = this._camera.screenToWorldPosition(input.mousePosition);
            this._camera.drawTexture(getTexture("cursor"), mousePos.x, mousePos.y, 9, 9);
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

    private generateChunk(chunkX: number, chunkY: number): void {
        const tiles = new Grid<Tile>(
            ChunkConstants.CHUNK_SIZE, ChunkConstants.CHUNK_SIZE, 
            { index: TileIndex.AIR, rotation: 0 }
        );
        const chunk = new Chunk(this.camera.gl, tiles, new Point(chunkX, chunkY));
        this.chunks.set(chunkX, chunkY, chunk);
    }

    private addToAppropriateChunk(obj: GameObject) {
        const chunkPosition = ChunkConstants.getChunkPositionFromWorldPosition(obj.position);
        if (!this.chunks.has(chunkPosition.x, chunkPosition.y)) {
            this.generateChunk(chunkPosition.x, chunkPosition.y);
        };
        const chunk = this.chunks.get(chunkPosition.x, chunkPosition.y)!;
        chunk.objects.push(obj);
        obj.storedInChunkPosition = chunkPosition;
    }

    public changeChunk(obj: GameObject, lastChunkPosition: Optional<Point>) {
        // remove the object from "lastChunk"
        if (lastChunkPosition !== undefined) {
            if (!this.chunks.has(lastChunkPosition.x, lastChunkPosition.y)) {
                throw Error("The supposed last chunk has never been loaded: " + lastChunkPosition.x + ", " + lastChunkPosition.y);
            }
            const chunk = this.chunks.get(lastChunkPosition.x, lastChunkPosition.y)!;
            const ind = chunk.objects.indexOf(obj);
            if (ind < 0) {
                throw Error("The given object was not found in its supposed last chunk: " + lastChunkPosition.x + ", " + lastChunkPosition.y);
            }
            chunk.objects.splice(ind, 1);
        }
        this.addToAppropriateChunk(obj);
    }

    // gets the adjacent objects to a position (those within a 1 chunk radius)
    public getAdjacentObjects(position: Vector) {
        const chunkPosition = ChunkConstants.getChunkPositionFromWorldPosition(position);
        const objs = [];
        for (let xo = -1; xo <= 1; xo++) {
            for (let yo = -1; yo <= 1; yo++) {
                const chunk = this.chunks.get(
                    chunkPosition.x + xo, chunkPosition.y + yo
                );
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

    private getTileCoordinateFromWorldPosition(position: Vector): ChunkTilePair {
        const chunkPosition = ChunkConstants.getChunkPositionFromWorldPosition(position);
        const chunkWorldPosition = ChunkConstants.getChunkWorldPosition(chunkPosition.x, chunkPosition.y);
        const offset = position.minus(chunkWorldPosition).scaled(1 / ChunkConstants.PIXELS_PER_TILE);
        const offsetX = MathUtils.clamp(Math.floor(offset.x), 0, ChunkConstants.CHUNK_SIZE - 1);
        const offsetY = MathUtils.clamp(Math.floor(offset.y), 0, ChunkConstants.CHUNK_SIZE - 1);
        return {
            chunkPosition,
            tilePosition: { row: offsetY, col: offsetX }
        };
    }

    // Set the tile at the integer tile coordinates to the given tileIndex.
    // will generate the chunk there if it is not generated already.
    public setTileAtWorldPosition(position: Vector, tileIndex: TileIndex, rotation: TileRotation = 0) {
        const { chunkPosition, tilePosition } = this.getTileCoordinateFromWorldPosition(position);
        if (!this.chunks.has(chunkPosition.x, chunkPosition.y)) {
            this.generateChunk(chunkPosition.x, chunkPosition.y);
        }
        const chunk = this.chunks.get(chunkPosition.x, chunkPosition.y);
        if (!chunk) throw Error("something went wrong");
        chunk.setTile(tilePosition.row, tilePosition.col, {
            index: tileIndex,
            rotation: rotation
        });
    }

    public getTileAtWorldPosition(position: Vector): TileIndex {
        const { chunkPosition, tilePosition } = this.getTileCoordinateFromWorldPosition(position);
        if (!this.chunks.has(chunkPosition.x, chunkPosition.y)) {
            this.generateChunk(chunkPosition.x, chunkPosition.y);
        }
        const chunk = this.chunks.get(chunkPosition.x, chunkPosition.y);
        if (!chunk) throw Error("something went wrong");
        return chunk.tiles.get(tilePosition.row, tilePosition.col).index;
    }

    // Get the tile object from the tilemap stored at the given world position
    // will generate the chunk there if necessary.
    public getTileDataAtWorldPosition(position: Vector): TileData {
        const tileIndex = this.getTileAtWorldPosition(position);
        return tileCodex[tileIndex];
    }

    private getTileCoordinateFromTilePosition(position: Point): ChunkTilePair {
        const chunkPosition = ChunkConstants.getChunkPositionFromTilePosition(position);
        const chunkWorldPosition = ChunkConstants.getChunkTilePosition(chunkPosition.x, chunkPosition.y);
        const offsetX = position.x - chunkWorldPosition.x;
        const offsetY = position.y - chunkWorldPosition.y;
        return {
            chunkPosition,
            tilePosition: { row: offsetY, col: offsetX }
        };
    }

    public setTileAtTilePosition(position: Point, tileIndex: TileIndex, rotation: TileRotation = 0) {
        const { chunkPosition, tilePosition } = this.getTileCoordinateFromTilePosition(position);
        if (!this.chunks.has(chunkPosition.x, chunkPosition.y)) {
            this.generateChunk(chunkPosition.x, chunkPosition.y);
        }
        const chunk = this.chunks.get(chunkPosition.x, chunkPosition.y);
        if (!chunk) throw Error("something went wrong");
        chunk.setTile(tilePosition.row, tilePosition.col, {
            index: tileIndex,
            rotation: rotation
        });
    }

    public getTileAtTilePosition(position: Point) {
        const { chunkPosition, tilePosition } = this.getTileCoordinateFromTilePosition(position);
        if (!this.chunks.has(chunkPosition.x, chunkPosition.y)) {
            this.generateChunk(chunkPosition.x, chunkPosition.y);
        }
        const chunk = this.chunks.get(chunkPosition.x, chunkPosition.y);
        if (!chunk) throw Error("something went wrong");
        return chunk.tiles.get(tilePosition.row, tilePosition.col);
    }

    // Returns true if any tile in the given radius around the given position is
    // the given tileIndex.
    public isTileInArea(position: Vector, radius: number, tileIndex: TileIndex): boolean {
        for (let xo = -radius; xo <= radius; xo++) {
            for (let yo = -radius; yo <= radius; yo++) {
                if (this.getTileAtWorldPosition(Vector.add(position, new Vector(xo, yo))) === tileIndex) {
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
                if (this.getTileDataAtWorldPosition(Vector.add(position, new Vector(xo, yo)))[property] === value) {
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

    public get time() {
        return this._gameTime;
    }

    public get totalObjects() {
        return this._totalObjects;
    }

    public get totalActiveObjects() {
        return this.activeObjects.length;
    }

    public get portals() {
        return this._portals;
    }

    // Schedule a function to run after a certain game time delay.
    public setTimeout(func: () => void, delay: number) {
        this.timeoutQueue.enqueue({
            func,
            delay,
            timestamp: this.time,
        })
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
}

export { Game };
