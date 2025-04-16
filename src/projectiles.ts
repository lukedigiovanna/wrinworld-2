import { ItemDropFactory, ProjectileFactory } from "./gameObjects";
import { GameObject } from "./gameObjects";
import { Vector, MathUtils, Color } from "./utils";
import { Item, ItemIndex, itemsCodex } from "./items";
import { Codex } from "./codex";
import { StatusEffectIndex } from "./statusEffects";
import { ComponentFactory } from "./components";
// For some webpack reason this needs to be a separate import or we get a bizzare error only detected upon javascript execution.
import { ParticleEmitter } from "./components/ParticleEmitter";

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
    ROOT_SNARE,
}

interface Projectile {
    // 0 to 1 - how good the projectile is at tracking the target. 0 is no homing, 1 is perfect homing
    homingSkill: number;
    // How many distinct mobs this projectile can hit
    maxHits: number;
    // How direction changes after a hit
    ricochetFactor: number;
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
    scale?: number;
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

    particleEmitter?: ComponentFactory,
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
projectilesCodex.set(ProjectileIndex.SHURIKEN, {
    homingSkill: 0,
    maxHits: 1,
    ricochetFactor: 0,
    spriteID: "shuriken",
    damage: 16,
    damageReductionPerHit: 0,
    knockback: 3,
    lifespan: 999,
    speed: 320,
    angularVelocity: 20,
    rotateToDirectionOfTarget: true,
    drag: 0,
    hitboxSize: new Vector(0.25, 0.25),
    colliderSize: new Vector(0.25, 0.25),
    chanceOfBreaking: 0.1,
    destroyOnPhysicalCollision: true,
    onDestroy(gameObject) {
        chanceDropItem(gameObject, itemsCodex[ItemIndex.SHURIKEN], this.chanceOfBreaking);
    },
});
projectilesCodex.set(ProjectileIndex.ARROW, {
    homingSkill: 0,
    maxHits: 10,
    ricochetFactor: 0,
    spriteID: "arrow",
    damage: 10,
    damageReductionPerHit: 0,
    knockback: 24,
    lifespan: 4,
    speed: 400,
    angularVelocity: 0,
    rotateToDirectionOfTarget: true,
    drag: 0.9,
    hitboxSize: new Vector(0.25, 0.25),
    colliderSize: new Vector(0.25, 0.25),
    chanceOfBreaking: 0.2,
    destroyOnPhysicalCollision: true,
    particleEmitter: ParticleEmitter(
        {
            spriteID: () => "square",
            rate: () => MathUtils.random(2, 6),
            rotation: () => MathUtils.randomAngle(),
            velocity: () => MathUtils.randomVector(MathUtils.random(24, 32)),
            lifetime: () => MathUtils.random(0.4, 0.6)
        }
    ),
    onDestroy(gameObject) {
        chanceDropItem(gameObject, itemsCodex[ItemIndex.ARROW], this.chanceOfBreaking);
    }
});
projectilesCodex.set(ProjectileIndex.POISON_ARROW, {
    homingSkill: 0,
    maxHits: 1,
    ricochetFactor: 0.2,
    spriteID: "poison_arrow",
    damage: 10,
    damageReductionPerHit: 0,
    knockback: 24,
    lifespan: 4,
    speed: 400,
    angularVelocity: 0,
    rotateToDirectionOfTarget: true,
    drag: 0.9,
    hitboxSize: new Vector(0.25, 0.25),
    colliderSize: new Vector(0.2, 0.2),
    chanceOfBreaking: 0.2,
    destroyOnPhysicalCollision: true,
    particleEmitter: ParticleEmitter(
        {
            spriteID: () => "square",
            color: () => Color.GREEN,
            rate: () => MathUtils.random(2, 6),
            rotation: () => MathUtils.randomAngle(),
            velocity: () => MathUtils.randomVector(MathUtils.random(24, 32)),
            lifetime: () => MathUtils.random(0.4, 0.6)
        }
    ),
    onDestroy(gameObject) {
        chanceDropItem(gameObject, itemsCodex[ItemIndex.POISON_ARROW], this.chanceOfBreaking);
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
    ricochetFactor: 0,
    spriteID: "tear_drop",
    damage: 4,
    damageReductionPerHit: 0,
    knockback: 4,
    lifespan: 4,
    speed: 148,
    angularVelocity: 0,
    rotateToDirectionOfTarget: false,
    drag: 0,
    colliderSize: new Vector(0.3, 0.3),
    destroyOnPhysicalCollision: true,
    particleEmitter: ParticleEmitter(
        {
            spriteID: () => "square",
            color: () => {
                const f = MathUtils.random(0.3, 0.6);
                return new Color(f, f, f + 0.4, 1);
            },
            rate: () => 0,
            scale: () => MathUtils.random(1, 2),
            rotation: () => MathUtils.randomAngle(),
            velocity: () => MathUtils.randomVector(MathUtils.random(4, 32)),
            lifetime: () => MathUtils.random(0.4, 0.6)
        },
        "explosion"
    ),
    onDestroy(gameObject) {
        for (let i = 0; i < 35; i++)
            gameObject.getComponent("particle-emitter-explosion").data.emit();
    },
});
projectilesCodex.set(ProjectileIndex.WRAITH_ATTACK, {
    homingSkill: 0,
    maxHits: 1,
    ricochetFactor: 0,
    spriteID: "wraith_attack",
    damage: 8,
    damageReductionPerHit: 0,
    knockback: 2,
    lifespan: 4,
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
    ricochetFactor: 0,
    spriteID: "rock",
    damage: 6,
    damageReductionPerHit: 0,
    knockback: 1,
    lifespan: 4,
    speed: 256,
    rotateToDirectionOfTarget: true,
    drag: 0,
    angularVelocity: 5,
    colliderSize: new Vector(0.25, 0.25),
    destroyOnPhysicalCollision: true,
    particleEmitter: ParticleEmitter(
        {
            spriteID: () => "square",
            color: () => {
                const f = MathUtils.random(0.3, 0.6);
                return new Color(f, f, f, 1);
            },
            rate: () => 0,
            scale: () => MathUtils.random(1, 2),
            rotation: () => MathUtils.randomAngle(),
            velocity: () => MathUtils.randomVector(MathUtils.random(4, 32)),
            lifetime: () => MathUtils.random(0.4, 0.6)
        },
        "explosion"
    ),
    onDestroy(gameObject) {
        for (let i = 0; i < 35; i++)
            gameObject.getComponent("particle-emitter-explosion").data.emit();
    },
});
projectilesCodex.set(ProjectileIndex.CRYSTAL_BOMB, {
    homingSkill: 0,
    maxHits: 999,
    ricochetFactor: 0,
    spriteID: "crystal_bomb",
    damage: 0,
    damageReductionPerHit: 0,
    knockback: 0,
    lifespan: 5,
    speed: 160,
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
            projectile.speed += MathUtils.random(-40, 40);
            projectile.angularVelocity += MathUtils.random(-10, 10);
            // projectile.size += MathUtils.random(-0.1, 0.1);
            const shard = ProjectileFactory(projectile, owner, gameObject.position, target);
            gameObject.game.addGameObject(shard);
        }
    },
});
projectilesCodex.set(ProjectileIndex.CRYSTAL_SHARD, {
    homingSkill: 0,
    maxHits: 3,
    ricochetFactor: 0.1,
    spriteID: "crystal_shard",
    damage: 8,
    damageReductionPerHit: 0.2,
    knockback: 0.4,
    lifespan: 3,
    speed: 160,
    angularVelocity: 0,
    rotateToDirectionOfTarget: true,
    drag: 0,
    destroyOnPhysicalCollision: true,
});
projectilesCodex.set(ProjectileIndex.ROOT_SNARE, {
    homingSkill: 0,
    maxHits: 1,
    ricochetFactor: 0,
    spriteID: "root_snare",
    damage: 5,
    damageReductionPerHit: 0,
    knockback: 0,
    lifespan: 3,
    speed: 160,
    angularVelocity: 0,
    rotateToDirectionOfTarget: false,
    drag: 1.2,
    destroyOnPhysicalCollision: false,
    onHit(hit) {
        if (hit.hasComponent("status-effect-manager")) {
            hit.getComponent("status-effect-manager").data.applyEffect(StatusEffectIndex.ROOT_SNARE, 1, 5);
        }
    },
});

export { ProjectileIndex, projectilesCodex };
export type { Projectile };
