import { Rectangle, Vector } from "../utils";
import { Game } from "../game/game";
import { PortalDrop } from "../gameObjects";
import { ForestLevel } from "./ForestLevel";
import { ForestBoss } from "./ForestBoss";
import { SchoolLevel } from "./SchoolLevel";

type PortalDropPool = PortalDrop[];

enum LevelIndex {
    FOREST,
    SCHOOL,
    FOREST_BOSS,
}

type LevelType = "regular" | "boss";

interface Level {
    name: string;
    type: LevelType;
    portalDrops: PortalDropPool[];
    playerSpawnPosition: Vector;
    cameraBounds: Rectangle;
    endzone: Rectangle;
    nextLevels: LevelIndex[];

    generate: (game: Game) => void;
}

const levels: Record<LevelIndex, Level> = {
[LevelIndex.FOREST]: new ForestLevel(),
[LevelIndex.SCHOOL]: new SchoolLevel(),
[LevelIndex.FOREST_BOSS]: new ForestBoss(),
}

export { levels, LevelIndex };
export type { Level, PortalDropPool };
