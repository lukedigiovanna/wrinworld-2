import { Color } from "./utils";
import { Codex } from "./codex";

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

const tileCodex = new Codex<TileIndex, Tile>();
tileCodex.set(TileIndex.AIR, {
    spriteID: undefined,
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: false,
});
tileCodex.set(TileIndex.GRASS, {
    spriteID: "grass",
    canGrowPlants: true,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.RED,
});
tileCodex.set(TileIndex.CURSED_GRASS, {
    spriteID: "cursed_grass",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.RED,
});
tileCodex.set(TileIndex.WATER, {
    spriteID: "water",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: false,
});
tileCodex.set(TileIndex.ROCKS, {
    spriteID: "rocks",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
});
tileCodex.set(TileIndex.PATH, {
    spriteID: "path",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.ORANGE,
});
tileCodex.set(TileIndex.CURSED_PATH, {
    spriteID: "cursed_path",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.ORANGE,
});
tileCodex.set(TileIndex.SAND, {
    spriteID: "sand",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.YELLOW,
});
tileCodex.set(TileIndex.CURSED_SAND, {
    spriteID: "cursed_sand",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.YELLOW,
});
tileCodex.set(TileIndex.PLANKS, {
    spriteID: "planks",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.ORANGE,
});
tileCodex.set(TileIndex.CURSED_PLANKS, {
    spriteID: "cursed_planks",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.ORANGE,
});

export type { Tile };
export { tileCodex, TileIndex };
