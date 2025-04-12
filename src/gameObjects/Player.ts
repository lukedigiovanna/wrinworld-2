import { GameObjectFactory, GameObject, Team } from "./";
import { Vector, MathUtils } from "../utils";
import { Physics, PlayerMovement, PhysicalCollider, Hitbox, InventoryManager, 
         Health, WeaponManager, EssenceManager, HealthBarDisplayMode,
         StatusEffectManager, ParticleEmitter, ParticleLayer,
         MovementData} from "../components";
import { spriteRenderer } from "../renderers";
import { ItemIndex, itemsCodex } from "../items";
import { getImage } from "../imageLoader";
import input from "../input";

const PlayerFactory: GameObjectFactory = (position: Vector) => {
    const player = new GameObject();
    player.team = Team.PLAYER;
    player.tag = "player";
    player.position.set(position.copy());
    player.renderer = spriteRenderer("peach");
    player.scale.setComponents(32, 48);
    player.castsShadow = true;
    player.shadowSize = 2;

    player.addComponent(Physics);
    const movementData = player.addComponent(MovementData);
    movementData.data.baseSpeed = 150;
    player.addComponent(PlayerMovement);
    
    const hitbox = player.addComponent(Hitbox);
    hitbox.data.boxSize.setComponents(24, 24);
    hitbox.data.boxOffset.setComponents(0, -12)
    
    const collider = player.addComponent(PhysicalCollider);
    collider.data.boxOffset.setComponents(0, -20);
    collider.data.boxSize.setComponents(24, 8);
    collider.data.castShadow = false;

    const health = player.addComponent(Health);
    health.data.initializeHealth(50);
    health.data.regenerationRate = 0.0;
    health.data.healthBarDisplayMode = HealthBarDisplayMode.NONE;
    health.data.damageSoundEffectID = "peach_damage";
    health.data.deathSoundEffectID = "peach_die";

    const trailEmitter = player.addComponent(ParticleEmitter({
        rate: () => 30,
        scale: () => MathUtils.random(1, 1.5),
        velocity: () => MathUtils.randomVector(MathUtils.random(3, 22)),
        angularVelocity: () => MathUtils.random(-1, 1),
        spawnBoxOffset: () => collider.data.boxOffset,
        spawnBoxSize: () => new Vector(5, 2),
        lifetime: () => MathUtils.random(0.3, 0.8),
        layer: () => ParticleLayer.BELOW_OBJECTS
    }, "trail"));
    trailEmitter.data.enabled = false;

    player.addComponent(InventoryManager);
    player.addComponent(WeaponManager);
    player.addComponent(EssenceManager);
    player.addComponent(StatusEffectManager);

    // Starter items
    player.addComponent((gameObject) => {
        return {
            id: "add-starter-items",
            start() {
                const inventoryManager = gameObject.getComponent("inventory-manager");
                const items = [ItemIndex.STUN_FIDDLE, ItemIndex.ESSENCE_VIAL, ItemIndex.BATTLE_HAMMER, ItemIndex.BOW, ItemIndex.ARROW];
                for (const i of items) {
                    const item = itemsCodex.get(i as ItemIndex);
                    for (let j = 0; j < item.maxStack; j++) {
                        inventoryManager.data.inventory.addItemIndex(i);
                    }
                }
                // inventoryManager.data.inventory.addItemIndex(ItemIndex.BROAD_SWORD);
                // inventoryManager.data.inventory.addItemIndex(ItemIndex.BOW);
                // for (let i = 0; i < 100; i++) {
                //     inventoryManager.data.inventory.addItemIndex(ItemIndex.ARROW);
                // }
            }
        }
    })

    // UI Manager
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
            $("#hp-amount").text(Math.round(hp));
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
                    let elapsed = gameObject.game.time - data.weaponManager.data.timeLastFired;
                    let percent = elapsed / equipped.cooldown;
                    let index = Math.floor(percent * 10);
                    const attackReloadIcon = $("#attack-reload-icon");
                    let follow = false;
                    if (percent <= 1) {
                        follow = true;
                        attackReloadIcon.attr("src", getImage(`attack_reload_${index}`).src);
                    }
                    else {
                        if (data.weaponManager.data.charging) {
                            follow = true;
                            elapsed = gameObject.game.time - data.weaponManager.data.timeChargeStart;
                            percent = elapsed /  (equipped.maxCharge ? equipped.maxCharge : 1);
                            index = Math.min(9, Math.floor(percent * 10));
                            attackReloadIcon.attr("src", getImage(`attack_charge_${index}`).src);
                        }
                    }
                    if (follow) {
                        attackReloadIcon.show();
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

    return player;
}

export { PlayerFactory }