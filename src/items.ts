// registry of all the items in the game and logic for their usage

// NOTE: items are exclusively used by the player

import { Vector } from "./utils";
import { GameObject } from "./gameObjects";
import { WeaponIndex } from "./weapons";
import { Codex } from "./codex";

type ItemCategory = "Weapon" | "Misc." | "Projectile" | "Consumable" | "Upgrade" | "Buff" | "Mystic Arts";

enum ItemIndex {
    ZOMBIE_BRAINS,
    ZOMBIE_FLESH,
    // Melee weapons
    BROAD_SWORD,
    DAGGERS,
    BATTLE_HAMMER,
    ESSENCE_DRIPPED_DAGGER,
    // Ranged weapons
    BOW,
    SHURIKEN,
    SLINGSHOT,
    QUICK_BOW,
    // Projectiles
    ARROW,
    POISON_ARROW,
    FLAME_ARROW,
    CRYSTAL_BOMB,
    ROOT_SNARE,
    // Consumables
    HEALING_VIAL,
    ESSENCE_VIAL,
    // Upgrades
    FLAME_UPGRADE,
    POISON_UPGRADE,
    STRENGTH_UPGRADE,
    // Buffs
    HEART,
    HEART_CRYSTAL,
    BASIC_SHIELD,
    // Mystic arts
    TELEPORTATION_RUNE,
    STUN_FIDDLE,
}

// Return true if successfully used.
type UseItemFunction = (player: GameObject, target: Vector) => boolean;
type EquipItemFunction = (player: GameObject) => void;

interface Item {
    itemIndex: ItemIndex;
    displayName: string;
    description: string;
    category: ItemCategory;
    iconSpriteID: string;
    maxStack: number;
    consumable: boolean;
    essenceCost: number;
    // ex. Bow uses Arrow type
    usesItem?: ItemIndex[];
    use?: UseItemFunction;
    equip?: EquipItemFunction;
    unequip?: EquipItemFunction;
}

interface ItemDropChance {
    chance: number; // 0 to 1
    itemIndex: ItemIndex;
}

