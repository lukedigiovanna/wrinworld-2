// registry of all the items in the game and logic for their usage

import { BulletFactory, GameObject } from "./gameObjects";
import { getImage } from "./imageLoader";
import input from "./input";

enum ItemIndex {
    STONE_SWORD,
    ZOMBIE_BRAINS,
    ZOMBIE_FLESH,
}

// Return true if using the item should consume it.
type UseItemFunction = (player: GameObject) => boolean;

interface Item {
    itemIndex: ItemIndex;
    iconSpriteID: string;
    maxStack: number;
    use?: UseItemFunction;
}

const itemsCodex: Item[] = [
    {
        itemIndex: ItemIndex.STONE_SWORD,
        iconSpriteID: "stone_sword_icon",
        maxStack: 1,
        use(player) {
            const bullet = BulletFactory(player.position, player.game.camera.screenToWorldPosition(input.mousePosition));
            player.game.addGameObject(bullet);
            return false;
        }
    },
    {
        itemIndex: ItemIndex.ZOMBIE_BRAINS,
        iconSpriteID: "zombie_brains",
        maxStack: 16,
        use(player) {
            console.log("[brraaaiiinnnss]");
            return true;
        }
    },
    {
        itemIndex: ItemIndex.ZOMBIE_FLESH,
        iconSpriteID: "zombie_flesh",
        maxStack: 64
    }
];

interface ItemDropChance {
    chance: number; // 0 to 1
    itemIndex: ItemIndex;
}

interface InventorySlot {
    item: Item;
    count: number;
}

const INVENTORY_SLOT_HTML = `
<div class="inventory-slot">
    <img class="slot-icon" src="assets/images/hotbar_slot.png" />
    <img class="item" />
    <span class="count"></span>
</div>
`

const INVENTORY_ROW_HTML = `<div class="inventory-row"> </div>`;

class Inventory {
    // Includes all the free space to place arbitrary items
    private size: number = 36;
    // The hotbar is the first N elements of the slots array.
    private _hotbarSize: number = 9;
    private slots: (InventorySlot | null)[];
    private inventorySlotDivs: JQuery<HTMLElement>[];
    private hotbarSlotDivs: JQuery<HTMLElement>[];
    private _selectedSlot: number = 0;

    constructor() {
        this.slots = Array.from({ length: this.size }, () => null);

        // Create the inventory UI
        this.inventorySlotDivs = [];
        $("#inventory").empty();

        const hotbarRow = $(INVENTORY_ROW_HTML); 
        for (let i = 0; i < this._hotbarSize; i++) {
            const inventorySlot = $(INVENTORY_SLOT_HTML);
            hotbarRow!.append(inventorySlot);
            this.inventorySlotDivs.push(inventorySlot);   
        }
        hotbarRow.css("marginTop", "20px");
        // Add the hotbar row after the regular inventory
        
        let currentRow;
        for (let i = this._hotbarSize; i < this.size; i++) {
            if (i % 9 === 0) {
                if (currentRow) {
                    $("#inventory").append(currentRow);
                }
                currentRow = $(INVENTORY_ROW_HTML);
            }
            const inventorySlot = $(INVENTORY_SLOT_HTML);
            currentRow!.append(inventorySlot);
            this.inventorySlotDivs.push(inventorySlot);   
        }
        if (currentRow) {
            $("#inventory").append(currentRow);
        }
        $("#inventory").append(hotbarRow);

        // Create the regular hotbar UI
        this.hotbarSlotDivs = [];
        $("#hotbar").empty();
        for (let i = 0; i < this._hotbarSize; i++) {
            const hotbarSlot = $(INVENTORY_SLOT_HTML);
            $("#hotbar").append(hotbarSlot);
            this.hotbarSlotDivs.push(hotbarSlot);
        }
        this.setSelectedHotbarSlot(this._selectedSlot);
    }

    // Returns true if the item was successfully added to the inventory
    // false otherwise.
    public addItem(item: Item): boolean {
        // First look if we can stack it anywhere
        let index = -1;
        let empty = -1;
        for (let i = 0; i < this.size; i++) {
            if (this.slots[i] !== null && 
                this.slots[i]!.item.itemIndex === item.itemIndex && 
                this.slots[i]!.count < item.maxStack) {
                index = i;
                break;
            }
            else if (empty === -1 && this.slots[i] === null) {
                empty = i;
            }
        }
        if (index !== -1) {
            this.slots[index]!.count++;
            this.updateUI();
            return true;
        }
        else if (empty !== -1) {
            this.slots[empty] = {
                item,
                count: 1
            };
            this.updateUI();
            return true;
        }
        else {
            return false;
        }
    }

    public setSelectedHotbarSlot(index: number) {
        if (index < 0 || index >= this._hotbarSize) {
            throw Error("Index out of bounds: " + index);
        }
        this.hotbarSlotDivs[this._selectedSlot].find(".slot-icon").attr("src", getImage("hotbar_slot").src);
        this._selectedSlot = index;
        this.hotbarSlotDivs[this._selectedSlot].find(".slot-icon").attr("src", getImage("hotbar_slot_selected").src);
    }

    private setSlotUI(slot: InventorySlot | null, slotDiv: JQuery<HTMLElement>) {
        if (slot === null) {
            slotDiv.find(".item").css("display", "none");
            slotDiv.find(".count").text("");
        }
        else {
            slotDiv.find(".item").css("display", "block");
            slotDiv.find(".item").attr("src", getImage(slot.item.iconSpriteID).src);
            slotDiv.find(".count").text(slot.count);
        }
    }

    public updateUI() {
        // Update the inventory UI
        for (let i = 0; i < this.size; i++) {
            this.setSlotUI(this.slots[i], this.inventorySlotDivs[i]);
        }

        // Update the hotbar UI
        for (let i = 0; i < this._hotbarSize; i++) {
            this.setSlotUI(this.slots[i], this.hotbarSlotDivs[i]);
        }
    }

    public get selectedHotbarIndex() {
        return this._selectedSlot;
    }

    public get hotbarSize() {
        return this._hotbarSize;
    }

    public getSelectedItem(): Item | null {
        const slot = this.slots[this._selectedSlot];
        return slot ? slot.item : null;
    }

    public useSelectedItem(player: GameObject) {
        const slot = this.slots[this._selectedSlot];
        const item = slot?.item;
        if (!item) {
            return;
        }
        if (item.use) {
            const consume = item.use(player);
            if (consume) {
                slot.count--;
                if (slot.count === 0) {
                    this.slots[this._selectedSlot] = null;
                }
                this.updateUI();
            }
        }
    }
};

export { itemsCodex, ItemIndex, Inventory };
export type { Item, ItemDropChance };
