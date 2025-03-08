import { Vector } from "../utils";
import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";
import settings from "../settings";

const PhysicalCollider: ComponentFactory = (gameObject: GameObject) => {
    const data = {
        boxOffset: Vector.zero(),
        boxSize: gameObject.scale.copy(),
        castShadow: true,
        ignoreCollisionWith: new Set()
    };
    return {
        id: "physical-collider",
        start() {},
        update(dt) {

        },
        debugRender(camera) {
            if (settings.showPhysicalColliders) {
                camera.setStrokeColor("red");
                camera.setLineWidth(3);
                camera.strokeRect(gameObject.position.x + data.boxOffset.x, gameObject.position.y + data.boxOffset.y, data.boxSize.x, data.boxSize.y);
            }
        },
        data
    }
}

export { PhysicalCollider };