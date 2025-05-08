import { GameObject, ItemDropFactory, ProjectileFactory, Team } from "../gameObjects";
import { Vector, MathUtils, Color } from "../utils";
import { Item, ItemIndex, itemsCodex } from "./items";
import { StatusEffectIndex } from "./statusEffects";
import { ComponentFactory } from "../components";
// Own import to avoid circular dependency error in webpack.
import { ParticleEmitter } from "../components/ParticleEmitter";

enum ProjectileIndex {
    SHURIKEN,
    ARROW,
    GHOST_ARROW,
    POISON_ARROW,
    FLAME_ARROW,
    RICOCHET_ARROW,
    TEAR_DROP,
    WRAITH_ATTACK,
    ROCK,
    CRYSTAL_BOMB,
    CRYSTAL_SHARD,
    ROOT_SNARE,
    BOOMERANG,
    RICOCHET_BOOMERANG,
    FLOWER_POWER_PETAL,
    PLAYING_CARD,
    DOVE,
    RUBBER_CHICKEN,
    WATER_DROP,
    POP_QUIZ,
}

interface Projectile {
    // how good the projectile is at tracking the target. higher number is better homing
    homingSkill: number;
    // How many distinct mobs this projectile can hit
    maxHits: number;
    // How direction changes after a hit
    ricochetFactor: number;
    // The sprite this projectile should represent as (invisible if undefined)
    spriteID: string;
    // Optional color scale
    color?: Color;
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
    // Any additional logic for this projectile
    update?: (gameObject: GameObject, data: any, dt: number) => void;
    // Any logic that should happen when this object dies (including after lifespan)
    onDestroy?: (gameObject: GameObject) => void;
    // Any additional logic that happens to a thing this projectile hits
    onHit?: (gameObject: GameObject, data: any, hit: GameObject) => void;
}

function chanceDropItem(gameObject: GameObject, item: Item, chanceOfBreaking: number | undefined) {
    const chance = chanceOfBreaking ?? 1;
    if (Math.random() > chance) {
        gameObject.game.addGameObject(
            ItemDropFactory(item, gameObject.position)
        );
    }
}

