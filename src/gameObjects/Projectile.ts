import { GameObject, GameObjectFactory } from "./index";
import { Vector, MathUtils } from "../utils";
import { Hitbox, Physics, ParticleEmitter, PhysicalCollider } from "../components";
import { spriteRenderer } from "../renderers";

interface ProjectileProperties {
    // 0 to 1 - how good the projectile is at tracking the target. 0 is no homing, 1 is perfect homing
    homingSkill: number;
    // How many distinct mobs this projectile can hit
    maxHits: number;
    // The sprite this projectile should represent as (invisible if undefined)
    spriteID?: string;
    // Amount of HP to deal upon hit
    damage: number;
    // Any logic that should happen upon collision
    onCollision?: () => void;
    // How much knockback force to apply
    knockback: number;
}

const ProjectileFactory: GameObjectFactory = (owner: GameObject, position: Vector, target: Vector) => {
    const projectile = new GameObject();
    projectile.position = position.copy();
    projectile.scale.setComponents(1, 0.6);

    projectile.lifespan = 3;

    projectile.renderer = spriteRenderer("fireball");

    projectile.addComponent((gameObject: GameObject) => {
        const data: any = {
            owner,
            physics: undefined,
        };
        return {
            id: "projectile",
            start() {
                data.physics = gameObject.getComponent("physics");
            },
            onHitboxCollisionEnter(collision) {
                if (collision.tag === "animal" || collision.tag === "portal" || collision.tag ===  "enemy") {
                    const health = collision.getComponent("health");
                    if (health) {
                        health.data.hp -= 5;
                    }
                    const physics = collision.getComponent("physics");
                    if (physics) {
                        physics.data.impulse.add(
                            Vector.scaled(
                                Vector.normalized(
                                    data.physics.data.velocity
                                ), 
                                2
                            )
                        );
                    }
                    const particles = gameObject.getComponent("particle-emitter-explosion");
                    for (let i = 0; i < 25; i++) particles?.data.emit();
                    gameObject.destroy();
                }
            },
            onPhysicalCollision(collision, isTile) {
                if (!isTile) {
                    collision = collision as GameObject;
                    if (collision.tag ===  "enemy") {
                        return;
                    }
                }
                const particles = gameObject.getComponent("particle-emitter-explosion");
                for (let i = 0; i < 25; i++) particles?.data.emit();
                gameObject.destroy();
            },
            data
        }
    });

    projectile.addComponent(ParticleEmitter({
        spriteID: () => "spark",
        rate: () => 25,
        size: () => new Vector(0.7, 0.7),
        rotation: () => MathUtils.random(0, Math.PI * 2),
        velocity: () => MathUtils.randomVector(MathUtils.random(0.5, 1.2)),
        angularVelocity: () => MathUtils.random(-4, 4),
        lifetime: () => MathUtils.random(0.1, 0.5)
    }, "sparks"));

    projectile.addComponent(ParticleEmitter({
        spriteID: () => MathUtils.randomChoice(["smoke", "spark"]),
        rate: () => 0,
        size: () => new Vector(0.5, 0.5),
        rotation: () => MathUtils.random(0, 2 * Math.PI),
        velocity: () => MathUtils.randomVector(MathUtils.random(0.2, 2.0)),
        lifetime: () => MathUtils.random(0.4, 0.8),
        spawnBoxSize: () => Vector.zero()
    }, "explosion"));
    
    const physics = projectile.addComponent(Physics);
    physics.data.velocity.set(
        Vector.scaled(
            Vector.normalized(
                Vector.subtract(target, position)
            ),
            15
        )
    );

    const hitbox = projectile.addComponent(Hitbox);
    hitbox.data.boxOffset.setComponents(0.25, 0);
    hitbox.data.boxSize.setComponents(0.25, 0.25);
    
    const collider = projectile.addComponent(PhysicalCollider);
    collider.data?.ignoreCollisionWith.add("player");
    collider.data.boxOffset.setComponents(0.25, 0);
    collider.data.boxSize.setComponents(0.5, 0.5);
    
    projectile.rotation = physics.data.velocity.angle;

    projectile.tag = "projectile";

    return projectile;
}

export { ProjectileFactory };
