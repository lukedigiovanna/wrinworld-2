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
    maxCharge?: number;
    chargeable: boolean;
    attack: (props?: AttackProperties) => MeleeAttack | Projectile;
    fire: WeaponFireFunction;
}

enum WeaponIndex {
    ZOMBIE_BRAINS,

    BROAD_SWORD,
    DAGGERS,
    BATTLE_HAMMER,
    ESSENCE_DRIPPED_DAGGER,
    SHURIKEN,
    BOW,
    SLINGSHOT,
    QUICK_BOW,
    CRYSTAL_BOMB,

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

const weaponsCodex = new Codex<WeaponIndex, Weapon>();
weaponsCodex.set(WeaponIndex.BROAD_SWORD, {
    cooldown: 0.5,
    chargeable: false,
    attack: () => meleeAttacksCodex.get(MeleeAttackIndex.BROAD_SWORD),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.ZOMBIE_BRAINS, {
    cooldown: 6,
    chargeable: false,
    attack: () => projectilesCodex.get(ProjectileIndex.ZOMBIE_BRAINS),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.SHURIKEN, {
    cooldown: 0.25,
    chargeable: false,
    attack: () => projectilesCodex.get(ProjectileIndex.SHURIKEN),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.BOW, {
    cooldown: 0.5,
    maxCharge: 1.2,
    chargeable: true,
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
        return {
            ...projectile,
            speed: projectile.speed * (props?.charge ? props.charge : 1), 
        };
    },
    fire(gameObject, target, props) {
        fireProjectile(this.attack(props) as Projectile, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.DAGGERS, {
    cooldown: 0.2,
    chargeable: false,
    attack: () => meleeAttacksCodex.get(MeleeAttackIndex.DAGGER),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.BATTLE_HAMMER, {
    cooldown: 1.6,
    maxCharge: 1.6,
    chargeable: true,
    attack: () => meleeAttacksCodex.get(MeleeAttackIndex.BATTLE_HAMMER),
    fire(gameObject, target) {
        fireMelee(this.attack() as MeleeAttack, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.ESSENCE_DRIPPED_DAGGER, {
    cooldown: 0.4,
    chargeable: false,
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
    chargeable: true,
    maxCharge: 1.2,
    attack: () => projectilesCodex.get(ProjectileIndex.ROCK),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.QUICK_BOW, {
    cooldown: 0.25,
    chargeable: false,
    attack: () => ({
        ...projectilesCodex.get(ProjectileIndex.ARROW),
        damage: 4,
        knockback: 2,
        speed: 20,
    }),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.CRYSTAL_BOMB, {
    cooldown: 1,
    chargeable: true,
    maxCharge: 2,
    attack: () => projectilesCodex.get(ProjectileIndex.CRYSTAL_BOMB),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
})

// Enemy attacks
weaponsCodex.set(WeaponIndex.ZOMBIE_ATTACK, {
    cooldown: 1,
    chargeable: false,
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
    chargeable: false,
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
    chargeable: false,
    attack: () => projectilesCodex.get(ProjectileIndex.TEAR_DROP),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
});
weaponsCodex.set(WeaponIndex.SLIME_ATTACK, {
    cooldown: 2,
    chargeable: false,
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
    chargeable: false,
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
    chargeable: false,
    attack: () => projectilesCodex.get(ProjectileIndex.WRAITH_ATTACK),
    fire(gameObject, target) {
        fireProjectile(this.attack() as Projectile, gameObject, target);
    }
});

export { WeaponIndex, weaponsCodex };
export type { Weapon };