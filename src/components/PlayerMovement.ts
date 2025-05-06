import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import input from "../input";
import { Color, MathUtils, Vector } from "../utils";
import { tileCodex, TileIndex } from "../game/tiles";
import { SpriteAnimationIndex } from "../game/animations";

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
            data.animationManager = gameObject.getComponent("animation-manager");
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

            

            
            if (movement.isZero()) {
                data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_IDLE;
                const mousePos = gameObject.game.camera.screenToWorldPosition(input.mousePosition);
                if (mousePos.x > gameObject.position.x) {
                    gameObject.scale.x = Math.abs(gameObject.scale.x);
                }
                else {
                    gameObject.scale.x = -Math.abs(gameObject.scale.x);
                }
            }
            else {
                data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_RUN;
                if (data.physics.data.velocity.x >= 0) { 
                    gameObject.scale.x = Math.abs(gameObject.scale.x);
                }
                else {
                    gameObject.scale.x = -Math.abs(gameObject.scale.x);
                }
            }

            const tileIndex = gameObject.game.getTileAtWorldPosition(Vector.add(gameObject.position, data.collider.data.boxOffset));
            if (tileIndex === TileIndex.WATER) {
                data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_IDLE_WATER;
                gameObject.castsShadow = false;
            }
            else {
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