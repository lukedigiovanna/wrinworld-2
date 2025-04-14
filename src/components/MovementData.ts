import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import { TileIndex } from "../tiles";

// Very simple component to centrally store movement data for objects that have
// variable speeds like enemies and players.
const MovementData: ComponentFactory = (gameObject: GameObject) => {
    return {
        id: "movement-data",
        data: {
            baseSpeed: 100,
            sprintModifier: 1.5,
            chargingModifier: 0.3,
            attackingPortalModifier: 0.5,
            waterModifier: 0.5,
            modifier: 1.0,
            sprinting: false,
            charging: false,
            attackingPortal: false,
            getSpeed() {
                let realModifier = 1.0;
                realModifier *= this.modifier;
                if (this.sprinting) realModifier *= this.sprintModifier;
                if (this.charging) realModifier *= this.chargingModifier;
                if (this.attackingPortal) realModifier *= this.attackingPortalModifier;
                let pos = gameObject.position.copy();
                if (gameObject.hasComponent("hitbox")) {
                    pos.add(gameObject.getComponent("hitbox").data.boxOffset);
                }
                if (gameObject.game.getTileIndex(pos) === TileIndex.WATER) {
                    realModifier *= this.waterModifier;
                }
                return this.baseSpeed * realModifier;
            }
        },
        update(dt) {
            
        },
    }
}

export { MovementData };