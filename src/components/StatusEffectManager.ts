import { ComponentFactory, ParticleEmitter } from "./";
import { GameObject } from "../gameObjects";
import { StatusEffectIndex, statusEffectsCodex, StatusEffect } from "../statusEffects";
import { MathUtils, Vector } from "../utils";

interface Effect {
    statusEffect: StatusEffect;
    level: number;
    duration: number;
    timer: number;
    startTime: number;
}

const StatusEffectManager: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        effects: [],
        applyEffect(effectIndex: StatusEffectIndex, level: number, duration: number) {
            const statusEffect = statusEffectsCodex.get(effectIndex);
            const effect: Effect = {
                statusEffect,
                level,
                duration,
                timer: 0,
                startTime: gameObject.game.time,
            };
            statusEffect.apply?.(gameObject, level);
            statusEffect.start?.(gameObject, level);
            this.effects.push(effect);
        },
        statusEffectParticles: undefined,
    };
    return {
        id: "status-effect-manager",
        update(dt) {
            for (let i = 0; i < this.data.effects.length; i++) {
                const effect = this.data.effects[i];
                effect.timer += dt;
                const period = 1.0 / effect.statusEffect.rate;
                while (effect.timer >= period) {
                    effect.statusEffect.apply?.(gameObject, effect.level);
                    effect.timer -= period;
                }
                const totalElapsed = gameObject.game.time - effect.startTime;
                if (totalElapsed >= effect.duration) {
                    effect.statusEffect.end?.(gameObject, effect.level);
                    this.data.effects.splice(i, 1);
                    i--;
                }
            }
            if (this.data.effects.length === 0) {
                data.statusEffectParticles.data.enabled = false;
            }
            else {
                data.statusEffectParticles.data.enabled = true;
            }
        },
        start() {
            data.statusEffectParticles = gameObject.addComponent(ParticleEmitter(
                {
                    rate: () => MathUtils.random(2.5, 3.5),
                    velocity: () => new Vector(0, MathUtils.random(8, 16)),
                    spawnBoxSize: () => new Vector(0.5, 0.5),
                    spriteID: () => MathUtils.randomChoice(
                        this.data.effects.map((effect: Effect) => effect.statusEffect.particleID)
                    )
                },
                "status-effects"
            ))
        },
        data
    }
}

export { StatusEffectManager };
