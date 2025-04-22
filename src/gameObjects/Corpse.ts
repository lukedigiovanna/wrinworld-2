import { GameObject, GameObjectFactory } from "./";
import { Physics } from "../components";
import { getTexture } from "../imageLoader";
import { Color, MathUtils } from "../utils";
import { spriteRenderer } from "../renderers";

const CorpseFactory: GameObjectFactory = (gameObject: GameObject, spriteID: string) => {
    const corpse = new GameObject();
    corpse.position.set(gameObject.position);
    const sprite = getTexture(spriteID);
    corpse.renderer = spriteRenderer(spriteID);
    corpse.scale.setComponents(Math.sign(gameObject.scale.x) * sprite.width, sprite.height);
    const physics = corpse.addComponent(Physics);
    physics.data.angularVelocity = Math.sign(gameObject.scale.x) * MathUtils.random(0.4, 2.0);
    physics.data.angularVelocityDrag = MathUtils.random(0.6, 1);
    const objectPhysics = gameObject.getComponentOptional("physics");
    if (objectPhysics) {
        physics.data.impulse.set(objectPhysics.data.impulse);
    }
    corpse.lifespan = MathUtils.random(8, 20);

    corpse.addComponent((gameObject) => {
        return {
            id: "fade",
            update(dt) {
                const remaining = gameObject.lifespan! - gameObject.age;
                if (remaining <= 1) {
                    gameObject.color = new Color(1, 1, 1, remaining);
                }
            },
        }
    })

    return corpse;
}

export { CorpseFactory };
