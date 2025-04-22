import { GameObject, GameObjectFactory, EssenceOrbFactory, Team, CorpseFactory } from "./";
import { spriteRenderer } from "../renderers";
import { Vector, MathUtils } from "../utils";
import { Health, Hitbox, Physics, PhysicalCollider, ItemDropper, 
    HealthBarDisplayMode, ParticleEmitter, ParticleLayer, StatusEffectManager, 
    MovementData} from "../components";
import { TileIndex } from "../tiles";
import { enemiesCodex, EnemyIndex } from "../enemies";
import { getTexture } from "../imageLoader";

const EnemyFactory: GameObjectFactory = (position: Vector, enemyIndex: EnemyIndex) => {
    const enemyData = enemiesCodex[enemyIndex];
    
    const enemy = new GameObject();
    enemy.team = Team.ENEMY;
    enemy.tag = "enemy";
    enemy.position = position.copy();
    
    const texture = getTexture(enemyData.spriteID);

    enemy.renderer = spriteRenderer(enemyData.spriteID);
    enemy.scale.setComponents(texture.image.width, texture.image.height);
    enemy.shadowSize = texture.image.width / 16;

    const health = enemy.addComponent(Health);
    health.data.initializeHealth(enemyData.hp);
    health.data.damageSoundEffectID = "hitmarker";
    health.data.healthBarDisplayMode = HealthBarDisplayMode.ON_HIT;
    
    const hitbox = enemy.addComponent(Hitbox);
    hitbox.data.boxSize = new Vector(enemy.scale.x * 0.75, enemy.scale.y);
    
    enemy.addComponent(Physics);
    enemy.addComponent(ItemDropper(enemyData.drops));
    enemy.addComponent(StatusEffectManager);
    
    const movementData = enemy.addComponent(MovementData);
    movementData.data.baseSpeed = enemyData.speed;
    movementData.data.waterModifier = enemyData.waterSpeedModifier;
    
    const collider = enemy.addComponent(PhysicalCollider);
    collider.data.boxSize = new Vector(enemy.scale.x * 0.75, 6);
    collider.data.boxOffset = new Vector(0, -enemy.scale.y / 2 + 3);
    
    enemy.addComponent((gameObject) => {
        const data: any = {
            collider: undefined,
            physics: undefined,
            ai: undefined,
        };
        return {
            id: "common-enemy-logic",
            start() {
                data.collider = gameObject.getComponent("physical-collider");
                data.physics = gameObject.getComponent("physics");
                data.ai = gameObject.getComponent("enemy-ai");
            },
            update(dt) {
                if (gameObject.game.getTileIndex(gameObject.position) === TileIndex.WATER) {
                    if (enemyData.waterSpriteID) {
                        gameObject.renderer!.data.spriteID = enemyData.waterSpriteID;
                        gameObject.renderer!.data.offset = new Vector(0, Math.sin(gameObject.age * 6) * 0.04);
                        gameObject.castsShadow = false;
                    }
                }
                else {
                    if (enemyData.attackSpriteID && data.ai.data.attacking) {
                        gameObject.renderer!.data.spriteID = enemyData.attackSpriteID;
                    }
                    else {
                        gameObject.renderer!.data.spriteID = enemyData.spriteID;
                    }
                    gameObject.renderer!.data.offset = Vector.zero();
                    gameObject.castsShadow = true;
                }

                if (data.physics.data.velocity.x < 0) {
                    gameObject.scale.x = Math.abs(gameObject.scale.x) * -1;
                }
                else if (data.physics.data.velocity.x > 0) {
                    gameObject.scale.x = Math.abs(gameObject.scale.x);
                }
            },
            destroy() {
                if (enemyData.deadSpriteID) {
                    gameObject.game.addGameObject(CorpseFactory(gameObject, enemyData.deadSpriteID));
                }
            },
        }
    });
    enemy.addComponent(enemyData.ai);
    enemy.addComponent((gameObject) => {
        return {
            id: "essence-dropper",
            data: {
                disabled: false,
            },
            destroy() {
                if (!this.data.disabled) {
                    gameObject.game.addGameObject(
                        EssenceOrbFactory(enemyData.essenceAmount.randomInt(), gameObject.position)
                    );
                }
            }
        }
    });
    enemy.addComponent((gameObject) => {
        return {
            id: "portal-tracker",
            destroy() {
                if (this.data.portal !== undefined && this.data.index !== undefined) {
                    this.data.portal.data.enemiesSpawned[this.data.index]--;
                }
            },
            data: {
                portal: undefined,
                index: undefined,
            }
        }
    });
    if (enemyData.particleID) {
        enemy.addComponent(ParticleEmitter({
            spriteID: () => enemyData.particleID as string,
            rotation: () => MathUtils.random(0, 2 * Math.PI),
            spawnBoxSize: () => enemy.scale,
            rate: () => 5,
            layer: () => ParticleLayer.BELOW_OBJECTS
        }));
    }
    enemy.tag = "enemy";
    return enemy;
}

export { EnemyFactory, EnemyIndex };
