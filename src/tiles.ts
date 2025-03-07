interface Tile {
    spriteID: string;
    canGrowPlants: boolean;
    wall: boolean;
}

const tileCodex: Tile[] = [
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
    }
];

export type { Tile };
export { tileCodex };
