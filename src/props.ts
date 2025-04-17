
enum PropIndex {
    TREE,
    TALL_GRASS,
    FLOWER,
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
[PropIndex.TALL_GRASS]: {
    spriteID: "tall_grass",
    hasCollision: false,
    castsShadow: false,
},
[PropIndex.FLOWER]: {
    spriteID: "flower",
    hasCollision: false,
    castsShadow: false,
},
}

export { PropIndex, propsCodex };
export type { PropProperties };
