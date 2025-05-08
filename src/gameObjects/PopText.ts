import { textRenderer } from "../rendering/renderers";
import { GameObject, GameObjectFactory } from "./";
import { Color, MathUtils, Vector } from "../utils";
import { Physics } from "../components";

const PopText: GameObjectFactory = (position: Vector, text: string, color: Color) => {
    const popText = new GameObject();
    popText.renderer = textRenderer("pixel_font", text);
    popText.position.set(position);
    popText.zIndex = 1000;
    popText.lifespan = 0.8;
    const physics = popText.addComponent(Physics);
    physics.data.gravity = 100;
    physics.data.velocity.setComponents(MathUtils.random(-15, 15), 40);
    popText.addComponent((gameObject) => {
        return {
            id: "fade",
            update(dt) {
                gameObject.color = new Color(color.r, color.g, color.b, 1 - Math.pow(gameObject.age / gameObject.lifespan!, 6));
            },
        }
    });
    return popText;
}

export { PopText };
