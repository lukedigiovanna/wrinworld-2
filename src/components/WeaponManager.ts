import { ComponentFactory } from "./";
import { GameObject } from "../gameObjects";
import { Weapon, WeaponIndex, weaponsCodex } from "../weapons";
import { Vector } from "../utils";
import { Item } from "../items";

const WeaponManager: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        timeLastFired: 0,
        timeChargeStart: 0,
        charging: false,
        equippedWeapon: undefined,
        press(weaponIndex: WeaponIndex, target: Vector, uses?: Item) {
            const weapon = weaponsCodex.get(weaponIndex);
            // If the weapon has a charge, then do not fire now.
            const timeSinceLastFired = gameObject.game.time - this.timeLastFired;
            if (timeSinceLastFired < weapon.cooldown) {
                return false;
            }
            // if (!weapon.chargeable) {
                weapon.fire(gameObject, target, {uses});
                this.timeLastFired = gameObject.game.time;
                return true;
            // }
            // else {
            //     // Start a charge up.
            //     this.timeChargeStart = gameObject.game.time;
            //     this.charging = true;
            //     return false;
            // }
        },
        release(weaponIndex: WeaponIndex, target: Vector, uses?: Item) {
            const weapon = weaponsCodex.get(weaponIndex);
            const timeSinceLastFired = gameObject.game.time - this.timeLastFired;
            if (timeSinceLastFired < weapon.cooldown) {
                return false;
            }
            if (this.charging) {
                const maxCharge = weapon.charge ? weapon.charge : 1;
                const charge = gameObject.game.time - this.timeChargeStart;
                weapon.fire(gameObject, target, {uses, charge: Math.min(charge / maxCharge, 1)});
                this.timeLastFired = gameObject.game.time;
                this.charging = false;
                return true;
            }
            else {
                return false;
            }
        },
        equip(weaponIndex: WeaponIndex | undefined) {
            this.timeLastFired = gameObject.game.time;
            if (weaponIndex !== undefined) {
                this.equippedWeapon = weaponsCodex.get(weaponIndex);
            }
            else {
                this.equippedWeapon = undefined;
            }
        },
    };
    return {
        id: "weapon-manager",
        data
    }
}

export { WeaponManager };