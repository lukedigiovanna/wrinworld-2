// registry of all the items in the game and logic for their usage

// NOTE: items are exclusively used by the player

import input from "./input";
import { GameObject } from "./gameObjects";
import { WeaponIndex } from "./weapons";

enum ItemIndex {
    BROAD_SWORD,
    ZOMBIE_BRAINS,
    ZOMBIE_FLESH,
    SHURIKEN,
    BOW,
    ARROW,
}

// Return true if successfully used.
type UseItemFunction = (player: GameObject) => boolean;
type EquipItemFunction = (player: GameObject) => void;

interface Item {
    itemIndex: ItemIndex;
    iconSpriteID: string;
    maxStack: number;
    consumable: boolean;
    // ex. Bow uses Arrow type
    usesItem?: ItemIndex;
    use?: UseItemFunction;
    equip?: EquipItemFunction;
}

interface ItemDropChance {
    chance: number; // 0 to 1
    itemIndex: ItemIndex;
}

function fireWeapon(player: GameObject, weapon: WeaponIndex) {
    const weaponManager = player.getComponent("weapon-manager");
    return weaponManager?.data.fire(
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
        consumable: false,
        use(player) {
            return fireWeapon(player, WeaponIndex.BROAD_SWORD);
        },
        equip(player) {
            equipWeapon(player, WeaponIndex.BROAD_SWORD);
        }
    },
    {
        itemIndex: ItemIndex.ZOMBIE_BRAINS,
        iconSpriteID: "zombie_brains",
        maxStack: 99,
        consumable: false,
        use(player) {
            console.log("[brraaaiiinnnss]");
            return true;
        }
    },
    {
        itemIndex: ItemIndex.ZOMBIE_FLESH,
        iconSpriteID: "zombie_flesh",
        maxStack: 999,
        consumable: false
    },
    {
        itemIndex: ItemIndex.SHURIKEN,
        iconSpriteID: "shuriken",
        maxStack: 20,
        consumable: true,
        use(player) {
            return fireWeapon(player, WeaponIndex.SHURIKEN);
        }
    },
    {
        itemIndex: ItemIndex.BOW,
        iconSpriteID: "bow",
        maxStack: 1,
        usesItem: ItemIndex.ARROW,
        consumable: false,
        use(player) {
            return fireWeapon(player, WeaponIndex.BOW);
        }
    },
    {
        itemIndex: ItemIndex.ARROW,
        iconSpriteID: "arrow-icon",
        maxStack: 100,
        consumable: false,
    }
];

export { itemsCodex, ItemIndex };
export type { Item, ItemDropChance };
