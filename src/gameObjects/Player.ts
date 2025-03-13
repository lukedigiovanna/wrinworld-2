import { GameObjectFactory, GameObject, Team } from "./";
import { Vector } from "../utils";
import { Physics, PlayerMovement, PhysicalCollider, Hitbox, InventoryManager, 
         Health, WeaponManager, EssenceManager,
         HealthBarDisplayMode} from "../components";
import { spriteRenderer } from "../renderers";
import { ItemIndex } from "../items";
import { getImage } from "../imageLoader";
import input from "../input";

const PlayerFactory: GameObjectFactory = (position: Vector) => {
    const player = new GameObject();
    player.team = Team.PLAYER;
    player.scale.setComponents(1.333, 2);
    player.position = position.copy();
    player.addComponent(Physics);
    player.addComponent(PlayerMovement);
    const hitbox = player.addComponent(Hitbox);
    hitbox.data?.boxSize.setComponents(1.0, 1.0);
    const collider = player.addComponent(PhysicalCollider);
    collider.data?.boxOffset.setComponents(0, -0.8);
    collider.data?.boxSize.setComponents(1, 0.5);
    collider.data.castShadow = false;

    const health = player.addComponent(Health);
    health.data.initializeHealth(50);
    health.data.healthBarDisplayMode = HealthBarDisplayMode.NONE;

    player.addComponent(InventoryManager);

    player.addComponent(WeaponManager);
    player.addComponent(EssenceManager);

    player.addComponent((gameObject) => {
        return {
            id: "add-starter-items",
            start() {
                const inventoryManager = gameObject.getComponent("inventory-manager");
                if (inventoryManager) {
                    inventoryManager.data.inventory.addItemIndex(ItemIndex.BROAD_SWORD);
                    for (let i = 0; i < 20; i++) {
                        inventoryManager.data.inventory.addItemIndex(ItemIndex.SHURIKEN);
                    }
                    inventoryManager.data.inventory.addItemIndex(ItemIndex.BOW);
                    for (let i = 0; i < 200; i++) {
                        inventoryManager.data.inventory.addItemIndex(ItemIndex.ARROW);
                    }
                }
            }
        }
    })

    player.addComponent((gameObject) => {
        const data: any = {
            health: undefined,
            lastHP: 0,
            lastMaxHP: 0,
            weaponManager: undefined,
        };
        const updateHealthUI = (hp: number, maxHP: number) => {
            data.lastHP = hp;
            data.lastMaxHP = maxHP;
            const percent = Math.floor(hp / maxHP * 100);
            $("#health-bar-fill").css("width", `${percent}%`);
            $("#hp-amount").text(hp);
            $("#hp-max").text(maxHP);
        }
        return {
            id: "player-ui-management",
            start() {
                data.health = gameObject.getComponent("health");
                data.weaponManager = gameObject.getComponent("weapon-manager");
            },
            update() {
                const dirty = data.lastHP !== data.health.data.hp ||
                             data.lastMaxHP !== data.health.data.maximumHP;
                if (dirty) {
                    updateHealthUI(data.health.data.hp, data.health.data.maximumHP);
                }

                const equipped = data.weaponManager.data.equippedWeapon;
                if (equipped) {
                    const elapsed = gameObject.game.time - data.weaponManager.data.timeLastFired;
                    const cooldown = equipped.cooldown;
                    const percent = elapsed / cooldown;
                    const index = Math.floor(percent * 10);
                    const attackReloadIcon = $("#attack-reload-icon");
                    if (percent <= 1) {
                        attackReloadIcon.show();
                        attackReloadIcon.attr("src", getImage(`attack_reload_${index}`).src);
                        attackReloadIcon.css("left", input.mousePosition.x);
                        attackReloadIcon.css("top", input.mousePosition.y);
                    }
                    else {
                        attackReloadIcon.hide();
                    }
                }
            }
        }
    });

    player.renderer = spriteRenderer("peach_water");
    health.data.damageSoundEffectID = "peach_damage";
    health.data.deathSoundEffectID = "peach_die";

    player.tag = "player";
    return player;
}

export { PlayerFactory }