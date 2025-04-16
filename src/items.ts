// registry of all the items in the game and logic for their usage

// NOTE: items are exclusively used by the player

import { Vector } from "./utils";
import { GameObject, Team } from "./gameObjects";
import { fireProjectile, WeaponIndex, weaponsCodex } from "./weapons";
import { Codex } from "./codex";
import { addNotification } from "./notifications";
import { ProjectileIndex, projectilesCodex } from "./projectiles";
import { StatusEffectIndex } from "./statusEffects";

enum ItemStat {
    // Weapon based
    DAMAGE, // How much damage a hit does
    COOLDOWN, // How long to wait between attacks
    DAMAGE_PER_SECOND, // How much damage a weapon does per second
    CHANCE_OF_BREAKING, // Percent chance of breaking (for projectiles),
    KNOCKBACK, // Knockback force
    // Health based
    HEAL, // How much healing the item does
    REGENERATION, // How much healing the item does a second (i.e. for buffs)
    MAX_HP_BOOST, // How much the item boosts the max HP (i.e. for buffs)
    RESISTANCE, // Percentage based resistance
    // Essence based
    ESSENCE_COST, // How much essence an item costs to use
    ESSENCE, // How much essence the item gives
    MAX_ESSENCE_BOOST, // How much the item boosts the max essence (i.e. for buffs)
}

interface ItemStatData {
    displayName: string;
    iconID: string;
    unit: string;
    isPercent: boolean;
    showSign: boolean;
}

const itemStats: Record<ItemStat, ItemStatData> = {
    [ItemStat.DAMAGE]: {
        displayName: "Damage",
        iconID: "damage_stat_icon",
        unit: "",
        isPercent: false,
        showSign: false,
    },
    [ItemStat.COOLDOWN]: {
        displayName: "Cooldown",
        iconID: "cooldown_stat_icon",
        unit: "s",
        isPercent: false,
        showSign: false,
    },
    [ItemStat.DAMAGE_PER_SECOND]: {
        displayName: "DPS",
        iconID: "damage_per_second_stat_icon",
        unit: "",
        isPercent: false,
        showSign: false,
    },
    [ItemStat.KNOCKBACK]: {
        displayName: "Knockback",
        iconID: "knockback_stat_icon",
        unit: "",
        isPercent: false,
        showSign: false,
    },
    [ItemStat.ESSENCE_COST]: {
        displayName: "Essence Cost",
        iconID: "essence_cost_stat_icon",
        unit: "",
        isPercent: false,
        showSign: false,
    },
    [ItemStat.RESISTANCE]: {
        displayName: "Resistance",
        iconID: "resistance_stat_icon",
        unit: "%",
        isPercent: true,
        showSign: true,
    },
    [ItemStat.CHANCE_OF_BREAKING]: {
        displayName: "Break Chance",
        iconID: "chance_of_breaking_stat_icon",
        unit: "%",
        isPercent: true,
        showSign: false,
    },
    [ItemStat.HEAL]: {
        displayName: "Heal",
        iconID: "heal_stat_icon",
        unit: " HP",
        isPercent: false,
        showSign: true,
    },
    [ItemStat.REGENERATION]: {
        displayName: "Regeneration",
        iconID: "regeneration_stat_icon",
        unit: " HP/s",
        isPercent: false,
        showSign: true,
    },
    [ItemStat.MAX_HP_BOOST]: {
        displayName: "Max HP Boost",
        iconID: "max_hp_boost_stat_icon",
        unit: " HP",
        isPercent: false,
        showSign: true,
    },
    [ItemStat.ESSENCE]: {
        displayName: "Essence",
        iconID: "essence_stat_icon",
        unit: "",
        isPercent: false,
        showSign: true,
    },
    [ItemStat.MAX_ESSENCE_BOOST]: {
        displayName: "Max Essence Boost",
        iconID: "max_essence_boost_stat_icon",
        unit: "",
        isPercent: false,
        showSign: true,
    }
}

interface ItemStatValue {
    stat: ItemStat;
    value: number;
}

