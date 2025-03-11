import { ItemIndex } from "./items";
import { Vector } from "./utils";
import { ComponentFactory, ZombieAI } from "./components";
import { ItemDropChance } from "./items";

enum EnemyIndex {
    ZOMBIE
}

interface Enemy {
    spriteID: string;
    waterSpriteID: string;
    scale: Vector;
    physicalColliderOffset: Vector;
    physicalColliderSize: Vector;
    hp: number;
    drops: ItemDropChance[];
    essenceAmount: number;
    ai: ComponentFactory;
}

const enemyCodex: Enemy[] = [
    {
        spriteID: "zombie",
        waterSpriteID: "zombie_water",
        scale: new Vector(1, 2.33),
        physicalColliderOffset: new Vector(0, -1),
        physicalColliderSize: new Vector(0.8, 0.3),
        hp: 20,
        drops: [
            {chance: 0.05, itemIndex: ItemIndex.ZOMBIE_BRAINS},
            // {chance: 0.8, itemIndex: ItemIndex.ZOMBIE_FLESH},
            // {chance: 0.8, itemIndex: ItemIndex.ZOMBIE_FLESH},
        ],
        essenceAmount: 2,
        ai: ZombieAI,
    }
]

export { enemyCodex, EnemyIndex };