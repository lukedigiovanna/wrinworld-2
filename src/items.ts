// registry of all the items in the game and logic for their usage

import { BulletFactory, GameObject } from "./gameObjects";
import { getImage } from "./imageLoader";
import input from "./input";

enum ItemIndex {
    STONE_SWORD,
    ZOMBIE_BRAINS,
    ZOMBIE_FLESH,
}

// Return true if using the item should consume it.
type UseItemFunction = (player: GameObject) => boolean;

interface Item {
    itemIndex: ItemIndex;
    iconSpriteID: string;
    maxStack: number;
    use?: UseItemFunction;
}

interface ItemDropChance {
    chance: number; // 0 to 1
    itemIndex: ItemIndex;
}

const itemsCodex: Item[] = [
    {
        itemIndex: ItemIndex.STONE_SWORD,
        iconSpriteID: "stone_sword_icon",
        maxStack: 1,
        use(player) {
            const bullet = BulletFactory(player.position, player.game.camera.screenToWorldPosition(input.mousePosition));
            player.game.addGameObject(bullet);
            return false;
        }
    },
    {
        itemIndex: ItemIndex.ZOMBIE_BRAINS,
        iconSpriteID: "zombie_brains",
        maxStack: 16,
        use(player) {
            console.log("[brraaaiiinnnss]");
            return true;
        }
    },
    {
        itemIndex: ItemIndex.ZOMBIE_FLESH,
        iconSpriteID: "zombie_flesh",
        maxStack: 64
    }
];

export { itemsCodex, ItemIndex };
export type { Item, ItemDropChance };
