import { Codex } from "./codex";

interface Tile {
    spriteID: string | undefined;
    canGrowPlants: boolean;
    canSpawnPortal: boolean;
    wall: boolean;
}

enum TileIndex {
    AIR,
    GRASS,
    WATER,
    ROCKS,
    PATH
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
    wall: false
});

export type { Tile };
export { tileCodex, TileIndex };
