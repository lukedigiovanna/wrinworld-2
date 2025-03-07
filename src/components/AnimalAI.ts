import { MathUtils } from "../utils";
import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";
import settings from "../settings";

// TODO! HANDLE DELETED OBJECTS POSSIBLY PERSISTING IN THE `collidingWith` SET

const AnimalAI: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {};
    return {
        id: "animal-ai",
        start() {
            data.physics = gameObject.getComponent("physics");
        },
        update(dt) {
            if (Math.random() < dt) {
                data.physics.data.velocity.setComponents(MathUtils.random(-1,1), MathUtils.random(-1,1));
                if (data.physics.data.velocity.x < 0) {
                    gameObject.scale.x = -Math.abs(gameObject.scale.x);
                }
                else if (data.physics.data.velocity.x > 0) {
                    gameObject.scale.x = Math.abs(gameObject.scale.x);
                }
            }
        },
        destroy() {
            const particles = gameObject.getComponent("particle-emitter");
            const num = MathUtils.randomInt(3, 7);
            for (let i = 0; i < num; i++) {
                particles?.data.emit();
            }
        },
        data
    }
}

export { AnimalAI };