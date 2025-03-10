import { Vector } from "./utils";
import { ProjectileFactory, GameObject, MeleeAttackFactory } from "./gameObjects";
import { Projectile, projectilesCodex, ProjectileIndex } from "./projectiles";

// NOTE: players AND enemies can fire weapons!

type WeaponFireFunction = (gameObject: GameObject, target: Vector) => void;

interface Weapon {
    weaponIndex: WeaponIndex;
    cooldown: number; // Minimum time between uses
    fire: WeaponFireFunction;
}

enum WeaponIndex {
    BROAD_SWORD,
    ZOMBIE_ATTACK,
    SHURIKEN,
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

const weaponsCodex: Weapon[] = [
    {
        weaponIndex: WeaponIndex.BROAD_SWORD,
        cooldown: 1,
        fire(gameObject, target) {
            fireMelee(gameObject, target, 1);
        }
    },
    {
        weaponIndex: WeaponIndex.ZOMBIE_ATTACK,
        cooldown: 1,
        fire(gameObject, target) {
            // fireMelee(gameObject, target, 5);
        }
    },
    {
        weaponIndex: WeaponIndex.SHURIKEN,
        cooldown: 0,
        fire(gameObject, target) {
            fireProjectile(projectilesCodex[ProjectileIndex.SHURIKEN], gameObject, target);
        }
    }
];

export { WeaponIndex, weaponsCodex };
export type { Weapon };