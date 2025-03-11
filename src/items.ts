// registry of all the items in the game and logic for their usage

// NOTE: items are exclusively used by the player

import input from "./input";
import { GameObject } from "./gameObjects";
import { WeaponIndex } from "./weapons";
import { Codex } from "./codex";

type ItemCategory = "Weapon" | "Misc." | "Projectile";

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
    displayName: string;
    category: ItemCategory;
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

const itemsCodex = new Codex<ItemIndex, Item>();
itemsCodex.set(ItemIndex.BROAD_SWORD, {
    itemIndex: ItemIndex.BROAD_SWORD,
    displayName: "Broad Sword",
    category: "Weapon",
    iconSpriteID: "broad_sword_icon",
    maxStack: 1,
    consumable: false,
    use(player) {
        return fireWeapon(player, WeaponIndex.BROAD_SWORD);
    },
    equip(player) {
        equipWeapon(player, WeaponIndex.BROAD_SWORD);
    }
});
itemsCodex.set(ItemIndex.ZOMBIE_BRAINS, {
    itemIndex: ItemIndex.ZOMBIE_BRAINS,
    displayName: "Zombie Brains",
    category: "Weapon",
    iconSpriteID: "zombie_brains",
    maxStack: 99,
    consumable: true,
    use(player) {
        return fireWeapon(player, WeaponIndex.ZOMBIE_BRAINS);
    },
    equip(player) {
        equipWeapon(player, WeaponIndex.ZOMBIE_BRAINS);
    }
});
itemsCodex.set(ItemIndex.ZOMBIE_FLESH, {
    itemIndex: ItemIndex.ZOMBIE_FLESH,
    displayName: "Zombie Flesh",
    category: "Misc.",
    iconSpriteID: "zombie_flesh",
    maxStack: 999,
    consumable: false
});
itemsCodex.set(ItemIndex.SHURIKEN, {
    itemIndex: ItemIndex.SHURIKEN,
    category: "Weapon",
    displayName: "Shuriken",
    iconSpriteID: "shuriken",
    maxStack: 20,
    consumable: true,
    use(player) {
        return fireWeapon(player, WeaponIndex.SHURIKEN);
    },
    equip(player) {
        equipWeapon(player, WeaponIndex.SHURIKEN);
    }
});
itemsCodex.set(ItemIndex.BOW, {
    itemIndex: ItemIndex.BOW,
    displayName: "Bow",
    category: "Weapon",
    iconSpriteID: "bow",
    maxStack: 1,
    usesItem: ItemIndex.ARROW,
    consumable: false,
    use(player) {
        return fireWeapon(player, WeaponIndex.BOW);
    },
    equip(player) {
        equipWeapon(player, WeaponIndex.BOW);
    }
});
itemsCodex.set(ItemIndex.ARROW, {
    itemIndex: ItemIndex.ARROW,
    displayName: "Arrow",
    category: "Projectile",
    iconSpriteID: "arrow-icon",
    maxStack: 100,
    consumable: false,
});

export { itemsCodex, ItemIndex };
export type { Item, ItemDropChance };
