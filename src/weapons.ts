import { Vector } from "./utils";
import { ProjectileFactory, GameObject, MeleeAttackFactory } from "./gameObjects";
import { Projectile, projectilesCodex, ProjectileIndex } from "./projectiles";
import { MeleeAttack, meleeAttacksCodex, MeleeAttackIndex } from "./meleeAttacks";
import { Codex } from "./codex";

// NOTE: players AND enemies can fire weapons!

type WeaponFireFunction = (gameObject: GameObject, target: Vector) => void;

interface Weapon {
    cooldown: number; // Minimum time between uses
    fire: WeaponFireFunction;
}

enum WeaponIndex {
    BROAD_SWORD,
    ZOMBIE_BRAINS,
    SHURIKEN,
    BOW,

    ZOMBIE_ATTACK,
    MINION_ATTACK,
    SLIME_ATTACK,
    REVENANT_EYE_ATTACK,
    WRETCHED_SKELETON_ATTACK,
    WRAITH_ATTACK,
}

const fireProjectile = (projectile: Projectile, gameObject: GameObject, target: Vector) => {
    const direction = Vector.subtract(target, gameObject.position);
    gameObject.scale.x = Math.abs(gameObject.scale.x) * Math.sign(direction.x);
    gameObject.game.addGameObject(
        ProjectileFactory(projectile, gameObject, gameObject.position, target)
    );
}

const fireMelee = (meleeAttack: MeleeAttack, gameObject: GameObject, target: Vector) => {
    const direction = Vector.subtract(target, gameObject.position);
    gameObject.scale.x = Math.abs(gameObject.scale.x) * Math.sign(direction.x);
    gameObject.game.addGameObject(
        MeleeAttackFactory(meleeAttack, gameObject, target)
    );
}

const weaponsCodex = new Codex<WeaponIndex, Weapon>();
weaponsCodex.set(WeaponIndex.BROAD_SWORD, {
    cooldown: 0.2,
    fire(gameObject, target) {
        fireMelee(meleeAttacksCodex.get(MeleeAttackIndex.BROAD_SWORD), gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.ZOMBIE_BRAINS, {
    cooldown: 6,
    fire(gameObject, target) {
        // fireMelee(gameObject, target, 5);
        fireProjectile(projectilesCodex.get(ProjectileIndex.ZOMBIE_BRAINS), gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.SHURIKEN, {
    cooldown: 0.25,
    fire(gameObject, target) {
        fireProjectile(projectilesCodex.get(ProjectileIndex.SHURIKEN), gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.BOW, {
    cooldown: 1,
    fire(gameObject, target) {
        fireProjectile(projectilesCodex.get(ProjectileIndex.ARROW), gameObject, target);
    }
});

weaponsCodex.set(WeaponIndex.ZOMBIE_ATTACK, {
    cooldown: 1,
    fire(gameObject, target) {
        const attack = {...meleeAttacksCodex.get(MeleeAttackIndex.BASIC)};
        attack.damage = 4;
        fireMelee(attack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.MINION_ATTACK, {
    cooldown: 0.7,
    fire(gameObject, target) {
        const attack = {...meleeAttacksCodex.get(MeleeAttackIndex.BASIC)};
        attack.damage = 2;
        fireMelee(attack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.REVENANT_EYE_ATTACK, {
    cooldown: 4,
    fire(gameObject, target) {
        fireProjectile(projectilesCodex.get(ProjectileIndex.TEAR_DROP), gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.SLIME_ATTACK, {
    cooldown: 2,
    fire(gameObject, target) {
        const attack = {...meleeAttacksCodex.get(MeleeAttackIndex.BASIC)};
        attack.damage = 1;
        attack.knockback = 5;
        fireMelee(attack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.WRETCHED_SKELETON_ATTACK, {
    cooldown: 1.5,
    fire(gameObject, target) {
        const arrow = {...projectilesCodex.get(ProjectileIndex.ARROW)};
        arrow.chanceOfBreaking = 1;
        fireProjectile(arrow, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.WRAITH_ATTACK, {
    cooldown: 2,
    fire(gameObject, target) {
        fireProjectile(projectilesCodex.get(ProjectileIndex.WRAITH_ATTACK), gameObject, target);
    }
});

export { WeaponIndex, weaponsCodex };
export type { Weapon };