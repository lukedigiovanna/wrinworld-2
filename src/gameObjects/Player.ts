import { GameObjectFactory, GameObject, Team } from "./";
import { Vector } from "../utils";
import { Physics, PlayerMovement, PhysicalCollider, Hitbox, InventoryManager, 
         Health, WeaponManager, EssenceManager} from "../components";
import { spriteRenderer } from "../renderers";
import { ItemIndex } from "../items";

const PlayerFactory: GameObjectFactory = (position: Vector) => {
    const player = new GameObject();
    player.team = Team.PLAYER;
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
    player.addComponent(EssenceManager);

    player.addComponent((gameObject) => {
        const data: any = {
            health: undefined,
            lastHP: 0,
            lastMaxHP: 0
        };
        const updateUI = (hp: number, maxHP: number) => {
            data.lastHP = hp;
            data.lastMaxHP = maxHP;
            console.log(hp, maxHP);
            const percent = Math.floor(hp / maxHP * 100);
            $("#health-bar-fill").css("width", `${percent}%`);
        }
        return {
            id: "player-health-bar-display",
            start() {
                data.health = gameObject.getComponent("health");
            },
            update() {
                const dirty = data.lastHP !== data.health.data.hp ||
                             data.lastMaxHP !== data.health.data.maximumHP;
                if (dirty) {
                    updateUI(data.health.data.hp, data.health.data.maximumHP);
                }
            }
        }
    })

    player.renderer = spriteRenderer("peach_water");

    player.tag = "player";
    return player;
}

export { PlayerFactory }