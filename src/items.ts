// registry of all the items in the game and logic for their usage

import { getImage } from "./imageLoader";

enum ItemIndex {
    STONE_SWORD,
    ZOMBIE_BRAINS,
    ZOMBIE_FLESH,
}

interface Item {
    itemIndex: ItemIndex;
    iconSpriteID: string;
    maxStack: number;
}

const itemsCodex: Item[] = [
    {
        itemIndex: ItemIndex.STONE_SWORD,
        iconSpriteID: "stone_sword_icon",
        maxStack: 1
    },
    {
        itemIndex: ItemIndex.ZOMBIE_BRAINS,
        iconSpriteID: "zombie_brains",
        maxStack: 16
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

class Inventory {
    // Includes all the free space to place arbitrary items
    private size: number = 27;
    // The hotbar is the first N elements of the slots array.
    private hotbarSize: number = 9;
    private slots: (InventorySlot | null)[];
    private hotbarSlotDivs: HTMLElement[];
    private selectedSlot: number = 0;

    constructor() {
        this.slots = [];
        for (let i = 0; i < this.size; i++) {
            this.slots.push(null);
        }
        this.hotbarSlotDivs = $(".hotbar-slot").toArray();
        this.setSelectedHotbarSlot(this.selectedSlot);
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
        $(this.hotbarSlotDivs[this.selectedSlot]).find(".slot-icon").attr("src", getImage("hotbar_slot").src);
        this.selectedSlot = index;
        $(this.hotbarSlotDivs[this.selectedSlot]).find(".slot-icon").attr("src", getImage("hotbar_slot_selected").src);
    }

    public updateUI() {
        for (let i = 0; i < this.hotbarSize; i++) {        
            let slotDiv = $(this.hotbarSlotDivs[i]);
            let slot = this.slots[i];
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
    }
};

export { itemsCodex, ItemIndex, Inventory };
export type { Item, ItemDropChance };
