import { GameObject } from "../gameObjects";
import { ComponentFactory } from "./index";
import { MathUtils, Vector } from "../utils";
import { PowerupFactory } from "../gameObjects/Powerup";
import { PowerupDropChance, powerups } from "../game/powerups";

const PowerupDropper: (pool: PowerupDropChance[]) => ComponentFactory = (pool: PowerupDropChance[]) => {
    return (gameObject: GameObject) => {
        return {
            id: "item-dropper",
            destroy() {
                for (let i = 0; i < pool.length; i++) {
                    if (Math.random() < pool[i].chance) {
                        gameObject.game.addGameObject(PowerupFactory(
                            pool[i].powerup, 
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

export { PowerupDropper }
