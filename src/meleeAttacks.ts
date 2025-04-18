import { GameObject } from "./gameObjects";

enum MeleeAttackIndex {
    BROAD_SWORD, // Sweeping attack for broad sword types
    DAGGER, // Short range dagger attack
    BATTLE_HAMMER, // Long range heavy attack
    BASIC, // Basic pointed attack
}

interface MeleeAttack {
    // How much damage this attack does to a main target
    damage: number;
    // How much damage this attack does to additional targets
    sweepDamage: number;
    // The maximum number of distinct opponents this attack can hit
    maxHits: number;
    // How much knockback force to apply
    knockback: number;
    // How long the attack lasts
    duration: number;
    // How large the hitbox of the attack is
    size: number;
    // How far out the attack goes from the owner
    range: number;
    // Define a sweep of the attack around the attacker
    sweepArcStart?: number;
    sweepArcLength?: number;
    // Particle effects, if applicable
    particleSpriteID?: string;

    onHit?: (gameObject: GameObject, data: any, hit: GameObject) => void;
}

const meleeAttacksCodex: Record<MeleeAttackIndex, MeleeAttack> = {
[MeleeAttackIndex.BROAD_SWORD]: {
    damage: 5,
    sweepDamage: 2,
    maxHits: 3,
    knockback: 32,
    size: 8,
    range: 20,
    duration: 0.25,
    sweepArcStart: -Math.PI / 4,
    sweepArcLength: Math.PI / 2,
    particleSpriteID: "sword_spark"
},
[MeleeAttackIndex.DAGGER]: {
    damage: 4,
    sweepDamage: 0,
    maxHits: 1,
    knockback: 24,
    size: 8,
    range: 24,
    duration: 0.1,
    particleSpriteID: "sword_spark"
},
[MeleeAttackIndex.BATTLE_HAMMER]: {
    damage: 20,
    sweepDamage: 10,
    maxHits: 6,
    knockback: 12,
    size: 16,
    range: 24,
    duration: 0.2,
    particleSpriteID: "sword_spark",
},
[MeleeAttackIndex.BASIC]: {
    damage: 1,
    sweepDamage: 0,
    maxHits: 1,
    knockback: 16,
    size: 4,
    range: 8,
    duration: 0.1,
    particleSpriteID: "sword_spark"
},
}

export { meleeAttacksCodex, MeleeAttackIndex };
export type { MeleeAttack };
