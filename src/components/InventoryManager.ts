import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import input from "../input";
import { Inventory } from "../items";

const InventoryManager: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        inventory: new Inventory(),
        inventoryDisplayed: false
    }
    return {
        id: "inventory-manager",
        start() {
            data.inventory.updateUI();
            input.registerScrollCallback((deltaY: number) => {
                const currIndex = data.inventory.selectedHotbarIndex;
                let newIndex;
                if (deltaY < 0) {
                    newIndex = (currIndex + 1) % data.inventory.hotbarSize; 
                }
                else {
                    if (currIndex === 0) {
                        newIndex = data.inventory.hotbarSize - 1;
                    }
                    else {
                        newIndex = currIndex - 1;
                    }
                }
                data.inventory.setSelectedHotbarSlot(newIndex);
            });
        },
        update(dt: number) {
            if (input.isKeyPressed("Digit1")) {
                data.inventory.setSelectedHotbarSlot(0);
            }
            if (input.isKeyPressed("Digit2")) {
                data.inventory.setSelectedHotbarSlot(1);
            }
            if (input.isKeyPressed("Digit3")) {
                data.inventory.setSelectedHotbarSlot(2);
            }
            if (input.isKeyPressed("Digit4")) {
                data.inventory.setSelectedHotbarSlot(3);
            }
            if (input.isKeyPressed("Digit5")) {
                data.inventory.setSelectedHotbarSlot(4);
            }
            if (input.isKeyPressed("Digit6")) {
                data.inventory.setSelectedHotbarSlot(5);
            }
            if (input.isKeyPressed("Digit7")) {
                data.inventory.setSelectedHotbarSlot(6);
            }
            if (input.isKeyPressed("Digit8")) {
                data.inventory.setSelectedHotbarSlot(7);
            }
            if (input.isKeyPressed("Digit9")) {
                data.inventory.setSelectedHotbarSlot(8);
            }

            if (input.isKeyPressed("KeyE")) {
                // Toggle inventory display
                if (data.inventoryDisplayed) {
                    $("#hotbar-screen").show();
                    $("#inventory-screen").hide();
                }
                else {
                    $("#hotbar-screen").hide();
                    $("#inventory-screen").show();
                }
                data.inventoryDisplayed = !data.inventoryDisplayed;
            }
            
            if (input.mousePressed) {
                data.inventory.useSelectedItem(gameObject);
            }
        },
        data
    }
}

export { InventoryManager };