import { GameObject, GameObjectFactory } from "./index";
import { Vector, MathUtils } from "../utils";
import { Hitbox, Physics, ParticleEmitter, PhysicalCollider } from "../components";
import { spriteRenderer } from "../renderers";

interface MeleeAttackProperties {
    // How many distinct mobs this attack can hit
    maxHits: number;
    // The sprite this attack should represent as (invisible if undefined)
    spriteID?: string;
    // Amount of HP to deal upon hit
    damage: number;
    // Any logic that should happen upon collision
    onCollision?: () => void;
    // How much knockback force to apply
    knockback: number;
}

const MeleeAttackFactory: GameObjectFactory = (owner: GameObject, position: Vector, target: Vector) => {
    const meleeAttack = new GameObject();
    
    const direction = Vector.normalized(Vector.subtract(target, position));
    
    meleeAttack.position = Vector.add(position, direction);
    meleeAttack.scale.setComponents(1, 0.6);

    meleeAttack.lifespan = 0.1;

    meleeAttack.renderer = spriteRenderer("square");

    meleeAttack.addComponent((gameObject: GameObject) => {
        const data: any = {
            owner,
            direction,
            physics: undefined,
        };
        return {
            id: "melee",
            start() {
                data.physics = gameObject.getComponent("physics");
            },
            onHitboxCollisionEnter(collision) {
                if (collision.tag === "animal" || collision.tag === "portal" || collision.tag ===  "enemy") {
                    const health = collision.getComponent("health");
                    if (health) {
                        health.data.damage(5);
                    }
                    const physics = collision.getComponent("physics");
                    if (physics) {
                        physics.data.impulse.add(
                            Vector.scaled(
                                data.direction, 
                                2
                            )
                        );
                    }
                    gameObject.destroy();
                }
            },
            onPhysicalCollision(collision, isTile) {
                gameObject.destroy();
            },
            data
        }
    });
    
    meleeAttack.addComponent(Physics);

    const hitbox = meleeAttack.addComponent(Hitbox);
    hitbox.data.boxOffset.setComponents(0.25, 0);
    hitbox.data.boxSize.setComponents(0.25, 0.25);
    
    meleeAttack.rotation = direction.angle;

    meleeAttack.tag = "melee-attack";

    return meleeAttack;
}

export { MeleeAttackFactory };
