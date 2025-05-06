import { Vector, MathUtils } from "../utils";
import { GameObject } from "../gameObjects";
import { tileCodex, Tile } from "../game/tiles";
import { Camera } from "../rendering/Camera";
import { FrameBuffer } from "../rendering/FrameBuffer";
import { ShaderProgram } from "../rendering/ShaderProgram";
import { animationsCodex } from "../game/animations";
import { getTexture } from "../assets/imageLoader";
import { Grid } from "../utils/Grid";

class ChunkConstants {
    static readonly CHUNK_SIZE = 8;
    static readonly TILES_PER_CHUNK = ChunkConstants.CHUNK_SIZE * ChunkConstants.CHUNK_SIZE;
    static readonly PIXELS_PER_TILE = 16;
    static readonly PIXELS_PER_CHUNK = ChunkConstants.CHUNK_SIZE * ChunkConstants.PIXELS_PER_TILE;
    static readonly MAX_NUM_CHUNKS = 1024; // number of chunks along width and height of the world
    static readonly WORLD_SIZE = ChunkConstants.CHUNK_SIZE * ChunkConstants.MAX_NUM_CHUNKS;
    
    static getChunkIndex(position: Vector) {
        const c = Vector.add(
            Vector.scaled(position, 1 / ChunkConstants.PIXELS_PER_TILE), 
            new Vector(ChunkConstants.WORLD_SIZE / 2, ChunkConstants.WORLD_SIZE / 2)
        );
        c.scale(1 / ChunkConstants.CHUNK_SIZE);
        return Math.floor(c.x) * ChunkConstants.MAX_NUM_CHUNKS + Math.floor(c.y);
    }
    
    static getChunkWorldPosition(chunkIndex: number) {
        const x = Math.floor(chunkIndex / ChunkConstants.MAX_NUM_CHUNKS) * ChunkConstants.CHUNK_SIZE - ChunkConstants.WORLD_SIZE / 2;
        const y = (chunkIndex % ChunkConstants.MAX_NUM_CHUNKS) * ChunkConstants.CHUNK_SIZE - ChunkConstants.WORLD_SIZE / 2;
        return new Vector(x * ChunkConstants.PIXELS_PER_TILE, y * ChunkConstants.PIXELS_PER_TILE);
    }
}

class Chunk {
    public objects: GameObject[];
    public tiles: Grid<Tile>;
    public dirty: boolean; // Marked true if the tileFramebuffer does not match the tiles
    public tileFramebuffer: FrameBuffer;
    private gl: WebGLRenderingContext;

    constructor(gl: WebGLRenderingContext, tiles: Tile[]) {
        this.gl = gl;
        this.tiles = Grid.from(tiles, ChunkConstants.CHUNK_SIZE, ChunkConstants.CHUNK_SIZE);
        this.objects = [];
        this.dirty = true;
        this.tileFramebuffer = new FrameBuffer(gl, ChunkConstants.PIXELS_PER_CHUNK, ChunkConstants.PIXELS_PER_CHUNK);
    }

    public renderFramebuffer(camera: Camera, chunkShader: ShaderProgram) {
        if (!this.dirty) {
            return;
        }
        console.log("rendering chunk framebuffer");
        this.tileFramebuffer.bind();
        chunkShader.use();
        this.gl.viewport(0, 0, this.tileFramebuffer.width, this.tileFramebuffer.height);
        // this.gl.clearColor(MathUtils.random(0, 1), 0.1, 0.8, 1.0);
        this.gl.clearColor(0, 0, 0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.tiles.iterate((self, r, c) => {
            const x = c;
            const y = r;
            const tile = this.tiles.get(r, c);
            const tileData = tileCodex[tile.index];
            let spriteID = "undefined";
            if (tileData.spriteID) spriteID = tileData.spriteID;
            if (tileData.animationIndex) {
                const animation = animationsCodex[tileData.animationIndex];
                // spriteID = animation.getFrame()
            }
            const texture = getTexture(spriteID);
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
            const mask = "square";
            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_2D, getTexture(mask).texture);
            chunkShader.setUniformInt("texture", 0);
            chunkShader.setUniformInt("mask", 1);
            chunkShader.setUniformFloat("chunkSize", ChunkConstants.CHUNK_SIZE);
            chunkShader.setUniform2f("position", x, ChunkConstants.CHUNK_SIZE - 1 - y);
            chunkShader.setUniformInt("rotation", tile.rotation);
            camera.renderQuad();
            console.log(spriteID);
        });
        this.dirty = false;
    }
}

export { Chunk, ChunkConstants }