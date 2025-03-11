import { ComponentFactory } from "./";
import { GameObject } from "../gameObjects";
import { WeaponIndex, weaponsCodex } from "../weapons";
import { Vector } from "../utils";

const WeaponManager: ComponentFactory = (gameObject: GameObject) => {
    const data = {
        timeLastFired: 0,
        fire: (weaponIndex: WeaponIndex, target: Vector) => {
            const weapon = weaponsCodex.get(weaponIndex);
            const timeSinceLastFired = gameObject.game.time - data.timeLastFired;
            if (timeSinceLastFired >= weapon.cooldown) {
                weapon.fire(gameObject, target);
                data.timeLastFired = gameObject.game.time;
                return true;
            }
            return false;
        },
        equip: (weaponIndex: WeaponIndex) => {
            data.timeLastFired = gameObject.game.time;
        }
    };
    return {
        id: "weapon-manager",
        data
    }
}

export { WeaponManager };