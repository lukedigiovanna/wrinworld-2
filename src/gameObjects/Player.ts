import { GameObjectFactory, GameObject } from "./index";
import { Vector } from "../utils";
import { Physics, PlayerMovement, PhysicalCollider, Hitbox, ParticleEmitter, ParticleEmitterData } from "../components";
import { spriteRenderer } from "../renderers";

const PlayerFactory: GameObjectFactory = (position: Vector) => {
    const player = new GameObject();
    player.scale.setComponents(1.333, 2);
    player.position = position.copy();
    player.addComponent(Physics);
    player.addComponent(PlayerMovement);
    const hitbox = player.addComponent(Hitbox);
    hitbox.data?.boxSize.setComponents(1.0, 2.0);
    const collider = player.addComponent(PhysicalCollider);
    collider.data?.boxOffset.setComponents(0, -0.8);
    collider.data?.boxSize.setComponents(1, 0.5);
    collider.data.castShadow = false;
    player.renderer = spriteRenderer("peach_water");

    player.tag = "player";
    return player;
}

export { PlayerFactory }