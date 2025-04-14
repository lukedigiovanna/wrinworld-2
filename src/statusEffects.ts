import { Color } from "./utils";
import { Codex } from "./codex";
import { GameObject } from "./gameObjects";

enum StatusEffectIndex {
    POISON,
    FLAME,
    STUN,
    ROOT_SNARE,
}

interface StatusEffect {
    displayName: string;
    iconSpriteID: string;
    particleID: string;
    rate: number; // How many times per second to apply the effect
    apply?: (gameObject: GameObject, level: number) => void; // Run based on rate
    start?: (gameObject: GameObject, level: number) => void; // Run when effect is added
    end?: (gameObject: GameObject, level: number) => void; // Run when effect is removed.
}

const statusEffectsCodex = new Codex<StatusEffectIndex, StatusEffect>();
statusEffectsCodex.set(StatusEffectIndex.POISON, {
    displayName: "Poison",
    iconSpriteID: "poison_effect_icon",
    particleID: "poison_particle",
    rate: 4,
    apply(gameObject, level) {
        if (gameObject.hasComponent("health")) {
            gameObject.getComponent("health").data.damage(level * 0.25);
        }
    },
});
statusEffectsCodex.set(StatusEffectIndex.FLAME, {
    displayName: "Flame",
    iconSpriteID: "flame_effect_icon",
    particleID: "flame_particle",
    rate: 1,
    apply(gameObject, level) {
        if (gameObject.hasComponent("health")) {
            gameObject.getComponent("health").data.damage(level * 1.2);
        }
    },
});
statusEffectsCodex.set(StatusEffectIndex.STUN, {
    displayName: "Stun",
    iconSpriteID: "stun_effect_icon",
    particleID: "stun_particle",
    rate: 1,
    apply(gameObject, level) {
    },
    start(gameObject, level) {
        if (gameObject.hasComponent("movement-data")) {
            gameObject.getComponent("movement-data").data.modifier -= 1.0;
        }
    },
    end(gameObject, level) {
        if (gameObject.hasComponent("movement-data")) {
            gameObject.getComponent("movement-data").data.modifier += 1.0;
        }
    },
});
statusEffectsCodex.set(StatusEffectIndex.ROOT_SNARE, {
    displayName: "Root Snare",
    iconSpriteID: "root_snare_icon",
    particleID: "square",
    rate: 1,
    apply(gameObject, level) {
        if (gameObject.hasComponent("health")) {
            gameObject.getComponent("health").data.damage(level);
        }
    },
    start(gameObject, level) {
        if (gameObject.hasComponent("movement-data")) {
            gameObject.getComponent("movement-data").data.modifier -= 1.0;
        }
    },
    end(gameObject, level) {
        if (gameObject.hasComponent("movement-data")) {
            gameObject.getComponent("movement-data").data.modifier += 1.0;
        }
    },
})

export { StatusEffectIndex, statusEffectsCodex };
export type { StatusEffect };
