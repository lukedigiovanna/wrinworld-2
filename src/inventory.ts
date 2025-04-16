import { Item, ItemCategory, ItemIndex, itemsCodex, ItemStat, 
         itemStats, 
         ItemStatValue} from "./items";
import { getImage } from "./imageLoader";
import { GameObject } from "./gameObjects";
import input, { InputLayer } from "./input";
import { MathUtils, Vector } from "./utils";
import { addNotification } from "./notifications";
import controls, { Controls } from "./controls";

interface InventorySlot {
    item: Item;
    count: number;
    lastTimeUsed?: number;
}

const slotTypes = ["free", "weapon", "quiver", "utility", "consumable", "buff"] as const;
type SlotType = typeof slotTypes[number];

interface SlotTypeConfig {
    iconID: string;
    selectedIconID?: string;
    chargeIconID?: string;
    acceptItemCategory: ItemCategory[] | null; // Null to accept all
    controlKeys?: (keyof Controls)[];
    selectable: boolean;
    equipOnAdd: boolean;
    equipOnSelect?: boolean;
}

const slotConfigs: Record<SlotType, SlotTypeConfig> = {
    free: {
        iconID: "inventory_slot",
        acceptItemCategory: null,
        equipOnAdd: false,
        selectable: false,
    },
    weapon: {
        iconID: "weapon_slot",
        selectedIconID: "selected_weapon_slot",
        acceptItemCategory: ["Weapon"],
        controlKeys: ["selectWeapon1", "selectWeapon2"],
        equipOnAdd: false,
        equipOnSelect: true,
        selectable: true,
    },
    quiver: {
        iconID: "quiver_slot",
        acceptItemCategory: ["Ammo"],
        equipOnAdd: false,
        selectable: false,
    },
    utility: {
        iconID: "utility_slot",
        chargeIconID: "selected_utility_slot",
        acceptItemCategory: ["Utility", "Mystic Arts"],
        controlKeys: ["utility1", "utility2"],
        equipOnAdd: false,
        selectable: false,
    },
    consumable: {
        iconID: "consumable_slot",
        chargeIconID: "selected_consumable_slot",
        acceptItemCategory: ["Consumable"],
        controlKeys: ["consumable"],
        equipOnAdd: false,
        selectable: false,
    },
    buff: {
        iconID: "buff_slot",
        acceptItemCategory: ["Buff"],
        equipOnAdd: true,
        selectable: false,
    }
} as const;

type InventorySlotCounts = {
    [key in SlotType]: number;
}

interface SlotGroup {
    slots: (InventorySlot | null)[];
    slotDivs: JQuery<HTMLElement>[];
    selectedIndex?: number;
}

interface SlotLocator {
    type: SlotType;
    index: number;
}

const defaultInventoryCounts: InventorySlotCounts = {
    free: 18,
    weapon: 2,
    quiver: 1,
    utility: 2,
    consumable: 1,
    buff: 2,
}

