// registry of all the items in the game and logic for their usage

interface Item {
    iconSpriteID: string;
};

const items = new Map<string, Item>();

items.set("kfc", {
    iconSpriteID: "kfc"
});

const getItem: (itemID: string) => Item = (itemID: string) => {
    const item = items.get(itemID);
    if (!item) {
        throw Error("No item found with id " + itemID);
    }
    return item;
}

class Inventory {

};

export { getItem, Item };