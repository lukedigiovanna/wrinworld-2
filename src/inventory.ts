import { Item, ItemCategory, ItemIndex, itemsCodex, ItemStat, ItemStatIndex, 
         itemStatPropertiesCodex } from "./items";
import { getImage } from "./imageLoader";
import { GameObject } from "./gameObjects";
import input, { InputLayer } from "./input";
import { Vector } from "./utils";
import { addNotification } from "./notifications";
import controls, { Controls } from "./controls";

interface InventorySlot {
    item: Item;
    count: number;
    lastTimeUsed?: number;
}

const slotTypes = ["free", "weapon", "quiver", "utility", "consumable", "buff"] as const;
type SlotType = typeof slotTypes[number];

interface SlotProps {
    iconID: string;
    selectedIconID?: string;
    acceptItemCategory: ItemCategory[] | null; // Null to accept all
    controlKeys?: (keyof Controls)[];
    equipOnAdd: boolean;
}

const slotTypeProperties: {[key in SlotType]: SlotProps} = {
    free: {
        iconID: "inventory_slot",
        acceptItemCategory: null,
        equipOnAdd: false,
    },
    weapon: {
        iconID: "weapon_slot",
        selectedIconID: "selected_weapon_slot",
        acceptItemCategory: ["Weapon"],
        controlKeys: ["selectWeapon1", "selectWeapon2"],
        equipOnAdd: true,
    },
    quiver: {
        iconID: "quiver_slot",
        acceptItemCategory: ["Ammo"],
        equipOnAdd: false,
    },
    utility: {
        iconID: "utility_slot",
        selectedIconID: "selected_utility_slot",
        acceptItemCategory: ["Utility", "Mystic Arts"],
        controlKeys: ["utility1", "utility2"],
        equipOnAdd: false,
    },
    consumable: {
        iconID: "consumable_slot",
        selectedIconID: "selected_consumable_slot",
        acceptItemCategory: ["Consumable"],
        controlKeys: ["consumable"],
        equipOnAdd: false,
    },
    buff: {
        iconID: "buff_slot",
        acceptItemCategory: ["Buff"],
        equipOnAdd: true,
    }
} as const;

type InventoryCounts = {
    [key in SlotType]: number;
}

interface SlotTypeSlots {
    slots: (InventorySlot | null)[];
    slotDivs: JQuery<HTMLElement>[];
}

type SlotReference = {
    [key in SlotType]: SlotTypeSlots;
}

interface SlotIndex {
    type: SlotType;
    index: number;
}

const defaultInventoryCounts: InventoryCounts = {
    free: 18,
    weapon: 2,
    quiver: 1,
    utility: 2,
    consumable: 1,
    buff: 2,
}

function inventorySlotHTML(type: SlotType) {
    const image = getImage(slotTypeProperties[type].iconID);
    return `
        <div class="inventory-slot">
            <img class="slot-icon" src="${image.src}" />
            <img class="item" />
            <img class="cooldown-overlay" src="assets/images/ui/cooldown_8.png" />
            <span class="count"></span>
            <span class="control"></span>
        </div>
    `   
}

function inventoryRowHTML() {
    return `<div class="inventory-row"> </div>`;
}

class Inventory {
    private reference: SlotReference;
    private hotbarSlotDivs: JQuery<HTMLElement>[];
    private hotbarSlots: SlotIndex[];

    private player: GameObject;
    
    private heldSlot: InventorySlot | null = null;
    private inventoryDisplayed: boolean = false;

    private hotbarSlotRowOrder: SlotType[] = ["weapon", "quiver", "utility", "consumable", "buff"];

    constructor(player: GameObject, counts: InventoryCounts=defaultInventoryCounts) {
        this.player = player;

        this.reference = Object.fromEntries(
            slotTypes.map((slotType): [SlotType, SlotTypeSlots] => [
                slotType, 
                {
                    slots: Array.from({ length: counts[slotType] }, () => null),
                    slotDivs: []
                }
            ])
        ) as SlotReference;

        this.hotbarSlots = [];
        this.hotbarSlotDivs = [];

        this.createUI();
    }

