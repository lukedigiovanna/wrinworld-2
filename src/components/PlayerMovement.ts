import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import input from "../input";
import { Color, MathUtils, Vector } from "../utils";
import { tileCodex, TileIndex } from "../tiles";

const PlayerMovement: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        speed: 140,
        regularSpeed: 140,
        waterSpeed: 90,
        physics: undefined,
        collider: undefined
    }
    return {
        id: "player-movement",
        start() {
            data.physics = gameObject.getComponent("physics");
            data.collider = gameObject.getComponent("physical-collider");
            data.weaponManager = gameObject.getComponent("weapon-manager");
            data.trailParticleEmitter = gameObject.getComponent("particle-emitter-trail");
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
            const chargeScale = data.weaponManager.data.charging ? 0.3 : 1;
            let realSpeed = data.speed * chargeScale;
            if (input.isKeyDown("ShiftLeft")) {
                realSpeed *= 2;
            }
            movement.scale(realSpeed);
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
                data.speed = data.waterSpeed;
            }
            else {
                data.speed = data.regularSpeed;
                gameObject.renderer!.data.offset = Vector.zero();
                gameObject.renderer!.data.spriteID = "peach";
                gameObject.castsShadow = true;
            }

            const tile = tileCodex.get(tileIndex);
            if (tile.trailColor && !movement.isZero()) {
                data.trailParticleEmitter.data.color = () => {
                    const f = MathUtils.random(-0.25, 0.25);
                    if (tile.trailColor) {
                        return new Color(tile.trailColor.r + f, tile.trailColor.g + f, tile.trailColor.b + f, 1);
                    }
                    return Color.WHITE;
                }; 
                data.trailParticleEmitter.data.rate = () => realSpeed / 12;
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