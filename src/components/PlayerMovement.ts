import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import input from "../input";
import { Vector } from "../utils";

const PlayerMovement: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        speed: 5,
        physics: undefined
    }
    return {
        id: "playerMovement",
        start() {
            data.physics = gameObject.getComponent("physics");
        },
        update(dt: number) {
            const movement = Vector.zero();
            if (input.isKeyDown("KeyW")) {
                movement.add(new Vector(0, 1));
            }
            if (input.isKeyDown("KeyS")) {
                movement.add(new Vector(0, -1));
            }
            if (input.isKeyDown("KeyA")) {
                movement.add(new Vector(-1, 0));
            }
            if (input.isKeyDown("KeyD")) {
                movement.add(new Vector(1, 0));
            }
            movement.normalize();
            movement.scale(data.speed);
            if (movement.x < 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x) * -1;
            }
            else if (movement.x > 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x);
            }
            // console.log(gameObject.position);
            data.physics.data.velocity.set(movement);
        },
        data
    }
}

export { PlayerMovement };