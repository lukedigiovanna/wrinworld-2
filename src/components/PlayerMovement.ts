import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import input from "../input";
import { Vector } from "../utils";
import { TileIndex } from "../tiles";

const PlayerMovement: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        speed: 5,
        regularSpeed: 5,
        waterSpeed: 2,
        physics: undefined,
        collider: undefined
    }
    return {
        id: "player-movement",
        start() {
            data.physics = gameObject.getComponent("physics");
            data.collider = gameObject.getComponent("physical-collider");
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
            if (input.isKeyDown("ShiftLeft")) {
                movement.scale(4);
            }
            data.physics.data.velocity.set(movement);

            const mousePos = gameObject.game.camera.screenToWorldPosition(input.mousePosition);
            if (mousePos.x > gameObject.position.x) {
                gameObject.scale.x = Math.abs(gameObject.scale.x);
            }
            else {
                gameObject.scale.x = -Math.abs(gameObject.scale.x);
            }

            const tileIndex = gameObject.game.getTileIndex(gameObject.position);
            if (tileIndex === TileIndex.WATER) {
                gameObject.renderer!.data.spriteID = "peach_water";
                gameObject.renderer!.data.offset = new Vector(0, Math.sin(gameObject.age * 6) * 0.04);
                data.collider.data.castShadow = false;
                data.speed = data.waterSpeed;
            }
            else {
                data.speed = data.regularSpeed;
                gameObject.renderer!.data.spriteID = "peach";
                data.collider.data.castShadow = true;
            }
        },
        data
    }
}

export { PlayerMovement };