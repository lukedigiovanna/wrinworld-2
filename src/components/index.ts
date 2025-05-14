import { GameObject } from "../gameObjects";
import { Camera } from "../rendering/Camera";
import { TileData } from "../game/tiles";

type ComponentID = "physics" | string;

interface Component {
    id: ComponentID,
    start?: () => void;
    update?: (dt: number) => void;
    destroy?: () => void;
    onHitboxCollisionEnter?: (collision: GameObject) => void;
    onHitboxCollisionExit?: (collision: GameObject) => void;
    onPhysicalCollision?: (collision: GameObject | TileData, isTile: boolean) => void;
    render?: (camera: Camera) => void; // extraneous rendering logic
    debugRender?: (camera: Camera) => void;
    data?: any;
}

type ComponentFactory = (gameObject: GameObject) => Component;

export { Component, ComponentFactory, ComponentID};
export * from "./AnimationManager";
export * from "./EssenceManager";
export * from "./Fade";
export * from "./Health";
export * from "./Hitbox";
export * from "./InventoryManager";
export * from "./MovementData";
export * from "./ParticleEmitter";
export * from "./PhysicalCollider";
export * from "./Physics";
export * from "./PlayerMovement";
export * from "./PowerupDropper";
export * from "./StatusEffectManager";
