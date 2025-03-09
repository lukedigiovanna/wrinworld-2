import { GameObject, GameObjectFactory } from "./index";
import { Vector, MathUtils } from "../utils";
import { Hitbox, Physics, ParticleEmitter, PhysicalCollider } from "../components";
import { spriteRenderer } from "../renderers";

const BulletFactory: GameObjectFactory = (position: Vector, target: Vector) => {
    const bullet = new GameObject();
    bullet.position = position.copy();
    bullet.scale.setComponents(1, 0.6);

    bullet.lifespan = 3;

    bullet.renderer = spriteRenderer("fireball");

    bullet.addComponent((gameObject: GameObject) => {
        return {
            id: "bullet",
            onHitboxCollisionEnter(collision) {
                if (collision.tag === "animal" || collision.tag === "portal" || collision.tag ===  "enemy") {
                    const health = collision.getComponent("health");
                    if (health) {
                        health.data.hp -= 20;
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
        }
    });

    bullet.addComponent(ParticleEmitter({
        spriteID: () => "spark",
        rate: () => 25,
        size: () => new Vector(0.7, 0.7),
        rotation: () => MathUtils.random(0, Math.PI * 2),
        velocity: () => MathUtils.randomVector(MathUtils.random(0.5, 1.2)),
        angularVelocity: () => MathUtils.random(-4, 4),
        lifetime: () => MathUtils.random(0.1, 0.5)
    }, "sparks"));
    bullet.addComponent(ParticleEmitter({
        spriteID: () => MathUtils.randomChoice(["smoke", "spark"]),
        rate: () => 0,
        size: () => new Vector(0.5, 0.5),
        rotation: () => MathUtils.random(0, 2 * Math.PI),
        velocity: () => MathUtils.randomVector(MathUtils.random(0.2, 2.0)),
        lifetime: () => MathUtils.random(0.4, 0.8),
        spawnBoxSize: () => Vector.zero()
    }, "explosion"));
    const physics = bullet.addComponent(Physics);
    physics.data.velocity.set(Vector.scaled(Vector.normalized(Vector.subtract(target, position)), 15));
    const hitbox = bullet.addComponent(Hitbox);
    hitbox.data.boxOffset.setComponents(0.25, 0);
    hitbox.data.boxSize.setComponents(0.25, 0.25);
    const collider = bullet.addComponent(PhysicalCollider);
    collider.data?.ignoreCollisionWith.add("player");
    collider.data.boxOffset.setComponents(0.25, 0);
    collider.data.boxSize.setComponents(0.5, 0.5);
    bullet.rotation = physics.data.velocity.angle;

    bullet.tag = "bullet";

    return bullet;
}

export { BulletFactory };