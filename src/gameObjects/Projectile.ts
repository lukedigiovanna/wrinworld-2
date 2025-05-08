import { GameObject, GameObjectFactory, Team } from "./index";
import { MathUtils, Vector, Color } from "../utils";
import { Hitbox, Physics, PhysicalCollider } from "../components";
import { spriteRenderer } from "../rendering/renderers";
import { Projectile } from "../game/projectiles";
import { getTexture } from "../assets/imageLoader";

const ProjectileFactory: GameObjectFactory = (properties: Projectile, owner: GameObject, position: Vector, target: Vector) => {
    properties = {...properties};

    const projectile = new GameObject();
    projectile.position = position.copy();
    
    const sprite = getTexture(properties.spriteID);
    const scale = properties.scale ?? 1;
    projectile.scale.setComponents(
        sprite.width * scale, sprite.height * scale
    );
    projectile.color = properties.color ?? Color.WHITE;
    
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
            update(dt) {
                if (properties.rotateToDirectionOfTarget) {
                    projectile.rotation = physics.data.velocity.angle;
                }
                properties.update?.(gameObject, data, dt);
                if (properties.homingSkill > 0) {
                    const target = gameObject.game.getNearestGameObjectWithFilter(
                        gameObject.position, (other) => other.team !== Team.UNTEAMED && other.team !== owner.team);
                    if (target !== undefined) {
                        const towards = gameObject.position.directionTowards(target.object.hitboxCenter).normalized();
                        const cross = towards.scalarCross(data.physics.data.velocity);
                        data.physics.data.velocity.rotate(-Math.sign(cross) * dt * properties.homingSkill);
                    }
                }
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
                    data.hitCount++;
                    properties.onHit?.(gameObject, data, collision);
                    const rotationAngle = MathUtils.random(-Math.PI / 2 * properties.ricochetFactor, Math.PI / 2 * properties.ricochetFactor);
                    data.physics.data.velocity.rotate(rotationAngle);
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
                    properties.onDestroy(gameObject, data);
                }
            },
            data
        }
    });
    
    if (properties.particleEmitter) {
        projectile.addComponent(properties.particleEmitter);
    }

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
