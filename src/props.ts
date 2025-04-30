
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
}

export { PropIndex, propsCodex };
export type { PropProperties };
