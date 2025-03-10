import { GameObjectFactory, GameObject } from "./index";
import { Vector } from "../utils";
import { Physics, PlayerMovement, PhysicalCollider, Hitbox, InventoryManager, 
         Health, WeaponManager} from "../components";
import { spriteRenderer } from "../renderers";
import { ItemIndex, itemsCodex } from "../items";

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

    const health = player.addComponent(Health);
    health.data.showHealthBar = false;

    const inventoryManager = player.addComponent(InventoryManager);
    inventoryManager.data.inventory.addItemIndex(ItemIndex.BROAD_SWORD);
    for (let i = 0; i < 20; i++) {
        inventoryManager.data.inventory.addItemIndex(ItemIndex.SHURIKEN);
    }
    inventoryManager.data.inventory.addItemIndex(ItemIndex.BOW);
    for (let i = 0; i < 120; i++) {
        inventoryManager.data.inventory.addItemIndex(ItemIndex.ARROW);
    }

    player.addComponent(WeaponManager);

    player.renderer = spriteRenderer("peach_water");

    player.tag = "player";
    return player;
}

export { PlayerFactory }