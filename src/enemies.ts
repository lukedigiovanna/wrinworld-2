import { ItemIndex } from "./items";
import { Vector } from "./utils";
import { BasicFollowAndAttackAI, ComponentFactory } from "./components";
import { ItemDropChance } from "./items";
import { Codex } from "./codex";
import { WeaponIndex } from "./weapons";

enum EnemyIndex {
    ZOMBIE,
    MINION,
    SLIME,
    REVENANT_EYE,
    WRAITH,
    WRETCHED_SKELETON,
}

interface Enemy {
    spriteID: string;
    waterSpriteID?: string; // No water effects when undefined
    particleID?: string; // No particles when undefined
    scale: Vector;
    hp: number;
    drops: ItemDropChance[];
    essenceAmount: number;
    ai: ComponentFactory;
}

const enemiesCodex = new Codex<EnemyIndex, Enemy>();
enemiesCodex.set(EnemyIndex.ZOMBIE, {
    spriteID: "zombie",
    waterSpriteID: "zombie_water",
    scale: new Vector(1, 2.33),
    hp: 25,
    drops: [
        {chance: 0.05, itemIndex: ItemIndex.ZOMBIE_BRAINS},
    ],
    essenceAmount: 4,
    ai: BasicFollowAndAttackAI({
        attackRange: 8,
        followDistance: 16,
        speed: 12.8,
        waterSpeed: 6.4,
        weaponIndex: WeaponIndex.ZOMBIE_ATTACK,
    }),
});
enemiesCodex.set(EnemyIndex.MINION, {
    spriteID: "minion",
    waterSpriteID: "minion_water",
    scale: new Vector(1, 1),
    hp: 16,
    drops: [],
    essenceAmount: 2,
    ai: BasicFollowAndAttackAI({
        attackRange: 8,
        followDistance: 160,
        speed: 29,
        waterSpeed: 20,
        weaponIndex: WeaponIndex.MINION_ATTACK,
    })
});
enemiesCodex.set(EnemyIndex.SLIME, {
    spriteID: "slime",
    waterSpriteID: "slime",
    particleID: "slime_particle",
    scale: new Vector(0.75, 0.5),
    hp: 10,
    drops: [],
    essenceAmount: 1,
    ai: BasicFollowAndAttackAI({
        attackRange: 12,
        followDistance: 192,
        speed: 22,
        waterSpeed: 16,
        weaponIndex: WeaponIndex.SLIME_ATTACK,
        customVelocityFunction(gameObject, direction) {
            return Vector.scaled(direction, Math.sin(gameObject.age * 6) + 1);
        },
    })
});
enemiesCodex.set(EnemyIndex.REVENANT_EYE, {
    spriteID: "revenant_eye",
    scale: new Vector(1, 1),
    hp: 25,
    drops: [],
    essenceAmount: 5,
    ai: BasicFollowAndAttackAI({
        attackRange: 96,
        followDistance: 256,
        speed: 22,
        waterSpeed: 22,
        weaponIndex: WeaponIndex.REVENANT_EYE_ATTACK,
    }),
});
enemiesCodex.set(EnemyIndex.WRETCHED_SKELETON, {
    spriteID: "wretched_skeleton",
    waterSpriteID: "wretched_skeleton_water",
    scale: new Vector(1, 2),
    hp: 30,
    drops: [],
    essenceAmount: 6,
    ai: BasicFollowAndAttackAI({
        attackRange: 128,
        followDistance: 256,
        speed: 22,
        waterSpeed: 14,
        weaponIndex: WeaponIndex.WRETCHED_SKELETON_ATTACK,
    })
});
enemiesCodex.set(EnemyIndex.WRAITH, {
    spriteID: "wraith",
    scale: new Vector(0.75, 1.5),
    hp: 35,
    drops: [],
    essenceAmount: 8,
    ai: BasicFollowAndAttackAI({
        attackRange: 96,
        followDistance: 256,
        speed: 25,
        waterSpeed: 25,
        weaponIndex: WeaponIndex.WRAITH_ATTACK
    })
});


export { enemiesCodex, EnemyIndex };