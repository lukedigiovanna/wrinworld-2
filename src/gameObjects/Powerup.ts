import { Powerup, powerups } from "../game/powerups";
import { GameObject, GameObjectFactory } from "./";
import { getTexture } from "../assets/imageLoader";
import { spriteRenderer } from "../rendering/renderers";
import { Color, MathUtils, Vector } from "../utils";
import { ComponentFactory, Hitbox, ParticleLayer } from "../components";

interface ParametricCurve {
    function: (t: number, scale?: number) => Vector;
    derivative: (t: number) => Vector;
}

const heartCurve: ParametricCurve = {
    function(t, scale=1) {
        return new Vector(
            scale * (16 * Math.sin(t) ** 3),
            scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
        );
    },
    derivative(t) {
        return new Vector(
            48 * Math.sin(t) ** 2 * Math.cos(t),
            -13 * Math.sin(t) + 10 * Math.sin(2 * t) + 6 * Math.sin(3 * t) + 4 * Math.sin(4 * t)
        );
    }
}

const HeartOutline: ComponentFactory = (gameObject) => {
    return {
        id: "heart",
        update(dt) {
            const t = gameObject.age * 3;
            const curvePosition = heartCurve.function(t);
            gameObject.game.addPartialParticle({
                position: gameObject.position.plus(curvePosition),
                color: Color.hex("#db58c5").vary(0.1),
                angularVelocity: MathUtils.random(-3, 3),
                velocity: MathUtils.randomVector(MathUtils.random(0.75, 1.5)),
                scale: MathUtils.random(1, 2),
                lifetime: MathUtils.random(1, 1.5),
                layer: ParticleLayer.ABOVE_OBJECTS
            })
        },
        destroy() {
            for (let t = 0; t < Math.PI * 2; t += Math.PI * 2 / 60) {
                const curvePosition = heartCurve.function(t);
                const outPosition = heartCurve.function(t, 2);
                const normal = outPosition.minus(curvePosition).normalized().scaled(8);
                gameObject.game.addPartialParticle({
                    position: gameObject.position.plus(curvePosition),
                    color: Color.hex("#db58c5").vary(0.1),
                    angularVelocity: MathUtils.random(-3, 3),
                    velocity: normal.plus(MathUtils.randomVector(MathUtils.random(0, 2))),
                    scale: MathUtils.random(1, 2),
                    lifetime: MathUtils.random(1, 1.5),
                    layer: ParticleLayer.ABOVE_OBJECTS
                })
            }
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
