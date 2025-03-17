import { Codex } from "./codex";
import { GameObject } from "./gameObjects";

enum StatusEffectIndex {
    POISON,
    FLAME,
}

interface StatusEffect {
    displayName: string;
    iconSpriteID: string;
    particleID: string;
    rate: number; // How many times per second to apply the effect
    apply: (gameObject: GameObject, level: number) => void;
}

const statusEffectsCodex = new Codex<StatusEffectIndex, StatusEffect>();
statusEffectsCodex.set(StatusEffectIndex.POISON, {
    displayName: "Poison",
    iconSpriteID: "poison_effect_icon",
    particleID: "poison_particle",
    rate: 0.25,
    apply(gameObject, level) {
        if (gameObject.hasComponent("health")) {
            gameObject.getComponent("health").data.damage(level / 4);
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

export { StatusEffectIndex, statusEffectsCodex };
export type { StatusEffect };
