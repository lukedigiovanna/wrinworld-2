import { Vector, Color } from "../utils";
import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";
import settings from "../settings";

// TODO! HANDLE DELETED OBJECTS POSSIBLY PERSISTING IN THE `collidingWith` SET

const Hitbox: ComponentFactory = (gameObject: GameObject) => {
    return {
        id: "hitbox",
        data: {
            boxOffset: new Vector(0, 0),
            boxSize: gameObject.scale.copy(),
            collidingWith: new Set<GameObject>(),
        },
        start() {},
        update(dt) {
            // check for collision with any other object with a hitbox collider
            const rotatedBoxOffset = Vector.rotated(this.data.boxOffset, gameObject.rotation);
            const [l, r, t, b] = [
                gameObject.position.x + rotatedBoxOffset.x - this.data.boxSize.x / 2,
                gameObject.position.x + rotatedBoxOffset.x + this.data.boxSize.x / 2,
                gameObject.position.y + rotatedBoxOffset.y + this.data.boxSize.y / 2,
                gameObject.position.y + rotatedBoxOffset.y - this.data.boxSize.y / 2,
            ];
            gameObject.getAdjacentObjects().forEach((obj: GameObject) => {
                if (gameObject === obj) return;
                if (!obj.hasComponent("hitbox")) return;
                if (obj.destroyed) return;
                const other = obj.getComponent("hitbox");
            
                // check for collision
                const oRotatedBoxOffset = Vector.rotated(other.data?.boxOffset, obj.rotation);
                const [ol, or, ot, ob] = [
                    obj.position.x + oRotatedBoxOffset.x - other.data?.boxSize.x / 2,
                    obj.position.x + oRotatedBoxOffset.x + other.data?.boxSize.x / 2,
                    obj.position.y + oRotatedBoxOffset.y + other.data?.boxSize.y / 2,
                    obj.position.y + oRotatedBoxOffset.y - other.data?.boxSize.y / 2,
                ];
                if (!(r <= ol || l >= or || t <= ob || b >= ot)) {
                    if (!this.data.collidingWith.has(obj)) {
                        gameObject.onHitboxCollisionEnter(obj);
                        this.data.collidingWith.add(obj);
                    }
                }
                else if (this.data.collidingWith.has(obj)) {
                    gameObject.onHitboxCollisionExit(obj);
                    this.data.collidingWith.delete(obj);
                }
            });
        },
        debugRender(camera) {
            if (settings.showHitboxes) {
                camera.color = Color.BLUE;
                const rotatedOffset = Vector.rotated(this.data.boxOffset, gameObject.rotation);
                camera.strokeRect(
                    gameObject.position.x + rotatedOffset.x, 
                    gameObject.position.y + rotatedOffset.y, 
                    this.data.boxSize.x,
                    this.data.boxSize.y
                )
            }
        },
    }
}

export { Hitbox };