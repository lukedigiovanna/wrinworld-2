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
            const speed = this.data.movementData.data.getSpeed();
            movement.scale(speed);
            // interpolate the velocity to match the movement speed
            const k = 40;
            const factor = (1 - Math.exp(-k * dt)) / (1 - Math.exp(-k))
            const velocity = data.physics.data.velocity as Vector;
            const newVelocity = velocity.plus(movement.minus(velocity).scaled(factor));
            data.physics.data.velocity.set(newVelocity);

            if (movement.isZero()) {
                // data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_IDLE;
                const mousePos = gameObject.game.camera.screenToWorldPosition(input.mousePosition);
                const angle = mousePos.minus(gameObject.position).angle;
                console.log(angle);
                if (-Math.PI / 4 <= angle && angle < Math.PI / 4) {
                    data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_IDLE_RIGHT;
                }
                else if (Math.PI / 4 <= angle && angle < 3 * Math.PI / 4) {
                    data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_IDLE_UP;
                }
                else if (3 * Math.PI / 4 <= angle || angle < -3 * Math.PI / 4) {
                    data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_IDLE_LEFT;
                }
                else {
                    data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_IDLE_DOWN;
                }
            }
            else {
                const angle = data.physics.data.velocity.angle;
                if (-Math.PI / 4 <= angle && angle < Math.PI / 4) {
                    data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_RUN_RIGHT;
                }
                else if (Math.PI / 4 <= angle && angle < 3 * Math.PI / 4) {
                    data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_RUN_UP;
                }
                else if (3 * Math.PI / 4 <= angle || angle < -3 * Math.PI / 4) {
                    data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_RUN_LEFT;
                }
                else {
                    data.animationManager.data.animation = SpriteAnimationIndex.CHARACTER_RUN_DOWN;
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

            const bounds = gameObject.game.camera.bounds;
            if (bounds) {
                gameObject.position.x = MathUtils.clamp(gameObject.position.x, bounds.left, bounds.right);
                gameObject.position.y = MathUtils.clamp(gameObject.position.y, bounds.bottom, bounds.top);
            }
        },
        data
    }
}

export { PlayerMovement };