import { GameObject, GameObjectFactory } from "./index";
import { Vector, MathUtils } from "../utils";
import { Hitbox, Physics, AnimalAI, PhysicalCollider, Health, ItemDropper, ParticleEmitter, Particle } from "../components";
import { spriteRenderer } from "../renderers";

const particleFall = (particle: Particle, dt: number) => {
    const age = particle.gameObject?.age as number - particle.birthTime;
    particle.velocity.setComponents(Math.sin(age * 5), -0.2 + Math.cos(age * 7) * 0.3);
}

const AnimalFactory: GameObjectFactory = (position: Vector, spriteID: string) => {
    const animal = new GameObject();
    animal.position = position.copy();
    animal.scale.setComponents(1.5, 0.8);

    animal.renderer = spriteRenderer(spriteID);
    
    animal.addComponent(Health);
    animal.addComponent(Physics);
    const collider = animal.addComponent(PhysicalCollider);
    animal.addComponent(Hitbox);
    animal.addComponent(AnimalAI);
    // animal.addComponent(ItemDropper());
    animal.addComponent(ParticleEmitter({
        rate: () => 0, 
        spriteID: () => "feather", 
        lifetime: () => MathUtils.random(0.5, 1.5),
        rotation: () => MathUtils.randomChoice([-Math.PI * 2/3, Math.PI / 3]),
        particleUpdate: particleFall
    }));

    collider.data.boxOffset?.setComponents(0, -0.25);
    collider.data.boxSize?.setComponents(0.7, 0.3);

    animal.tag = "animal";

    return animal;
}

export { AnimalFactory };