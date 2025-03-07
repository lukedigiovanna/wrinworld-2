import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";

const Health: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        hp: 5
    }
    return {
        id: "health",
        update(dt) {
            if (this.data.hp <= 0) {
                gameObject.destroy();
            }
        },
        data
    }
}

export { Health };