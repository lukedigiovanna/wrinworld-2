import { spriteRenderer } from "../renderers";
import { GameObject } from "../gameObjects";
import { ComponentFactory } from "./index";
import { Item } from "../items";
import { ItemDropFactory } from "../gameObjects/ItemDrop";

const ItemDropper: (item: Item) => ComponentFactory = (item: Item) => {
    return (gameObject: GameObject) => {
        return {
            id: "item-dropper",
            destroy() {
                gameObject.game.addGameObject(ItemDropFactory(item, gameObject.position));
            }    
        }
    }
}

export { ItemDropper }