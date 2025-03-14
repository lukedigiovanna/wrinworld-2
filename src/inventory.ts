import { Item, ItemIndex, itemsCodex } from "./items";
import { getImage } from "./imageLoader";
import { GameObject } from "./gameObjects";
import input, { InputLayer } from "./input";
import { Vector } from "./utils";

interface InventorySlot {
    item: Item;
    count: number;
}

const INVENTORY_SLOT_HTML = `
<div class="inventory-slot">
    <img class="slot-icon" src="assets/images/ui/hotbar_slot.png" />
    <img class="item" />
    <span class="count"></span>
</div>
`

const INVENTORY_ROW_HTML = `<div class="inventory-row"> </div>`;

class Inventory {
    // Includes all the free space to place arbitrary items
    private size: number = 18;
    // The hotbar is the first N elements of the slots array.
    private _hotbarSize: number = 9;
    private slots: (InventorySlot | null)[];
    private inventorySlotDivs: JQuery<HTMLElement>[];
    private hotbarSlotDivs: JQuery<HTMLElement>[];
    private _selectedSlot: number = -1;
    private player: GameObject;
    private heldSlot: InventorySlot | null = null;
    private inventoryDisplayed: boolean = false;

    constructor(player: GameObject) {
        this.player = player;

        this.slots = Array.from({ length: this.size }, () => null);

        const updateDisplayPositions = (ev: any) => {
            if (this.heldSlot) {
                const heldItemDisplay = $("#held-item-display");
                const width = heldItemDisplay.outerWidth() as number;
                const height = heldItemDisplay.outerHeight() as number;
                heldItemDisplay.css("left", ev.clientX - width / 2);
                heldItemDisplay.css("top", ev.clientY - height / 2);
            }
            else {
                const itemDisplay = $("#item-display");
                const width = itemDisplay.outerWidth() as number;
                let x = ev.clientX;
                if (ev.clientX + width >= window.innerWidth) {
                    x -= width;
                }
                let y = ev.clientY;
                const height = itemDisplay.outerHeight() as number;
                if (ev.clientY + height >= window.innerHeight) {
                    y -= height;
                }
                itemDisplay.css("left", x);
                itemDisplay.css("top", y);
            }
        }

        // Create the inventory UI
        this.inventorySlotDivs = [];
        $("#inventory").empty();

        const addInventorySlot = (row: JQuery<HTMLElement>, index: number) => {
            const inventorySlot = $(INVENTORY_SLOT_HTML);
            row!.append(inventorySlot);
            const showItemDisplay = () => {
                const itemDisplay = $("#item-display");
                const slot = this.slots[index];
                if (slot) {
                    itemDisplay.find("#item-name").text(slot.item.displayName);
                    itemDisplay.find("#item-category").text(slot.item.category);
                    itemDisplay.find("#item-icon").attr("src", getImage(slot.item.iconSpriteID).src);
                    itemDisplay.show();
                }
            }
            inventorySlot.on("mouseenter", () => {
                if (!this.heldSlot) {
                    showItemDisplay();
                }
            });
            inventorySlot.on("mouseleave", () => {
                $("#item-display").hide();
            });
            inventorySlot.on("click", (ev) => {
                const slot = this.slots[index];
                if (this.heldSlot === null) {
                    if (slot !== null) { 
                        // "pick up" the item in the slot.
                        this.heldSlot = this.slots[index];
                        this.slots[index] = null;
                        this.setSlotUI(null, this.inventorySlotDivs[index]);
                    }
                    $("#item-display").hide();
                }
                else {
                    // Place the held slot
                    if (this.slots[index] !== null && this.slots[index].item.itemIndex === this.heldSlot.item.itemIndex) {
                        // Transfer as much count as possible
                        const count = Math.min(
                            this.heldSlot.count,
                            this.heldSlot.item.maxStack - this.slots[index].count
                        );
                        this.slots[index].count += count;
                        this.heldSlot.count -= count;
                        if (this.heldSlot.count <= 0) {
                            this.heldSlot = null;
                        }
                    }
                    else {
                        // Swap the slots
                        const temp = this.slots[index];
                        this.slots[index] = this.heldSlot;
                        this.heldSlot = temp;
                    }
                    this.setSlotUI(this.slots[index], this.inventorySlotDivs[index]);
                }

                this.setSlotUI(this.heldSlot, $("#held-item-display"));
                if (this.heldSlot === null) {
                    showItemDisplay();
                }
                this.updateUI();
                updateDisplayPositions(ev);
            });
            inventorySlot.css("cursor", "pointer");
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

        $("#inventory-screen").on("mousemove", updateDisplayPositions);

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
            if (empty === this._selectedSlot && item.equip) {
                item.equip(this.player);
            }
            return true;
        }
        else {
            return false;
        }
    }

    public addItemIndex(itemIndex: ItemIndex) {
        this.addItem(itemsCodex.get(itemIndex));
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

    public getSelectedItem(): Item | null {
        const slot = this.slots[this._selectedSlot];
        return slot ? slot.item : null;
    }

    public useSelectedItem(target: Vector) {
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
            const success = item.use(this.player, target);
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

    public toggleUI() {
        if (this.inventoryDisplayed) {
            $("#inventory-screen").hide();
            if (this.heldSlot !== null) {
                for (let i = 0; i < this.heldSlot.count; i++) {
                    if (!this.addItem(this.heldSlot.item)) {
                        // Need to add it to the world!
                        // what do we do here!
                        // need to do something or items will disappear
                        // when the inventory is full
                        //.... i will worry about this later :)
                        break;
                    }
                }
                this.heldSlot = null;
                this.setSlotUI(this.heldSlot, $("#held-item-display"));
            }
            input.layer = InputLayer.GAME;
        }
        else {
            $("#inventory-screen").show();
            input.layer = InputLayer.INVENTORY;
        }
        this.inventoryDisplayed = !this.inventoryDisplayed;
    }

    public get selectedHotbarIndex() {
        return this._selectedSlot;
    }

    public get hotbarSize() {
        return this._hotbarSize;
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
};

export { Inventory };
