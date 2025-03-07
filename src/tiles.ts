interface Tile {
    spriteID: string | undefined;
    canGrowPlants: boolean;
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
        wall: false,
    },
    {
        spriteID: "grass",
        canGrowPlants: true,
        wall: false,
    },
    {
        spriteID: "water",
        canGrowPlants: false,
        wall: false,
    },
    {
        spriteID: "rocks",
        canGrowPlants: false,
        wall: true,
    },
    {
        spriteID: "path",
        canGrowPlants: false,
        wall: false
    }
];

export type { Tile };
export { tileCodex, TileIndex };
