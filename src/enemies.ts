import { NumberRange, Vector } from "./utils";
import { ComponentFactory } from "./components"
import * as AI from "./components/EnemyAI";
import { ItemDropChance } from "./items";
import { Codex } from "./codex";

enum EnemyIndex {
    MINION,
    SLIME,
    REVENANT_EYE,
    WRAITH,
    WRETCHED_SKELETON,
}

interface Enemy {
    spriteID: string;
    attackSpriteID?: string; // Changes to attack sprite if enemy in "attack" AI state
    waterSpriteID?: string; // Changes to water sprite when in water when defined
    deadSpriteID?: string; // Spawns a corpse when defined
    particleID?: string; // No particles when undefined
    scale: Vector;
    speed: number;
    waterSpeedModifier: number;
    hp: number;
    drops: ItemDropChance[];
    essenceAmount: NumberRange;
    ai: ComponentFactory;
}

const enemiesCodex = new Codex<EnemyIndex, Enemy>();
enemiesCodex.set(EnemyIndex.SLIME, {
    spriteID: "slime",
    waterSpriteID: "slime_water",
    deadSpriteID: "slime_dead",
    particleID: "slime_particle",
    scale: new Vector(0.75, 0.5),
    hp: 10,
    drops: [],
    speed: 22,
    waterSpeedModifier: 0.5,
    essenceAmount: new NumberRange(1, 3),
    ai: AI.EnemyAI(AI.slimeAIConfig)
});
enemiesCodex.set(EnemyIndex.MINION, {
    spriteID: "minion",
    waterSpriteID: "minion_water",
    deadSpriteID: "minion_dead",
    scale: new Vector(1, 1),
    hp: 16,
    drops: [],
    speed: 29,
    waterSpeedModifier: 0.5,
    essenceAmount: new NumberRange(2, 4),
    ai: AI.EnemyAI(AI.minionAIConfig)
});
enemiesCodex.set(EnemyIndex.WRETCHED_SKELETON, {
    spriteID: "wretched_skeleton",
    attackSpriteID: "wretched_skeleton_attack",
    waterSpriteID: "wretched_skeleton_water",
    deadSpriteID: "wretched_skeleton_dead",
    scale: new Vector(1, 2),
    hp: 30,
    speed: 22,
    waterSpeedModifier: 0.5,
    drops: [],
    essenceAmount: new NumberRange(5, 10),
    ai: AI.EnemyAI(AI.wretchedSkeletonAIConfig),
});
enemiesCodex.set(EnemyIndex.REVENANT_EYE, {
    spriteID: "revenant_eye",
    attackSpriteID: "revenant_eye_attack",
    deadSpriteID: "revenant_eye_dead",
    scale: new Vector(1, 1),
    hp: 25,
    drops: [],
    speed: 22,
    waterSpeedModifier: 1.0,
    essenceAmount: new NumberRange(8, 12),
    ai: AI.EnemyAI(AI.revenantEyeAIConfig),
});
enemiesCodex.set(EnemyIndex.WRAITH, {
    spriteID: "wraith",
    scale: new Vector(0.75, 1.5),
    hp: 35,
    speed: 25,
    waterSpeedModifier: 1.0,
    drops: [],
    essenceAmount: new NumberRange(10, 15),
    ai: AI.EnemyAI(AI.wraithAIConfig),
});


export { enemiesCodex, EnemyIndex };