function fireWeapon(player: GameObject, weapon: WeaponIndex, target: Vector) {
    const weaponManager = player.getComponent("weapon-manager");
    return weaponManager?.data.fire(
        weapon, target
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
    description: "Basic sword that'll get you by for a few portals",
    category: "Weapon",
    iconSpriteID: "broad_sword_icon",
    maxStack: 1,
    consumable: false,
    essenceCost: 0,
    use(player, target) {
        return fireWeapon(player, WeaponIndex.BROAD_SWORD, target);
    },
    equip(player) {
        equipWeapon(player, WeaponIndex.BROAD_SWORD);
    }
});
itemsCodex.set(ItemIndex.ZOMBIE_BRAINS, {
    itemIndex: ItemIndex.ZOMBIE_BRAINS,
    displayName: "Zombie Brains",
    description: "Braiiinnnsssss",
    category: "Weapon",
    iconSpriteID: "zombie_brains",
    maxStack: 99,
    consumable: true,
    essenceCost: 0,
    use(player, target) {
        return fireWeapon(player, WeaponIndex.ZOMBIE_BRAINS, target);
    },
    equip(player) {
        equipWeapon(player, WeaponIndex.ZOMBIE_BRAINS);
    }
});
itemsCodex.set(ItemIndex.ZOMBIE_FLESH, {
    itemIndex: ItemIndex.ZOMBIE_FLESH,
    displayName: "Zombie Flesh",
    description: "Tasty!",
    category: "Misc.",
    iconSpriteID: "zombie_flesh",
    maxStack: 999,
    consumable: false,
    essenceCost: 0,
});
itemsCodex.set(ItemIndex.SHURIKEN, {
    itemIndex: ItemIndex.SHURIKEN,
    category: "Weapon",
    displayName: "Shuriken",
    description: "Quick spinner sure to tear some flesh off its victim",
    iconSpriteID: "shuriken",
    maxStack: 20,
    consumable: true,
    essenceCost: 0,
    use(player, target) {
        return fireWeapon(player, WeaponIndex.SHURIKEN, target);
    },
    equip(player) {
        equipWeapon(player, WeaponIndex.SHURIKEN);
    }
});
itemsCodex.set(ItemIndex.BOW, {
    itemIndex: ItemIndex.BOW,
    displayName: "Bow",
    description: "Standard bow but requires you to have some arrows on hand",
    category: "Weapon",
    iconSpriteID: "bow",
    maxStack: 1,
    usesItem: [ItemIndex.ARROW, ItemIndex.POISON_ARROW],
    consumable: false,
    essenceCost: 0,
    use(player, target) {
        return fireWeapon(player, WeaponIndex.BOW, target);
    },
    equip(player) {
        equipWeapon(player, WeaponIndex.BOW);
    }
});
itemsCodex.set(ItemIndex.ARROW, {
    itemIndex: ItemIndex.ARROW,
    displayName: "Arrow",
    description: "Basic arrow",
    category: "Projectile",
    iconSpriteID: "arrow_icon",
    maxStack: 100,
    consumable: false,
    essenceCost: 0,
});
itemsCodex.set(ItemIndex.HEALING_VIAL, {
    itemIndex: ItemIndex.HEALING_VIAL,
    displayName: "Healing Vial",
    description: "Quickly recovers some HP after or during a tough battle",
    category: "Consumable",
    iconSpriteID: "healing_vial",
    consumable: true,
    essenceCost: 0,
    maxStack: 20,
    use(player) {
        const health = player.getComponent("health");
        if (health) {
            return health.data.heal(10) > 0;
        }
        return false;
    }
});
itemsCodex.set(ItemIndex.DAGGERS, {
    itemIndex: ItemIndex.DAGGERS,
    displayName: "Daggers",
    description: "With two of these you can really quickly jab a foe",
    category: "Weapon",
    iconSpriteID: "daggers",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    use(player) {
        return false;
    }
});
itemsCodex.set(ItemIndex.ESSENCE_VIAL, {
    itemIndex: ItemIndex.ESSENCE_VIAL,
    displayName: "Essence Vial",
    description: "Shatter when you need a bit of essence in a jif",
    category: "Consumable",
    iconSpriteID: "essence_vial",
    consumable: true,
    essenceCost: 0,
    maxStack: 20,
    use(player) {
        // TODO: add 20 essence (or something like that) to the player
        return false;
    }
});
itemsCodex.set(ItemIndex.FLAME_UPGRADE, {
    itemIndex: ItemIndex.FLAME_UPGRADE,
    displayName: "Flame Upgrade",
    description: "Adds a firey touch to a weapon",
    category: "Upgrade",
    iconSpriteID: "flame_upgrade",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
});
itemsCodex.set(ItemIndex.POISON_UPGRADE, {
    itemIndex: ItemIndex.POISON_UPGRADE,
    displayName: "Poison Upgrade",
    description: "Adds a drop of poison to the tip of a weapon",
    category: "Upgrade",
    iconSpriteID: "poison_upgrade",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
});
itemsCodex.set(ItemIndex.STRENGTH_UPGRADE, {
    itemIndex: ItemIndex.STRENGTH_UPGRADE,
    displayName: "Strength Upgrade",
    description: "Enhances the power of a weapon",
    category: "Upgrade",
    iconSpriteID: "strength_upgrade",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
});
itemsCodex.set(ItemIndex.HEART, {
    itemIndex: ItemIndex.HEART,
    displayName: "Heart",
    description: "With an additional heart you can withstand more damage",
    category: "Buff",
    iconSpriteID: "heart",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    equip(player) {
        console.log("Equip heart");
        const health = player.getComponent("health");
        if (health) {
            health.data.maximumHP += 10;
        }
    },
    unequip(player) {
        console.log("Unequip heart");
        const health = player.getComponent("health");
        if (health) {
            health.data.maximumHP -= 10;
        }
    }
});
itemsCodex.set(ItemIndex.POISON_ARROW, {
    itemIndex: ItemIndex.POISON_ARROW,
    displayName: "Poison Arrow",
    description: "Poison tipped arrows leave a stuck foe with more problems than a wound",
    category: "Projectile",
    iconSpriteID: "poison_arrow_icon",
    consumable: false,
    essenceCost: 0,
    maxStack: 100,
});
itemsCodex.set(ItemIndex.SLINGSHOT, {
    itemIndex: ItemIndex.SLINGSHOT,
    displayName: "Slingshot",
    description: "Use nearby rocks to hurl a bit of hurt from a distance",
    category: "Weapon",
    iconSpriteID: "slingshot",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    use(player) {
        return false; // TODO: fireprojectile
    }
});
itemsCodex.set(ItemIndex.TELEPORTATION_RUNE, {
    itemIndex: ItemIndex.TELEPORTATION_RUNE,
    displayName: "Teleportation Rune",
    description: "Teleport anywhere within a few meters, but at a slight cost",
    category: "Mystic Arts",
    iconSpriteID: "teleportation_rune",
    consumable: false,
    essenceCost: 5,
    maxStack: 1,
    use(player) {
        return false; // TODO: teleport to mouse position
    }
});
itemsCodex.set(ItemIndex.BATTLE_HAMMER, {
    itemIndex: ItemIndex.BATTLE_HAMMER,
    displayName: "Battle Hammer",
    description: "This heavy weighted weapon does a lot of damage in a small area",
    category: "Weapon",
    iconSpriteID: "battle_hammer",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    use(player) {
        return false; // TODO: use battle hammer melee
    }
});
itemsCodex.set(ItemIndex.CRYSTAL_BOMB, {
    itemIndex: ItemIndex.CRYSTAL_BOMB,
    displayName: "Crystal Bomb",
    description: "Toss this in a horde and let it do the rest",
    category: "Projectile",
    iconSpriteID: "crystal_bomb",
    consumable: true,
    essenceCost: 10,
    maxStack: 20,
    use(player) {
        return false; // TODO: make crystal bomb projectile
    }
});
itemsCodex.set(ItemIndex.HEART_CRYSTAL, {
    itemIndex: ItemIndex.HEART_CRYSTAL,
    displayName: "Heart Crystal",
    description: "The aura of this crystal has a special mending ability",
    category: "Buff",
    iconSpriteID: "heart_crystal",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
});
itemsCodex.set(ItemIndex.STUN_FIDDLE, {
    itemIndex: ItemIndex.STUN_FIDDLE,
    displayName: "Stun Fiddle",
    description: "The mystical melody emanated from this fiddle stops anyone in their tracks",
    category: "Mystic Arts",
    iconSpriteID: "stun_fiddle",
    consumable: false,
    essenceCost: 10,
    maxStack: 1,
    use(player) {
        return false; // TODO: stun all enemies in radius and play the melody
    }
});
itemsCodex.set(ItemIndex.ESSENCE_DRIPPED_DAGGER, {
    itemIndex: ItemIndex.ESSENCE_DRIPPED_DAGGER,
    displayName: "Essence Dripped Dagger",
    description: "Dripping essence on a weapon really increases the power!",
    category: "Weapon",
    iconSpriteID: "essence_dripped_dagger",
    consumable: false,
    essenceCost: 2,
    maxStack: 1,
    use(player) {
        return false; // TOOD: add strong dagger melee attack
    }
});
itemsCodex.set(ItemIndex.ROOT_SNARE, {
    itemIndex: ItemIndex.ROOT_SNARE,
    displayName: "Root Snare",
    description: "Send out a groveling root to tangle up any enemies in its path",
    category: "Projectile",
    iconSpriteID: "root_snare",
    consumable: true,
    essenceCost: 0,
    maxStack: 20,
    use(player) {
        return false; // TODO: add projectile
    }
});
itemsCodex.set(ItemIndex.BASIC_SHIELD, {
    itemIndex: ItemIndex.BASIC_SHIELD,
    displayName: "Basic Shield",
    description: "Deflects some damage",
    category: "Buff",
    iconSpriteID: "basic_shield",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
});
itemsCodex.set(ItemIndex.QUICK_BOW, {
    itemIndex: ItemIndex.QUICK_BOW,
    displayName: "Quick Bow",
    description: "Crafted from a hyper-elastic material this bow can shoot much faster, but at a cost to effectiveness",
    category: "Weapon",
    iconSpriteID: "quick_bow",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    use(player) {
        return false; // TODO: use quick bow
    }
});
itemsCodex.set(ItemIndex.FLAME_ARROW,  {
    itemIndex: ItemIndex.FLAME_ARROW,
    displayName: "Flame Arrow",
    description: "A firey tip is sure to leave a burn",
    category: "Projectile",
    iconSpriteID: "flame_arrow_icon",
    consumable: false,
    essenceCost: 0,
    maxStack: 100,
});

export { itemsCodex, ItemIndex };
export type { Item, ItemDropChance };
