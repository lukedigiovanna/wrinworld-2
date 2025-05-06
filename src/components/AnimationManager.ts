import { animationsCodex, SpriteAnimationIndex } from "../game/animations";
import { GameObject } from "../gameObjects";
import { ComponentFactory } from "./";

const AnimationManager: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        animation: undefined,
    };
    return {
        id: "animation-manager",
        start() {
            
        },
        update(dt) {
            if (gameObject.renderer && data.animation !== undefined) {
                gameObject.renderer.data.spriteID = animationsCodex[data.animation as SpriteAnimationIndex].getFrame(gameObject.age);
            }
        },
        data
    }
}

export { AnimationManager };
