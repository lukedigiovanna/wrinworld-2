import { Vector } from "../utils";
import { ComponentFactory } from "./index";

const ZombieAI: ComponentFactory = (gameObject) => {
    const data: any = {
        target: undefined,
        physics: undefined
    };
    return {
        id: "zombie-ai",
        start() {
            data.target = gameObject.game.player.position;
            data.physics = gameObject.getComponent("physics");
            console.log(data.target, data.physics);
        },
        update(dt) {
            const direction = Vector.subtract(data.target, gameObject.position);
            direction.normalize();
            data.physics.data.velocity.set(direction);
            if (direction.x < 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x) * -1;
            }
            else if (direction.x > 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x);
            }
        },
        data
    }
}

export { ZombieAI };
