import { Item, ItemIndex, itemsCodex, ItemStat, ItemStatIndex, itemStatPropertiesCodex } from "./items";
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

const INVENTORY_BUFF_SLOT_HTML = `
<div class="inventory-slot">
    <img class="slot-icon" src="assets/images/ui/buff_slot.png" />
    <img class="item" />
    <span class="count"></span>
</div>
`

const INVENTORY_ROW_HTML = `<div class="inventory-row"> </div>`;

class Inventory {
    // Includes all the free space to place arbitrary items
    private size: number = 27;
    // The hotbar is the first N elements of the slots array.
    private _hotbarSize: number = 9;
    private slots: (InventorySlot | null)[];
    private inventorySlotDivs: JQuery<HTMLElement>[];
    private hotbarSlotDivs: JQuery<HTMLElement>[];
    private _selectedSlot: number = -1;
    private numberOfBuffSlots: number = 3;
    private buffSlots: (InventorySlot | null)[];
    private buffSlotDivs: JQuery<HTMLElement>[];

    private player: GameObject;
    private heldSlot: InventorySlot | null = null;
    private inventoryDisplayed: boolean = false;

    constructor(player: GameObject) {
        this.player = player;

        this.slots = Array.from({ length: this.size }, () => null);
        this.buffSlots = Array.from({ length: this.numberOfBuffSlots }, () => null);

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

        const addInventorySlot = (
                row: JQuery<HTMLElement>,
                html: string,
                index: number, 
                slotArray: (InventorySlot | null)[], 
                slotDivsArray: JQuery<HTMLElement>[]) => {
            const inventorySlot = $(html);
            row!.append(inventorySlot);
            const showItemDisplay = () => {
                const itemDisplay = $("#item-display");
                const slot = slotArray[index];
                if (slot) {
                    itemDisplay.find("#item-name").text(slot.item.displayName);
                    itemDisplay.find("#item-category").text(slot.item.category);
                    itemDisplay.find("#item-icon").attr("src", getImage(slot.item.iconSpriteID).src);
                    itemDisplay.find("#item-description").text(slot.item.description);
                    const statsList = itemDisplay.find("#item-stats-list");
                    statsList.empty();
                    itemDisplay.find("#item-stats-title").hide();
                    let stats: ItemStat[] = [];
                    if (slot.item.essenceCost > 0) {
                        stats.push({
                            statIndex: ItemStatIndex.ESSENCE_COST,
                            value: slot.item.essenceCost,
                        });
                    }
                    if (slot.item.getStats) {
                        stats = [...stats, ...slot.item.getStats()];
                    }
                        
                    if (stats.length > 0) {
                        itemDisplay.find("#item-stats-title").show();
                    }
                    for (let i = 0; i < stats.length; i++) {
                        const stat = stats[i];
                        const statProperties = itemStatPropertiesCodex.get(stat.statIndex);
                        const value = statProperties.isPercent ? Math.round(stat.value * 100) : Math.round(stat.value * 10) / 10;
                        const sign = statProperties.showSign ? (value >= 0 ? "+" : "-") : "";
                        statsList.append($(`
                            <li>${statProperties.displayName}: ${sign}${value}${statProperties.unit}</li>
                        `))
                    }
                    
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
                const slot = slotArray[index];
                if (this.heldSlot === null) {
                    if (slot !== null) { 
                        // "pick up" the item in the slot.
                        this.heldSlot = slot;
                        if (slotArray === this.buffSlots) {
                            if (slot.item.unequip) {
                                slot.item.unequip(this.player);
                            }
                        }
                        slotArray[index] = null;
                        this.setSlotUI(null, slotDivsArray[index]);
                    }
                    $("#item-display").hide();
                }
                else {
                    // Place the held slot
                    if (slotArray[index] !== null && slotArray[index].item.itemIndex === this.heldSlot.item.itemIndex) {
                        // Transfer as much count as possible
                        const count = Math.min(
                            this.heldSlot.count,
                            this.heldSlot.item.maxStack - slotArray[index].count
                        );
                        slotArray[index].count += count;
                        this.heldSlot.count -= count;
                        if (this.heldSlot.count <= 0) {
                            this.heldSlot = null;
                        }
                    }
                    else {
                        // Swap the slots
                        // can only place in an upgrade slot if the item is an upgrade!
                        if (slotArray !== this.buffSlots || this.heldSlot.item.category === "Buff") {
                            if (slotArray === this.buffSlots) {
                                if (this.heldSlot.item.equip) {
                                    this.heldSlot.item.equip(this.player);
                                }
                                if (slotArray[index] !== null && slotArray[index].item.unequip) {
                                    slotArray[index].item.unequip(player);
                                }
                            }

                            const temp = slotArray[index];
                            slotArray[index] = this.heldSlot;
                            this.heldSlot = temp;
                        }
                    }
                    this.setSlotUI(slotArray[index], slotDivsArray[index]);
                }

                this.setSlotUI(this.heldSlot, $("#held-item-display"));
                if (this.heldSlot === null) {
                    showItemDisplay();
                }
                this.updateUI();
                updateDisplayPositions(ev);
            });
            inventorySlot.css("cursor", "pointer");
            slotDivsArray.push(inventorySlot);
        }
        
        // Create the inventory UI
        this.inventorySlotDivs = [];
        this.buffSlotDivs = [];

        $("#inventory").empty();

        const upgradeRow = $(INVENTORY_ROW_HTML);
        for (let i = 0; i < this.numberOfBuffSlots; i++) {
            addInventorySlot(upgradeRow, INVENTORY_BUFF_SLOT_HTML, i, this.buffSlots, this.buffSlotDivs);
        }
        upgradeRow.css("marginBottom", "15px");
        $("#inventory").append(upgradeRow);

        const hotbarRow = $(INVENTORY_ROW_HTML); 
        for (let i = 0; i < this._hotbarSize; i++) {
            addInventorySlot(hotbarRow, INVENTORY_SLOT_HTML, i, this.slots, this.inventorySlotDivs);
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
            addInventorySlot(currentRow as JQuery<HTMLElement>, INVENTORY_SLOT_HTML, i, this.slots, this.inventorySlotDivs);
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
        if (item.use !== undefined) {
            let useIndex = -1;
            if (item.usesItem) {
                // Iterate up from selected slot
                for (let i = 1; i < this.slots.length; i++) {
                    const index = (i + this._selectedSlot) % this.slots.length;
                    for (const useItem of item.usesItem) {
                        if (this.slots[index]?.item.itemIndex === useItem) {
                            useIndex = index;
                            break;
                        }
                    }
                    if (useIndex >= 0) {
                        break;
                    }
                }
                if (useIndex < 0) {
                    return;
                }
            }
            // Check if the player has enough essence to use the item
            const essenceManager = this.player.getComponent("essence-manager");
            if (essenceManager.data.essence >= item.essenceCost) {
                const useSlot = this.slots[useIndex];
                const useItem = (useIndex >= 0 && useSlot) ? useSlot.item : undefined;
                const success = item.use(this.player, target, useItem);
                if (success) {
                    if (useIndex >= 0) {
                        this.decreaseItemCount(useIndex);
                    }
                    if (item.consumable) {
                        this.decreaseItemCount(this._selectedSlot);
                    }
                    essenceManager.data.useEssence(item.essenceCost);
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
            if (slot.count === 1) {
                slotDiv.find(".count").text("");
            }
            else {
                slotDiv.find(".count").text(slot.count);
            }
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
