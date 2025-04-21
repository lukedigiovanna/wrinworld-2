import { MathUtils, Vector } from "./utils";
import { ProjectileFactory, GameObject, MeleeAttackFactory } from "./gameObjects";
import { Projectile, projectilesCodex, ProjectileIndex } from "./projectiles";
import { MeleeAttack, meleeAttacksCodex, MeleeAttackIndex } from "./meleeAttacks";
import { Item, ItemIndex } from "./items";
import { StatusEffectIndex } from "./statusEffects";

// NOTE: players AND enemies can fire weapons!

interface AttackProperties {
    uses?: Item;
    charge?: number;
}

type WeaponFireFunction = (gameObject: GameObject, target: Vector, props?: AttackProperties) => void;

interface Weapon {
    // Minimum time between uses
    cooldown: number;
    // Maximum amount of charge this weapon can accumulate.
    // If it is defined then does not attack until attack key is released.
    charge?: number;
    // Will shoot immediately upon reaching max charge.
    useOnFullCharge?: boolean;
    // Will charge again as soon as shooting
    automatic?: boolean;
    attack: (props?: AttackProperties) => MeleeAttack | Projectile;
    fire: WeaponFireFunction;
}

enum WeaponIndex {
    BROAD_SWORD,
    QUICK_BROAD_SWORD,
    STRONG_SWORD,
    POISON_BROAD_SWORD,
    POISON_STRONG_SWORD,
    DAGGERS,
    BATTLE_HAMMER,
    QUICK_BATTLE_HAMMER,
    POISON_BATTLE_HAMMER,
    ESSENCE_DRIPPED_DAGGER,
    SHURIKEN,
    BOW,
    GHOST_BOW,
    RICOCHET_BOW,
    QUICK_BOW,
    BOOMERANG,
    RICOCHET_BOOMERANG,
    SLINGSHOT,
    REINFORCED_SLINGSHOT,
    MACHINE_GUN_SLINGSHOT,
}

const fireProjectile = (projectile: Projectile, gameObject: GameObject, target: Vector) => {
    const hitboxCenter = gameObject.hitboxCenter;
    const direction = Vector.subtract(target, hitboxCenter);
    if (direction.x !== 0) {
        gameObject.scale.x = Math.abs(gameObject.scale.x) * Math.sign(direction.x);
    }
    gameObject.game.addGameObject(
        ProjectileFactory(projectile, gameObject, hitboxCenter, target)
    );
}

const fireMelee = (meleeAttack: MeleeAttack, gameObject: GameObject, target: Vector) => {
    const hitboxCenter = gameObject.hitboxCenter;
    const direction = Vector.subtract(target, hitboxCenter);
    if (direction.x !== 0) {
        gameObject.scale.x = Math.abs(gameObject.scale.x) * Math.sign(direction.x);
    }
    gameObject.game.addGameObject(
        MeleeAttackFactory(meleeAttack, gameObject, target)
    );
}

// Linearly scales the given fields by the charge and returns the new result
function scaleProjectileByCharge(projectile: Projectile, charge: number | undefined, fields: (keyof Projectile)[]=["damage", "lifespan", "speed", "knockback"]) {
    const chargeValue = charge ?? 1;
    const result = {...projectile};
    for (const key of fields) {
        (result[key] as number) *= chargeValue;
    }
    return result;
}

function scaleMeleeByCharge(melee: MeleeAttack, charge: number | undefined, fields: (keyof MeleeAttack)[]=["damage", "knockback", "sweepDamage"]) {
    const chargeValue = charge ?? 1;
    const result = {...melee};
    for (const key of fields) {
        (result[key] as number) *= chargeValue;
    }
    return result;
}