enum ItemIndex {
    // Melee weapons
    BROAD_SWORD,
    STRONG_SWORD,
    POISON_BROAD_SWORD,
    POISON_STRONG_SWORD,
    DAGGERS,
    BATTLE_HAMMER,
    ESSENCE_DRIPPED_DAGGER,
    // Ranged weapons
    BOW,
    GHOST_BOW,
    RICOCHET_BOW,
    SHURIKEN,
    SLINGSHOT,
    QUICK_BOW,
    BOOMERANG,
    RICOCHET_BOOMERANG,
    // Projectiles
    ARROW,
    POISON_ARROW,
    FLAME_ARROW, // not implemented
    CRYSTAL_BOMB,
    ROOT_SNARE,
    // Consumables
    HEALING_VIAL,
    ESSENCE_VIAL,
    // Upgrades
    FLAME_UPGRADE, // not implemented
    POISON_UPGRADE, // not implemented
    STRENGTH_UPGRADE, // not implemented
    DICE, // not implemented
    GHOST_ARROWS,
    RICOCHET_UPGRADE,
    // Buffs
    HEART,
    HEART_CRYSTAL,
    BASIC_SHIELD,
    // Mystic arts
    TELEPORTATION_RUNE,
    STUN_FIDDLE,
}

type ItemCategory = "Weapon" | "Ammo" | "Consumable" | "Upgrade" | "Buff" | "Utility" | "Mystic Arts";

// Return true if successfully used.
type UseItemFunction = (player: GameObject, target: Vector, uses?: Item, charge?: number) => boolean;
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
    cooldown?: number; // Minimum time between uses (none if undefined)
    charge?: number; // Max time to charge up to (none if undefined -- i.e. instant use)
    requireFullCharge?: boolean; // Only uses item if filled charge to max
    // ex. Bow uses Arrow type
    usesItem?: ItemIndex[];
    useItem?: UseItemFunction;
    equipItem?: EquipItemFunction;
    unequipItem?: EquipItemFunction;
    getStats?: () => ItemStatValue[];
}

interface ItemDropChance {
    chance: number; // 0 to 1
    itemIndex: ItemIndex;
}

function generateStatsForWeapon(weaponIndex: WeaponIndex): ItemStatValue[] {
    const weapon = weaponsCodex.get(weaponIndex);
    const attack = weapon.attack();
    const maxCharge = weapon.charge ? weapon.charge : 0;
    const stats = [
        {
            stat: ItemStat.COOLDOWN,
            value: weapon.cooldown,
        },
        {
            stat: ItemStat.DAMAGE,
            value: attack.damage,
        },
        {
            stat: ItemStat.DAMAGE_PER_SECOND,
            value: attack.damage / (weapon.cooldown + maxCharge),
        },
        {
            stat: ItemStat.KNOCKBACK,
            value: attack.knockback,
        }
    ];
    if (attack.hasOwnProperty("chanceOfBreaking")) {
        stats.push({
            stat: ItemStat.CHANCE_OF_BREAKING,
            value: (attack as any).chanceOfBreaking
        });
    }
    return stats;
}

// Shorthand for filling out basic item use functions for weapons.
function weaponItem(index: WeaponIndex): Partial<Item> {
    const weapon = weaponsCodex.get(index);
    return {
        cooldown: weapon.cooldown,
        charge: weapon.charge,
        useItem(player: GameObject, target: Vector, uses?: Item, charge?: number) {
            weaponsCodex.get(index).fire(player, target, {uses, charge});
            return true;
        },
        equipItem(player: GameObject) {
            console.log("Equipping weapon", index);
        },
        unequipItem(player: GameObject) {
            console.log("Unequipping weapon", index);
        },
        getStats() {
            return generateStatsForWeapon(index);
        }
    }
}

