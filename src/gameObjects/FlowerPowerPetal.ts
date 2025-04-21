import { getTexture } from "../imageLoader";
import { spriteRenderer } from "../renderers";
import { Ease, Vector } from "../utils";
import { GameObject, GameObjectFactory } from "./";

const FlowerPowerPetalFactory: GameObjectFactory = (owner: GameObject, p: number) => {
    const petal = new GameObject();
    const angle = p * Math.PI * 2;
    petal.position = owner.position.plus(new Vector(Math.cos(angle), Math.sin(angle)).scaled(12));
    const texture = getTexture("flower_power_petal");
    petal.scale = new Vector(texture.width, texture.height);
    petal.renderer = spriteRenderer("flower_power_petal");
    petal.rotation = angle;
    petal.zIndex = 16;
    petal.addComponent((gameObject) => {
        return {
            id: "flower-power-petal",
            update(dt) {
                const x = gameObject.age;
                const d = Ease.outElastic(x) * 12;
                const a = angle + gameObject.age * 2;
                gameObject.position = owner.position.plus(new Vector(Math.cos(a), Math.sin(a)).scaled(d));
                gameObject.rotation = a;
            },
        }
    });
    return petal;
}

export { FlowerPowerPetalFactory };
