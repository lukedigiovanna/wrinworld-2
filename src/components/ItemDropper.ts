import { GameObject } from "../gameObjects";
import { ComponentFactory } from "./index";
import { ItemDropChance, itemsCodex } from "../items";
import { ItemDropFactory } from "../gameObjects/ItemDrop";
import { MathUtils, Vector } from "../utils";

const ItemDropper: (itemPool: ItemDropChance[]) => ComponentFactory = (itemPool: ItemDropChance[]) => {
    return (gameObject: GameObject) => {
        return {
            id: "item-dropper",
            destroy() {
                for (let i = 0; i < itemPool.length; i++) {
                    if (Math.random() < itemPool[i].chance) {
                        gameObject.game.addGameObject(ItemDropFactory(
                            itemsCodex[itemPool[i].itemIndex], 
                            Vector.add(
                                gameObject.position, 
                                MathUtils.randomVector(MathUtils.random(0, 0.5))
                            )
                        ));
                    }
                }
            }
        }
    }
}

export { ItemDropper }
