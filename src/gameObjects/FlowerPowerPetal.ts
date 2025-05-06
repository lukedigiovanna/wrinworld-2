import { fireProjectile } from "../game/weapons";
import { getTexture } from "../assets/imageLoader";
import { spriteRenderer } from "../rendering/renderers";
import { Ease, Vector, MathUtils } from "../utils";
import { GameObject, GameObjectFactory } from "./";
import { ProjectileIndex, projectilesCodex } from "../game/projectiles";

const FlowerPowerPetalFactory: GameObjectFactory = (owner: GameObject, p: number) => {
    const petal = new GameObject();
    const angle = p * Math.PI * 2;
    petal.position = owner.position.plus(new Vector(Math.cos(angle), Math.sin(angle)).scaled(12));
    const texture = getTexture("flower_power_petal");
    petal.scale = new Vector(texture.width, texture.height);
    petal.renderer = spriteRenderer("flower_power_petal");
    petal.rotation = angle;
    petal.zIndex = 16;
    petal.lifespan = MathUtils.random(3, 5);
    petal.team = owner.team;
    petal.addComponent((gameObject) => {
        return {
            id: "flower-power-petal",
            update(dt) {
                const x = gameObject.age;
                const d = Ease.outElastic(x) * 12;
                const a = angle + gameObject.age * 2;
                gameObject.position = owner.position
                                        .plus(new Vector(Math.cos(a), Math.sin(a))
                                        .scaled(d));
                gameObject.rotation = a;
            },
            destroy() {
                fireProjectile(
                    projectilesCodex[ProjectileIndex.FLOWER_POWER_PETAL], 
                    gameObject, 
                    gameObject.position.plus(owner.position.directionTowards(gameObject.position))
                )
            },
        }
    });
    return petal;
}

export { FlowerPowerPetalFactory };
