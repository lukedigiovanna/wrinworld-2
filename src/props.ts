import { Codex } from "./codex";

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

const propsCodex = new Codex<PropIndex, PropProperties>();
propsCodex.set(PropIndex.TREE, {
    spriteID: "tree",
    hasCollision: true,
    castsShadow: true,
});
propsCodex.set(PropIndex.TALL_GRASS, {
    // spriteID: "tall_grass",
    spriteID: "pixel_font_0",
    hasCollision: false,
    castsShadow: false,
});
propsCodex.set(PropIndex.FLOWER, {
    spriteID: "flower",
    hasCollision: false,
    castsShadow: false,
});

export { PropIndex, propsCodex };
export type { PropProperties };
