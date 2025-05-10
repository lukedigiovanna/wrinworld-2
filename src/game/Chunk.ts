import { Vector, MathUtils, Point } from "../utils";
import { GameObject } from "../gameObjects";
import { tileCodex, Tile, TileIndex } from "../game/tiles";
import { Camera } from "../rendering/Camera";
import { FrameBuffer } from "../rendering/FrameBuffer";
import { ShaderProgram } from "../rendering/ShaderProgram";
import { animationsCodex } from "../game/animations";
import { getTexture } from "../assets/imageLoader";
import { Grid } from "../utils/Grid";
import { Game } from "./game";

class ChunkConstants {
    static readonly CHUNK_SIZE = 8;
    static readonly PIXELS_PER_TILE = 16;
    static readonly PIXELS_PER_CHUNK = ChunkConstants.CHUNK_SIZE * ChunkConstants.PIXELS_PER_TILE;
    
    static getChunkPositionFromWorldPosition(position: Vector): Point {
        return new Point(
            Math.floor(position.x / ChunkConstants.PIXELS_PER_CHUNK),
            Math.floor(position.y / ChunkConstants.PIXELS_PER_CHUNK),
        );
    }

    static getChunkPositionFromTilePosition(tilePosition: Point): Point {
        return new Point(
            Math.floor(tilePosition.x / ChunkConstants.CHUNK_SIZE),
            Math.floor(tilePosition.y / ChunkConstants.CHUNK_SIZE),
        );
    }
    
    static getChunkWorldPosition(chunkX: number, chunkY: number) {
        return new Vector(
            chunkX * ChunkConstants.PIXELS_PER_CHUNK, 
            chunkY * ChunkConstants.PIXELS_PER_CHUNK
        );
    }

    static getChunkTilePosition(chunkX: number, chunkY: number) {
        return new Point(
            chunkX * ChunkConstants.CHUNK_SIZE,
            chunkY * ChunkConstants.CHUNK_SIZE,
        )
    }
}

class Chunk {
    public objects: GameObject[];
    public tiles: Grid<Tile>;
    public dirty: boolean; // Marked true if the tileFramebuffer does not match the tiles
    public tileFramebuffer: FrameBuffer;
    private gl: WebGLRenderingContext;
    private readonly position: Point;

    constructor(gl: WebGLRenderingContext, tiles: Grid<Tile>, position: Point) {
        this.position = position;
        this.gl = gl;
        this.tiles = tiles;
        this.objects = [];
        this.dirty = true;
        this.tileFramebuffer = new FrameBuffer(gl, ChunkConstants.PIXELS_PER_CHUNK, ChunkConstants.PIXELS_PER_CHUNK);
    }

    private renderTile(camera: Camera, tileSpriteID: string, maskSpriteID: string) {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, getTexture(tileSpriteID).texture);
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, getTexture(maskSpriteID).texture);
        camera.renderQuad();
    }

    public renderFramebuffer(game: Game, camera: Camera, chunkShader: ShaderProgram) {
        if (!this.dirty) {
            return;
        }
        this.tileFramebuffer.bind();
        chunkShader.use();
        this.gl.viewport(0, 0, this.tileFramebuffer.width, this.tileFramebuffer.height);
        // this.gl.clearColor(MathUtils.random(0, 1), 0.1, 0.8, 1.0);
        this.gl.clearColor(0, 0, 0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        const tilePosition = ChunkConstants.getChunkTilePosition(this.position.x, this.position.y);
        this.tiles.iterate((self, r, c) => {
            const tile = this.tiles.get(r, c);
            const tileData = tileCodex[tile.index];
            let spriteID = "undefined";
            if (tileData.spriteID) spriteID = tileData.spriteID;
            // if (tileData.animationIndex) {
            //     const animation = animationsCodex[tileData.animationIndex];
            //     // spriteID = animation.getFrame()
            // }
            chunkShader.setUniformInt("texture", 0);
            chunkShader.setUniformInt("mask", 1);
            chunkShader.setUniformFloat("chunkSize", ChunkConstants.CHUNK_SIZE);
            chunkShader.setUniform2f("position", c, ChunkConstants.CHUNK_SIZE - 1 - r);
            chunkShader.setUniformInt("rotation", tile.rotation);
            this.renderTile(camera, spriteID, "square");

            if (tileData.leaks && tileData.leaks.length > 0) {
                const x = tilePosition.x + c;
                const y = tilePosition.y + r;
                const n = game.getTileAtTilePosition(new Point(x, y + 1)).index;
                const e = game.getTileAtTilePosition(new Point(x + 1, y)).index;
                const s = game.getTileAtTilePosition(new Point(x, y - 1)).index;
                const w = game.getTileAtTilePosition(new Point(x - 1, y)).index;
                const ne = game.getTileAtTilePosition(new Point(x + 1, y + 1)).index;
                const se = game.getTileAtTilePosition(new Point(x + 1, y - 1)).index;
                const sw = game.getTileAtTilePosition(new Point(x - 1, y - 1)).index;
                const nw = game.getTileAtTilePosition(new Point(x - 1, y + 1)).index;
                for (const leakTileIndex of tileData.leaks) {
                    if (leakTileIndex === e) {
                        chunkShader.setUniformInt("rotation", 0);
                        this.renderTile(camera, tileCodex[leakTileIndex].spriteID, "tile_mask_side");
                    }
                    if (leakTileIndex === s) {
                        chunkShader.setUniformInt("rotation", 3);
                        this.renderTile(camera, tileCodex[leakTileIndex].spriteID, "tile_mask_side");
                    }
                    if (leakTileIndex === w) {
                        chunkShader.setUniformInt("rotation", 2);
                        this.renderTile(camera, tileCodex[leakTileIndex].spriteID, "tile_mask_side");
                    }
                    if (leakTileIndex === n) {
                        chunkShader.setUniformInt("rotation", 1);
                        this.renderTile(camera, tileCodex[leakTileIndex].spriteID, "tile_mask_side");
                    }
                    // if (leakTileIndex === ne) {
                    //     chunkShader.setUniformInt("rotation", 0);
                    //     this.renderTile(camera, tileCodex[leakTileIndex].spriteID, "tile_mask_corner");
                    // }
                    // if (leakTileIndex === se) {
                    //     chunkShader.setUniformInt("rotation", 3);
                    //     this.renderTile(camera, tileCodex[leakTileIndex].spriteID, "tile_mask_corner");
                    // }
                    // if (leakTileIndex === sw) {
                    //     chunkShader.setUniformInt("rotation", 2);
                    //     this.renderTile(camera, tileCodex[leakTileIndex].spriteID, "tile_mask_corner");
                    // }
                    // if (leakTileIndex === nw) {
                    //     chunkShader.setUniformInt("rotation", 1);
                    //     this.renderTile(camera, tileCodex[leakTileIndex].spriteID, "tile_mask_corner");
                    // }
                }
            }
        });
        this.dirty = false;
    }

    public setTile(r: number, c: number, tile: Tile) {
        const currentTile = this.tiles.get(r, c)!;
        if (currentTile.index === tile.index && currentTile.rotation === tile.rotation) 
            return;
        this.tiles.set(r, c, tile);
        this.dirty = true;
    }
}

export { Chunk, ChunkConstants }