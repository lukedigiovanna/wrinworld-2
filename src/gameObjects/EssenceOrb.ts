import { spriteRenderer } from "../renderers";
import { GameObjectFactory, GameObject } from "./index";
import { MathUtils, Vector } from "../utils";
import { Hitbox } from "../components";
import { getSound } from "../soundLoader";

const ORB_LIFESPAN = 120;

const EssenceOrbFactory: GameObjectFactory = (value: number, position: Vector) => {
    const orb = new GameObject();
    const scale = -1 / (2 * Math.exp(0.05 * (value + 20))) + 0.4;
    orb.scale.setComponents(scale, scale);
    // TODO: choose a random essence orb
    orb.renderer = spriteRenderer("essence_orb");
    orb.position.set(position);
    orb.lifespan = ORB_LIFESPAN;
    orb.addComponent(Hitbox)
    orb.addComponent((gameObject: GameObject) => {
        const data: any = {
            velocity: new Vector(MathUtils.random(-0.8, 0.8),  MathUtils.random(1.5, 3))
        }
        return {
            id: "essence-movement",
            update(dt) {
                if (gameObject.age < 0.6) {
                    data.velocity.y -= 10 * dt;
                    gameObject.position.add(
                        Vector.scaled(
                            data.velocity,
                            dt
                        )
                    );
                }
                const player = gameObject.game.player;
                const diff = Vector.subtract(player.position, gameObject.position);
                const distance = diff.magnitude;
                if (distance < 3.5) {
                    gameObject.position.add(
                        Vector.scaled(
                            Vector.normalized(diff), 
                            dt * 0.6 / Math.max(distance - 1, 0.1)
                        )
                    );
                }
            }
        }
    });
    orb.addComponent((gameObject: GameObject) => {
        return {
            id: "essence-pickup",
            onHitboxCollisionEnter(collision) {
                if (collision.tag === "player") {
                    const essenceManager = collision.getComponent("essence-manager");
                    essenceManager?.data.addEssence(value);
                    getSound("essence_pickup").play();                    
                    gameObject.destroy();
                }
            },
        }
    });
    return orb;
}

export { EssenceOrbFactory };