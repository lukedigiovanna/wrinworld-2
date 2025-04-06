import { GameObject, GameObjectFactory } from "./index";
import { Vector, MathUtils } from "../utils";
import { Hitbox, ParticleEmitter } from "../components";
import { MeleeAttack } from "../meleeAttacks";
import { Team } from "./index";
import { getTexture } from "../imageLoader";

const MeleeAttackFactory: GameObjectFactory = (properties: MeleeAttack, owner: GameObject, target: Vector) => {
    properties = {...properties};

    const meleeAttack = new GameObject();
    
    const direction = Vector.normalized(Vector.subtract(target, owner.position));
    
    meleeAttack.scale.setComponents(properties.size, properties.size);
    meleeAttack.lifespan = properties.duration;

    if (properties.particleSpriteID) {
        const texture = getTexture(properties.particleSpriteID);
        meleeAttack.addComponent(ParticleEmitter({
            lifetime: () => 0.1,
            spriteID: () => properties.particleSpriteID as string,
            rate: () => 20,
            rotation: () => MathUtils.random(0, Math.PI * 2),
            spawnBoxSize: () => new Vector(4, 4),
            size: () => new Vector(texture.image.width, texture.image.height),
            velocity: () => MathUtils.randomVector(MathUtils.random(4, 14))
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
                    }
                }
            },
            data
        }
    });

    meleeAttack.addComponent(Hitbox);
    
    meleeAttack.rotation = direction.angle;

    meleeAttack.tag = "melee-attack";

    return meleeAttack;
}

export { MeleeAttackFactory };
