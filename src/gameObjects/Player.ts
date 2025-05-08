import { GameObjectFactory, GameObject, Team, PORTAL_ACTIVE_RADIUS, CorpseFactory } from "./";
import { Vector, MathUtils, Color } from "../utils";
import { Physics, PlayerMovement, PhysicalCollider, Hitbox, InventoryManager, 
         Health, EssenceManager, HealthBarDisplayMode,
         StatusEffectManager, ParticleEmitter, ParticleLayer,
         MovementData,
         AnimationManager} from "../components";
import { spriteRenderer } from "../rendering/renderers";
import { SpriteAnimationIndex } from "../game/animations";
import { getImage, getTexture } from "../assets/imageLoader";
import { ItemIndex, itemsCodex } from "../game/items";
import input from "../input";
import { LevelIndex } from "../levels";
import { PostProcessingShaderIndex } from "../rendering/postProcessingShaders";
import controls from "../controls";
import { addNotification } from "../notifications";

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
        player.game.camera.applyShake(0.2, Math.max(1, amount / health.data.maximumHP * 6));
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
                if (input.isKeyPressed("KeyG")) {
                    gameObject.destroy();
                }
                if (input.isKeyPressed("KeyT")) {
                    gameObject.getComponent("essence-manager").data.addEssence(100);
                }
                if (input.isKeyPressed("KeyL")) {
                    gameObject.game.switchLevel(LevelIndex.SCHOOL);
                }
                if (input.isKeyPressed("KeyH")) {
                    gameObject.getComponent("health").data.damage(1);
                }
                // if (input.isKeyDown("KeyI")) {
                //     gameObject.game.camera.setActivePostProcessingShader(PostProcessingShaderIndex.INVERT);
                // }
                // else {
                //     gameObject.game.camera.setActivePostProcessingShader(PostProcessingShaderIndex.NO_EFFECT);
                // }
            }
        }
    });

    // Starter items
    player.addComponent((gameObject) => {
        return {
            id: "add-starter-items",
            start() {
                const inventoryManager = gameObject.getComponent("inventory-manager");
                // const items = [ItemIndex.COMPOSITION_NOTEBOOK, ItemIndex.FIRE_ALARM, ItemIndex.LUNCH_BOX, ItemIndex.MECHANICAL_PENCIL, ItemIndex.MILK_CARTON, ItemIndex.MYSTERY_PUDDING, ItemIndex.PENCIL, ItemIndex.SCISSORS, ItemIndex.SODA_GRENADE, ItemIndex.SPRAY_PAINT, ItemIndex.TEXTBOOK, ItemIndex.VOLCANO];
                const items = [ItemIndex.PENCIL, ItemIndex.SODA_GRENADE, ItemIndex.VOLCANO, ItemIndex.MYSTERY_PUDDING];
                for (const i of items) {
                    const item = itemsCodex[i as ItemIndex];
                    for (let j = 0; j < Math.min(item.maxStack, 10); j++) {
                        inventoryManager.data.inventory.addItemIndex(i);
                    }
                }
                // for (let i = 0; i <= 47; i++) {
                //     const item = itemsCodex[i as ItemIndex];
                //     for (let j = 0; j < item.maxStack; j++) {
                //         inventoryManager.data.inventory.addItemIndex(i);
                //     }
                // }
            }
        }
    });

    player.addComponent((gameObject) => {
        return {
            id: "portal-finder",
            data: {
                lastFindPortalRequestTime: -999,
                searching: false,
                nearest: undefined,
            },
            update(dt) {
                if (input.isKeyPressed(controls.findPortal.code) && !this.data.searching) {
                    this.data.lastFindPortalRequestTime = gameObject.game.time;
                    this.data.searching = true;
                }
                if (this.data.searching) {
                    const elapsed = gameObject.game.time - this.data.lastFindPortalRequestTime;
                    if (elapsed >= 2.5) {
                        const portals = gameObject.game.portals;
                        let nearestPortal = undefined;
                        let minDistance = 0;
                        for (const portal of portals) {
                            const distance = gameObject.hitboxCenter.distanceTo(portal.position);
                            if (!nearestPortal || distance < minDistance) {
                                nearestPortal = portal;
                                minDistance = distance;
                            }
                        }
                        if (minDistance < 480 && nearestPortal) {
                            this.data.nearest = nearestPortal;
                        }
                        else {
                            addNotification({
                                color: "red",
                                text: "No portals found in range!",
                            })
                            this.data.nearest = undefined;
                        }
                        this.data.searching = false;
                    }
                }

            },
            render(camera) {
                const elapsed = gameObject.game.time - this.data.lastFindPortalRequestTime;
                if (elapsed < 2.5) {
                    const angle = MathUtils.rescale(Math.sin(elapsed * 4), -1, 1, 0, -0.4);
                    const texture = getTexture("antenna");
                    camera.drawTexture(
                        texture, 
                        gameObject.position.x + texture.width / 2 - 4, 
                        gameObject.position.y + gameObject.scale.y / 2 + texture.height / 2 - 4 , 
                        texture.width, texture.height,
                        angle, new Vector(-texture.width / 2, -texture.height / 2)
                    );
                }
                else if (this.data.nearest && elapsed < 5) {
                    const arrowAngle = gameObject.hitboxCenter.directionTowards(this.data.nearest.position).angle;
                    const texture = getTexture("right_arrow");
                    camera.drawTexture(
                        texture,
                        gameObject.position.x + texture.width / 2,
                        gameObject.position.y,
                        texture.width, texture.height,
                        arrowAngle, new Vector(-texture.width / 2, 0)
                    )
                }
            },
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
                if (percent <= 25) {
                    const p = MathUtils.rescale(Math.sin(gameObject.age * 6), -1, 1, 0.7, 1);
                    gameObject.game.camera.getPostProcessingShader(PostProcessingShaderIndex.VIGNETTE)
                                          .setUniformColorRGB(
                                            "color", new Color((0.75 - 0.5 * percent / 25) * p, 0, 0, 1.0));
                }
                else {
                    gameObject.game.camera.getPostProcessingShader(PostProcessingShaderIndex.VIGNETTE)
                                          .setUniformColorRGB("color", new Color(0, 0, 0, 1.0));

                }
            }
        }
    });

    player.addComponent((gameObject) => {
        return {
            id: "player-spawn-corpse",
            destroy() {
                gameObject.game.addGameObject(CorpseFactory(gameObject, "character_dead"))
            }
        }
    })

    return player;
}

export { PlayerFactory }