import { GameObject } from "../gameObjects";
import { ComponentFactory } from "./index";
import { Color } from "../utils";

const Fade: ComponentFactory = (gameObject: GameObject) => {
    return {
        id: "fade",
        update(dt) {
            const remaining = gameObject.lifespan! - gameObject.age;
                if (remaining <= 1) {
                    gameObject.color = new Color(
                        gameObject.color.r, 
                        gameObject.color.g, 
                        gameObject.color.b, 
                        remaining
                    );
                }
        }
    }
}

export { Fade }
