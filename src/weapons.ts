import { Vector } from "./utils";
import { ProjectileFactory, GameObject, MeleeAttackFactory } from "./gameObjects";

// NOTE: players AND enemies can fire weapons!

type WeaponFireFunction = (gameObject: GameObject, target: Vector) => void;

interface Weapon {
    weaponIndex: WeaponIndex;
    cooldown: number; // Minimum time between uses
    fire: WeaponFireFunction;
}

enum WeaponIndex {
    BROAD_SWORD,
    ZOMBIE_ATTACK
}

const fireProjectile = (gameObject: GameObject, target: Vector) => {
    gameObject.game.addGameObject(
        ProjectileFactory(gameObject, gameObject.position, target)
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
    }
];

export { WeaponIndex, weaponsCodex };
export type { Weapon };