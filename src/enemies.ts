import { MathUtils, NumberRange, Vector } from "./utils";
import { ComponentFactory, ParticleEmitter, ParticleLayer } from "./components"
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
    FUNGAL_HUSK,
    FUNGAL_SPIRIT,
}

interface Enemy {
    spriteID: string;
    attackSpriteID?: string; // Changes to attack sprite if enemy in "attack" AI state
    waterSpriteID?: string; // Changes to water sprite when in water when defined
    waterAttackSpriteID?: string;
    deadSpriteID?: string; // Spawns a corpse when defined
    particleEmitter?: ComponentFactory; // No particles when undefined
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
    particleEmitter: ParticleEmitter({
        spriteID: () => "slime_particle",
        rotation: () => MathUtils.random(0, 2 * Math.PI),
        spawnBoxSize: () => new Vector(5, 5),
        rate: () => 5,
        layer: () => ParticleLayer.BELOW_OBJECTS
    }),
    hp: 10,
    drops: [],
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
    waterSpeedModifier: 1.0,
    essenceAmount: new NumberRange(8, 12),
    ai: AI.EnemyAI(AI.revenantEyeAIConfig),
},
[EnemyIndex.WRAITH]: {
    spriteID: "wraith",
    hp: 35,
    waterSpeedModifier: 1.0,
    drops: [],
    essenceAmount: new NumberRange(10, 15),
    ai: AI.EnemyAI(AI.wraithAIConfig),
},
[EnemyIndex.EVIL_BUNNY]: {
    spriteID: "evil_bunny",
    attackSpriteID: "evil_bunny_attack",
    deadSpriteID: "evil_bunny_dead",
    hp: 12,
    waterSpeedModifier: 0.4,
    drops: [],
    essenceAmount: new NumberRange(10, 15),
    ai: AI.EnemyAI(AI.evilBunnyAI),
},
[EnemyIndex.RED_SLIME]: {
    spriteID: "red_slime",
    hp: 10,
    waterSpeedModifier: 0.4,
    drops: [],
    essenceAmount: new NumberRange(3, 5),
    ai: AI.EnemyAI(AI.redSlimeAIConfig),
},
[EnemyIndex.GROUND_WORM]: {
    spriteID: "ground_worm",
    deadSpriteID: "ground_worm_dead",
    hp: 12,
    waterSpeedModifier: 0.4,
    drops: [],
    essenceAmount: new NumberRange(3, 5),
    ai: AI.EnemyAI(AI.groundWormAI),
},
[EnemyIndex.CORRUPTED_DEER]: {
    spriteID: "corrupted_deer",
    hp: 12,
    waterSpeedModifier: 0.4,
    drops: [],
    essenceAmount: new NumberRange(10, 15),
    ai: AI.EnemyAI(AI.dummyAI),
},
[EnemyIndex.FUNGAL_HUSK]: {
    spriteID: "fungal_husk",
    attackSpriteID: "fungal_husk_attack",
    deadSpriteID: "fungal_husk_dead",
    particleEmitter: ParticleEmitter({
        spriteID: () => "husk_particle",
        rotation: () => MathUtils.random(0, 2 * Math.PI),
        angularVelocity: () => MathUtils.random(-0.2, 0.2),
        velocity: () => MathUtils.randomVector(MathUtils.random(1, 14)),
        spawnBoxSize: () => new Vector(5, 5),
        rate: () => 1,
        layer: () => ParticleLayer.ABOVE_OBJECTS
    }),
    hp: 50,
    waterSpeedModifier: 0.4,
    drops: [],
    essenceAmount: new NumberRange(12, 16),
    ai: AI.EnemyAI(AI.fungalHuskAI),
},
[EnemyIndex.FUNGAL_SPIRIT]: {
    spriteID: "fungal_spirit",
    hp: 7,
    waterSpeedModifier: 0.4,
    drops: [],
    essenceAmount: new NumberRange(1, 2),
    ai: AI.EnemyAI(AI.fungalSpiritAI),
},
}


export { enemiesCodex, EnemyIndex };