import { getTexture } from "../assets/imageLoader";
import { GameObjectFactory, GameObject } from "./";
import { spriteRenderer } from "../rendering/renderers";
import { Vector } from "../utils";

const VolcanoFactory: GameObjectFactory = (position: Vector) => {
    const volcano = new GameObject();
    const texture = getTexture("volcano");
    volcano.renderer = spriteRenderer("volcano");
    volcano.scale.setComponents(texture.width, texture.height);
    volcano.position.set(position);
    return volcano;
}

export { VolcanoFactory };
