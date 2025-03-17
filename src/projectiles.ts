import { ItemDropFactory, ProjectileFactory } from "./gameObjects";
import { GameObject } from "./gameObjects";
import { Vector, MathUtils } from "./utils";
import { Item, ItemIndex, itemsCodex } from "./items";
import { Codex } from "./codex";
import { StatusEffectIndex } from "./statusEffects";

enum ProjectileIndex {
    ZOMBIE_BRAINS,
    SHURIKEN,
    ARROW,
    POISON_ARROW,
    TEAR_DROP,
    WRAITH_ATTACK,
    ROCK,
    CRYSTAL_BOMB,
    CRYSTAL_SHARD,
}

interface Projectile {
    // 0 to 1 - how good the projectile is at tracking the target. 0 is no homing, 1 is perfect homing
    homingSkill: number;
    // How many distinct mobs this projectile can hit
    maxHits: number;
    // The sprite this projectile should represent as (invisible if undefined)
    spriteID: string;
    // Amount of HP to deal upon hit
    damage: number;
    // Amount to reduce the damage of this projectile by per hit when the maxHits > 1
    damageReductionPerHit: number;
    // How much knockback force to apply
    knockback: number;
    // How long until the projectile should self-destruct
    lifespan: number;
    // How large the projectile is -- scales to the aspect ratio of the sprite
    // or is the width/height is no sprite is attached.
    size: number;
    // how fast the projectile should go
    speed: number;
    // how fast the projectile should rotate
    angularVelocity: number;
    // Whether this projectile should set its rotation to the direction of the target on instantiation
    rotateToDirectionOfTarget: boolean;
    // The rate at which "drag" is applied, 0 is none.
    drag: number;
    // Whether or not we should destroy when hitting a prop (like a wall or tree)
    destroyOnPhysicalCollision: boolean;
    // hitbox properties (optional... defaults to size of projectile)
    hitboxOffset?: Vector,
    hitboxSize?: Vector,
    // collider properties (optional... defaults to size of projectile)
    colliderOffset?: Vector,
    colliderSize?: Vector,


    chanceOfBreaking?: number;
    // Any logic that should happen when this object dies (including after lifespan)
    onDestroy?: (gameObject: GameObject) => void;
    // Any additional logic that happens to a thing this projectile hits
    onHit?: (hit: GameObject) => void;
}

function chanceDropItem(gameObject: GameObject, item: Item, chanceOfBreaking: number | undefined) {
    const chance = chanceOfBreaking ? chanceOfBreaking as number : 1;
    if (Math.random() > chance) {
        gameObject.game.addGameObject(
            ItemDropFactory(item, gameObject.position)
        );
    }
}

