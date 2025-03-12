import { Vector } from "./utils";
import { ProjectileFactory, GameObject, MeleeAttackFactory } from "./gameObjects";
import { Projectile, projectilesCodex, ProjectileIndex } from "./projectiles";
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
}

const fireProjectile = (projectile: Projectile, gameObject: GameObject, target: Vector) => {
    gameObject.game.addGameObject(
        ProjectileFactory(projectile, gameObject, gameObject.position, target)
    );
}

const fireMelee = (gameObject: GameObject, target: Vector, strength: number) => {
    gameObject.game.addGameObject(
        MeleeAttackFactory(gameObject, gameObject.position, target)
    );
}

const weaponsCodex = new Codex<WeaponIndex, Weapon>();
weaponsCodex.set(WeaponIndex.BROAD_SWORD, {
    weaponIndex: WeaponIndex.BROAD_SWORD,
    cooldown: 1,
    fire(gameObject, target) {
        fireMelee(gameObject, target, 1);
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

export { WeaponIndex, weaponsCodex };
export type { Weapon };