    // Returns true if the item was successfully added to the inventory
    // false otherwise.
    public addItem(item: Item): boolean {
        const types: SlotType[] = ["weapon", "quiver", "consumable", "utility", "free"];
        // First check if we can stack it anywhere
        let foundIndex: SlotIndex | null = null; // First index of matching item with available space.
        let emptyIndex: SlotIndex | null = null; // First empty valid index.
        for (const slotType of types) {
            const type = this.reference[slotType];
            for (let i = 0; i < type.slots.length; i++) {
                const slot = type.slots[i];
                if (slot !== null &&
                    slot.item.itemIndex === item.itemIndex &&
                    slot.count < item.maxStack) {
                    foundIndex = {
                        type: slotType,
                        index: i
                    }
                    break;
                }
                else if (emptyIndex === null && slot === null &&
                         (slotTypeProperties[slotType].acceptItemCategory === null ||
                         slotTypeProperties[slotType].acceptItemCategory?.indexOf(item.category) >= 0)) {
                    emptyIndex = {
                        type: slotType,
                        index: i,
                    }
                }
            }
            if (foundIndex !== null) {
                break;
            }
        }
        if (foundIndex !== null) {
            this.reference[foundIndex.type].slots[foundIndex.index]!.count++;
            this.setSlotUIByIndex(foundIndex);
            this.updateHotbarUI();
            return true;
        }
        else if (emptyIndex !== null) {
            this.reference[emptyIndex.type].slots[emptyIndex.index] = {
                item,
                count: 1,
                lastTimeUsed: undefined,
            };
            this.setSlotUIByIndex(emptyIndex);
            this.updateHotbarUI();
            // TODO: Equip item if it went into an appropriate slot to be equipped
            if (slotTypeProperties[emptyIndex.type].equipOnAdd) {
                if (item.equipItem) {
                    item.equipItem(this.player);
                }
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
    public indexOf(itemIndex: ItemIndex): SlotIndex | null {
        for (const slotType of slotTypes) {
            const type = this.reference[slotType];
            for (let i = 0; i < type.slots.length; i++) {
                if (type.slots[i] && type.slots[i]?.item.itemIndex === itemIndex) {
                    return {
                        type: slotType,
                        index: i
                    };
                }
            }
        }
        return null;
    }

    public getSlot(slotIndex: SlotIndex): InventorySlot | null {
        return this.reference[slotIndex.type].slots[slotIndex.index];
    }

    private decreaseItemCount(slotIndex: SlotIndex) {
        const type = this.reference[slotIndex.type];
        if (type.slots[slotIndex.index] === null) {
            return;
        }
        type.slots[slotIndex.index]!.count--;
        if (type.slots[slotIndex.index]!.count === 0) {
            type.slots[slotIndex.index] = null;
        }
        this.setSlotUIByIndex(slotIndex);
        this.updateHotbarUI();
    }

    private useItem(slotIndex: SlotIndex, target: Vector, func: "pressItem" | "releaseItem"): boolean {
        const slot = this.getSlot(slotIndex);
        if (slot === null) { 
            return false;
        }
        const item = slot.item;
        if (!item[func]) {
            throw Error("Cannot use item with " + func + " function because it does not exist");
        }
        if (item.cooldown && slot.lastTimeUsed && 
            this.player.game.time - slot.lastTimeUsed < item.cooldown) {
            return false;
        }


        let useIndex: SlotIndex | null = null;
        if (item.usesItem) {
            for (let i = 0; i < this.reference.quiver.slots.length; i++) {
                for (const useItem of item.usesItem) {
                    if (this.reference.quiver.slots[i]?.item.itemIndex === useItem) {
                        useIndex = {
                            type: "quiver",
                            index: i
                        };
                        break;
                    }
                }
                if (useIndex !== null) {
                    break;
                }
            }
            if (useIndex === null) {
                return false; // We don't have the necessary item in the quiver.
            }
        }
        // // Check if the player has enough essence to use the item
        const essenceManager = this.player.getComponent("essence-manager");
        if (essenceManager.data.essence >= item.essenceCost) {
            const useItem = useIndex !== null ? this.getSlot(useIndex)?.item : undefined; 
            const success = item[func](this.player, target, useItem);
            if (success) {
                if (useIndex !== null) {
                    this.decreaseItemCount(useIndex);
                }
                if (item.consumable) {
                    this.decreaseItemCount(slotIndex);
                }
                essenceManager.data.useEssence(item.essenceCost);
                slot.lastTimeUsed = this.player.game.time;
                return true;
            }
            else {
                return false;
            }
        }
        else {
            addNotification({
                text: "Not enough essence!",
                color: "rgb(255, 31, 31)"
            })
            return false;
        }
    }

    private pressedIndex: SlotIndex | null = null;
    private pressedItem: Item | null = null;

    public pressItem(slotIndex: SlotIndex, target: Vector) {
        this.pressedIndex = slotIndex;
        const slot = this.getSlot(slotIndex);
        const item = slot?.item;
        if (!item) {
            return;
        }
        this.pressedItem = item;
        if (item.pressItem !== undefined) {
            if (this.useItem(slotIndex, target, "pressItem")) {
                this.pressedIndex = null;
            }
        }
    }

    public releaseItem(slotIndex: SlotIndex, target: Vector) {
        // // Ensure that if the player changes their slot we ignore a release.
        if (this.pressedIndex === null || this.pressedIndex.type !== slotIndex.type || this.pressedIndex.index !== slotIndex.index) {
            return;
        }
        const slot = this.getSlot(slotIndex);
        const item = slot?.item;
        // // If theres no item in the slot or the item somehow changed from a press, then ignore
        if (!item || item !== this.pressedItem) {
            return;
        }
        if (item.releaseItem) {
            this.useItem(slotIndex, target, "releaseItem");
        }
    }

    // --- UI functions ---

    private updateDisplayPositions(ev: any) {
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

    private showItemDisplay(slotIndex: SlotIndex) {
        const itemDisplay = $("#item-display");
        const slot = this.reference[slotIndex.type].slots[slotIndex.index];
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

    private hideItemDisplay() {
        $("#item-display").hide();
    }

    private clickSlot(slotIndex: SlotIndex, ev: any) {
        const {index, type} = slotIndex;
        const typeSlots = this.reference[type];
        const slot = typeSlots.slots[slotIndex.index];
            if (this.heldSlot === null) {
                if (slot !== null) { 
                    // "pick up" the item in the slot.
                    this.heldSlot = slot;
                    if (slotIndex.type === "buff") {
                        if (slot.item.unequipItem) {
                            slot.item.unequipItem(this.player);
                        }
                    }
                    typeSlots.slots[index] = null;
                    this.setSlotUIByIndex(slotIndex);
                }
                this.hideItemDisplay();
            }
            else {
                // Place the held slot
                if (typeSlots.slots[index] !== null && typeSlots.slots[index].item.itemIndex === this.heldSlot.item.itemIndex) {
                    // Transfer as much count as possible
                    const count = Math.min(
                        this.heldSlot.count,
                        this.heldSlot.item.maxStack - typeSlots.slots[index].count
                    );
                    typeSlots.slots[index].count += count;
                    this.heldSlot.count -= count;
                    if (this.heldSlot.count <= 0) {
                        this.heldSlot = null;
                    }
                }
                else {
                    // Swap the slots
                    if (slotTypeProperties[type].acceptItemCategory === null || 
                        slotTypeProperties[type].acceptItemCategory.indexOf(this.heldSlot.item.category) >= 0) {
                        if (type === "buff") {
                            if (this.heldSlot.item.equipItem) {
                                this.heldSlot.item.equipItem(this.player);
                            }
                            if (typeSlots.slots[index] !== null && typeSlots.slots[index].item.unequipItem) {
                                typeSlots.slots[index].item.unequipItem(this.player);
                            }
                        }

                        const temp = typeSlots.slots[index];
                        typeSlots.slots[index] = this.heldSlot;
                        this.heldSlot = temp;
                    }
                }
                this.setSlotUI(typeSlots.slots[index], typeSlots.slotDivs[index]);
            }

            this.setSlotUI(this.heldSlot, $("#held-item-display"));
            if (this.heldSlot === null) {
                this.showItemDisplay(slotIndex);
            }
            this.updateHotbarUI();
            this.updateDisplayPositions(ev);
    }

    // Helper function to create an empty slot for the given type and add it to
    // the given row.
    private createAndAddSlotUI(slotType: SlotType): JQuery<HTMLElement> {
        const type = this.reference[slotType];
        const index = type.slotDivs.length;

        const html = inventorySlotHTML(slotType);
        const inventorySlot = $(html);

        // Set up functionality
        inventorySlot.on("mouseenter", () => {
            if (!this.heldSlot) {
                this.showItemDisplay(
                    {
                        index: index,
                        type: slotType
                    }
                );
            }
        });
        inventorySlot.on("mouseleave", () => {
            this.hideItemDisplay();
        });
        inventorySlot.on("click", (ev) => {
            this.clickSlot({index, type: slotType}, ev);
        });
        
        // Appearance
        inventorySlot.css("cursor", "pointer");

        type.slotDivs.push(inventorySlot);

        return inventorySlot;
    }

    // Constructs the entire blank UI, to be called in the constructor only
    private createUI() {
        $("#inventory").empty();
        $("#inventory-screen").on("mousemove", this.updateDisplayPositions.bind(this));

        let currentRow;
        for (let i = 0; i < this.reference.free.slots.length; i++) {
            if (i % 9 === 0) {
                if (currentRow) {
                    $("#inventory").append(currentRow);
                }
                currentRow = $(inventoryRowHTML());
            }
            currentRow!.append(this.createAndAddSlotUI("free"));
        }
        $("#inventory").append(currentRow!);
        

        const activeBarRow = $(inventoryRowHTML());
        for (const type of this.hotbarSlotRowOrder) {
            for (let i = 0; i < this.reference[type].slots.length; i++) {
                const element = this.createAndAddSlotUI(type);
                if (i === this.reference[type].slots.length - 1) {
                    element.css("margin-right", "10px");
                }
                activeBarRow.append(element);
            }
        }
        activeBarRow.css("margin-top", "15px");
        $("#inventory").append(activeBarRow);

        // Create the regular hotbar UI
        this.hotbarSlotDivs = [];
        $("#hotbar").empty();
        for (const type of this.hotbarSlotRowOrder) {
            for (let i = 0; i < this.reference[type].slots.length; i++) {
                const element = $(inventorySlotHTML(type));
                // Add control marker
                const controlsKeys = slotTypeProperties[type].controlKeys;
                if (controlsKeys && i < controlsKeys.length) {
                    const control = element.find(".control");
                    control.text(controls[controlsKeys[i]].display);
                    control.css("visibility", "visible");
                }

                // Add gap between sections
                if (i === this.reference[type].slots.length - 1) {
                    element.css("margin-right", "12px");
                }
                
                $("#hotbar").append(element);
                this.hotbarSlotDivs.push(element);
                this.hotbarSlots.push({
                    type: type,
                    index: i
                });
            }
        }
    }

    // Update the slotDiv's content to match the given slot object.
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

    private setSlotUIByIndex(slotIndex: SlotIndex) {
        const type = this.reference[slotIndex.type];
        this.setSlotUI(type.slots[slotIndex.index], type.slotDivs[slotIndex.index]);
    }

    private updateHotbarUI() {
        let i = 0;
        for (const slotIndex of this.hotbarSlots) {
            this.setSlotUI(this.reference[slotIndex.type].slots[slotIndex.index], this.hotbarSlotDivs[i]);
            i++;
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

    // Get the slot div of the given slotIndex. 
    private hotbarSlotDiv(slotIndex: SlotIndex): JQuery<HTMLElement> | null {
        let i = 0;
        for (const type of this.hotbarSlotRowOrder) {
            if (slotIndex.type === type) {
                return this.hotbarSlotDivs[i + slotIndex.index];
            }
            else {
                i += this.reference[type].slots.length;
            }
        }
        return null;
    }

    public unselectSlot(slotIndex: SlotIndex, unequip=false) {
        const div = this.hotbarSlotDiv(slotIndex);
        if (div === null) {
            throw Error("Trying to unselect a slotIndex which is not on the hotbar");
        }
        div.find(".slot-icon").attr("src", getImage(slotTypeProperties[slotIndex.type].iconID).src);
        if (unequip) {
            const slot = this.getSlot(slotIndex);
            if (slot) {
                if (slot.item.unequipItem) {
                    slot.item.unequipItem(this.player);
                }
            }
        }
    }

    public selectSlot(slotIndex: SlotIndex, equip=false) {
        const { selectedIconID, iconID } = slotTypeProperties[slotIndex.type]
        const id = selectedIconID ? selectedIconID : iconID;
        const src = getImage(id).src;
        const div = this.hotbarSlotDiv(slotIndex);
        if (div === null) {
            throw Error("Trying to select a slotIndex which is not on the hotbar");
        }
        div.find(".slot-icon").attr("src", src);
        if (equip) {
            const slot = this.getSlot(slotIndex);
            if (slot) {
                if (slot.item.equipItem) {
                    slot.item.equipItem(this.player);
                }
            }
        }
    }

    public updateCooldownUI() {
        console.log("update");
        for (const type of this.hotbarSlotRowOrder) {
            for (let i = 0; i < this.reference[type].slotDivs.length; i++) {
                const slot = this.reference[type].slots[i];
                const div = this.hotbarSlotDiv({index: i, type})?.find(".cooldown-overlay");
                if (div && slot?.lastTimeUsed && slot.item.cooldown) {
                    const elapsed = this.player.game.time - slot.lastTimeUsed;
                    // console.log(elapsed, slot.item.cooldown);
                    if (elapsed < slot.item.cooldown) {
                        const p = elapsed / slot.item.cooldown;
                        const index = Math.floor(p * 16);
                        const id = `cooldown_${index}`;
                        console.log(id);
                        const image = getImage(id);
                        div.attr("src", image.src);
                        div.css("visibility", "visible");
                    }
                    else {
                        div.css("visibility", "hidden");
                    }
                }
                else {
                    div.css("visibility", "hidden");
                }
            }
        }
    }
};

export { Inventory };
export type { SlotIndex };
