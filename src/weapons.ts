import { Vector } from "./utils";
import { ProjectileFactory, GameObject, MeleeAttackFactory } from "./gameObjects";
import { Projectile, projectilesCodex, ProjectileIndex } from "./projectiles";
import { MeleeAttack, meleeAttacksCodex, MeleeAttackIndex } from "./meleeAttacks";
import { Codex } from "./codex";

// NOTE: players AND enemies can fire weapons!

type WeaponFireFunction = (gameObject: GameObject, target: Vector) => void;

interface Weapon {
    weaponIndex: WeaponIndex;
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
}

const fireProjectile = (projectile: Projectile, gameObject: GameObject, target: Vector) => {
    gameObject.game.addGameObject(
        ProjectileFactory(projectile, gameObject, gameObject.position, target)
    );
}

const fireMelee = (meleeAttack: MeleeAttack, gameObject: GameObject, target: Vector) => {
    gameObject.game.addGameObject(
        MeleeAttackFactory(meleeAttack, gameObject, target)
    );
}

const weaponsCodex = new Codex<WeaponIndex, Weapon>();
weaponsCodex.set(WeaponIndex.BROAD_SWORD, {
    weaponIndex: WeaponIndex.BROAD_SWORD,
    cooldown: 1,
    fire(gameObject, target) {
        fireMelee(meleeAttacksCodex.get(MeleeAttackIndex.BROAD_SWORD), gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.ZOMBIE_BRAINS, {
    weaponIndex: WeaponIndex.ZOMBIE_BRAINS,
    cooldown: 6,
    fire(gameObject, target) {
        // fireMelee(gameObject, target, 5);
        fireProjectile(projectilesCodex.get(ProjectileIndex.ZOMBIE_BRAINS), gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.SHURIKEN, {
    weaponIndex: WeaponIndex.SHURIKEN,
    cooldown: 0,
    fire(gameObject, target) {
        fireProjectile(projectilesCodex.get(ProjectileIndex.SHURIKEN), gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.BOW, {
    weaponIndex: WeaponIndex.BOW,
    cooldown: 0.1,
    fire(gameObject, target) {
        fireProjectile(projectilesCodex.get(ProjectileIndex.ARROW), gameObject, target);
    }
});

weaponsCodex.set(WeaponIndex.ZOMBIE_ATTACK, {
    weaponIndex: WeaponIndex.ZOMBIE_ATTACK,
    cooldown: 1,
    fire(gameObject, target) {
        const attack = {...meleeAttacksCodex.get(MeleeAttackIndex.BASIC)};
        attack.damage = 4;
        fireMelee(attack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.MINION_ATTACK, {
    weaponIndex: WeaponIndex.MINION_ATTACK,
    cooldown: 0.7,
    fire(gameObject, target) {
        const attack = {...meleeAttacksCodex.get(MeleeAttackIndex.BASIC)};
        attack.damage = 2;
        fireMelee(attack, gameObject, target);
    }
});

export { WeaponIndex, weaponsCodex };
export type { Weapon };