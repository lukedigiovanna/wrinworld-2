import { spriteRenderer } from "../renderers";
import { GameObjectFactory, GameObject } from "./index";
import { MathUtils, Vector } from "../utils";
import { getSound } from "../soundLoader";

const EssenceOrbAttackFactory: GameObjectFactory = (value: number, position: Vector, target: GameObject) => {
    const orb = new GameObject();
    // const scale = -1 / (2 * Math.exp(0.05 * (value + 20))) + 0.4;
    const scale = 4;
    orb.scale.setComponents(scale, scale);
    orb.renderer = spriteRenderer("essence_orb_small");
    orb.position.set(position);
    // const physics = orb.addComponent(Physics);
    // physics.data.velocity = MathUtils.randomVector(2);
    orb.addComponent((gameObject: GameObject) => {
        const data: any = {
            velocity: MathUtils.randomVector(64)
        }
        return {
            id: "essence-attack-movement",
            update(dt) {
                const diff = Vector.subtract(target.position, gameObject.position);
                const distance = diff.magnitude;
                if (distance < 8) {
                    target.getComponent("health")?.data.damage(value);
                    gameObject.destroy();
                    getSound("essence_pickup").play();
                }
                this.data.velocity.scale(Math.exp(-dt * 2));
                gameObject.position.add(Vector.scaled(
                    this.data.velocity,
                    dt
                ))
                gameObject.position.add(
                    Vector.scaled(
                        Vector.normalized(diff), 
                        dt * 0.6 / Math.max(distance * 0.02 - 1, 0.1) * 16
                    )
                );
                
            },
            data
        }
    });
    return orb;
}

export { EssenceOrbAttackFactory };
