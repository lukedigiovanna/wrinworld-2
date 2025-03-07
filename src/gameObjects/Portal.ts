import { spriteRenderer } from "../renderers";
import { Item } from "../items";
import { GameObjectFactory, GameObject } from "./index";
import { Vector, MathUtils } from "../utils";
import { Hitbox, ParticleEmitter, Health } from "../components";

const PortalFactory: GameObjectFactory = (position: Vector) => {
    const portal = new GameObject();
    portal.renderer = spriteRenderer("portal");
    portal.position.set(position);
    portal.scale.scale(4);
    portal.addComponent(Hitbox)
    portal.addComponent(ParticleEmitter(
        {
            spriteID: () => MathUtils.randomChoice(["portal_particle", "portal_particle", "portal_particle", "smoke"]),
            rate: () => 16,
            size: () => new Vector(0.35, 0.35),
            spawnBoxSize: () => Vector.zero(),
            rotation: () => MathUtils.random(0, Math.PI * 2),
            velocity: () => MathUtils.randomVector(MathUtils.random(1, 1.5)),
            lifetime: () => MathUtils.random(0.3, 1.2)
        }
    ))
    portal.addComponent((gameObject: GameObject) => {
        return {
            id: "portal-effects",
            update(dt) {
                gameObject.rotation = gameObject.age * 3;
            },
        }
    });
    portal.addComponent(Health);
    portal.tag = "portal";
    return portal;
}

export { PortalFactory };