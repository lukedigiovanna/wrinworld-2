import { NumberRange, Vector } from "./utils";
import { ComponentFactory } from "./components"
import * as AI from "./components/EnemyAI";
import { ItemDropChance } from "./items";

enum EnemyIndex {
    // Level 1 Enemies
    MINION,
    SLIME,
    REVENANT_EYE,
    WRAITH,
    WRETCHED_SKELETON,
    EVIL_BUNNY,
    RED_SLIME,
    CORRUPTED_DEER,
    GROUND_WORM,
    FUNGAL_HUSK
}

interface Enemy {
    spriteID: string;
    attackSpriteID?: string; // Changes to attack sprite if enemy in "attack" AI state
    waterSpriteID?: string; // Changes to water sprite when in water when defined
    deadSpriteID?: string; // Spawns a corpse when defined
    particleID?: string; // No particles when undefined
    speed: number;
    waterSpeedModifier: number;
    hp: number;
    drops: ItemDropChance[];
    essenceAmount: NumberRange;
    ai: ComponentFactory;
}

const enemiesCodex: Record<EnemyIndex, Enemy> = {
[EnemyIndex.SLIME]: {
    spriteID: "slime",
    waterSpriteID: "slime_water",
    deadSpriteID: "slime_dead",
    particleID: "slime_particle",
    hp: 10,
    drops: [],
    speed: 22,
    waterSpeedModifier: 0.5,
    essenceAmount: new NumberRange(2, 4),
    ai: AI.EnemyAI(AI.slimeAIConfig)
},
[EnemyIndex.MINION]: {
    spriteID: "minion",
    waterSpriteID: "minion_water",
    deadSpriteID: "minion_dead",
    hp: 16,
    drops: [],
    speed: 29,
    waterSpeedModifier: 0.5,
    essenceAmount: new NumberRange(2, 5),
    ai: AI.EnemyAI(AI.minionAIConfig)
},
[EnemyIndex.WRETCHED_SKELETON]: {
    spriteID: "wretched_skeleton",
    attackSpriteID: "wretched_skeleton_attack",
    waterSpriteID: "wretched_skeleton_water",
    deadSpriteID: "wretched_skeleton_dead",
    hp: 30,
    speed: 22,
    waterSpeedModifier: 0.5,
    drops: [],
    essenceAmount: new NumberRange(5, 10),
    ai: AI.EnemyAI(AI.wretchedSkeletonAIConfig),
},
[EnemyIndex.REVENANT_EYE]: {
    spriteID: "revenant_eye",
    attackSpriteID: "revenant_eye_attack",
    deadSpriteID: "revenant_eye_dead",
    hp: 25,
    drops: [],
    speed: 22,
    waterSpeedModifier: 1.0,
    essenceAmount: new NumberRange(8, 12),
    ai: AI.EnemyAI(AI.revenantEyeAIConfig),
},
[EnemyIndex.WRAITH]: {
    spriteID: "wraith",
    hp: 35,
    speed: 25,
    waterSpeedModifier: 1.0,
    drops: [],
    essenceAmount: new NumberRange(10, 15),
    ai: AI.EnemyAI(AI.wraithAIConfig),
},
[EnemyIndex.EVIL_BUNNY]: {
    spriteID: "evil_bunny",
    hp: 12,
    speed: 25,
    waterSpeedModifier: 0.4,
    drops: [],
    essenceAmount: new NumberRange(10, 15),
    ai: AI.EnemyAI(AI.dummyAI),
},
[EnemyIndex.RED_SLIME]: {
    spriteID: "red_slime",
    hp: 10,
    speed: 25,
    waterSpeedModifier: 0.4,
    drops: [],
    essenceAmount: new NumberRange(3, 5),
    ai: AI.EnemyAI(AI.redSlimeAIConfig),
},
[EnemyIndex.GROUND_WORM]: {
    spriteID: "ground_worm",
    deadSpriteID: "ground_worm_dead",
    hp: 12,
    speed: 25,
    waterSpeedModifier: 0.4,
    drops: [],
    essenceAmount: new NumberRange(3, 5),
    ai: AI.EnemyAI(AI.groundWormAI),
},
[EnemyIndex.CORRUPTED_DEER]: {
    spriteID: "corrupted_deer",
    hp: 12,
    speed: 25,
    waterSpeedModifier: 0.4,
    drops: [],
    essenceAmount: new NumberRange(10, 15),
    ai: AI.EnemyAI(AI.dummyAI),
},
[EnemyIndex.FUNGAL_HUSK]: {
    spriteID: "fungal_husk",
    hp: 12,
    speed: 25,
    waterSpeedModifier: 0.4,
    drops: [],
    essenceAmount: new NumberRange(10, 15),
    ai: AI.EnemyAI(AI.dummyAI),
}
}


export { enemiesCodex, EnemyIndex };