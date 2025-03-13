import { GameObject, GameObjectFactory, EssenceOrbFactory, Team } from "./";
import { spriteRenderer } from "../renderers";
import { Vector } from "../utils";
import { Health, Hitbox, Physics, PhysicalCollider, ItemDropper, WeaponManager, HealthBarDisplayMode } from "../components";
import { TileIndex } from "../tiles";
import { enemyCodex, EnemyIndex } from "../enemies";

const EnemyFactory: GameObjectFactory = (position: Vector, enemyIndex: EnemyIndex) => {
    const enemy = new GameObject();
    enemy.team = Team.ENEMY;
    enemy.position = position.copy();
    const enemyType = enemyCodex.get(enemyIndex);
    if (!enemyType) {
        throw Error("Invalid enemy type");
    }
    enemy.renderer = spriteRenderer(enemyType.spriteID);
    enemy.scale.set(enemyType.scale);
    const health = enemy.addComponent(Health);
    health.data.hp = enemyType.hp;
    health.data.damageSoundEffectID = "hitmarker";
    health.data.healthBarDisplayMode = HealthBarDisplayMode.ON_HIT;
    enemy.addComponent(Hitbox);
    enemy.addComponent(Physics);
    enemy.addComponent(ItemDropper(enemyType.drops));
    enemy.addComponent(enemyType.ai);
    enemy.addComponent(WeaponManager);
    const collider = enemy.addComponent(PhysicalCollider);
    collider.data.boxOffset = enemyType.physicalColliderOffset.copy();
    collider.data.boxSize = enemyType.physicalColliderSize.copy();
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
                    gameObject.renderer!.data.spriteID = enemyType.waterSpriteID;
                    gameObject.renderer!.data.offset = new Vector(0, Math.sin(gameObject.age * 6) * 0.04);
                    data.collider!.data.castShadow = false;
                }
                else {
                    gameObject.renderer!.data.spriteID = enemyType.spriteID;
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
        }
    });
    enemy.addComponent((gameObject) => {
        return {
            id: "essence-dropper",
            destroy() {
                gameObject.game.addGameObject(
                    EssenceOrbFactory(enemyType.essenceAmount, gameObject.position)
                );
            }
        }
    });
    enemy.addComponent((gameObject) => {
        return {
            id: "portal-tracker",
            destroy() {
                if (this.data.portal) {
                    this.data.portal.data.enemiesSpawned--;
                }
            },
            data: {
                portal: undefined
            }
        }
    });
    enemy.tag = "enemy";
    return enemy;
}

export { EnemyFactory, EnemyIndex };
