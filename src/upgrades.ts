import { ItemIndex } from "./items";
import { MathUtils } from "./utils";

type UpgradeCombinationTuple = [ItemIndex, ItemIndex];

function hashUpgradeCombinationTuple(tuple: UpgradeCombinationTuple) {
    return `${tuple[0]},${tuple[1]}`;
}

type UpgradeResultFunction = () => ItemIndex;

const upgradeCombinations = new Map<string, UpgradeResultFunction>();

function setCombo(item: ItemIndex, upgrade: ItemIndex, result: UpgradeResultFunction) {
    const hash = hashUpgradeCombinationTuple([item, upgrade]);
    upgradeCombinations.set(hash, result);
}

function getUpgradeCombination(item: ItemIndex, upgrade: ItemIndex) {
    const hash = hashUpgradeCombinationTuple([item, upgrade]);
    const resultFunc = upgradeCombinations.get(hash);
    if (resultFunc) {
        return resultFunc();
    }
    else {
        return undefined;
    }
}

setCombo(ItemIndex.BROAD_SWORD, ItemIndex.STRENGTH_UPGRADE, () => ItemIndex.STRONG_SWORD);
setCombo(ItemIndex.BROAD_SWORD, ItemIndex.POISON_UPGRADE, () => ItemIndex.POISON_BROAD_SWORD);
setCombo(ItemIndex.STRONG_SWORD, ItemIndex.POISON_UPGRADE, () => ItemIndex.POISON_STRONG_SWORD);
setCombo(ItemIndex.POISON_BROAD_SWORD, ItemIndex.STRENGTH_UPGRADE, () => ItemIndex.POISON_STRONG_SWORD);
setCombo(ItemIndex.BROAD_SWORD, ItemIndex.QUICK_HAND_UPGRADE, () => ItemIndex.QUICK_BROAD_SWORD);
setCombo(ItemIndex.BATTLE_HAMMER, ItemIndex.QUICK_HAND_UPGRADE, () => ItemIndex.QUICK_BATTLE_HAMMER);
setCombo(ItemIndex.BATTLE_HAMMER, ItemIndex.POISON_UPGRADE, () => ItemIndex.POISON_BATTLE_HAMMER);

setCombo(ItemIndex.SLINGSHOT, ItemIndex.STRENGTH_UPGRADE, () => ItemIndex.REINFORCED_SLINGSHOT);
setCombo(ItemIndex.REINFORCED_SLINGSHOT, ItemIndex.SPROCKET_UPGRADE, () => ItemIndex.MACHINE_GUN_SLINGSHOT);
setCombo(ItemIndex.BOW, ItemIndex.GHOST_ARROWS, () => ItemIndex.GHOST_BOW);
setCombo(ItemIndex.BOW, ItemIndex.RICOCHET_UPGRADE, () => ItemIndex.RICOCHET_BOW);
setCombo(ItemIndex.BOW, ItemIndex.QUICK_HAND_UPGRADE, () => ItemIndex.QUICK_BOW);
setCombo(ItemIndex.BOW, ItemIndex.STRENGTH_UPGRADE, () => ItemIndex.POWER_BOW);
setCombo(ItemIndex.BOOMERANG, ItemIndex.RICOCHET_UPGRADE, () => ItemIndex.RICOCHET_BOOMERANG);

setCombo(ItemIndex.WATER_GUN, ItemIndex.SPROCKET_UPGRADE, () => ItemIndex.PRESSURE_WASHER);

const dicePool = [ItemIndex.BROAD_SWORD, ItemIndex.BATTLE_HAMMER, ItemIndex.POISON_BROAD_SWORD, ItemIndex.BOW, ItemIndex.SLINGSHOT, ItemIndex.DAGGERS, ItemIndex.STRONG_SWORD, ItemIndex.POISON_STRONG_SWORD, ItemIndex.BOOMERANG];
for (const item of dicePool) {
    setCombo(item, ItemIndex.DICE, () => MathUtils.randomChoice(dicePool));
}

export { getUpgradeCombination }
