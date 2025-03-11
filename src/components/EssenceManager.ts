import { getImage } from "../imageLoader";
import { ComponentFactory } from "./";

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

const EssenceManager: ComponentFactory = () => {
    const data: any = {
        essence: 0,
        maxEssence: 100,
        addEssence(amount: number) {
            this.essence = Math.min(this.essence + amount, this.maxEssence);
            updateEssenceUI(this.essence, this.maxEssence);
        }
    };
    return {
        id: "essence-manager",
        start() {
            updateEssenceUI(data.essence, data.maxEssence);
        },
        data
    }
}

export { EssenceManager };
