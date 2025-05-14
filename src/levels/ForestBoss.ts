import { Game } from "../game/game";
import { Level, LevelIndex, PortalDropPool } from "./";
import { Point, Rectangle, Vector } from "../utils";
import { TileIndex } from "../game/tiles";

class ForestBoss implements Level {
    readonly name = "Forest Boss";
    readonly type = "boss"; 
    readonly cameraBounds = new Rectangle(-100, 100, -100, 100);
    readonly endzone = new Rectangle(-100, 100, 100, 200);
    readonly nextLevels = [LevelIndex.SCHOOL];
    readonly playerSpawnPosition = new Vector(0, 0);
    readonly portalDrops: PortalDropPool[] = [];

    generate(game: Game) {
        for (let x = -10; x <= 10; x++) {
            for (let y = -10; y <= 10; y++) {
                game.setTileAtTilePosition(new Point(x, y), TileIndex.RAINBOW_TARGET);
            }
        }
    }
}

export { ForestBoss };
