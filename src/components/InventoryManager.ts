import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import input, { InputLayer } from "../input";
import { Item } from "../items";
import { Inventory } from "../inventory";
import { getTexture } from "../imageLoader";
import { Color, Vector } from "../utils";

const InventoryManager: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        inventory: undefined,
        inventoryDisplayed: false
    }
    return {
        id: "inventory-manager",
        start() {
            data.inventory = new Inventory(gameObject);
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

            if (input.isKeyPressed("KeyE")) {
                data.inventory.toggleUI();
            }
            if (input.isKeyPressed("KeyE", InputLayer.INVENTORY)) {
                data.inventory.toggleUI();
            }
            if (input.isKeyPressed("Escape", InputLayer.INVENTORY)) {
                data.inventory.toggleUI();
            }
            
            if (input.mousePressed()) {
                data.inventory.pressSelectedItem(gameObject.game.camera.screenToWorldPosition(input.mousePosition));
            }
            if (input.mouseReleased()) {
                data.inventory.releaseSelectedItem(gameObject.game.camera.screenToWorldPosition(input.mousePosition), 0);
            }

            // if (input.isKeyPressed("ArrowLeft")) {
            //     data.inventory.useSelectedItem(Vector.add(gameObject.position, Vector.left()));
            // }
            // if (input.isKeyPressed("ArrowRight")) {
            //     data.inventory.useSelectedItem(Vector.add(gameObject.position, Vector.right()));
            // }
            // if (input.isKeyPressed("ArrowDown")) {
            //     data.inventory.useSelectedItem(Vector.add(gameObject.position, Vector.down()));
            // }
            // if (input.isKeyPressed("ArrowUp")) {
            //     data.inventory.useSelectedItem(Vector.add(gameObject.position, Vector.up()));
            // }
        },
        render(camera) {
            // const selected = data.inventory.getSelectedItem() as Item;
            // if (selected) {
            //     let sign = Math.sign(gameObject.scale.x)
            //     const offset = 12;
            //     camera.color = Color.WHITE;
            //     camera.drawTexture(
            //         getTexture(selected.iconSpriteID), 
            //         gameObject.position.x + offset * sign, gameObject.position.y - 6, 
            //         16 * sign, 16
            //     );
            // }
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