function inventorySlotHTML(type: SlotType) {
    const image = getImage(slotConfigs[type].iconID);
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
    private reference: Record<SlotType, SlotGroup>;

    private hotbarSlotRowOrder: SlotType[] = ["weapon", "quiver", "utility", "consumable", "buff"];
    private hotbarSlotLocators: SlotLocator[];
    private hotbarSlotDivs: JQuery<HTMLElement>[];
    
    private heldSlot: InventorySlot | null = null;

    private inventoryDisplayed: boolean = false;

    // For tracking charged items:
    // When charging, all other items become disabled.
    private _charging: boolean = false;
    private chargeStartTime: number = 0;
    private chargeIndex?: SlotLocator;
    private chargeItem?: Item;

    private player: GameObject;

    constructor(player: GameObject, counts: InventorySlotCounts=defaultInventoryCounts) {
        this.player = player;

        this.reference = Object.fromEntries(
            slotTypes.map((slotType): [SlotType, SlotGroup] => [
                slotType, 
                {
                    slots: Array.from({ length: counts[slotType] }, () => null),
                    slotDivs: [],
                }
            ])
        ) as Record<SlotType, SlotGroup>;

        for (const slotType of slotTypes) {
            if (slotConfigs[slotType].selectable) {
                this.selectSlot({
                    type: slotType,
                    index: 0,
                });
            }
        }

        this.hotbarSlotLocators = [];
        this.hotbarSlotDivs = [];

        this.createUI();
    }

    public get charging() {
        return this._charging;
    }

    // Returns true if the item was successfully added to the inventory
    // false otherwise.
    public addItem(item: Item): boolean {
        const types: SlotType[] = ["weapon", "quiver", "consumable", "utility", "free"];
        // First check if we can stack it anywhere
        let foundIndex: SlotLocator | null = null; // First index of matching item with available space.
        let emptyIndex: SlotLocator | null = null; // First empty valid index.
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
                         (slotConfigs[slotType].acceptItemCategory === null ||
                         slotConfigs[slotType].acceptItemCategory?.indexOf(item.category) >= 0)) {
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
            return true;
        }
        else if (emptyIndex !== null) {
            this.reference[emptyIndex.type].slots[emptyIndex.index] = {
                item,
                count: 1,
                lastTimeUsed: undefined,
            };
            if (slotConfigs[emptyIndex.type].equipOnAdd) {
                item.equipItem?.(this.player);
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
    public indexOf(itemIndex: ItemIndex): SlotLocator | null {
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

    public getSlot(slotIndex: SlotLocator): InventorySlot | null {
        return this.reference[slotIndex.type].slots[slotIndex.index];
    }

    private decreaseItemCount(slotIndex: SlotLocator) {
        const type = this.reference[slotIndex.type];
        if (type.slots[slotIndex.index] === null) {
            return;
        }
        type.slots[slotIndex.index]!.count--;
        if (type.slots[slotIndex.index]!.count === 0) {
            type.slots[slotIndex.index] = null;
        }
    }

    private useItem(slotIndex: SlotLocator, target: Vector, charge?: number): boolean {
        console.log(`Inventory.useItem(${JSON.stringify(slotIndex)})`)
        const slot = this.getSlot(slotIndex);
        if (slot === null) { 
            return false;
        }
        const item = slot.item;
        if (!item.useItem) {
            return false;
        }

        let useIndex: SlotLocator | null = null;
        if (item.usesItem) {
            const quiver = this.reference.quiver.slots;
            for (let i = 0; i < quiver.length; i++) {
                for (const useItem of item.usesItem) {
                    if (quiver[i]?.item.itemIndex === useItem) {
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
        if (essenceManager.data.essence < item.essenceCost) {
            addNotification({
                text: "Not enough essence!",
                color: "rgb(255, 31, 31)"
            })
            return false;
        }
        else {
            const useItem = useIndex !== null ? this.getSlot(useIndex)?.item : undefined; 
            if (item.requireFullCharge && (!charge || charge < 1)) {
                return false;
            }
            const success = item.useItem(this.player, target, useItem, charge);
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
    }

    // Called when firing key is pressed down
    public pressItem(slotIndex: SlotLocator, target: Vector) {
        console.log(`Inventory.pressItem(${JSON.stringify(slotIndex)})`)
        // Ignore request if already charging another item
        if (this._charging) {
            console.log("FAIL: charging");
            return false;
        }
        
        const slot = this.getSlot(slotIndex);
        if (slot === null) {
            console.log("FAIL: no slot at index")
            return;
        }
        const item = slot.item;

        // Ignore request if the item is still on cooldown 
        if (item.cooldown && slot.lastTimeUsed && 
            this.player.game.time - slot.lastTimeUsed < item.cooldown) {
            const remaining = item.cooldown - (this.player.game.time - slot.lastTimeUsed);
            addNotification({
                text: `Available in ${Math.round(remaining * 10) / 10}s`,
                color: "rgb(255, 31, 31)"
            });
            return;
        }

        // Use item instantly if the item is not chargeable
        if (item.charge === undefined) {
            this.useItem(slotIndex, target);
        }
        else { // Enter charge mode
            this._charging = true;
            this.chargeStartTime = this.player.game.time;
            this.chargeIndex = slotIndex;
            this.chargeItem = item;
        }
    }

    // Called when firing key is released
    public releaseItem(slotIndex: SlotLocator, target: Vector) {
        if (!this._charging) {
            return false;
        }

        if (!this.chargeIndex || slotIndex.type !== this.chargeIndex.type || slotIndex.index !== this.chargeIndex.index) {
            return;
        }

        const slot = this.getSlot(slotIndex);
        if (slot === null) {
            return;
        }

        if (slot.item !== this.chargeItem) {
            return;
        }

        if (slot.item.charge === undefined) {
            throw Error("Somehow was charging an item that doesn't charge");
        }

        console.log(`Inventory.releaseItem(${JSON.stringify(slotIndex)})`)

        if (!this.chargeItem || !this.chargeIndex) {
            throw Error("Somehow was charging without setting the chargeIndex, or chargeItem");
        }

        const chargePeriod = this.player.game.time - this.chargeStartTime;
        const charge = Math.min(slot.item.charge, chargePeriod) / slot.item.charge;
        this.useItem(slotIndex, target, charge);

        this._charging = false;
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

    private showItemDisplay(slotIndex: SlotLocator) {
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
            let stats: ItemStatValue[] = [];
            if (slot.item.essenceCost > 0) {
                stats.push({
                    stat: ItemStat.ESSENCE_COST,
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
                const statValue = stats[i];
                const statProperties = itemStats[statValue.stat];
                const value = statProperties.isPercent ? Math.round(statValue.value * 100) : Math.round(statValue.value * 10) / 10;
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

    private clickSlot(slotIndex: SlotLocator, ev: any) {
        const { index, type } = slotIndex;
        const slotGroup = this.reference[type];
        const slot = slotGroup.slots[slotIndex.index];
        if (this.heldSlot === null) {
            if (slot !== null) { 
                // "pick up" the item in the slot.
                this.heldSlot = slot;
                this.unequipItem(slotIndex);
                slotGroup.slots[index] = null;
            }
            this.hideItemDisplay();
        }
        else {
            // Place the held slot
            if (slotGroup.slots[index] !== null && slotGroup.slots[index].item.itemIndex === this.heldSlot.item.itemIndex) {
                // Transfer as much count as possible
                const count = Math.min(
                    this.heldSlot.count,
                    this.heldSlot.item.maxStack - slotGroup.slots[index].count
                );
                slotGroup.slots[index].count += count;
                this.heldSlot.count -= count;
                if (this.heldSlot.count <= 0) {
                    this.heldSlot = null;
                }
            }
            else {
                // Swap the slots
                if (slotConfigs[type].acceptItemCategory === null || 
                    slotConfigs[type].acceptItemCategory.indexOf(this.heldSlot.item.category) >= 0) {
                    if (type === "buff") {
                        if (this.heldSlot.item.equipItem) {
                            console.log("equip?");
                            this.heldSlot.item.equipItem(this.player);
                        }
                        if (slotGroup.slots[index] !== null && slotGroup.slots[index].item.unequipItem) {
                            this.unequipItem({
                                type, index
                            });
                        }
                    }

                    const temp = slotGroup.slots[index];
                    slotGroup.slots[index] = this.heldSlot;
                    this.heldSlot = temp;
                }
            }
        }

        this.setSlotUI(this.heldSlot, $("#held-item-display"));
        if (this.heldSlot === null) {
            this.showItemDisplay(slotIndex);
        }
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
                const controlsKeys = slotConfigs[type].controlKeys;
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
                this.hotbarSlotLocators.push({
                    type: type,
                    index: i
                });
            }
        }
    }

    // Update the slotDiv's content to match the given slot object.
    private setSlotUI(slot: InventorySlot | null, slotDiv: JQuery<HTMLElement>) {
        const item = slotDiv.find(".item");
        const cooldown = slotDiv.find(".cooldown-overlay");
        const count = slotDiv.find(".count");
        if (slot === null) {
            item.css("visibility", "hidden");
            cooldown.css("visibility", "hidden");
            count.text("");
        }
        else {
            item.css("visibility", "visible");
            item.attr("src", getImage(slot.item.iconSpriteID).src);
            if (slot.count === 1) {
                count.text("");
            }
            else {
                count.text(slot.count);
            }
            if (slot.lastTimeUsed && slot.item.cooldown) {
                const elapsed = this.player.game.time - slot.lastTimeUsed;
                // console.log(elapsed, slot.item.cooldown);
                if (elapsed < slot.item.cooldown) {
                    const p = elapsed / slot.item.cooldown;
                    const index = Math.floor(p * 16);
                    const id = `cooldown_${index}`;
                    const image = getImage(id);
                    cooldown.attr("src", image.src);
                    cooldown.css("visibility", "visible");
                }
                else {
                    cooldown.css("visibility", "hidden");
                }
            }
            else {
                cooldown.css("visibility", "hidden");
            }
        }
    }

    private setSlotUIByIndex(slotIndex: SlotLocator) {
        const type = this.reference[slotIndex.type];
        this.setSlotUI(type.slots[slotIndex.index], type.slotDivs[slotIndex.index]);
    }

    public updateUI() {
        for (const type of slotTypes) {
            for (let i = 0; i < this.reference[type].slots.length; i++) {
                this.setSlotUIByIndex({
                    index: i,
                    type
                });
            }
        }
        let i = 0;
        for (const slotIndex of this.hotbarSlotLocators) {
            this.setSlotUI(this.reference[slotIndex.type].slots[slotIndex.index], this.hotbarSlotDivs[i]);
            const config = slotConfigs[slotIndex.type];
            let iconID = config.iconID;
            if (this._charging && this.chargeIndex && config.chargeIconID && 
                this.chargeIndex.index === slotIndex.index && 
                this.chargeIndex.type === slotIndex.type) {
                iconID = config.chargeIconID;
            }
            else if (config.selectedIconID && slotIndex.index === this.reference[slotIndex.type].selectedIndex) {
                iconID = config.selectedIconID;
            }
            this.hotbarSlotDivs[i]
                .find(".slot-icon")
                .attr("src", getImage(iconID).src);
            i++;
        }

        // Update cooldown/charging icon
        const icon = $("#cooldown-charge-icon");
        if (this._charging) {
            if (!this.chargeItem || this.chargeItem.charge === undefined) {
                throw Error("Somehow was charging an item without a charge field");
            }
            const elapsed = this.player.game.time - this.chargeStartTime;
            const charge = Math.min(this.chargeItem.charge, elapsed);
            const percent = charge / this.chargeItem.charge;
            const index = Math.floor(percent * 9);
            icon.attr("src", getImage(`attack_charge_${index}`).src);
            icon.show();
            icon.css("left", input.mousePosition.x);
            icon.css("top", input.mousePosition.y);
        }
        else {
            const selectedWeapon = this.reference.weapon.selectedIndex !== undefined ? this.reference.weapon.slots[this.reference.weapon.selectedIndex] : undefined;
            if (selectedWeapon && selectedWeapon.lastTimeUsed && selectedWeapon.item.cooldown) {
                const elapsed = this.player.game.time - selectedWeapon.lastTimeUsed;
                const percent = elapsed / selectedWeapon.item.cooldown;
                if (percent < 1) {
                    const index = Math.floor(percent * 10);
                    icon.attr("src", getImage(`attack_cooldown_${index}`).src);
                    icon.show();
                    icon.css("left", input.mousePosition.x);
                    icon.css("top", input.mousePosition.y);
                }
                else {
                    icon.hide();
                }
            }
            else {
                icon.hide();
            }
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
    private hotbarSlotDiv(slotIndex: SlotLocator): JQuery<HTMLElement> | null {
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

    public getSelectedIndex(type: SlotType) {
        return this.reference[type].selectedIndex;
    }

    public getSelectedItem(type: SlotType): Item | undefined {
        const index = this.getSelectedIndex(type);
        return index !== undefined ? this.reference[type].slots[index]?.item : undefined;
    }

    public getChargingItem(): Item | undefined {
        return this._charging ? this.chargeItem : undefined;
    }

    public getNumberOfSlots(type: SlotType) {
        return this.reference[type].slots.length;
    }

    private unequipItem(slotIndex: SlotLocator) {
        const slotGroup = this.reference[slotIndex.type];
        const slot = slotGroup.slots[slotIndex.index];
        if (slot !== null) {
            slot.item.unequipItem?.(this.player);
        }
        if (this._charging && this.chargeIndex && 
            this.chargeIndex.type === slotIndex.type && 
            this.chargeIndex.index === slotIndex.index) {
            this._charging = false;
        }
    }

    public selectSlot(slotIndex: SlotLocator) {
        if (!slotConfigs[slotIndex.type].selectable) {
            throw Error(`Cannot select slot type ${slotIndex.type} as it is unselectable`);
        }
        console.log(`Inventory.selectSlot(${JSON.stringify(slotIndex)})`)
        const slotGroup = this.reference[slotIndex.type];
        slotIndex.index = MathUtils.modulo(slotIndex.index, this.getNumberOfSlots(slotIndex.type));
        // Do nothing if already selecting this slot
        if (slotIndex.index === slotGroup.selectedIndex) {
            return;
        }
        const equip = slotConfigs[slotIndex.type].equipOnSelect;
        if (equip && slotGroup.selectedIndex !== undefined) {
            this.unequipItem({
                index: slotGroup.selectedIndex,
                type: slotIndex.type
            })
        }
        slotGroup.selectedIndex = slotIndex.index;
        if (equip && slotGroup.selectedIndex !== undefined) {
            const newItem = slotGroup.slots[slotGroup.selectedIndex];
            if (newItem !== null) {
                newItem.item.equipItem?.(this.player);
            }
        }
    }
};

export { Inventory };
export type { SlotLocator };
