import { Powerup, powerups } from "../game/powerups";
import { GameObject, GameObjectFactory } from "./";
import { getTexture } from "../assets/imageLoader";
import { spriteRenderer } from "../rendering/renderers";
import { Color, MathUtils, Vector } from "../utils";
import { ComponentFactory, Hitbox, ParticleLayer } from "../components";

const HeartOutline: ComponentFactory = (gameObject) => {
    return {
        id: "heart",
        update(dt) {
            const t = gameObject.age * 3;
            const x = 16 * Math.sin(t) ** 3
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            gameObject.game.addPartialParticle({
                position: new Vector(gameObject.position.x + x, gameObject.position.y + y),
                color: Color.hex("#db58c5").vary(0.1),
                angularVelocity: MathUtils.random(-3, 3),
                velocity: MathUtils.randomVector(MathUtils.random(0.75, 1.5)),
                scale: MathUtils.random(1, 2),
                lifetime: MathUtils.random(1, 1.5),
                layer: ParticleLayer.ABOVE_OBJECTS
            })
        }
    }
}

const PowerupFactory: GameObjectFactory = (powerup: Powerup, position: Vector) => {
    const powerupObject = new GameObject();
    powerupObject.position.set(position);
    const powerupData = powerups[powerup];
    const texture = getTexture(powerupData.spriteID);
    powerupObject.scale.setComponents(texture.width, texture.height);
    powerupObject.renderer = spriteRenderer(powerupData.spriteID);
    powerupObject.castsShadow = true;

    if (powerupData.outline === "heart") {
        powerupObject.addComponent(HeartOutline);
    }

    powerupObject.addComponent((gameObject) => {
        return {
            id: "powerup-bob",
            update(dt) {
                gameObject.renderer?.data.offset.setComponents(0, Math.sin(gameObject.age * 3) * 1.2);
            }
        }
    });

    powerupObject.addComponent((gameObject) => {
        return {
            id: "powerup",
            update(dt) {
                const distance = gameObject.position.distanceTo(gameObject.game.player.hitboxCenter);
                if (distance < 8 && powerupData.apply(gameObject.game.player)) {
                    gameObject.destroy();
                }
            },
        }
    });

    return powerupObject;
}

export { PowerupFactory };
