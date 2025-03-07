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
        collider: undefined,
    }
    return {
        id: "playerMovement",
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
            if (movement.x < 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x) * -1;
            }
            else if (movement.x > 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x);
            }
            // console.log(gameObject.position);
            data.physics.data.velocity.set(movement);

            let R = 3;
            for (let xo = -R; xo <= R; xo++) {
                for (let yo = -R; yo <= R; yo++) {
                    let ti;
                    if (Math.abs(xo) == R || Math.abs(yo) == R) {
                        ti = TileIndex.ROCKS;
                    }
                    else {
                        ti = TileIndex.GRASS;
                    }
                    gameObject.game.setTile(Vector.add(gameObject.position, new Vector(xo, yo)), ti);
                }
            }
            const tile = gameObject.game.getTile(gameObject.position);
            if (tile.spriteID === "water") {
                gameObject.renderer!.data.spriteID = "peach_water";
                gameObject.renderer!.data.offset = new Vector(0, Math.sin(gameObject.age * 6) * 0.04);
                data.speed = data.waterSpeed;
            }
            else {
                data.speed = data.regularSpeed;
                gameObject.renderer!.data.spriteID = "peach";
            }
        },
        data
    }
}

export { PlayerMovement };