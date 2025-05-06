import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import input, { InputLayer } from "../input";
import { Inventory, SlotLocator } from "../game/inventory";
import { getTexture } from "../assets/imageLoader";
import { Color } from "../utils";
import controls, { Controls } from "../controls";
import { ArealEffect } from "../game/arealEffect";
import { ItemIndex } from "../game/items";

const InventoryManager: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        inventory: undefined,
        inventoryDisplayed: false,
        movementData: undefined,
        waterTimer: 0,
        setSelectedWeaponIndex(i: number) {
            this.inventory.selectSlot({
                type: "weapon",
                index: i
            }, true);
        },
        checkInput(control: keyof Controls, slotIndex: SlotLocator) {
            if (input.isKeyPressed(controls[control].code)) {
                this.inventory.pressItem(
                    slotIndex,
                    gameObject.game.camera.screenToWorldPosition(input.mousePosition)
                );
            }
            if (input.isKeyReleased(controls[control].code)) {
                this.inventory.releaseItem(
                    slotIndex,
                    gameObject.game.camera.screenToWorldPosition(input.mousePosition)
                );
            }
        }
    }
    return {
        id: "inventory-manager",
        start() {
            data.inventory = new Inventory(gameObject);
            input.registerScrollCallback((deltaY: number) => {
                const currIndex = data.inventory.getSelectedIndex("weapon");
                if (deltaY < 0) {
                    data.setSelectedWeaponIndex(currIndex + 1);
                }
                else {
                    data.setSelectedWeaponIndex(currIndex - 1);
                }
            });
            data.movementData = gameObject.getComponent("movement-data");
        },
        update(dt: number) {
            const inventory = data.inventory as Inventory;

            data.movementData.data.charging = inventory.charging;

            if (input.isKeyPressed(controls.selectWeapon1.code)) {
                data.setSelectedWeaponIndex(0);
            }
            if (input.isKeyPressed(controls.selectWeapon2.code)) {
                data.setSelectedWeaponIndex(1);
            }

            data.checkInput("utility1", {
                type: "utility",
                index: 0,
            });
            data.checkInput("utility2", {
                type: "utility",
                index: 1,
            });
            data.checkInput("consumable", {
                type: "consumable",
                index: 0,
            });

            if (input.isKeyPressed(controls.toggleInventory.code)) {
                inventory.toggleUI();
            }
            if (input.isKeyPressed(controls.toggleInventory.code, InputLayer.INVENTORY)) {
                inventory.toggleUI();
            }
            if (input.isKeyPressed("Escape", InputLayer.INVENTORY)) {
                inventory.toggleUI();
            }
            
            const mousePos = gameObject.game.camera.screenToWorldPosition(input.mousePosition);
            if (input.mousePressed()) {
                inventory.pressItem({
                    type: "weapon",
                    index: inventory.getSelectedIndex("weapon") as number
                }, mousePos);
            }
            if (input.mouseReleased()) {
                data.inventory.releaseItem({
                    type: "weapon",
                    index: inventory.getSelectedIndex("weapon")
                }, mousePos);
            }

            inventory.checkChargedItem(mousePos);

            const quiver = inventory.getSlot({ index: 0, type: "quiver" });
            if (quiver && 
                quiver.count < quiver.item.maxStack && 
                quiver.item.itemIndex === ItemIndex.WATER_BOTTLE &&
                gameObject.hasArealEffect(ArealEffect.WATER)) {
                data.waterTimer += dt;
                while (data.waterTimer >= 0.2) {
                    inventory.addItemIndex(ItemIndex.WATER_BOTTLE);
                    data.waterTimer -= 0.2;
                }
            }
            else {
                data.waterTimer = 0;
            }

            data.inventory.updateUI();
        },
        render(camera) {
            let activeItem = data.inventory.getChargingItem();
            if (!activeItem) {
                activeItem = data.inventory.getSelectedItem("weapon");
            } 
            if (activeItem) {
                let sign = Math.sign(gameObject.scale.x)
                const offset = 12;
                camera.color = Color.WHITE;
                camera.drawTexture(
                    getTexture(activeItem.iconSpriteID), 
                    gameObject.position.x + offset * sign, gameObject.position.y - 4, 
                    16 * sign, 16
                );
            }
            
            // const weaponManager = gameObject.getComponent("weapon-manager");
            // if (weaponManager.data.charging) {
            //     const hitboxCenter = Vector.add(gameObject.position, gameObject.getComponent("hitbox").data.boxOffset);
            //     const mousePos = gameObject.game.camera.screenToWorldPosition(input.mousePosition);
            //     const angle = Vector.subtract(mousePos, hitboxCenter).angle;
            //     camera.drawTexture(getTexture("right_arrow"), hitboxCenter.x + 10, hitboxCenter.y, 20, 13, angle, new Vector(-10, 0));
            // }
        },
        data
    }
}

export { InventoryManager };