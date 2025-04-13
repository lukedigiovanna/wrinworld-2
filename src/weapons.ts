import { Vector } from "./utils";
import { ProjectileFactory, GameObject, MeleeAttackFactory } from "./gameObjects";
import { Projectile, projectilesCodex, ProjectileIndex } from "./projectiles";
import { MeleeAttack, meleeAttacksCodex, MeleeAttackIndex } from "./meleeAttacks";
import { Codex } from "./codex";
import { Item, ItemIndex } from "./items";

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
    attack: (props?: AttackProperties) => MeleeAttack | Projectile;
    fire: WeaponFireFunction;
}

enum WeaponIndex {
    BROAD_SWORD,
    DAGGERS,
    BATTLE_HAMMER,
    ESSENCE_DRIPPED_DAGGER,
    SHURIKEN,
    BOW,
    SLINGSHOT,
    QUICK_BOW,

    ZOMBIE_ATTACK,
    MINION_ATTACK,
    SLIME_ATTACK,
    REVENANT_EYE_ATTACK,
    WRETCHED_SKELETON_ATTACK,
    WRAITH_ATTACK,
}

const fireProjectile = (projectile: Projectile, gameObject: GameObject, target: Vector) => {
    const hitboxCenter = Vector.add(gameObject.position, gameObject.getComponent("hitbox").data.boxOffset);
    const direction = Vector.subtract(target, hitboxCenter);
    if (direction.x !== 0) {
        gameObject.scale.x = Math.abs(gameObject.scale.x) * Math.sign(direction.x);
    }
    gameObject.game.addGameObject(
        ProjectileFactory(projectile, gameObject, hitboxCenter, target)
    );
}

const fireMelee = (meleeAttack: MeleeAttack, gameObject: GameObject, target: Vector) => {
    const hitboxCenter = Vector.add(gameObject.position, gameObject.getComponent("hitbox").data.boxOffset);
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
    const chargeValue = charge ? charge : 1;
    const result = {...projectile};
    for (const key of fields) {
        (result[key] as number) *= chargeValue;
    }
    return result;
}

function scaleMeleeByCharge(melee: MeleeAttack, charge: number | undefined, fields: (keyof MeleeAttack)[]=["damage", "knockback", "sweepDamage"]) {
    const chargeValue = charge ? charge : 1;
    const result = {...melee};
    for (const key of fields) {
        (result[key] as number) *= chargeValue;
    }
    return result;
}

const weaponsCodex = new Codex<WeaponIndex, Weapon>();
weaponsCodex.set(WeaponIndex.BROAD_SWORD, {
    cooldown: 0.5,
    attack: () => meleeAttacksCodex.get(MeleeAttackIndex.BROAD_SWORD),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.SHURIKEN, {
    cooldown: 0.25,
    attack: () => projectilesCodex.get(ProjectileIndex.SHURIKEN),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.BOW, {
    cooldown: 0.0,
    charge: 1.2,
    attack(props) {
        let projectile;
        if (props?.uses) {
            if (props.uses.itemIndex === ItemIndex.POISON_ARROW) {
                projectile = projectilesCodex.get(ProjectileIndex.POISON_ARROW);
            }
        }
        if (!projectile) {
            projectile = projectilesCodex.get(ProjectileIndex.ARROW);
        }
        return scaleProjectileByCharge(projectile, props?.charge);
    },
    fire(gameObject, target, props) {
        fireProjectile(this.attack(props) as Projectile, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.DAGGERS, {
    cooldown: 0.2,
    attack: () => meleeAttacksCodex.get(MeleeAttackIndex.DAGGER),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.BATTLE_HAMMER, {
    cooldown: 1.6,
    charge: 1.6,
    attack: (props) => scaleMeleeByCharge(meleeAttacksCodex.get(MeleeAttackIndex.BATTLE_HAMMER), props?.charge),
    fire(gameObject, target, props) {
        fireMelee(this.attack(props) as MeleeAttack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.ESSENCE_DRIPPED_DAGGER, {
    cooldown: 0.4,
    attack: () => ({
        ...meleeAttacksCodex.get(MeleeAttackIndex.DAGGER),
        damage: 16
    }),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.SLINGSHOT, {
    cooldown: 0.8,
    charge: 1.2,
    attack: (props) => scaleProjectileByCharge(projectilesCodex.get(ProjectileIndex.ROCK), props?.charge),
    fire(gameObject, target, props) {
        fireProjectile(this.attack(props) as Projectile, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.QUICK_BOW, {
    cooldown: 0.25,
    attack: () => ({
        ...projectilesCodex.get(ProjectileIndex.ARROW),
        damage: 6,
        knockback: 16,
        speed: 480,
    }),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
});

// Enemy attacks
weaponsCodex.set(WeaponIndex.ZOMBIE_ATTACK, {
    cooldown: 1,
    attack: () => ({
        ...meleeAttacksCodex.get(MeleeAttackIndex.BASIC),
        damage: 4,
    }),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.MINION_ATTACK, {
    cooldown: 0.7,
    attack: () => ({
        ...meleeAttacksCodex.get(MeleeAttackIndex.BASIC),
        damage: 2,
    }),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.REVENANT_EYE_ATTACK, {
    cooldown: 4,
    attack: () => projectilesCodex.get(ProjectileIndex.TEAR_DROP),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.SLIME_ATTACK, {
    cooldown: 2,
    attack: () => ({
        ...meleeAttacksCodex.get(MeleeAttackIndex.BASIC),
        damage: 1,
        knockback: 40,
    }),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.WRETCHED_SKELETON_ATTACK, {
    cooldown: 3.5,
    attack: () => ({
        ...projectilesCodex.get(ProjectileIndex.ARROW),
        chanceOfBreaking: 1,
        damage: 6,
    }),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.WRAITH_ATTACK, {
    cooldown: 2,
    attack: () => projectilesCodex.get(ProjectileIndex.WRAITH_ATTACK),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
});

export { WeaponIndex, weaponsCodex, fireProjectile, fireMelee };
export type { Weapon };