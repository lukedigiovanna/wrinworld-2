import { Rectangle, Vector } from "../utils";
import { Game } from "../game/game";
import { PortalDrop } from "../gameObjects";
import { ForestLevel } from "./ForestLevel";
import { SchoolLevel } from "./SchoolLevel";

type PortalDropPool = PortalDrop[];

interface Level {
    name: string;
    portalDrops: PortalDropPool[];
    playerSpawnPosition: Vector;
    cameraBounds: Rectangle;

    generate: (game: Game) => void;    
}

enum LevelIndex {
    FOREST,
    SCHOOL,
}

const levels: Record<LevelIndex, Level> = {
[LevelIndex.FOREST]: new ForestLevel(),
[LevelIndex.SCHOOL]: new SchoolLevel(),
}

export { levels, LevelIndex };
export type { Level, PortalDropPool };
