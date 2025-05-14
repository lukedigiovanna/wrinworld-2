import { Game } from "../game/game";
import { Level, LevelIndex, PortalDropPool } from "./";
import { Grid, Point, Rectangle, Vector } from "../utils";
import { Tile, TileIndex } from "../game/tiles";
import { ChunkConstants } from "../game/Chunk";
import { PropIndex, propsCodex } from "../game/props";
import { Nullable } from "../utils/types";
import { getTexture } from "../assets/imageLoader";
import { PropFactory } from "../gameObjects";

class ForestBoss implements Level {
    readonly name = "Forest Boss";
    readonly type = "boss"; 
    readonly portalDrops: PortalDropPool[] = [];
    
    private readonly gridSize = 76;

    readonly cameraBounds = new Rectangle(
        -this.gridSize / 2 * ChunkConstants.PIXELS_PER_TILE, 
        this.gridSize / 2 * ChunkConstants.PIXELS_PER_TILE, 
        0,
        this.gridSize * ChunkConstants.PIXELS_PER_TILE, 
    );
    readonly endzone = new Rectangle(
        -100, 
        100, 
        this.gridSize * ChunkConstants.PIXELS_PER_TILE, 
        this.gridSize * ChunkConstants.PIXELS_PER_TILE + 200
    );
    readonly nextLevels = [LevelIndex.SCHOOL];
    readonly playerSpawnPosition = new Vector(0, 22 * ChunkConstants.PIXELS_PER_TILE);

    generate(game: Game) {
        const arenaTileGrid = new Grid<Tile>(this.gridSize, this.gridSize, { index: TileIndex.ROCKS, rotation: 0 });
        arenaTileGrid.fillCircle(this.gridSize / 2, this.gridSize / 2, 18, { index: TileIndex.GRASS, rotation: 0 });
        arenaTileGrid.fillCircle(this.gridSize / 2, this.gridSize / 2, 6, { index: TileIndex.SAND, rotation: 0 });
        arenaTileGrid.fillCircle(this.gridSize / 2, this.gridSize / 2, 4, { index: TileIndex.WATER, rotation: 0 });
        const arenaPropGrid = new Grid<Nullable<PropIndex>>(this.gridSize, this.gridSize, null);
        arenaPropGrid.drawCircle(this.gridSize / 2, this.gridSize / 2, 18, PropIndex.EVERGREEN_TREE);

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (arenaTileGrid.get(r, c).index === TileIndex.GRASS) {
                    if (Math.random() < 0.01) { 
                        arenaPropGrid.set(r, c, PropIndex.RED_WILDFLOWER);
                    }
                }
            }
        }

        arenaTileGrid.iterate((self, r, c) => {
            let x = c - self.width / 2;
            let y = r;
            const tile = self.get(r, c)!;
            game.setTileAtTilePosition(new Point(x, y), tile.index, tile.rotation);
            
            const prop = arenaPropGrid.get(r, c);
            if (prop !== null) {
                const texture = getTexture(propsCodex[prop as PropIndex].spriteID);
                const position = new Vector((x + 0.5) * ChunkConstants.PIXELS_PER_TILE, y * ChunkConstants.PIXELS_PER_TILE + texture.height / 2);
                game.addGameObject(PropFactory(prop, position));
            }
        });
    }
}

export { ForestBoss };
