import { GameObject } from "../gameObjects";

enum Powerup {
    BLUEBERRIES,
}

type PowerupOutlineType = "heart";

interface PowerupData {
    spriteID: string;
    outline: PowerupOutlineType;
    apply: (player: GameObject) => boolean;
}

interface PowerupDropChance {
    chance: number;
    powerup: Powerup;
}

const powerups: Record<Powerup, PowerupData> = {
[Powerup.BLUEBERRIES]: {
    spriteID: "blueberries",
    outline: "heart",
    apply(player) {
        return player.getComponent("health").data.heal(10, true) > 0;
    }
},
}

export { Powerup, PowerupData, powerups };
export type { PowerupDropChance };