const projectilesCodex: Record<ProjectileIndex, Projectile> = {
[ProjectileIndex.SHURIKEN]: {
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
},
[ProjectileIndex.ARROW]: {
    homingSkill: 0,
    maxHits: 1,
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
},
[ProjectileIndex.POISON_ARROW]: {
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
    onHit(gameObject, owner, hit) {
        if (hit.hasComponent("status-effect-manager")) {
            hit.getComponent("status-effect-manager").data.applyEffect(StatusEffectIndex.POISON, 1, 5);
        }
    },
},
[ProjectileIndex.FLAME_ARROW]: {
    homingSkill: 0,
    maxHits: 1,
    ricochetFactor: 0.0,
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
    colliderSize: new Vector(0.2, 0.2),
    chanceOfBreaking: 0.2,
    destroyOnPhysicalCollision: true,
    particleEmitter: ParticleEmitter(
        {
            spriteID: () => "flame_particle",
            rate: () => MathUtils.random(2, 6),
            velocity: () => MathUtils.randomVector(MathUtils.random(24, 32)),
            lifetime: () => MathUtils.random(0.4, 0.6)
        }
    ),
    onDestroy(gameObject) {
        chanceDropItem(gameObject, itemsCodex[ItemIndex.FLAME_ARROW], this.chanceOfBreaking);
    },
    onHit(gameObject, owner, hit) {
        if (hit.hasComponent("status-effect-manager")) {
            hit.getComponent("status-effect-manager").data.applyEffect(StatusEffectIndex.FLAME, 1, 5);
        }
    },
},
[ProjectileIndex.GHOST_ARROW]: {
    homingSkill: 0.5,
    maxHits: 4,
    ricochetFactor: 0,
    spriteID: "arrow",
    damage: 6,
    damageReductionPerHit: 0.4,
    color: new Color(0.5, 1, 1, 0.8),
    knockback: 0,
    lifespan: 4,
    speed: 400,
    angularVelocity: 0,
    rotateToDirectionOfTarget: true,
    drag: 0.9,
    hitboxSize: new Vector(0.25, 0.25),
    colliderSize: new Vector(0, 0),
    destroyOnPhysicalCollision: false,
    particleEmitter: ParticleEmitter(
        {
            spriteID: () => "square",
            rate: () => MathUtils.random(2, 6),
            rotation: () => MathUtils.randomAngle(),
            velocity: () => MathUtils.randomVector(MathUtils.random(24, 32)),
            lifetime: () => MathUtils.random(0.4, 0.6),
            color: () => Color.CYAN,
        }
    ),
},
[ProjectileIndex.RICOCHET_ARROW]: {
    homingSkill: 0,
    maxHits: 3,
    ricochetFactor: 0.0,
    spriteID: "ricochet_arrow",
    damage: 10,
    damageReductionPerHit: 0.2,
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
            color: () => new Color(0.8, 0.2, 0.2, 1.0),
            rate: () => MathUtils.random(2, 6),
            rotation: () => MathUtils.randomAngle(),
            velocity: () => MathUtils.randomVector(MathUtils.random(24, 32)),
            lifetime: () => MathUtils.random(0.4, 0.6)
        }
    ),
    onDestroy(gameObject) {
        chanceDropItem(gameObject, itemsCodex[ItemIndex.ARROW], this.chanceOfBreaking);
    },
    onHit(gameObject, data, hit) {
        const physics = gameObject.getComponent("physics");
        const nearestEnemy = gameObject.game.getNearestGameObjectWithFilter(
            gameObject.position, 
            (obj) => hit !== obj && obj.team !== Team.UNTEAMED && obj.team !== data.owner.team
        );
        if (nearestEnemy !== undefined && nearestEnemy.distance < 144) {
            physics.data.velocity = gameObject.position
                                    .directionTowards(nearestEnemy.object.position)
                                    .normalized()
                                    .scaled(physics.data.velocity.magnitude);
        }
    },
},
[ProjectileIndex.TEAR_DROP]: {
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
    onDestroy(gameObject) {
        gameObject.game.addParticleExplosion(gameObject.position, new Color(0.4, 0.4, 0.8, 1), 32, 32);
    },
},
[ProjectileIndex.WRAITH_ATTACK]: {
    homingSkill: 0,
    maxHits: 1,
    ricochetFactor: 0,
    spriteID: "wraith_attack",
    damage: 8,
    damageReductionPerHit: 0,
    knockback: 32,
    lifespan: 4,
    speed: 180,
    angularVelocity: 0,
    rotateToDirectionOfTarget: true,
    drag: 0,
    colliderSize: new Vector(0.3, 0.3),
    destroyOnPhysicalCollision: true,
    onDestroy(gameObject) {
        gameObject.game.addParticleExplosion(gameObject.position, new Color(0.1, 0.1, 0.1, 1), 32, 32);
    }
},
[ProjectileIndex.ROCK]: {
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
    onDestroy(gameObject) {
        gameObject.game.addParticleExplosion(gameObject.position, new Color(0.4, 0.4, 0.4, 1.0), 32, 32);
    },
},
[ProjectileIndex.CRYSTAL_BOMB]: {
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
            const projectile = {...projectilesCodex[ProjectileIndex.CRYSTAL_SHARD]};
            projectile.speed += MathUtils.random(-40, 40);
            projectile.angularVelocity += MathUtils.random(-10, 10);
            // projectile.size += MathUtils.random(-0.1, 0.1);
            const shard = ProjectileFactory(projectile, owner, gameObject.position, target);
            gameObject.game.addGameObject(shard);
        }
    },
},
[ProjectileIndex.CRYSTAL_SHARD]: {
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
},
[ProjectileIndex.ROOT_SNARE]: {
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
    onHit(gameObject, owner, hit) {
        if (hit.hasComponent("status-effect-manager")) {
            hit.getComponent("status-effect-manager").data.applyEffect(StatusEffectIndex.ROOT_SNARE, 1, 5);
        }
    },
},
[ProjectileIndex.BOOMERANG]: {
    homingSkill: 0,
    maxHits: 999,
    ricochetFactor: 0,
    spriteID: "boomerang",
    damage: 10,
    damageReductionPerHit: 0.2,
    knockback: 0,
    lifespan: 6,
    speed: 160,
    angularVelocity: 16,
    rotateToDirectionOfTarget: false,
    drag: 0,
    destroyOnPhysicalCollision: true,
    update(gameObject, data, dt) {
        if (gameObject.age > 0.2 && gameObject.position.distanceTo(data.owner.position) < 16) {
            gameObject.destroy();
        }
        else {
            const physics = gameObject.getComponent("physics");
            const pull = gameObject.position
                            .directionTowards(data.owner.position)
                            .normalized().scaled(128 * dt);
            physics.data.velocity.add(pull);
        }
    },
    onDestroy(gameObject) {
        chanceDropItem(gameObject, itemsCodex[ItemIndex.BOOMERANG], 0);
    },
},
[ProjectileIndex.RICOCHET_BOOMERANG]: {
    homingSkill: 0,
    maxHits: 999,
    ricochetFactor: 0,
    spriteID: "ricochet_boomerang",
    damage: 10,
    damageReductionPerHit: 0.2,
    knockback: 0,
    lifespan: 6,
    speed: 160,
    angularVelocity: 16,
    rotateToDirectionOfTarget: false,
    drag: 0,
    destroyOnPhysicalCollision: true,
    update(gameObject, data, dt) {
        if (gameObject.age > 0.2 && gameObject.position.distanceTo(data.owner.position) < 16) {
            gameObject.destroy();
        }
    },
    onDestroy(gameObject) {
        chanceDropItem(gameObject, itemsCodex[ItemIndex.RICOCHET_BOOMERANG], 0);
    },
    onHit(gameObject, data, hit) {
        const physics = gameObject.getComponent("physics");
        let target = data.owner.position;
        if (data.hitCount < 3) {
            const nearestEnemy = gameObject.game.getNearestGameObjectWithFilter(
                gameObject.position, 
                (obj) => hit !== obj && obj.team !== Team.UNTEAMED && obj.team !== data.owner.team
            );
            if (nearestEnemy !== undefined && nearestEnemy.distance < 144) {
                target = nearestEnemy.object.position;
            }
        }
        physics.data.velocity = gameObject.position
                                        .directionTowards(target)
                                        .normalized()
                                        .scaled(physics.data.velocity.magnitude);
    },
},
[ProjectileIndex.FLOWER_POWER_PETAL]: {
    homingSkill: 4,
    maxHits: 1,
    ricochetFactor: 0,
    spriteID: "flower_power_petal",
    damage: 8,
    damageReductionPerHit: 0.0,
    knockback: 32,
    lifespan: 6,
    speed: 160,
    angularVelocity: 0,
    rotateToDirectionOfTarget: true,
    drag: 0,
    destroyOnPhysicalCollision: true,
},
[ProjectileIndex.PLAYING_CARD]: {
    homingSkill: 0,
    maxHits: 1,
    ricochetFactor: 0,
    spriteID: "playing_card",
    damage: 3,
    damageReductionPerHit: 0,
    knockback: 24,
    lifespan: 4,
    speed: 260,
    angularVelocity: 12,
    rotateToDirectionOfTarget: false,
    drag: 0,
    destroyOnPhysicalCollision: true,
},
[ProjectileIndex.DOVE]: {
    homingSkill: 0.75,
    maxHits: 1,
    ricochetFactor: 0,
    spriteID: "dove",
    damage: 2,
    damageReductionPerHit: 0,
    knockback: 24,
    lifespan: 4,
    speed: 200,
    angularVelocity: 0,
    rotateToDirectionOfTarget: true,
    drag: 0,
    destroyOnPhysicalCollision: true,
},
[ProjectileIndex.RUBBER_CHICKEN]: {
    homingSkill: 0,
    maxHits: 1,
    ricochetFactor: 0,
    spriteID: "rubber_chicken",
    damage: 1,
    damageReductionPerHit: 0,
    knockback: 120,
    lifespan: 4,
    speed: 200,
    angularVelocity: 3,
    rotateToDirectionOfTarget: false,
    drag: 0,
    destroyOnPhysicalCollision: true,
},
[ProjectileIndex.WATER_DROP]: {
    homingSkill: 0,
    maxHits: 1,
    ricochetFactor: 0,
    spriteID: "water_drop",
    damage: 2,
    damageReductionPerHit: 0,
    knockback: 20,
    lifespan: 4,
    speed: 180,
    angularVelocity: 3,
    rotateToDirectionOfTarget: false,
    drag: 0.2,
    destroyOnPhysicalCollision: true,
    particleEmitter: ParticleEmitter(
        {
            spriteID: () => "square",
            rate: () => MathUtils.random(8, 15),
            rotation: () => MathUtils.randomAngle(),
            velocity: () => MathUtils.randomVector(MathUtils.random(24, 32)),
            lifetime: () => MathUtils.random(0.4, 0.6),
            color: () => Color.CYAN,
        }
    ),
    onDestroy(gameObject) {
        gameObject.game.addParticleExplosion(gameObject.position, Color.hex("#87ecff"), 12, 24);
    },
},
[ProjectileIndex.POP_QUIZ]: {
    homingSkill: 0.1,
    maxHits: 1,
    ricochetFactor: 0,
    spriteID: "pop_quiz",
    damage: 10,
    damageReductionPerHit: 0,
    knockback: 50,
    lifespan: 4,
    speed: 200,
    angularVelocity: 3,
    rotateToDirectionOfTarget: false,
    drag: 0.3,
    destroyOnPhysicalCollision: true,
}
}

export { ProjectileIndex, projectilesCodex };
export type { Projectile };
