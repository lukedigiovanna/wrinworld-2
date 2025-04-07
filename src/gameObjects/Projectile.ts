import { GameObject, GameObjectFactory, Team } from "./index";
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
    const scale = properties.scale ? properties.scale : 1;
    projectile.scale.setComponents(
        sprite.width * scale, sprite.height * scale
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
                if (collision.team !== Team.UNTEAMED && 
                    data.owner.team !== collision.team) {
                    const health = collision.getComponent("health");
                    health.data.damage(properties.damage);
                    const physics = collision.getComponent("physics");
                    physics.data.impulse.set(
                        Vector.scaled(
                            Vector.normalized(
                                data.physics.data.velocity
                            ), 
                            properties.knockback
                        )
                    );
                    if (properties.onHit) {
                        properties.onHit(collision);
                    }
                    data.hitCount++;
                    properties.damage *= (1 - properties.damageReductionPerHit);
                    properties.knockback *= (1 - properties.damageReductionPerHit);
                    if (data.hitCount >= properties.maxHits) {
                        gameObject.destroy();
                    }
                }
            },
            onPhysicalCollision(collision, isTile) {
                if (properties.destroyOnPhysicalCollision) {
                    gameObject.destroy();
                }
            },
            destroy() {
                if (properties.onDestroy) {
                    properties.onDestroy(gameObject);
                }
            },
            data
        }
    });
    
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
        hitbox.data.boxOffset.set(Vector.multiply(properties.hitboxOffset, projectile.scale));
    }
    if (properties.hitboxSize) {
        hitbox.data.boxSize.set(Vector.multiply(properties.hitboxSize, projectile.scale));
    }
    
    const collider = projectile.addComponent(PhysicalCollider);
    collider.data?.ignoreCollisionWith.add("player");
    collider.data?.ignoreCollisionWith.add("enemy");
    collider.data?.ignoreCollisionWith.add("projectile");
    if (properties.colliderOffset) {
        collider.data.boxOffset.set(Vector.multiply(properties.colliderOffset, projectile.scale));
    }
    if (properties.colliderSize) {
        collider.data.boxSize.set(Vector.multiply(properties.colliderSize, projectile.scale));
    }
    
    physics.data.angularVelocity = properties.angularVelocity;
    if (properties.rotateToDirectionOfTarget) {
        projectile.rotation = physics.data.velocity.angle;
    }
    physics.data.drag = properties.drag;

    projectile.tag = "projectile";

    return projectile;
}

export { ProjectileFactory };
