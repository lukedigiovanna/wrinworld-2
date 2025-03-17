import { ComponentFactory } from "./";
import { GameObject } from "../gameObjects";
import { WeaponIndex, weaponsCodex } from "../weapons";
import { Vector } from "../utils";
import { Item } from "../items";

const WeaponManager: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        timeLastFired: 0,
        equippedWeapon: undefined,
        fire(weaponIndex: WeaponIndex, target: Vector, uses?: Item) {
            const weapon = weaponsCodex.get(weaponIndex);
            const timeSinceLastFired = gameObject.game.time - this.timeLastFired;
            if (timeSinceLastFired >= weapon.cooldown) {
                weapon.fire(gameObject, target, uses);
                this.timeLastFired = gameObject.game.time;
                return true;
            }
            return false;
        },
        equip(weaponIndex: WeaponIndex | undefined) {
            this.timeLastFired = gameObject.game.time;
            if (weaponIndex !== undefined) {
                this.equippedWeapon = weaponsCodex.get(weaponIndex);
            }
            else {
                this.equippedWeapon = undefined;
            }
        }
    };
    return {
        id: "weapon-manager",
        data
    }
}

export { WeaponManager };