import { spriteRenderer } from "../renderers";
import { Item } from "../items";
import { GameObjectFactory, GameObject } from "./index";
import { Vector } from "../utils";
import { Hitbox } from "../components";

const ItemDropFactory: GameObjectFactory = (item: Item, position: Vector) => {
    const itemDrop = new GameObject();
    itemDrop.renderer = spriteRenderer(item.iconSpriteID);
    itemDrop.position.set(position);
    itemDrop.addComponent(Hitbox)
    itemDrop.addComponent((gameObject: GameObject) => {
        return {
            id: "item-bob-effect",
            update(dt) {
                gameObject.renderer?.data.offset.setComponents(0, Math.sin(gameObject.age * 3) * 0.1);
            }
        }
    });
    itemDrop.addComponent((gameObject: GameObject) => {
        return {
            id: "item-pickup",
            onHitboxCollisionEnter(collision) {
                if (collision.tag === "player") {
                    const inventoryManager = collision.getComponent("inventory-manager");
                    if (inventoryManager?.data.inventory.addItem(item)) {
                        gameObject.destroy();
                    }
                }
            },
        }
    });
    return itemDrop;
}

export { ItemDropFactory };