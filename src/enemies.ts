import { ItemIndex } from "./items";
import { Vector } from "./utils";
import { BasicFollowAndAttackAI, ComponentFactory } from "./components";
import { ItemDropChance } from "./items";
import { Codex } from "./codex";
import { WeaponIndex } from "./weapons";

enum EnemyIndex {
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
    speed: number;
    waterSpeedModifier: number;
    hp: number;
    drops: ItemDropChance[];
    essenceAmount: number;
    ai: ComponentFactory;
}

const enemiesCodex = new Codex<EnemyIndex, Enemy>();
enemiesCodex.set(EnemyIndex.MINION, {
    spriteID: "minion",
    waterSpriteID: "minion_water",
    scale: new Vector(1, 1),
    hp: 16,
    drops: [],
    speed: 29,
    waterSpeedModifier: 0.5,
    essenceAmount: 2,
    ai: BasicFollowAndAttackAI({
        attackRange: 8,
        followDistance: 160,
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
    speed: 22,
    waterSpeedModifier: 0.5,
    essenceAmount: 1,
    ai: BasicFollowAndAttackAI({
        attackRange: 12,
        followDistance: 192,
        weaponIndex: WeaponIndex.SLIME_ATTACK,
        customSpeedModifier(gameObject, direction) {
            return Math.sin(gameObject.age * 6) * 0.5 + 0.5;
        },
    })
});
enemiesCodex.set(EnemyIndex.REVENANT_EYE, {
    spriteID: "revenant_eye",
    scale: new Vector(1, 1),
    hp: 25,
    drops: [],
    speed: 22,
    waterSpeedModifier: 1.0,
    essenceAmount: 5,
    ai: BasicFollowAndAttackAI({
        attackRange: 96,
        followDistance: 256,
        weaponIndex: WeaponIndex.REVENANT_EYE_ATTACK,
    }),
});
enemiesCodex.set(EnemyIndex.WRETCHED_SKELETON, {
    spriteID: "wretched_skeleton",
    waterSpriteID: "wretched_skeleton_water",
    scale: new Vector(1, 2),
    hp: 30,
    speed: 22,
    waterSpeedModifier: 0.5,
    drops: [],
    essenceAmount: 6,
    ai: BasicFollowAndAttackAI({
        attackRange: 128,
        followDistance: 256,
        weaponIndex: WeaponIndex.WRETCHED_SKELETON_ATTACK,
    })
});
enemiesCodex.set(EnemyIndex.WRAITH, {
    spriteID: "wraith",
    scale: new Vector(0.75, 1.5),
    hp: 35,
    speed: 25,
    waterSpeedModifier: 1.0,
    drops: [],
    essenceAmount: 8,
    ai: BasicFollowAndAttackAI({
        attackRange: 96,
        followDistance: 256,
        weaponIndex: WeaponIndex.WRAITH_ATTACK
    })
});


export { enemiesCodex, EnemyIndex };