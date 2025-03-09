// registry of all the items in the game and logic for their usage

// NOTE: items are exclusively used by the player

import input from "./input";
import { GameObject } from "./gameObjects";
import { WeaponIndex } from "./weapons";

enum ItemIndex {
    BROAD_SWORD,
    ZOMBIE_BRAINS,
    ZOMBIE_FLESH,
}

// Return true if using the item should consume it.
type UseItemFunction = (player: GameObject) => boolean;
type EquipItemFunction = (player: GameObject) => void;

interface Item {
    itemIndex: ItemIndex;
    iconSpriteID: string;
    maxStack: number;
    use?: UseItemFunction;
    equip?: EquipItemFunction;
}

interface ItemDropChance {
    chance: number; // 0 to 1
    itemIndex: ItemIndex;
}

function fireWeapon(player: GameObject, weapon: WeaponIndex) {
    const weaponManager = player.getComponent("weapon-manager");
    weaponManager?.data.fire(
        weapon,
        player.game.camera.screenToWorldPosition(input.mousePosition) // target
    );
}

function equipWeapon(player: GameObject, weapon: WeaponIndex) {
    const weaponManager = player.getComponent("weapon-manager");
    weaponManager?.data.equip(weapon);
}

const itemsCodex: Item[] = [
    {
        itemIndex: ItemIndex.BROAD_SWORD,
        iconSpriteID: "broad_sword_icon",
        maxStack: 1,
        use(player) {
            fireWeapon(player, WeaponIndex.BROAD_SWORD);
            return false;
        },
        equip(player) {
            equipWeapon(player, WeaponIndex.BROAD_SWORD);
        }
    },
    {
        itemIndex: ItemIndex.ZOMBIE_BRAINS,
        iconSpriteID: "zombie_brains",
        maxStack: 99,
        use(player) {
            console.log("[brraaaiiinnnss]");
            return true;
        }
    },
    {
        itemIndex: ItemIndex.ZOMBIE_FLESH,
        iconSpriteID: "zombie_flesh",
        maxStack: 999
    }
];

export { itemsCodex, ItemIndex };
export type { Item, ItemDropChance };
