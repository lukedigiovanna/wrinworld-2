import { Level, PortalDropPool } from "./";
import { PortalProperties } from "../gameObjects";
import { Game } from "../game";
import { TileIndex } from "../tiles";
import { Vector } from "../utils";

class SchoolLevel implements Level {
    readonly name = "School";
    readonly portalTypes: PortalProperties[] = [

    ];
    readonly portalDrops: PortalDropPool[] = [

    ];

    generate(game: Game) {
        for (let x = -50; x <= 50; x++) {
            for (let y = 0; y <= 100; y++) {
                game.setTileWithTilemapCoordinate(new Vector(x, y), TileIndex.CURSED_SAND);
            }
        }
    }
}

export { SchoolLevel };
