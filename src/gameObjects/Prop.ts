import { spriteRenderer } from "../renderers";
import { GameObjectFactory, GameObject } from "./index";
import { Vector } from "../utils";
import { PhysicalCollider } from "../components";
import { getTexture } from "../imageLoader";

const PropFactory: GameObjectFactory = (position: Vector, spriteID: string, hasCollision: boolean=true) => {
    const prop = new GameObject();
    prop.tag = "prop";
    const texture = getTexture(spriteID);
    prop.scale.setComponents(texture.image.width, texture.image.height);
    prop.renderer = spriteRenderer(spriteID);
    prop.position.set(position);
    if (hasCollision) {
        const collider = prop.addComponent(PhysicalCollider);
        collider.data.boxSize = new Vector(prop.scale.x / 4, 8);
        collider.data.boxOffset = new Vector(0, -prop.scale.y / 2 + 4);
    }
    return prop;
}

export { PropFactory };
