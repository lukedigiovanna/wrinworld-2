import { GameObject, GameObjectFactory, EssenceOrbFactory, Team } from "./";
import { spriteRenderer } from "../renderers";
import { Vector, MathUtils } from "../utils";
import { Health, Hitbox, Physics, PhysicalCollider, ItemDropper, WeaponManager, 
    HealthBarDisplayMode, ParticleEmitter, ParticleLayer, StatusEffectManager, 
    MovementData} from "../components";
import { TileIndex } from "../tiles";
import { enemiesCodex, EnemyIndex } from "../enemies";
import { getTexture } from "../imageLoader";

const EnemyFactory: GameObjectFactory = (position: Vector, enemyIndex: EnemyIndex) => {
    const enemy = new GameObject();
    enemy.team = Team.ENEMY;
    enemy.position = position.copy();
    const enemyData = enemiesCodex.get(enemyIndex);
    enemy.renderer = spriteRenderer(enemyData.spriteID);
    const texture = getTexture(enemyData.spriteID);
    enemy.scale.setComponents(texture.image.width, texture.image.height);
    const health = enemy.addComponent(Health);
    health.data.initializeHealth(enemyData.hp);
    health.data.damageSoundEffectID = "hitmarker";
    health.data.healthBarDisplayMode = HealthBarDisplayMode.ON_HIT;
    enemy.addComponent(Hitbox);
    enemy.addComponent(Physics);
    const movementData = enemy.addComponent(MovementData);
    movementData.data.baseSpeed = enemyData.speed;
    movementData.data.waterModifier = enemyData.waterSpeedModifier;
    enemy.addComponent(ItemDropper(enemyData.drops));
    enemy.addComponent(enemyData.ai);
    enemy.addComponent(WeaponManager);
    enemy.addComponent(StatusEffectManager);
    const collider = enemy.addComponent(PhysicalCollider);
    collider.data.boxSize = new Vector(enemy.scale.x * 0.75, 6);
    collider.data.boxOffset = new Vector(0, -enemy.scale.y / 2 + 3);
    // collider.data.boxOffset = enemyType.physicalColliderOffset.copy();
    // collider.data.boxSize = enemyType.physicalColliderSize.copy();
    enemy.addComponent((gameObject) => {
        const data: any = {
            collider: undefined,
            physics: undefined,
        };
        return {
            id: "common-enemy-logic",
            start() {
                data.collider = gameObject.getComponent("physical-collider");
                data.physics = gameObject.getComponent("physics");
            },
            update(dt) {
                if (gameObject.game.getTileIndex(gameObject.position) === TileIndex.WATER) {
                    if (enemyData.waterSpriteID) {
                        gameObject.renderer!.data.spriteID = enemyData.waterSpriteID;
                        gameObject.renderer!.data.offset = new Vector(0, Math.sin(gameObject.age * 6) * 0.04);
                        data.collider!.data.castShadow = false;
                    }
                }
                else {
                    gameObject.renderer!.data.spriteID = enemyData.spriteID;
                    gameObject.renderer!.data.offset = Vector.zero();
                    data.collider!.data.castShadow = true;
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
                    const corpse = new GameObject();
                    corpse.position.set(gameObject.position);
                    const sprite = getTexture(enemyData.deadSpriteID);
                    corpse.renderer = spriteRenderer(enemyData.deadSpriteID);
                    corpse.scale.setComponents(Math.sign(gameObject.scale.x) * sprite.width, sprite.height);
                    const physics = corpse.addComponent(Physics);
                    physics.data.angularVelocity = Math.sign(gameObject.scale.x) * MathUtils.random(0.4, 2.0);
                    physics.data.angularVelocityDrag = MathUtils.random(0.6, 1);
                    physics.data.impulse.set(data.physics.data.impulse);
                    corpse.lifespan = MathUtils.random(8, 20);
                    gameObject.game.addGameObject(corpse);
                }
            },
        }
    });
    enemy.addComponent((gameObject) => {
        return {
            id: "essence-dropper",
            destroy() {
                gameObject.game.addGameObject(
                    EssenceOrbFactory(enemyData.essenceAmount, gameObject.position)
                );
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
