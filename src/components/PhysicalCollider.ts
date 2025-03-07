import { Vector } from "../utils";
import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";
import settings from "../settings";

const PhysicalCollider: ComponentFactory = (gameObject: GameObject) => {
    const boxOffset = Vector.zero();
    const boxSize = gameObject.scale.copy();
    const castShadow = true;
    return {
        id: "physical-collider",
        start() {},
        update(dt) {

        },
        debugRender(camera) {
            if (settings.showPhysicalColliders) {
                camera.setStrokeColor("red");
                camera.setLineWidth(3);
                camera.strokeRect(gameObject.position.x + this.data.boxOffset.x, gameObject.position.y + this.data.boxOffset.y, boxSize.x, boxSize.y);
            }
        },
        data: {
            boxOffset,
            boxSize,
            castShadow
        }
    }
}

export { PhysicalCollider };