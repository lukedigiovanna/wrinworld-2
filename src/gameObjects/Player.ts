import { GameObjectFactory, GameObject, Team, PORTAL_ACTIVE_RADIUS } from "./";
import { Vector, MathUtils } from "../utils";
import { Physics, PlayerMovement, PhysicalCollider, Hitbox, InventoryManager, 
         Health, EssenceManager, HealthBarDisplayMode,
         StatusEffectManager, ParticleEmitter, ParticleLayer,
         MovementData,
         AnimationManager} from "../components";
import { spriteRenderer } from "../renderers";
import { SpriteAnimationIndex } from "../animations";
import { getImage } from "../imageLoader";
import { ItemIndex, itemsCodex } from "../items";
import input from "../input";

const PlayerFactory: GameObjectFactory = (position: Vector) => {
    const player = new GameObject();
    player.team = Team.PLAYER;
    player.tag = "player";
    player.position.set(position.copy());
    player.renderer = spriteRenderer("character");
    const animationManager = player.addComponent(AnimationManager);
    animationManager.data.animation = SpriteAnimationIndex.CHARACTER_IDLE;

    player.scale.setComponents(24, 42);
    player.castsShadow = true;
    player.shadowSize = 2;

    player.addComponent(Physics);
    const movementData = player.addComponent(MovementData);
    movementData.data.baseSpeed = 120;
    player.addComponent(PlayerMovement);
    
    const hitbox = player.addComponent(Hitbox);
    hitbox.data.boxSize.setComponents(18, 18);
    hitbox.data.boxOffset.setComponents(0, -11);
    
    const collider = player.addComponent(PhysicalCollider);
    collider.data.boxOffset.setComponents(0, -16);
    collider.data.boxSize.setComponents(16, 6);

    const health = player.addComponent(Health);
    health.data.initializeHealth(50);
    health.data.regenerationRate = 0.0;
    health.data.healthBarDisplayMode = HealthBarDisplayMode.NONE;
    health.data.damageSoundEffectID = "peach_damage";
    health.data.deathSoundEffectID = "peach_die";
    health.data.onDamage = (amount: number) => {
        player.game.camera.applyShake(0.2, amount / 4);
    }

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
    player.addComponent(EssenceManager);
    player.addComponent(StatusEffectManager);

    player.addComponent((gameObject) => {
        return {
            id: "cheats",
            update(dt) {
                if (input.isKeyPressed("KeyZ")) {
                    const p = gameObject.game.getNearestGameObjectWithFilter(gameObject.position, (gameObject) => gameObject.tag === "portal");
                    if (p !== undefined && p.distance < PORTAL_ACTIVE_RADIUS) {
                        p.object.destroy();
                    }
                }
            }
        }
    });

    // Starter items
    player.addComponent((gameObject) => {
        return {
            id: "add-starter-items",
            start() {
                const inventoryManager = gameObject.getComponent("inventory-manager");
                // const items = [ItemIndex.BROAD_SWORD, ItemIndex.BOW, ItemIndex.POISON_ARROW, ItemIndex.FLAME_ARROW];
                // for (const i of items) {
                //     const item = itemsCodex[i as ItemIndex];
                //     for (let j = 0; j < item.maxStack; j++) {
                //         inventoryManager.data.inventory.addItemIndex(i);
                //     }
                // }
                for (let i = 0; i <= 44; i++) {
                    const item = itemsCodex[i as ItemIndex];
                    for (let j = 0; j < item.maxStack; j++) {
                        inventoryManager.data.inventory.addItemIndex(i);
                    }
                }
            }
        }
    })

    // UI Manager
    player.addComponent((gameObject) => {
        const data: any = {
            health: undefined,
            statusEffectManager: undefined
        };
        return {
            id: "player-ui-management",
            start() {
                data.health = gameObject.getComponent("health");
                data.statusEffectManager = gameObject.getComponent("status-effect-manager");
            },
            update() {
                const hp = data.health.data.hp;
                const maxHP = data.health.data.maximumHP;
                const percent = Math.floor(hp / maxHP * 100);
                $("#health-bar-fill").css("width", `${percent}%`);
                $("#hp-amount").text(Math.round(hp));
                $("#hp-max").text(maxHP);
                $("#status-effect-icon-row").empty();
                for (const effect of data.statusEffectManager.data.effects) {
                    const icon = $(`
                        <div class="status-effect-icon-container">
                            <img class="slot-icon" src="assets/images/ui/status_effect_slot.png" />
                            <img class="effect-icon" src="${getImage(effect.statusEffect.iconSpriteID).src}" />
                        </div>
                    `);
                    const elapsed = gameObject.game.time - effect.startTime;
                    if (effect.duration - elapsed < 5) {
                        icon.css("opacity", `${MathUtils.rescale(Math.sin(elapsed * 4), -1, 1, 50, 100)}%`);
                    }
                    $("#status-effect-icon-row").append(icon);
                }
            }
        }
    });

    return player;
}

export { PlayerFactory }