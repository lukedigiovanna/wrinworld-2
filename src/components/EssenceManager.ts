import { EssenceOrbAttackFactory, GameObject } from "../gameObjects";
import { getImage } from "../imageLoader";
import { ComponentFactory } from "./";
import input from "../input";

function updateEssenceUI(essenceAmount: number, essenceMax: number) {
    // TODO: change this to be different jars based on the maxEssence amount
    const numberFrames = 9;
    const smallJarPrefix = "essence_jar_small_";

    const percent = essenceAmount / essenceMax;
    const frameNumber = Math.floor((numberFrames - 1) * percent);
    const frameID = `${smallJarPrefix}${frameNumber}`;
    const frame = getImage(frameID);

    $("#essence-jar").attr("src", frame.src);
    $("#essence-amount").text(essenceAmount);
    $("#essence-max").text(essenceMax);
}

const EssenceManager: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        essence: 0,
        maxEssence: 100,
        startingRate: 0.5,
        rate: 0.5,
        lastThrownEssenceTime: -999,
        addEssence(amount: number) {
            this.essence = Math.min(this.essence + amount, this.maxEssence);
            updateEssenceUI(this.essence, this.maxEssence);
        },
        useEssence(amount: number) {
            this.essence = Math.max(this.essence - amount, 0);
            updateEssenceUI(this.essence, this.maxEssence);
        }
    };
    return {
        id: "essence-manager",
        start() {
            updateEssenceUI(data.essence, data.maxEssence);
        },
        update(dt) {
            let attacking = false;
            if (data.essence >= 1 && input.isKeyDown("Space")) {
                const nearest = gameObject.game.getNearestGameObjectWithTag(gameObject.position, "portal");
                if (nearest) {
                    const { object, distance } = nearest;
                    if (distance <= 5) {
                        attacking = true;
                        const elapsed = gameObject.game.time - this.data.lastThrownEssenceTime;
                        if (elapsed >= this.data.rate) {
                            this.data.lastThrownEssenceTime = gameObject.game.time;
                            this.data.rate = Math.max(0.05, 0.9 * this.data.rate);
                            const portalHealth = object.getComponent("health");
                            if (portalHealth) {
                                // portalHealth.data.damage(1);
                                data.useEssence(1);
                                gameObject.game.addGameObject(EssenceOrbAttackFactory(
                                    1, gameObject.position, object
                                ));
                            }
                        }
                    }
                }
            }
            if (!attacking) {
                this.data.rate = this.data.startingRate;
            }
        },
        data
    }
}

export { EssenceManager };
