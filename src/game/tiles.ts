import { ArealEffect } from "./arealEffect";
import { SpriteAnimationIndex } from "./animations";
import { Color } from "../utils";

interface TileData {
    spriteID: string;
    animationIndex?: SpriteAnimationIndex; 
    canGrowPlants: boolean;
    canSpawnPortal: boolean;
    wall: boolean;
    trailColor?: Color;
    arealEffects?: Set<ArealEffect>;
    leaks?: TileIndex[];
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
    SCHOOL_TILE,
    SCHOOL_TILE_BLACK,
    SCHOOL_WALL,
    SCHOOL_WALL_SIDE,
    SCHOOL_WALL_DOUBLE_SIDE,
    SCHOOL_WALL_INSIDE_CORNER,
    SCHOOL_WALL_INSIDE_CORNER_OUTSIDE_CORNER,
    SCHOOL_WALL_U,
    SCHOOL_WALL_OUTSIDE_CORNER,
    SCHOOL_WALL_SIDE_OUTSIDE_CORNER_TOP,
    SCHOOL_WALL_SIDE_OUTSIDE_CORNER_BOTTOM,
    SCHOOL_WALL_SIDE_DOUBLE_OUTSIDE_CORNER,
    GRAY_BRICKS,
    GYM_FLOOR
}

type TileRotation = 0 | 1 | 2 | 3;

interface Tile {
    index: TileIndex;
    rotation: TileRotation;
}

const tileCodex: Record<TileIndex, TileData> = {
[TileIndex.AIR]: {
    spriteID: "square",
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
    leaks: [TileIndex.PATH, TileIndex.SAND, TileIndex.WATER],
},
[TileIndex.CURSED_GRASS]: {
    spriteID: "cursed_grass",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.hex("#058600"),
},
[TileIndex.WATER]: {
    spriteID: "static_water",
    // animationIndex: SpriteAnimationIndex.WATER_TILE,
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: false,
    arealEffects: new Set<ArealEffect>([ArealEffect.WATER]),
},
[TileIndex.ROCKS]: {
    spriteID: "rocks",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
    leaks: [TileIndex.GRASS, TileIndex.PATH, TileIndex.SAND],
},
[TileIndex.PATH]: {
    spriteID: "path",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    trailColor: Color.hex("#886e2a"),
    leaks: [TileIndex.WATER, TileIndex.SAND]
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
    leaks: [TileIndex.WATER]
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
[TileIndex.SCHOOL_TILE]: {
    spriteID: "school_tile",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
},
[TileIndex.SCHOOL_TILE_BLACK]: {
    spriteID: "school_tile_black",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
},
[TileIndex.SCHOOL_WALL]: {
    spriteID: "school_wall",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
},
[TileIndex.SCHOOL_WALL_SIDE]: {
    spriteID: "school_wall_side",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
},
[TileIndex.SCHOOL_WALL_DOUBLE_SIDE]: {
    spriteID: "school_wall_double_side",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
},
[TileIndex.SCHOOL_WALL_INSIDE_CORNER]: {
    spriteID: "school_wall_inside_corner",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
},
[TileIndex.SCHOOL_WALL_INSIDE_CORNER_OUTSIDE_CORNER]: {
    spriteID: "school_wall_inside_corner_outside_corner",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
},
[TileIndex.SCHOOL_WALL_U]: {
    spriteID: "school_wall_u",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
},
[TileIndex.SCHOOL_WALL_OUTSIDE_CORNER]: {
    spriteID: "school_wall_outside_corner",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
},
[TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_TOP]: {
    spriteID: "school_wall_side_outside_corner_top",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
},
[TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_BOTTOM]: {
    spriteID: "school_wall_side_outside_corner_bottom",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
},
[TileIndex.SCHOOL_WALL_SIDE_DOUBLE_OUTSIDE_CORNER]: {
    spriteID: "school_wall_side_double_outside_corner",
    canGrowPlants: false,
    canSpawnPortal: false,
    wall: true,
},
[TileIndex.GRAY_BRICKS]: {
    spriteID: "gray_bricks",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
    leaks: [TileIndex.GRASS]
},
[TileIndex.GYM_FLOOR]: {
    spriteID: "gym_floor",
    canGrowPlants: false,
    canSpawnPortal: true,
    wall: false,
},
}

export type { TileData, TileRotation, Tile };
export { tileCodex, TileIndex };
