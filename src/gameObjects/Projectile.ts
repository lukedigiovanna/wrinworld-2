import { GameObject, GameObjectFactory } from "./index";
import { Vector, MathUtils } from "../utils";
import { Hitbox, Physics, ParticleEmitter, PhysicalCollider } from "../components";
import { spriteRenderer } from "../renderers";
import { Projectile } from "../projectiles";
import { getImage } from "../imageLoader";

const ProjectileFactory: GameObjectFactory = (properties: Projectile, owner: GameObject, position: Vector, target: Vector) => {
    properties = {...properties};

    const projectile = new GameObject();
    projectile.position = position.copy();
    
    const sprite = getImage(properties.spriteID);
    projectile.scale.setComponents(
        properties.size, sprite.height / sprite.width * properties.size
    );
    
    projectile.lifespan = properties.lifespan;

    projectile.renderer = spriteRenderer(properties.spriteID);

    projectile.addComponent((gameObject: GameObject) => {
        const data: any = {
            owner,
            physics: undefined,
            hitCount: 0
        };
        return {
            id: "projectile",
            start() {
                data.physics = gameObject.getComponent("physics");
            },
            onHitboxCollisionEnter(collision) {
                if (collision.tag === "portal" || collision.tag ===  "enemy") {
                    const health = collision.getComponent("health");
                    if (health) {
                        health.data.damage(properties.damage);
                    }
                    const physics = collision.getComponent("physics");
                    if (physics) {
                        physics.data.impulse.set(
                            Vector.scaled(
                                Vector.normalized(
                                    data.physics.data.velocity
                                ), 
                                properties.knockback
                            )
                        );
                    }
                    data.hitCount++;
                    properties.damage *= properties.damageReductionPerHit;
                    properties.knockback *= properties.damageReductionPerHit;
                    if (data.hitCount >= properties.maxHits) {
                        if (properties.onDestroy) {
                            properties.onDestroy(gameObject);
                        }
                        gameObject.destroy();
                    }
                }
            },
            onPhysicalCollision(collision, isTile) {
                if (properties.onDestroy) {
                    properties.onDestroy(gameObject);
                }
                gameObject.destroy();
            },
            data
        }
    });

    // projectile.addComponent(ParticleEmitter({
    //     spriteID: () => "spark",
    //     rate: () => 25,
    //     size: () => new Vector(0.7, 0.7),
    //     rotation: () => MathUtils.random(0, Math.PI * 2),
    //     velocity: () => MathUtils.randomVector(MathUtils.random(0.5, 1.2)),
    //     angularVelocity: () => MathUtils.random(-4, 4),
    //     lifetime: () => MathUtils.random(0.1, 0.5)
    // }, "sparks"));

    // projectile.addComponent(ParticleEmitter({
    //     spriteID: () => MathUtils.randomChoice(["smoke", "spark"]),
    //     rate: () => 0,
    //     size: () => new Vector(0.5, 0.5),
    //     rotation: () => MathUtils.random(0, 2 * Math.PI),
    //     velocity: () => MathUtils.randomVector(MathUtils.random(0.2, 2.0)),
    //     lifetime: () => MathUtils.random(0.4, 0.8),
    //     spawnBoxSize: () => Vector.zero()
    // }, "explosion"));
    
    const physics = projectile.addComponent(Physics);
    physics.data.velocity.set(
        Vector.scaled(
            Vector.normalized(
                Vector.subtract(target, position)
            ),
            properties.speed
        )
    );

    const hitbox = projectile.addComponent(Hitbox);
    if (properties.hitboxOffset) {
        hitbox.data.boxOffset.set(properties.hitboxOffset);
    }
    if (properties.hitboxSize) {
        hitbox.data.boxSize.set(properties.hitboxSize);
    }
    
    const collider = projectile.addComponent(PhysicalCollider);
    collider.data?.ignoreCollisionWith.add("player");
    collider.data?.ignoreCollisionWith.add("enemy");
    if (properties.colliderOffset) {
        collider.data.boxOffset.set(properties.colliderOffset);
    }
    if (properties.colliderSize) {
        collider.data.boxSize.set(properties.colliderSize);
    }
    
    physics.data.angularVelocity = properties.angularVelocity;
    projectile.rotation = physics.data.velocity.angle;

    projectile.tag = "projectile";

    return projectile;
}

export { ProjectileFactory };