// const itemsCodex = new Codex<ItemIndex, Item>();
const itemsCodex: Record<ItemIndex, Item> = {
[ItemIndex.BROAD_SWORD]: {
    itemIndex: ItemIndex.BROAD_SWORD,
    displayName: "Broad Sword",
    description: "Basic sword that'll get you by for a few portals",
    category: "Weapon",
    iconSpriteID: "broad_sword_icon",
    maxStack: 1,
    consumable: false,
    essenceCost: 0,
    ...weaponItem(WeaponIndex.BROAD_SWORD),
},
[ItemIndex.DAGGERS]: {
    itemIndex: ItemIndex.DAGGERS,
    displayName: "Daggers",
    description: "With two of these you can really quickly jab a foe",
    category: "Weapon",
    iconSpriteID: "daggers",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    ...weaponItem(WeaponIndex.DAGGERS)
},
[ItemIndex.BATTLE_HAMMER]: {
    itemIndex: ItemIndex.BATTLE_HAMMER,
    displayName: "Battle Hammer",
    description: "This heavy weighted weapon does a lot of damage in a small area",
    category: "Weapon",
    iconSpriteID: "battle_hammer",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    ...weaponItem(WeaponIndex.BATTLE_HAMMER)
},
[ItemIndex.ESSENCE_DRIPPED_DAGGER]: {
    itemIndex: ItemIndex.ESSENCE_DRIPPED_DAGGER,
    displayName: "Essence Dripped Dagger",
    description: "Dripping essence on a weapon really increases the power!",
    category: "Weapon",
    iconSpriteID: "essence_dripped_dagger",
    consumable: false,
    essenceCost: 2,
    maxStack: 1,
    ...weaponItem(WeaponIndex.ESSENCE_DRIPPED_DAGGER)
},
[ItemIndex.SHURIKEN]: {
    itemIndex: ItemIndex.SHURIKEN,
    category: "Weapon",
    displayName: "Shuriken",
    description: "Quick spinner sure to tear some flesh off its victim",
    iconSpriteID: "shuriken",
    maxStack: 20,
    consumable: true,
    essenceCost: 0,
    ...weaponItem(WeaponIndex.SHURIKEN),
},
[ItemIndex.BOW]: {
    itemIndex: ItemIndex.BOW,
    displayName: "Bow",
    description: "Standard bow but requires you to have some arrows on hand",
    category: "Weapon",
    iconSpriteID: "bow",
    maxStack: 1,
    usesItem: [ItemIndex.ARROW, ItemIndex.POISON_ARROW, ItemIndex.FLAME_ARROW],
    consumable: false,
    essenceCost: 0,
    ...weaponItem(WeaponIndex.BOW),
},
[ItemIndex.QUICK_BOW]: {
    itemIndex: ItemIndex.QUICK_BOW,
    displayName: "Quick Bow",
    description: "Crafted from a hyper-elastic material this bow can shoot much faster, but at a cost to effectiveness",
    category: "Weapon",
    iconSpriteID: "quick_bow",
    usesItem: [ItemIndex.ARROW, ItemIndex.POISON_ARROW, ItemIndex.FLAME_ARROW],
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    ...weaponItem(WeaponIndex.QUICK_BOW)
},
[ItemIndex.SLINGSHOT]: {
    itemIndex: ItemIndex.SLINGSHOT,
    displayName: "Slingshot",
    description: "Use nearby rocks to hurl a bit of hurt from a distance",
    category: "Weapon",
    iconSpriteID: "slingshot",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    ...weaponItem(WeaponIndex.SLINGSHOT)
},
[ItemIndex.ARROW]: {
    itemIndex: ItemIndex.ARROW,
    displayName: "Arrow",
    description: "Basic arrow",
    category: "Ammo",
    iconSpriteID: "arrow_icon",
    maxStack: 100,
    consumable: false,
    essenceCost: 0,
},
[ItemIndex.POISON_ARROW]: {
    itemIndex: ItemIndex.POISON_ARROW,
    displayName: "Poison Arrow",
    description: "Poison tipped arrows leave a stuck foe with more problems than a wound",
    category: "Ammo",
    iconSpriteID: "poison_arrow_icon",
    consumable: false,
    essenceCost: 0,
    maxStack: 100,
},
[ItemIndex.FLAME_ARROW]: {
    itemIndex: ItemIndex.FLAME_ARROW,
    displayName: "Flame Arrow",
    description: "A fiery tip is sure to leave a burn",
    category: "Ammo",
    iconSpriteID: "flame_arrow_icon",
    consumable: false,
    essenceCost: 0,
    maxStack: 100,
},
[ItemIndex.HEALING_VIAL]: {
    itemIndex: ItemIndex.HEALING_VIAL,
    displayName: "Healing Vial",
    description: "Quickly recovers some HP after or during a tough battle",
    category: "Consumable",
    iconSpriteID: "healing_vial",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    cooldown: 90,
    charge: 1,
    useItem(player) {
        const health = player.getComponent("health");
        const amountHealed = health.data.heal(10);
        if (amountHealed > 0) {
            addNotification({
                text: `+${Math.round(amountHealed * 10) / 10} HP`,
                color: "#06cf28"
            });
            return true;
        }
        else {
            addNotification({
                text: `HP already full!`,
                color: "#ddd"
            });
            return false;
        }
    },
    getStats() {
        return [
            {
                stat: ItemStat.HEAL,
                value: 10
            }
        ]
    },
},
[ItemIndex.ESSENCE_VIAL]: {
    itemIndex: ItemIndex.ESSENCE_VIAL,
    displayName: "Essence Vial",
    description: "Shatter when you need a bit of essence in a jif",
    category: "Consumable",
    iconSpriteID: "essence_vial",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    cooldown: 60,
    charge: 1,
    requireFullCharge: true,
    useItem(player) {
        // TODO: add 20 essence (or something like that) to the player
        const essenceManager = player.getComponent("essence-manager");
        const amountAdded = essenceManager.data.addEssence(20);
        if (amountAdded > 0) {
            addNotification({
                text: `+${amountAdded} Essence`,
                color: "#00d6d3"
            });
            return true;
        }
        else {
            addNotification({
                text: `Essence already full!`,
                color: "#ddd"
            });
            return false;
        }
    },
    getStats() {
        return [
            {
                stat: ItemStat.ESSENCE,
                value: 20,
            }
        ]
    },
},
[ItemIndex.FLAME_UPGRADE]: {
    itemIndex: ItemIndex.FLAME_UPGRADE,
    displayName: "Flame Upgrade",
    description: "Adds a fiery touch to a weapon",
    category: "Upgrade",
    iconSpriteID: "flame_upgrade",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.POISON_UPGRADE]: {
    itemIndex: ItemIndex.POISON_UPGRADE,
    displayName: "Poison Upgrade",
    description: "Adds a drop of poison to the tip of a weapon",
    category: "Upgrade",
    iconSpriteID: "poison_upgrade",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.STRENGTH_UPGRADE]: {
    itemIndex: ItemIndex.STRENGTH_UPGRADE,
    displayName: "Strength Upgrade",
    description: "Enhances the power of a weapon",
    category: "Upgrade",
    iconSpriteID: "strength_upgrade",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.DICE]: {
    itemIndex: ItemIndex.DICE,
    displayName: "Dice",
    description: "Transforms a weapon into something new",
    category: "Upgrade",
    iconSpriteID: "dice",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.HEART]: {
    itemIndex: ItemIndex.HEART,
    displayName: "Heart",
    description: "With an additional heart you can withstand more damage",
    category: "Buff",
    iconSpriteID: "heart",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    equipItem(player) {
        const health = player.getComponent("health");
        health.data.setMaximumHP(health.data.maximumHP + 10);
    },
    unequipItem(player) {
        const health = player.getComponent("health");
        health.data.setMaximumHP(health.data.maximumHP - 10);
    },
    getStats() {
        return [
            {
                stat: ItemStat.MAX_HP_BOOST,
                value: 10,
            }
        ]
    },
},
[ItemIndex.TELEPORTATION_RUNE]: {
    itemIndex: ItemIndex.TELEPORTATION_RUNE,
    displayName: "Teleportation Rune",
    description: "Teleport anywhere within a few meters, but at a slight cost",
    category: "Mystic Arts",
    iconSpriteID: "teleportation_rune",
    consumable: false,
    essenceCost: 5,
    maxStack: 1,
    cooldown: 30,
    charge: 1,
    requireFullCharge: true,
    useItem(player, target) {
        player.position.set(target);
        // TODO: spawn particles
        return true;
    }
},
[ItemIndex.CRYSTAL_BOMB]: {
    itemIndex: ItemIndex.CRYSTAL_BOMB,
    displayName: "Crystal Bomb",
    description: "Toss this in a horde and let it do the rest",
    category: "Utility",
    iconSpriteID: "crystal_bomb",
    consumable: false,
    essenceCost: 10,
    maxStack: 1,
    cooldown: 1,
    useItem(player, target) {
        fireProjectile(projectilesCodex.get(ProjectileIndex.CRYSTAL_BOMB), player, target);
        return true;
    }
},
[ItemIndex.HEART_CRYSTAL]: {
    itemIndex: ItemIndex.HEART_CRYSTAL,
    displayName: "Heart Crystal",
    description: "The aura of this crystal has a special mending ability",
    category: "Buff",
    iconSpriteID: "heart_crystal",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    equipItem(player) {
        const health = player.getComponent("health");
        health.data.regenerationRate += 1;
    },
    unequipItem(player) {
        const health = player.getComponent("health");
        health.data.regenerationRate -= 1;
    },
    getStats() {
        return [
            {
                stat: ItemStat.REGENERATION,
                value: 1
            }
        ]
    },
},
[ItemIndex.STUN_FIDDLE]: {
    itemIndex: ItemIndex.STUN_FIDDLE,
    displayName: "Stun Fiddle",
    description: "The mystical melody emanated from this fiddle stops anyone in their tracks",
    category: "Mystic Arts",
    iconSpriteID: "stun_fiddle",
    consumable: false,
    essenceCost: 10,
    maxStack: 1,
    cooldown: 45,
    useItem(player) {
        const targets = player.game.getGameObjectsByFilter((gameObject) => {
            if (gameObject.team !== Team.ENEMY) {
                return false;
            }
            const distance = gameObject.position.distanceTo(player.position);
            return distance < 150;
        });
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            if (target.hasComponent("status-effect-manager")) {
                const effectManager = target.getComponent("status-effect-manager");
                effectManager.data.applyEffect(StatusEffectIndex.STUN, 1, 6);
            }
        }
        return true; // TODO: stun all enemies in radius and play the melody
    }
},
[ItemIndex.ROOT_SNARE]: {
    itemIndex: ItemIndex.ROOT_SNARE,
    displayName: "Root Snare",
    description: "Send out a groveling root to tangle up any enemies in its path",
    category: "Utility",
    iconSpriteID: "root_snare",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    cooldown: 10,
    useItem(player, target) {
        fireProjectile(projectilesCodex.get(ProjectileIndex.ROOT_SNARE), player, target);
        return true;
    }
},
[ItemIndex.BASIC_SHIELD]: {
    itemIndex: ItemIndex.BASIC_SHIELD,
    displayName: "Basic Shield",
    description: "Deflects some damage",
    category: "Buff",
    iconSpriteID: "basic_shield",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
    equipItem(player) {
        player.getComponent("health").data.resistance += 0.1;
    },
    unequipItem(player) {
        player.getComponent("health").data.resistance -= 0.1;
    },
    getStats() {
        return [
            {
                stat: ItemStat.RESISTANCE,
                value: 0.1
            }
        ];
    }
},
[ItemIndex.GHOST_ARROWS]: {
    itemIndex: ItemIndex.GHOST_ARROWS,
    displayName: "Ghost Arrows",
    description: "Where are these extra arrows coming from?",
    iconSpriteID: "ghost_arrows",
    category: "Upgrade",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.RICOCHET_UPGRADE]: {
    itemIndex: ItemIndex.RICOCHET_UPGRADE,
    displayName: "Ricochet Upgrade",
    description: "Bouncy bouncy",
    iconSpriteID: "ricochet_upgrade",
    category: "Upgrade",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.GHOST_BOW]: {
    itemIndex: ItemIndex.GHOST_BOW,
    displayName: "Ghost Bow",
    description: "Multishot!",
    iconSpriteID: "ghost_bow",
    category: "Weapon",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.RICOCHET_BOW]: {
    itemIndex: ItemIndex.RICOCHET_BOW,
    displayName: "Ricochet Bow",
    description: "Your arrows will just keep on going",
    iconSpriteID: "ricochet_bow",
    category: "Weapon",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.STRONG_SWORD]: {
    itemIndex: ItemIndex.STRONG_SWORD,
    displayName: "Strong Sword",
    description: "This sure deals a lot of damage",
    iconSpriteID: "strong_sword",
    category: "Weapon",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.POISON_STRONG_SWORD]: {
    itemIndex: ItemIndex.POISON_STRONG_SWORD,
    displayName: "Poisonous Strong Sword",
    description: "A lot of a damage and a lasting sting",
    iconSpriteID: "poison_strong_sword",
    category: "Weapon",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.POISON_BROAD_SWORD]: {
    itemIndex: ItemIndex.POISON_BROAD_SWORD,
    displayName: "Poisonous Broad Sword",
    description: "Leave a lasting ailment to your foe",
    iconSpriteID: "poison_broad_sword",
    category: "Weapon",
    consumable: false,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.BOOMERANG]: { 
    itemIndex: ItemIndex.BOOMERANG,
    displayName: "Boomerang",
    description: "Woop woop",
    iconSpriteID: "boomerang",
    category: "Weapon",
    consumable: true,
    essenceCost: 0,
    maxStack: 1,
},
[ItemIndex.RICOCHET_BOOMERANG]: {
    itemIndex: ItemIndex.RICOCHET_BOOMERANG,
    displayName: "Bouncy Boomerang",
    description: "Woop hit woop hit woop",
    iconSpriteID: "ricochet_boomerang",
    category: "Weapon",
    consumable: true,
    essenceCost: 0,
    maxStack: 1
}
}

export { itemsCodex, ItemIndex, ItemStat, itemStats };
export type { Item, ItemDropChance, ItemStatData, ItemStatValue, ItemCategory };
