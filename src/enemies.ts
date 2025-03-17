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
    physicalColliderOffset: Vector;
    physicalColliderSize: Vector;
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
    physicalColliderOffset: new Vector(0, -1),
    physicalColliderSize: new Vector(0.8, 0.3),
    hp: 25,
    drops: [
        {chance: 0.05, itemIndex: ItemIndex.ZOMBIE_BRAINS},
    ],
    essenceAmount: 4,
    ai: BasicFollowAndAttackAI({
        attackRange: 0.5,
        followDistance: 16,
        speed: 0.8,
        waterSpeed: 0.4,
        weaponIndex: WeaponIndex.ZOMBIE_ATTACK,
    }),
});
enemiesCodex.set(EnemyIndex.MINION, {
    spriteID: "minion",
    waterSpriteID: "minion_water",
    scale: new Vector(1, 1),
    physicalColliderOffset: new Vector(0, -0.4),
    physicalColliderSize: new Vector(0.8, 0.2),
    hp: 16,
    drops: [],
    essenceAmount: 2,
    ai: BasicFollowAndAttackAI({
        attackRange: 0.5,
        followDistance: 10,
        speed: 1.8,
        waterSpeed: 1,
        weaponIndex: WeaponIndex.MINION_ATTACK,
    })
});
enemiesCodex.set(EnemyIndex.SLIME, {
    spriteID: "slime",
    waterSpriteID: "slime",
    particleID: "slime_particle",
    scale: new Vector(0.75, 0.5),
    physicalColliderOffset: new Vector(0, -0.1),
    physicalColliderSize: new Vector(0.5, 0.1),
    hp: 10,
    drops: [],
    essenceAmount: 1,
    ai: BasicFollowAndAttackAI({
        attackRange: 0.8,
        followDistance: 12,
        speed: 1.4,
        waterSpeed: 1,
        weaponIndex: WeaponIndex.SLIME_ATTACK,
        customVelocityFunction(gameObject, direction) {
            return Vector.scaled(direction, Math.sin(gameObject.age * 6) + 1);
        },
    })
});
enemiesCodex.set(EnemyIndex.REVENANT_EYE, {
    spriteID: "revenant_eye",
    scale: new Vector(1, 1),
    physicalColliderOffset: new Vector(0, -0.4),
    physicalColliderSize: new Vector(0.8, 0.2),
    hp: 25,
    drops: [],
    essenceAmount: 5,
    ai: BasicFollowAndAttackAI({
        attackRange: 6,
        followDistance: 16,
        speed: 0.8,
        waterSpeed: 0.8,
        weaponIndex: WeaponIndex.REVENANT_EYE_ATTACK,
    }),
});
enemiesCodex.set(EnemyIndex.WRETCHED_SKELETON, {
    spriteID: "wretched_skeleton",
    waterSpriteID: "wretched_skeleton_water",
    scale: new Vector(1, 2),
    physicalColliderOffset: new Vector(0, -0.9),
    physicalColliderSize: new Vector(0.8, 0.2),
    hp: 30,
    drops: [],
    essenceAmount: 6,
    ai: BasicFollowAndAttackAI({
        attackRange: 8,
        followDistance: 16,
        speed: 1.2,
        waterSpeed: 0.6,
        weaponIndex: WeaponIndex.WRETCHED_SKELETON_ATTACK,
    })
});
enemiesCodex.set(EnemyIndex.WRAITH, {
    spriteID: "wraith",
    scale: new Vector(0.75, 1.5),
    physicalColliderOffset: new Vector(0, -0.65),
    physicalColliderSize: new Vector(0.5, 0.2),
    hp: 35,
    drops: [],
    essenceAmount: 8,
    ai: BasicFollowAndAttackAI({
        attackRange: 6,
        followDistance: 16,
        speed: 1.6,
        waterSpeed: 1.6,
        weaponIndex: WeaponIndex.WRAITH_ATTACK
    })
});


export { enemiesCodex, EnemyIndex };