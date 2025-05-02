import { spriteRenderer } from "../renderers";
import { GameObjectFactory, GameObject } from "./index";
import { MathUtils, Vector, Color, Ease } from "../utils";
import { Hitbox } from "../components";
import { getSound } from "../assets/soundLoader";

const ORB_LIFESPAN = 120;

const EssenceOrbFactory: GameObjectFactory = (value: number, position: Vector) => {
    const orb = new GameObject();
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
                if (!player.destroyed) {
                    const pickupDistance = player.getComponent("essence-manager").data.essencePickupDistance;
                    const dir = gameObject.position.directionTowards(player.hitboxCenter);
                    const distance = dir.magnitude;
                    if (distance <= pickupDistance) {
                        const speed = 128 * Ease.inQuart(1 - distance / pickupDistance);
                        gameObject.position.add(dir.normalized().scaled(speed * dt));
                    }
                }

                const c = (Math.cos(gameObject.age * 6) * 0.5 + 0.5) * 0.5 + 0.75;
                gameObject.color = new Color(c, c, c, 1);
            }
        }
    });
    orb.addComponent((gameObject: GameObject) => {
        return {
            id: "essence-pickup",
            onHitboxCollisionEnter(collision) {
                if (collision.tag === "player") {
                    const essenceManager = collision.getComponentOptional("essence-manager");
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