const projectilesCodex = new Codex<ProjectileIndex, Projectile>();
projectilesCodex.set(ProjectileIndex.ZOMBIE_BRAINS, {
    homingSkill: 0,
    maxHits: 1,
    spriteID: "zombie_brains",
    damage: 1,
    damageReductionPerHit: 0,
    knockback: 3,
    lifespan: 10,
    size: 0.8,
    speed: 6,
    angularVelocity: 6,
    rotateToDirectionOfTarget: true,
    drag: 0,
    hitboxSize: new Vector(0.25, 0.25),
    colliderOffset: new Vector(0.25, 0),
    colliderSize: new Vector(0.5, 0.5),
    destroyOnPhysicalCollision: true,
    onDestroy(gameObject) {
        // chanceDropItem(gameObject, itemsCodex.get(ItemIndex.ZOMBIE_BRAINS), this.chanceOfBreaking);
    }
});
projectilesCodex.set(ProjectileIndex.SHURIKEN, {
    homingSkill: 0,
    maxHits: 1,
    spriteID: "shuriken",
    damage: 16,
    damageReductionPerHit: 0,
    knockback: 3,
    lifespan: 999,
    size: 0.5,
    speed: 20,
    angularVelocity: 20,
    rotateToDirectionOfTarget: true,
    drag: 0,
    hitboxSize: new Vector(0.25, 0.25),
    colliderSize: new Vector(0.25, 0.25),
    chanceOfBreaking: 0.1,
    destroyOnPhysicalCollision: true,
    onDestroy(gameObject) {
        chanceDropItem(gameObject, itemsCodex.get(ItemIndex.SHURIKEN), this.chanceOfBreaking);
    },
});
projectilesCodex.set(ProjectileIndex.ARROW, {
    homingSkill: 0,
    maxHits: 10,
    spriteID: "arrow",
    damage: 8,
    damageReductionPerHit: 0,
    knockback: 3,
    lifespan: 4,
    size: 1,
    speed: 16,
    angularVelocity: 0,
    rotateToDirectionOfTarget: true,
    drag: 0.2,
    hitboxSize: new Vector(0.25, 0.25),
    colliderSize: new Vector(0.2, 0.2),
    chanceOfBreaking: 0.2,
    destroyOnPhysicalCollision: true,
    onDestroy(gameObject) {
        chanceDropItem(gameObject, itemsCodex.get(ItemIndex.ARROW), this.chanceOfBreaking);
    }
});
projectilesCodex.set(ProjectileIndex.POISON_ARROW, {
    homingSkill: 0,
    maxHits: 10,
    spriteID: "poison_arrow",
    damage: 8,
    damageReductionPerHit: 0,
    knockback: 3,
    lifespan: 4,
    size: 1,
    speed: 16,
    angularVelocity: 0,
    rotateToDirectionOfTarget: true,
    drag: 0.2,
    hitboxSize: new Vector(0.25, 0.25),
    colliderSize: new Vector(0.2, 0.2),
    chanceOfBreaking: 0.2,
    destroyOnPhysicalCollision: true,
    onDestroy(gameObject) {
        chanceDropItem(gameObject, itemsCodex.get(ItemIndex.POISON_ARROW), this.chanceOfBreaking);
    },
    onHit(hit) {
        if (hit.hasComponent("status-effect-manager")) {
            hit.getComponent("status-effect-manager").data.applyEffect(StatusEffectIndex.POISON, 1, 5);
        }
    },
})
projectilesCodex.set(ProjectileIndex.TEAR_DROP, {
    homingSkill: 0,
    maxHits: 1,
    spriteID: "tear_drop",
    damage: 4,
    damageReductionPerHit: 0,
    knockback: 4,
    lifespan: 4,
    size: 0.4,
    speed: 7,
    angularVelocity: 0,
    rotateToDirectionOfTarget: false,
    drag: 0,
    colliderSize: new Vector(0.3, 0.3),
    destroyOnPhysicalCollision: true,
});
projectilesCodex.set(ProjectileIndex.WRAITH_ATTACK, {
    homingSkill: 0,
    maxHits: 1,
    spriteID: "wraith_attack",
    damage: 8,
    damageReductionPerHit: 0,
    knockback: 2,
    lifespan: 4,
    size: 0.5,
    speed: 9,
    angularVelocity: 0,
    rotateToDirectionOfTarget: true,
    drag: 0,
    colliderSize: new Vector(0.3, 0.3),
    destroyOnPhysicalCollision: true,
});
projectilesCodex.set(ProjectileIndex.ROCK, {
    homingSkill: 0,
    maxHits: 1,
    spriteID: "rock",
    damage: 4,
    damageReductionPerHit: 0,
    knockback: 1,
    lifespan: 4,
    size: 0.5,
    speed: 16,
    rotateToDirectionOfTarget: true,
    drag: 0,
    angularVelocity: 5,
    colliderSize: new Vector(0.25, 0.25),
    destroyOnPhysicalCollision: true,
});
projectilesCodex.set(ProjectileIndex.CRYSTAL_BOMB, {
    homingSkill: 0,
    maxHits: 999,
    spriteID: "crystal_bomb",
    damage: 0,
    damageReductionPerHit: 0,
    knockback: 0,
    lifespan: 5,
    size: 1,
    speed: 10,
    angularVelocity: 0,
    rotateToDirectionOfTarget: false,
    drag: 1.5,
    colliderSize: new Vector(1, 1),
    destroyOnPhysicalCollision: false,
    onDestroy(gameObject) {
        const owner = gameObject.getComponent("projectile").data.owner;
        for (let i = 0; i < 50; i++) {
            const target = Vector.add(gameObject.position, MathUtils.randomVector(1));
            const projectile = {...projectilesCodex.get(ProjectileIndex.CRYSTAL_SHARD)};
            projectile.speed += MathUtils.random(-5, 5);
            projectile.angularVelocity += MathUtils.random(-10, 10);
            projectile.size += MathUtils.random(-0.1, 0.1);
            const shard = ProjectileFactory(projectile, owner, gameObject.position, target);
            gameObject.game.addGameObject(shard);
        }
    },
});
projectilesCodex.set(ProjectileIndex.CRYSTAL_SHARD, {
    homingSkill: 0,
    maxHits: 3,
    spriteID: "crystal_shard",
    damage: 8,
    damageReductionPerHit: 0.2,
    knockback: 0.4,
    lifespan: 3,
    size: 0.25,
    speed: 10,
    angularVelocity: 0,
    rotateToDirectionOfTarget: true,
    drag: 0,
    destroyOnPhysicalCollision: true,
});

export { ProjectileIndex, projectilesCodex };
export type { Projectile };
