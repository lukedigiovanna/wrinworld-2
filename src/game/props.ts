
enum PropIndex {
    TREE,
    EVERGREEN_TREE,
    STONE_1,
    WHITE_STONE_1,
    BUSH,
    RED_WILDFLOWER,
    YELLOW_WILDFLOWER,
    TALL_GRASS,
    UNLIT_CAMPFIRE,
    TREE_STUMP,
    MOSSY_FALLEN_TREE,
    TOILET,
    SINK,
    CHALK_BOARD,
    SCHOOL_DESK,
    BASKETBALL,
    LUNCH_TABLE,
}

interface PropProperties {
    spriteID: string;
    hasCollision: boolean;
    castsShadow: boolean;
}

const propsCodex: Record<PropIndex, PropProperties> = {
[PropIndex.TREE]: {
    spriteID: "tree",
    hasCollision: true,
    castsShadow: true,
},
[PropIndex.EVERGREEN_TREE]: {
    spriteID: "evergreen_tree",
    hasCollision: true,
    castsShadow: true,
},
[PropIndex.STONE_1]: {
    spriteID: "stone_1",
    hasCollision: false,
    castsShadow: false,
},
[PropIndex.WHITE_STONE_1]: {
    spriteID: "white_stone_1",
    hasCollision: false,
    castsShadow: false,
},
[PropIndex.BUSH]: {
    spriteID: "bush",
    hasCollision: false,
    castsShadow: false,
},
[PropIndex.RED_WILDFLOWER]: {
    spriteID: "red_wildflower",
    hasCollision: false,
    castsShadow: false,
},
[PropIndex.YELLOW_WILDFLOWER]: {
    spriteID: "yellow_wildflower",
    hasCollision: false,
    castsShadow: false,
},
[PropIndex.TALL_GRASS]: {
    spriteID: "tall_grass",
    hasCollision: false,
    castsShadow: false,
},
[PropIndex.UNLIT_CAMPFIRE]: {
    spriteID: "unlit_campfire",
    hasCollision: false,
    castsShadow: true,
},
[PropIndex.TREE_STUMP]: {
    spriteID: "tree_stump",
    hasCollision: false,
    castsShadow: false,
},
[PropIndex.MOSSY_FALLEN_TREE]: {
    spriteID: "mossy_fallen_tree",
    hasCollision: false,
    castsShadow: false,
},
[PropIndex.TOILET]: {
    spriteID: "toilet",
    hasCollision: true,
    castsShadow: false,
},
[PropIndex.SINK]: {
    spriteID: "sink",
    hasCollision: true,
    castsShadow: false,
},
[PropIndex.CHALK_BOARD]: {
    spriteID: "chalk_board",
    hasCollision: true,
    castsShadow: false,
},
[PropIndex.SCHOOL_DESK]: {
    spriteID: "school_desk",
    hasCollision: true,
    castsShadow: false,
},
[PropIndex.BASKETBALL]: {
    spriteID: "basketball",
    hasCollision: false,
    castsShadow: true,
},
[PropIndex.LUNCH_TABLE]: {
    spriteID: "lunch_table",
    hasCollision: true,
    castsShadow: false,
},
}

export { PropIndex, propsCodex };
export type { PropProperties };
