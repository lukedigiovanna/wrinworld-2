// this manages all logic pertaining to the management of particles.
// needs to be attached to a live game object to work properly, though

import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import { Vector, MathUtils, Color } from "../utils";
import { getTexture } from "../assets/imageLoader";

enum ParticleLayer {
    ABOVE_OBJECTS,
    BELOW_OBJECTS,
}

interface Particle {
    position: Vector;
    scale: number;
    velocity: Vector;
    angularVelocity: number;
    rotation: number;
    color: Color;

    useRelativePosition: boolean;
    gameObject?: GameObject;

    spriteID: string;
    layer: ParticleLayer;
    
    birthTime: number; // game time of birth
    lifetime: number; // time the particle should be allowed to live

    update?: (particle: Particle, dt: number) => void;
}

interface ParticleEmitterData {
    enabled: boolean;
    spriteID: () => string;
    color: () => Color;
    layer: () => ParticleLayer;
    rate: () => number; // particles per second
    spawnBoxOffset: () => Vector;
    spawnBoxSize: () => Vector;
    rotation: () => number;
    scale: () => number;
    velocity: () => Vector;
    angularVelocity: () => number;
    lifetime: () => number;
    particleUpdate: (particle: Particle, dt: number) => void;
    emit: () => void;
}

const ParticleEmitter: (data: Partial<ParticleEmitterData>, altID?: string) => ComponentFactory = (settings: Partial<ParticleEmitterData>, altID="") => {
    return (gameObject: GameObject) => {
        let timer = 0.0;
        const data: ParticleEmitterData = {
            enabled: true,
            spriteID: () => "square",
            color: () => Color.WHITE,
            layer: () => ParticleLayer.ABOVE_OBJECTS,
            rate: () => 1.0, 
            spawnBoxOffset: () => Vector.zero(),
            spawnBoxSize: () => Vector.zero(),
            rotation: () => 0.0,
            scale: () => 1.0,
            velocity: () => Vector.zero(),
            angularVelocity: () => 0.0,
            lifetime: () => 1.0,
            particleUpdate(dt) {},
            emit() {
                const boxSize = data.spawnBoxSize();
                const spriteID = data.spriteID();
                const sprite = getTexture(spriteID);
                gameObject.game.addParticle({
                    gameObject,
                    position: Vector.add(
                        Vector.add(gameObject.position, data.spawnBoxOffset()), 
                        new Vector(MathUtils.random(-boxSize.x / 2, boxSize.x / 2), MathUtils.random(-boxSize.y / 2, boxSize.y / 2))
                    ),
                    spriteID: spriteID,
                    color: data.color(),
                    useRelativePosition: false,
                    scale: data.scale(),
                    rotation: data.rotation(),
                    velocity: data.velocity(),
                    angularVelocity: data.angularVelocity(),
                    birthTime: gameObject.game.time,
                    lifetime: data.lifetime(),
                    update(particle, dt) {
                        data.particleUpdate(particle, dt);
                    },
                    layer: data.layer()
                });
            },
            ...settings
        };
        let currentRate = data.rate();
        return {
            id: `particle-emitter${altID.length > 0 ? `-${altID}` : ''}`,
            update(dt) {
                if (data.enabled) {
                    timer += dt;
                    if (currentRate > 0 && timer > (1.0 / currentRate)) {
                        timer %= 1.0 / currentRate;
                        currentRate = data.rate();
                        data.emit();
                    }
                }
            },
            data
        }
    }
}

export { ParticleEmitter, ParticleEmitterData, Particle, ParticleLayer };
