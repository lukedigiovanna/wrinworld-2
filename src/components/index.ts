import { GameObject } from "../gameObjects";
import { Camera } from "../camera";
import { Tile } from "tiles";

type ComponentID = "physics" | string;

type Component = {
    id: ComponentID,
    start?: () => void;
    update?: (dt: number) => void;
    destroy?: () => void;
    onHitboxCollisionEnter?: (collision: GameObject) => void;
    onHitboxCollisionExit?: (collision: GameObject) => void;
    onPhysicalCollision?: (collision: GameObject | Tile, isTile: boolean) => void;
    render?: (camera: Camera) => void; // extraneous rendering logic
    debugRender?: (camera: Camera) => void;
    data?: any;
}

type ComponentFactory = (gameObject: GameObject) => Component;

export { Component, ComponentFactory, ComponentID};
export * from "./Physics";
export * from "./PlayerMovement";
export * from "./PhysicalCollider";
export * from "./Hitbox";
export * from "./AnimalAI";
export * from "./Health";
export * from "./ItemDropper";
export * from "./ParticleEmitter";
export * from "./EnemyAI";
export * from "./InventoryManager";
export * from "./WeaponManager";
