import { GameObject, GameObjectFactory, EssenceOrbFactory, Team } from "./";
import { spriteRenderer } from "../renderers";
import { Vector } from "../utils";
import { Health, Hitbox, Physics, PhysicalCollider, ItemDropper, WeaponManager } from "../components";
import { TileIndex } from "../tiles";
import { enemyCodex, EnemyIndex } from "../enemies";

const EnemyFactory: GameObjectFactory = (position: Vector, enemyIndex: EnemyIndex) => {
    const enemy = new GameObject();
    enemy.team = Team.ENEMY;
    enemy.position = position.copy();
    const enemyType = enemyCodex[enemyIndex];
    if (!enemyType) {
        throw Error("Invalid enemy type");
    }
    enemy.renderer = spriteRenderer(enemyType.spriteID);
    enemy.scale.set(enemyType.scale);
    const health = enemy.addComponent(Health);
    health.data.hp = enemyType.hp;
    health.data.damageSoundEffectID = "hitmarker";
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
            collider: undefined
        };
        return {
            id: "enemy-water",
            start() {
                data.collider = gameObject.getComponent("physical-collider");
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
    enemy.tag = "enemy";
    return enemy;
}

export { EnemyFactory, EnemyIndex };
