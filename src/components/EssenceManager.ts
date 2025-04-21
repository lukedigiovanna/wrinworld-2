import { EssenceOrbAttackFactory, GameObject, PORTAL_ACTIVE_RADIUS } from "../gameObjects";
import { getImage } from "../imageLoader";
import { ComponentFactory } from "./";
import input from "../input";
import controls from "../controls";

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
        movementData: undefined,
        essencePickupDistance: 40,
        essence: 0,
        maxEssence: 100,
        startingRate: 0.5,
        rate: 0.5,
        multiplier: 1,
        lastThrownEssenceTime: -999,
        // Returns the amount actually added
        addEssence(amount: number) {
            if (this.essence + amount > this.maxEssence) {
                amount = this.maxEssence - this.essence;
            }
            this.essence += amount;
            updateEssenceUI(this.essence, this.maxEssence);
            return amount;
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
            data.movementData = gameObject.getComponent("movement-data");
        },
        update(dt) {
            let attacking = false;
            if (data.essence >= 1 && input.isKeyDown(controls.attackPortal.code)) {
                const nearest = gameObject.game.getNearestGameObjectWithFilter(gameObject.position, (gameObject) => gameObject.tag === "portal");
                if (nearest) {
                    const { object, distance } = nearest;
                    if (distance <= PORTAL_ACTIVE_RADIUS) {
                        attacking = true;
                        const elapsed = gameObject.game.time - this.data.lastThrownEssenceTime;
                        if (elapsed >= this.data.rate) {
                            if (object.hasComponent("essence-damage-tracker")) {
                                const tracker = object.getComponent("essence-damage-tracker");
                                if (tracker.data.effectiveHP > 0) {
                                    this.data.lastThrownEssenceTime = gameObject.game.time;
                                    this.data.rate = Math.max(0.05, 0.9 * this.data.rate);
                                    data.useEssence(1);
                                    gameObject.game.addGameObject(EssenceOrbAttackFactory(
                                        data.multiplier, gameObject.position, object
                                    ));
                                    tracker.data.effectiveHP -= data.multiplier;
                                    data.multiplier *= 1.02;
                                }
                                else {
                                    attacking = false;
                                }
                            }
                            else {
                                attacking = false;
                            }
                        }
                    }
                }
            }
            if (!attacking) {
                this.data.rate = this.data.startingRate;
                this.data.multiplier = 1;
            }
            this.data.movementData.data.attackingPortal = attacking;
        },
        data
    }
}

export { EssenceManager };
