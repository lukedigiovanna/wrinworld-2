import { Color } from "./utils";
import { GameObject } from "./gameObjects";

enum StatusEffectIndex {
    POISON,
    FLAME,
    STUN,
    ROOT_SNARE,
    INVINCIBILITY,
}

interface StatusEffect {
    displayName: string;
    iconSpriteID: string;
    particleID: string;
    displayIconID?: string;
    rate: number; // How many times per second to apply the effect
    apply?: (gameObject: GameObject, level: number) => void; // Run based on rate
    start?: (gameObject: GameObject, level: number) => void; // Run when effect is added
    end?: (gameObject: GameObject, level: number) => void; // Run when effect is removed.
}

const statusEffectsCodex: Record<StatusEffectIndex, StatusEffect> = {
[StatusEffectIndex.POISON]: {
    displayName: "Poison",
    iconSpriteID: "poison_effect_icon",
    particleID: "poison_particle",
    rate: 4,
    apply(gameObject, level) {
        if (gameObject.hasComponent("health")) {
            gameObject.getComponent("health").data.damage(level * 0.25);
        }
    },
},
[StatusEffectIndex.FLAME]: {
    displayName: "Flame",
    iconSpriteID: "flame_effect_icon",
    particleID: "flame_particle",
    rate: 1,
    apply(gameObject, level) {
        if (gameObject.hasComponent("health")) {
            gameObject.getComponent("health").data.damage(level * 1.2);
        }
    },
},
[StatusEffectIndex.STUN]: {
    displayName: "Stun",
    iconSpriteID: "stun_effect_icon",
    particleID: "stun_particle",
    rate: 1,
    apply(gameObject, level) {
    },
    start(gameObject, level) {
        if (gameObject.hasComponent("movement-data")) {
            gameObject.getComponent("movement-data").data.stunnedCount++;
        }
    },
    end(gameObject, level) {
        if (gameObject.hasComponent("movement-data")) {
            gameObject.getComponent("movement-data").data.stunnedCount--;
        }
    },
},
[StatusEffectIndex.ROOT_SNARE]: {
    displayName: "Root Snare",
    iconSpriteID: "root_snare_icon",
    particleID: "square",
    displayIconID: "root_snare",
    rate: 1,
    apply(gameObject, level) {
        if (gameObject.hasComponent("health")) {
            gameObject.getComponent("health").data.damage(level);
        }
    },
    start(gameObject, level) {
        if (gameObject.hasComponent("movement-data")) {
            gameObject.getComponent("movement-data").data.stunnedCount++;
        }
    },
    end(gameObject, level) {
        if (gameObject.hasComponent("movement-data")) {
            gameObject.getComponent("movement-data").data.stunnedCount--;
        }
    },
},
[StatusEffectIndex.INVINCIBILITY]: {
    displayName: "Invincibility",
    iconSpriteID: "invincibility_icon",
    displayIconID: "invincibility_bubble",
    particleID: "square",
    rate: 1,
    start(gameObject, level) {
        if (gameObject.hasComponent("health")) {
            gameObject.getComponent("health").data.invincibleCount++;
        }
    },
    end(gameObject, level) {
        if (gameObject.hasComponent("health")) {
            gameObject.getComponent("health").data.invincibleCount--;
        }
    },
}
}

export { StatusEffectIndex, statusEffectsCodex };
export type { StatusEffect };
