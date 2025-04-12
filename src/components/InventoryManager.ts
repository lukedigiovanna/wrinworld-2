import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import input, { InputLayer } from "../input";
import { Inventory, SlotIndex } from "../inventory";
import { getTexture } from "../imageLoader";
import { Color, Vector } from "../utils";
import controls from "../controls";

const InventoryManager: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        inventory: undefined,
        selectedWeaponIndex: 0,
        inventoryDisplayed: false,
        setSelectedWeaponIndex(i: number) {
            this.inventory.unselectSlot({
                type: "weapon",
                index: this.selectedWeaponIndex
            }, true);
            this.inventory.selectSlot({
                type: "weapon",
                index: i
            }, true);
            this.selectedWeaponIndex = i;
        },
        useItem(slotIndex: SlotIndex) {
            this.inventory.pressItem(slotIndex, gameObject.game.camera.screenToWorldPosition(input.mousePosition));
            this.inventory.selectSlot(slotIndex);
            setTimeout(() => {
                this.inventory.unselectSlot(slotIndex);
            }, 75);
        }
    }
    return {
        id: "inventory-manager",
        start() {
            data.inventory = new Inventory(gameObject);
            data.setSelectedWeaponIndex(0);
            input.registerScrollCallback((deltaY: number) => {
                const currIndex = data.selectedWeaponIndex;
                let newIndex;
                if (deltaY < 0) {
                    newIndex = (currIndex + 1) % 2; 
                }
                else {
                    if (currIndex === 0) {
                        newIndex = 2 - 1;
                    }
                    else {
                        newIndex = currIndex - 1;
                    }
                }
                data.setSelectedWeaponIndex(newIndex);
            });
        },
        update(dt: number) {
            if (input.isKeyPressed(controls.selectWeapon1.code)) {
                data.setSelectedWeaponIndex(0);
            }
            if (input.isKeyPressed(controls.selectWeapon2.code)) {
                data.setSelectedWeaponIndex(1);
            }

            if (input.isKeyPressed(controls.utility1.code)) {
                data.useItem({
                    type: "utility",
                    index: 0,
                });
            }
            if (input.isKeyPressed(controls.utility2.code)) {
                data.useItem({
                    type: "utility",
                    index: 1,
                });
            }
            if (input.isKeyPressed(controls.consumable.code)) {
                data.useItem({
                    type: "consumable",
                    index: 0,
                });
            }

            if (input.isKeyPressed(controls.toggleInventory.code)) {
                data.inventory.toggleUI();
            }
            if (input.isKeyPressed(controls.toggleInventory.code, InputLayer.INVENTORY)) {
                data.inventory.toggleUI();
            }
            if (input.isKeyPressed("Escape", InputLayer.INVENTORY)) {
                data.inventory.toggleUI();
            }
            
            if (input.mousePressed()) {
                data.inventory.pressItem({
                    type: "weapon",
                    index: data.selectedWeaponIndex
                }, gameObject.game.camera.screenToWorldPosition(input.mousePosition));
            }
            if (input.mouseReleased()) {
                data.inventory.releaseItem({
                    type: "weapon",
                    index: data.selectedWeaponIndex
                }, gameObject.game.camera.screenToWorldPosition(input.mousePosition), 0);
            }

            data.inventory.updateCooldownUI();
        },
        render(camera) {
            const selectedWeaponSlot = data.inventory.getSlot({
                type: "weapon",
                index: data.selectedWeaponIndex
            });
            if (selectedWeaponSlot) {
                const selected = selectedWeaponSlot.item;
                let sign = Math.sign(gameObject.scale.x)
                const offset = 12;
                camera.color = Color.WHITE;
                camera.drawTexture(
                    getTexture(selected.iconSpriteID), 
                    gameObject.position.x + offset * sign, gameObject.position.y - 6, 
                    16 * sign, 16
                );
            }
            const weaponManager = gameObject.getComponent("weapon-manager");
            if (weaponManager.data.charging) {
                const hitboxCenter = Vector.add(gameObject.position, gameObject.getComponent("hitbox").data.boxOffset);
                const mousePos = gameObject.game.camera.screenToWorldPosition(input.mousePosition);
                const angle = Vector.subtract(mousePos, hitboxCenter).angle;
                camera.drawTexture(getTexture("right_arrow"), hitboxCenter.x + 10, hitboxCenter.y, 20, 13, angle, new Vector(-10, 0));
            }
        },
        data
    }
}

export { InventoryManager };