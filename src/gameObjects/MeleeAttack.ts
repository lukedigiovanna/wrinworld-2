import { GameObject, GameObjectFactory } from "./index";
import { Vector, MathUtils } from "../utils";
import { Hitbox, Physics, ParticleEmitter } from "../components";
import { spriteRenderer } from "../renderers";
import { MeleeAttack } from "../meleeAttacks";
import { Team } from "./index";

const MeleeAttackFactory: GameObjectFactory = (properties: MeleeAttack, owner: GameObject, target: Vector) => {
    properties = {...properties};

    const meleeAttack = new GameObject();
    
    const direction = Vector.normalized(Vector.subtract(target, owner.position));
    
    meleeAttack.scale.scale(properties.size);
    meleeAttack.lifespan = properties.duration;

    if (properties.particleSpriteID) {
        meleeAttack.addComponent(ParticleEmitter({
            lifetime: () => 0.1,
            spriteID: () => properties.particleSpriteID as string,
            rate: () => 100,
            rotation: () => MathUtils.random(0, Math.PI * 2),
            spawnBoxSize: () => new Vector(0.3, 0.3),
            size: () => new Vector(0.25, 0.25),
            velocity: () => MathUtils.randomVector(MathUtils.random(0.2, 0.8))
        }));
    }

    meleeAttack.addComponent((gameObject: GameObject) => {
        const data: any = {
            owner,
            direction,
            hitCount: 0,
            updatePosition() {
                const startAngle = properties.sweepArcStart ? properties.sweepArcStart : 0;
                const sweepLength = properties.sweepArcLength ? properties.sweepArcLength : 0;
                const angle = startAngle + sweepLength * gameObject.age / properties.duration;
                const transformedDirection = Vector.rotated(data.direction, angle);
                transformedDirection.scale(properties.range);
                gameObject.position = Vector.add(data.owner.position, transformedDirection);
            }
        };
        return {
            id: "melee",
            start() {
                data.updatePosition();
            },
            update(dt) {
                data.updatePosition();
            },
            onHitboxCollisionEnter(collision) {
                if (collision.team !== Team.UNTEAMED &&
                    data.owner.team !== collision.team) {
                    const health = collision.getComponent("health");
                    if (health) {
                        const damage = data.hitCount === 0 ? properties.damage : properties.sweepDamage;
                        health.data.damage(damage);
                    }
                    const physics = collision.getComponent("physics");
                    if (physics) {
                        physics.data.impulse.add(
                            Vector.scaled(
                                data.direction, 
                                properties.knockback
                            )
                        );
                    }
                    data.hitCount++;
                    if (data.hitCount >= properties.maxHits) {
                        gameObject.destroy();
                        console.log('destroyed');
                    }
                }
            },
            data
        }
    });

    const hitbox = meleeAttack.addComponent(Hitbox);
    hitbox.data.boxOffset.setComponents(0.25, 0);
    hitbox.data.boxSize.setComponents(0.25, 0.25);
    
    meleeAttack.rotation = direction.angle;

    meleeAttack.tag = "melee-attack";

    return meleeAttack;
}

export { MeleeAttackFactory };
