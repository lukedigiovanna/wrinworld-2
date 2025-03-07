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

const tileCodex: Tile[] = [
    {
        spriteID: undefined,
        canGrowPlants: false,
        canSpawnPortal: false,
        wall: false,
    },
    {
        spriteID: "grass",
        canGrowPlants: true,
        canSpawnPortal: true,
        wall: false,
    },
    {
        spriteID: "water",
        canGrowPlants: false,
        canSpawnPortal: false,
        wall: false,
    },
    {
        spriteID: "rocks",
        canGrowPlants: false,
        canSpawnPortal: false,
        wall: true,
    },
    {
        spriteID: "path",
        canGrowPlants: false,
        canSpawnPortal: true,
        wall: false
    }
];

export type { Tile };
export { tileCodex, TileIndex };
