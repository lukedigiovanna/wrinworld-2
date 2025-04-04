import { spriteRenderer } from "../renderers";
import { Item } from "../items";
import { GameObjectFactory, GameObject } from "./index";
import { Vector } from "../utils";
import { Hitbox, Physics } from "../components";
import { getSound } from "../soundLoader";

const ITEM_LIFESPAN = 180;

const ItemDropFactory: GameObjectFactory = (item: Item, position: Vector) => {
    const itemDrop = new GameObject();
    itemDrop.scale.setComponents(16, 16);
    itemDrop.renderer = spriteRenderer(item.iconSpriteID);
    itemDrop.position.set(position);
    itemDrop.lifespan = ITEM_LIFESPAN;
    itemDrop.addComponent(Hitbox);
    itemDrop.addComponent(Physics);
    itemDrop.addComponent((gameObject: GameObject) => {
        return {
            id: "item-bob-effect",
            update(dt) {
                gameObject.renderer?.data.offset.setComponents(0, Math.sin(gameObject.age * 3) * 0.1);
            }
        }
    });
    itemDrop.addComponent((gameObject: GameObject) => {
        const data: any =  {
            hitbox: undefined,
        };
        return {
            id: "item-pickup",
            start() {
                data.hitbox = gameObject.getComponent("hitbox");
            },
            update(dt) {
                if (gameObject.age > 0.8 && data.hitbox.data.collidingWith.has(gameObject.game.player)) {
                    const inventoryManager = gameObject.game.player.getComponent("inventory-manager");
                    if (inventoryManager.data.inventory.addItem(item)) {
                        gameObject.destroy();
                        getSound("item_pickup").play();
                    }
                }
            },
        }
    });
    return itemDrop;
}

export { ItemDropFactory };