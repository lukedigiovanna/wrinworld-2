import { Vector } from "../utils";
import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";
import settings from "../settings";

// TODO! HANDLE DELETED OBJECTS POSSIBLY PERSISTING IN THE `collidingWith` SET

const Hitbox: ComponentFactory = (gameObject: GameObject) => {
    const boxOffset = new Vector(0, 0);
    const boxSize = gameObject.scale.copy();
    const collidingWith = new Set<GameObject>();
    return {
        id: "hitbox",
        start() {},
        update(dt) {
            // check for collision with any other object with a hitbox collider
            const rotatedBoxOffset = Vector.rotated(boxOffset, gameObject.rotation);
            const [l, r, t, b] = [
                gameObject.position.x + rotatedBoxOffset.x - boxSize.x / 2,
                gameObject.position.x + rotatedBoxOffset.x + boxSize.x / 2,
                gameObject.position.y + rotatedBoxOffset.y + boxSize.y / 2,
                gameObject.position.y + rotatedBoxOffset.y - boxSize.y / 2,
            ];
            gameObject.getAdjacentObjects().forEach((obj: GameObject) => {
                if (gameObject === obj) return;
                const other = obj.getComponent("hitbox");
                if (!other) return;
                
                // check for collision
                const oRotatedBoxOffset = Vector.rotated(other.data?.boxOffset, obj.rotation);
                const [ol, or, ot, ob] = [
                    obj.position.x + oRotatedBoxOffset.x - other.data?.boxSize.x / 2,
                    obj.position.x + oRotatedBoxOffset.x + other.data?.boxSize.x / 2,
                    obj.position.y + oRotatedBoxOffset.y + other.data?.boxSize.y / 2,
                    obj.position.y + oRotatedBoxOffset.y - other.data?.boxSize.y / 2,
                ];
                if (!(r <= ol || l >= or || t <= ob || b >= ot)) {
                    if (!collidingWith.has(obj)) {
                        gameObject.onHitboxCollisionEnter(obj);
                        collidingWith.add(obj);
                    }
                }
                else if (collidingWith.has(obj)) {
                    gameObject.onHitboxCollisionExit(obj);
                    collidingWith.delete(obj);
                }
            });
        },
        debugRender(camera) {
            if (settings.showHitboxes) {
                camera.setStrokeColor("blue");
                camera.setLineWidth(3);
                const rotatedOffset = Vector.rotated(this.data.boxOffset, gameObject.rotation);
                camera.strokeRect(
                    gameObject.position.x + rotatedOffset.x, 
                    gameObject.position.y + rotatedOffset.y, 
                    boxSize.x,
                    boxSize.y
                )
            }
        },
        data: {
            boxOffset,
            boxSize,
            collidingWith
        }
    }
}

export { Hitbox };