import { Vector } from "../utils";
import { Game } from "../game";
import { PortalDrop, PortalProperties } from "../gameObjects";
import { ForestLevel } from "./ForestLevel";
import { SchoolLevel } from "./SchoolLevel";

type PortalDropPool = PortalDrop[];

interface Level {
    name: string;
    portalTypes: PortalProperties[];
    portalDrops: PortalDropPool[];
    playerSpawnPosition: Vector;
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
