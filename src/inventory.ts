import { Item, ItemIndex, itemsCodex } from "./items";
import { getImage } from "./imageLoader";
import { GameObject } from "./gameObjects";

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
    private _selectedSlot: number = -1;
    private player: GameObject;

    constructor(player: GameObject) {
        this.player = player;

        this.slots = Array.from({ length: this.size }, () => null);

        // Create the inventory UI
        this.inventorySlotDivs = [];
        $("#inventory").empty();

        const addInventorySlot = (row: JQuery<HTMLElement>, index: number) => {
            const inventorySlot = $(INVENTORY_SLOT_HTML);
            row!.append(inventorySlot);
            inventorySlot.on("mouseenter", () => {
                console.log("Mouse entered", index);
            });
            this.inventorySlotDivs.push(inventorySlot);
        }

        const hotbarRow = $(INVENTORY_ROW_HTML); 
        for (let i = 0; i < this._hotbarSize; i++) {
            addInventorySlot(hotbarRow, i);
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
            addInventorySlot(currentRow as JQuery<HTMLElement>, i);
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

        this.setSelectedHotbarSlot(0);
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

    public addItemIndex(itemIndex: ItemIndex) {
        this.addItem(itemsCodex[itemIndex]);
    }

    public setSelectedHotbarSlot(index: number) {
        if (index < 0 || index >= this._hotbarSize) {
            throw Error("Index out of bounds: " + index);
        }
        if (index === this._selectedSlot) {
            return;
        }
        if (this._selectedSlot !== -1) {
            this.hotbarSlotDivs[this._selectedSlot].find(".slot-icon").attr("src", getImage("hotbar_slot").src);
        }
        this._selectedSlot = index;
        this.hotbarSlotDivs[this._selectedSlot].find(".slot-icon").attr("src", getImage("hotbar_slot_selected").src);
        
        const slot = this.slots[this._selectedSlot];
        if (slot) {
            if (slot.item.equip) {
                slot.item.equip(this.player);
            }
        }
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

    // Returns the first index containing an item with the given index.
    // returns -1 if there is no such match.
    public indexOf(itemIndex: ItemIndex): number {
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i] && this.slots[i]?.item.itemIndex === itemIndex) {
                return i;
            }
        }
        return -1;
    }

    private decreaseItemCount(slotIndex: number) {
        if (this.slots[slotIndex] === null) {
            return;
        }
        this.slots[slotIndex].count--;
        if (this.slots[slotIndex].count === 0) {
            this.slots[slotIndex] = null;
        }
        this.updateUI();
    }

    public useSelectedItem() {
        const slot = this.slots[this._selectedSlot];
        const item = slot?.item;
        if (!item) {
            return;
        }
        if (item.use) {
            let useIndex = -1;
            if (item.usesItem) {
                useIndex = this.indexOf(item.usesItem);
                if (useIndex < 0) {
                    return;
                }
            }
            const success = item.use(this.player);
            if (success) {
                if (useIndex > -1) {
                    this.decreaseItemCount(useIndex);
                }
                if (item.consumable) {
                    this.decreaseItemCount(this._selectedSlot);
                }
            }
        }
    }
};

export { Inventory };
