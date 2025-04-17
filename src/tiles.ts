import { Color } from "./utils";

interface Tile {
    spriteID: string | undefined;
    canGrowPlants: boolean;
    canSpawnPortal: boolean;
    wall: boolean;
    trailColor?: Color;
}

enum TileIndex {
    AIR,
    GRASS,
    WATER,
    ROCKS,
    PATH,
    SAND,
    PLANKS,
    CURSED_GRASS,
    CURSED_PATH,
    CURSED_SAND,
    CURSED_PLANKS,
}

const tileCodex: Record<TileIndex, Tile> = {
[TileIndex.AIR]: {
    spriteID: undefined,
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: false,
},
[TileIndex.GRASS]: {
    spriteID: "grass",
    canGrowPlants: true,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.hex("#058600"),
},
[TileIndex.CURSED_GRASS]: {
    spriteID: "cursed_grass",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.hex("#058600"),
},
[TileIndex.WATER]: {
    spriteID: "water",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: false,
},
[TileIndex.ROCKS]: {
    spriteID: "rocks",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
},
[TileIndex.PATH]: {
    spriteID: "path",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.hex("#886e2a"),
},
[TileIndex.CURSED_PATH]: {
    spriteID: "cursed_path",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.hex("#886e2a"),
},
[TileIndex.SAND]: {
    spriteID: "sand",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.hex("#d9cb4c"),
},
[TileIndex.CURSED_SAND]: {
    spriteID: "cursed_sand",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.hex("#d9cb4c"),
},
[TileIndex.PLANKS]: {
    spriteID: "planks",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.ORANGE,
},
[TileIndex.CURSED_PLANKS]: {
    spriteID: "cursed_planks",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.ORANGE,
},
}

export type { Tile };
export { tileCodex, TileIndex };
