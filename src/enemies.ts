import { ItemIndex } from "./items";
import { Vector } from "./utils";
import { ComponentFactory, ZombieAI } from "./components";
import { ItemDropChance } from "./items";
import { Codex } from "./codex";

enum EnemyIndex {
    ZOMBIE,
    MINION,
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

const enemyCodex = new Codex<EnemyIndex, Enemy>();
enemyCodex.set(EnemyIndex.ZOMBIE, {
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
});
enemyCodex.set(EnemyIndex.MINION, {
    spriteID: "minion",
    waterSpriteID: "minion_water",
    scale: new Vector(1, 1),
    physicalColliderOffset: new Vector(0, -0.4),
    physicalColliderSize: new Vector(0.8, 0.2),
    hp: 10,
    drops: [],
    essenceAmount: 1,
    ai: ZombieAI
});

export { enemyCodex, EnemyIndex };