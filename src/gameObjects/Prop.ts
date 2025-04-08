import { spriteRenderer } from "../renderers";
import { GameObjectFactory, GameObject } from "./index";
import { Vector, Color } from "../utils";
import { PhysicalCollider } from "../components";
import { getTexture } from "../imageLoader";
import { PropIndex, propsCodex } from "../props";

const PropFactory: GameObjectFactory = (propertiesIndex: PropIndex, position: Vector) => {
    const properties = propsCodex.get(propertiesIndex);
    const prop = new GameObject();
    prop.tag = "prop";
    const texture = getTexture(properties.spriteID);
    prop.scale.setComponents(texture.width, texture.height);
    prop.renderer = spriteRenderer(properties.spriteID);
    prop.position.set(position);
    if (properties.hasCollision) {
        const collider = prop.addComponent(PhysicalCollider);
        collider.data.boxSize = new Vector(prop.scale.x / 4, 8);
        collider.data.boxOffset = new Vector(0, -prop.scale.y / 2 + 4);
    }
    prop.castsShadow = properties.castsShadow;
    return prop;
}

export { PropFactory };