const weaponsCodex: Record<WeaponIndex, Weapon> = {
[WeaponIndex.BROAD_SWORD]: {
    cooldown: 0.75,
    attack: () => meleeAttacksCodex[MeleeAttackIndex.BROAD_SWORD],
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
},
[WeaponIndex.QUICK_BROAD_SWORD]: {
    cooldown: 0.35,
    attack: () => meleeAttacksCodex[MeleeAttackIndex.BROAD_SWORD],
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
},
[WeaponIndex.POISON_BROAD_SWORD]: {
    cooldown: 0.75,
    attack: (props) => ({
        ...meleeAttacksCodex[MeleeAttackIndex.BROAD_SWORD],
        onHit(gameObject, data, hit) {
            hit.getComponentOptional("status-effect-manager")?.data.applyEffect(StatusEffectIndex.POISON, 1, MathUtils.random(3, 6));
        }
    }),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
},
[WeaponIndex.STRONG_SWORD]: {
    cooldown: 0.75,
    attack: (props) => ({
        ...meleeAttacksCodex[MeleeAttackIndex.BROAD_SWORD],
        damage: 10,
        sweepDamage: 5,
    }),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
},
[WeaponIndex.POISON_STRONG_SWORD]: {
    cooldown: 0.75,
    attack: (props) => ({
        ...meleeAttacksCodex[MeleeAttackIndex.BROAD_SWORD],
        damage: 10,
        sweepDamage: 5,
        onHit(gameObject, data, hit) {
            hit.getComponentOptional("status-effect-manager")?.data.applyEffect(StatusEffectIndex.POISON, MathUtils.random(1, 3), MathUtils.random(3, 6));
        }
    }),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
},
[WeaponIndex.SHURIKEN]: {
    cooldown: 0.25,
    attack: () => projectilesCodex[ProjectileIndex.SHURIKEN],
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
},
[WeaponIndex.BOW]: {
    cooldown: 0.0,
    charge: 1.2,
    attack(props) {
        let projectile;
        if (props?.uses) {
            if (props.uses.itemIndex === ItemIndex.POISON_ARROW) {
                projectile = projectilesCodex[ProjectileIndex.POISON_ARROW];
            }
            else if (props.uses.itemIndex === ItemIndex.FLAME_ARROW) {
                projectile = projectilesCodex[ProjectileIndex.FLAME_ARROW];
            }
        }
        if (!projectile) {
            projectile = projectilesCodex[ProjectileIndex.ARROW];
        }
        return scaleProjectileByCharge(projectile, props?.charge);
    },
    fire(gameObject, target, props) {
        fireProjectile(this.attack(props) as Projectile, gameObject, target);
    }
},
[WeaponIndex.GHOST_BOW]: {
    cooldown: 0,
    charge: 1.2,
    attack: (props) => scaleProjectileByCharge(projectilesCodex[ProjectileIndex.ARROW], props?.charge),
    fire(gameObject, target, props) {
        fireProjectile(this.attack(props) as Projectile, gameObject, target);
        const direction = gameObject.position.directionTowards(target);
        const rightTarget = Vector.add(gameObject.position, Vector.rotated(direction, 0.2));
        const leftTarget = Vector.add(gameObject.position, Vector.rotated(direction, -0.2));
        const ghostArrow = scaleProjectileByCharge(projectilesCodex[ProjectileIndex.GHOST_ARROW], props?.charge);
        fireProjectile(ghostArrow, gameObject, rightTarget);
        fireProjectile(ghostArrow, gameObject, leftTarget);
    }
},
[WeaponIndex.RICOCHET_BOW]: {
    cooldown: 0,
    charge: 1.2,
    attack: (props) => scaleProjectileByCharge(projectilesCodex[ProjectileIndex.RICOCHET_ARROW], props?.charge),
    fire(gameObject, target, props) {
        fireProjectile(this.attack(props) as Projectile, gameObject, target);
    }
},
[WeaponIndex.QUICK_BOW]: {
    cooldown: 0.25,
    attack: () => ({
        ...projectilesCodex[ProjectileIndex.ARROW],
        damage: 6,
        knockback: 16,
        speed: 480,
    }),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
},
[WeaponIndex.DAGGERS]: {
    cooldown: 0.0,
    charge: 0.2,
    automatic: true,
    attack: () => meleeAttacksCodex[MeleeAttackIndex.DAGGER],
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
},
[WeaponIndex.BATTLE_HAMMER]: {
    cooldown: 1.6,
    charge: 1.6,
    attack: (props) => meleeAttacksCodex[MeleeAttackIndex.BATTLE_HAMMER],
    fire(gameObject, target, props) {
        fireMelee(this.attack(props) as MeleeAttack, gameObject, target);
    }
},
[WeaponIndex.QUICK_BATTLE_HAMMER]: {
    cooldown: 1,
    charge: 1,
    attack: (props) => scaleMeleeByCharge(meleeAttacksCodex[MeleeAttackIndex.BATTLE_HAMMER], props?.charge),
    fire(gameObject, target, props) {
        fireMelee(this.attack(props) as MeleeAttack, gameObject, target);
    }
},
[WeaponIndex.POISON_BATTLE_HAMMER]: {
    cooldown: 1.6,
    charge: 1.6,
    attack: (props) => ({
        ...scaleMeleeByCharge(meleeAttacksCodex[MeleeAttackIndex.BATTLE_HAMMER], props?.charge),
        onHit(gameObject, data, hit) {
            hit.getComponentOptional("status-effect-manager")?.data.applyEffect(StatusEffectIndex.POISON, MathUtils.random(1, 3), MathUtils.random(2, 5));
        }
    }),
    fire(gameObject, target, props) {
        fireMelee(this.attack(props) as MeleeAttack, gameObject, target);
    }
},
[WeaponIndex.ESSENCE_DRIPPED_DAGGER]: {
    cooldown: 0.4,
    attack: () => ({
        ...meleeAttacksCodex[MeleeAttackIndex.DAGGER],
        damage: 16
    }),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
},
[WeaponIndex.SLINGSHOT]: {
    cooldown: 0.8,
    charge: 1.2,
    attack: (props) => scaleProjectileByCharge(projectilesCodex[ProjectileIndex.ROCK], props?.charge),
    fire(gameObject, target, props) {
        fireProjectile(this.attack(props) as Projectile, gameObject, target);
    }
},
[WeaponIndex.REINFORCED_SLINGSHOT]: {
    cooldown: 0.8,
    charge: 0.8,
    attack: (props) => scaleProjectileByCharge({
        ...projectilesCodex[ProjectileIndex.ROCK],
        damage: 12
    }, props?.charge),
    fire(gameObject, target, props) {
        fireProjectile(this.attack(props) as Projectile, gameObject, target);
    }
},
[WeaponIndex.MACHINE_GUN_SLINGSHOT]: {
    cooldown: 0,
    charge: 0.2,
    automatic: true,
    useOnFullCharge: true,
    attack: () => ({
        ...projectilesCodex[ProjectileIndex.ROCK],
        damage: 3,
    }),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
},
[WeaponIndex.BOOMERANG]: {
    cooldown: 0,
    attack: (props) => projectilesCodex[ProjectileIndex.BOOMERANG],
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
},
[WeaponIndex.RICOCHET_BOOMERANG]: {
    cooldown: 0,
    attack: (props) => projectilesCodex[ProjectileIndex.RICOCHET_BOOMERANG],
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
},
}

export { WeaponIndex, weaponsCodex, fireProjectile, fireMelee };
export type { Weapon };
