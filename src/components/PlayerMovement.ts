import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import input from "../input";
import { Color, MathUtils, Vector } from "../utils";
import { tileCodex, TileIndex } from "../tiles";

const PlayerMovement: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        physics: undefined,
        collider: undefined,
        trailParticleEmitter: undefined,
        movementData: undefined,
    }
    return {
        id: "player-movement",
        start() {
            data.physics = gameObject.getComponent("physics");
            data.collider = gameObject.getComponent("physical-collider");
            data.trailParticleEmitter = gameObject.getComponent("particle-emitter-trail");
            data.movementData = gameObject.getComponent("movement-data");
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
            if (input.isKeyDown("ShiftLeft")) {
                this.data.movementData.data.sprinting = true;
            }
            else {
                this.data.movementData.data.sprinting = false;
            }
            // this.data.movementData.data.charging = data.weaponManager.data.charging;
            const speed = this.data.movementData.data.getSpeed();
            movement.scale(speed);
            data.physics.data.velocity.set(movement);

            const mousePos = gameObject.game.camera.screenToWorldPosition(input.mousePosition);
            if (mousePos.x > gameObject.position.x) {
                gameObject.scale.x = Math.abs(gameObject.scale.x);
            }
            else {
                gameObject.scale.x = -Math.abs(gameObject.scale.x);
            }

            const tileIndex = gameObject.game.getTileIndex(Vector.add(gameObject.position, data.collider.data.boxOffset));
            if (tileIndex === TileIndex.WATER) {
                gameObject.renderer!.data.spriteID = "peach_water";
                gameObject.renderer!.data.offset = new Vector(0, Math.sin(gameObject.age * 4) * 1.5);
                gameObject.castsShadow = false;
            }
            else {
                gameObject.renderer!.data.offset = Vector.zero();
                gameObject.renderer!.data.spriteID = "character";
                gameObject.castsShadow = true;
            }

            const tile = tileCodex[tileIndex];
            if (tile.trailColor && !movement.isZero()) {
                data.trailParticleEmitter.data.color = () => {
                    const f = MathUtils.random(-0.25, 0.25);
                    if (tile.trailColor) {
                        return new Color(tile.trailColor.r + f, tile.trailColor.g + f, tile.trailColor.b + f, 1);
                    }
                    return Color.WHITE;
                }; 
                data.trailParticleEmitter.data.rate = () => speed / 12;
                data.trailParticleEmitter.data.enabled = true;
            }
            else {
                data.trailParticleEmitter.data.enabled = false;
            }
        },
        data
    }
}

export { PlayerMovement };