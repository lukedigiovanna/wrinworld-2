import { spriteRenderer } from "../renderers";
import { GameObjectFactory, GameObject } from "./index";
import { MathUtils, Vector } from "../utils";
import { Hitbox } from "../components";
import { getSound } from "../soundLoader";
import { PIXELS_PER_TILE } from "../game";

const ORB_LIFESPAN = 120;

const EssenceOrbFactory: GameObjectFactory = (value: number, position: Vector) => {
    const orb = new GameObject();
    // const scale = -1 / (2 * Math.exp(0.05 * (value + 20))) + 0.4;
    // orb.scale.setComponents(scale, scale);
    orb.scale.setComponents(4, 4);
    // TODO: choose a random essence orb
    orb.renderer = spriteRenderer("essence_orb_small");
    orb.position.set(position);
    orb.lifespan = ORB_LIFESPAN;
    orb.addComponent(Hitbox)
    orb.addComponent((gameObject: GameObject) => {
        const data: any = {
            velocity: new Vector(MathUtils.random(-12, 12),  MathUtils.random(24, 32))
        }
        return {
            id: "essence-movement",
            update(dt) {
                if (gameObject.age < 0.6) {
                    data.velocity.y -= 160 * dt;
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
                if (distance < 64) {
                    gameObject.position.add(
                        Vector.scaled(
                            Vector.normalized(diff), 
                            dt * 32 / Math.max(distance - PIXELS_PER_TILE, 1)
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