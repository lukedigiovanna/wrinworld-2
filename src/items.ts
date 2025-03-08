// registry of all the items in the game and logic for their usage

interface Item {
    iconSpriteID: string;
    stacks: boolean;
}

enum ItemIndex {
    ZOMBIE_BRAINS
}

const itemsCodex: Item[] = [
    {
        iconSpriteID: "zombie_brains",
        stacks: true
    }
];

interface ItemDropChance {
    chance: number; // 0 to 1
    itemIndex: ItemIndex;
}

class Inventory {

};

export { itemsCodex, ItemIndex };
export type { Item, ItemDropChance };
