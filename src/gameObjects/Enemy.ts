import { GameObject, GameObjectFactory } from "./";
import { spriteRenderer } from "../renderers";
import { Vector } from "../utils";
import { Health, Hitbox, ComponentFactory, ZombieAI, Physics, PhysicalCollider, ItemDropper } from "../components";
import { TileIndex } from "../tiles";
import { ItemDropChance, ItemIndex } from "../items";

enum EnemyIndex {
    ZOMBIE
}

interface Enemy {
    spriteID: string;
    waterSpriteID: string;
    scale: Vector;
    physicalColliderOffset: Vector;
    physicalColliderSize: Vector;
    hp: number;
    drops: ItemDropChance[];
    ai: ComponentFactory;
}

const enemyCodex: Enemy[] = [
    {
        spriteID: "zombie",
        waterSpriteID: "zombie_water",
        scale: new Vector(1, 2.33),
        physicalColliderOffset: new Vector(0, -1),
        physicalColliderSize: new Vector(0.8, 0.3),
        hp: 20,
        drops: [
            {chance: 0.2, itemIndex: ItemIndex.ZOMBIE_BRAINS},
            {chance: 0.8, itemIndex: ItemIndex.ZOMBIE_FLESH},
            {chance: 0.8, itemIndex: ItemIndex.ZOMBIE_FLESH},
        ],
        ai: ZombieAI,
    }
]

const EnemyFactory: GameObjectFactory = (position: Vector, enemyIndex: EnemyIndex) => {
    const enemy = new GameObject();
    enemy.position = position.copy();
    const enemyType = enemyCodex[enemyIndex];
    if (!enemyType) {
        throw Error("Invalid enemy type");
    }
    enemy.renderer = spriteRenderer(enemyType.spriteID);
    enemy.scale.set(enemyType.scale);
    const health = enemy.addComponent(Health);
    health.data.hp = enemyType.hp;
    enemy.addComponent(Hitbox);
    enemy.addComponent(Physics);
    enemy.addComponent(ItemDropper(enemyType.drops));
    enemy.addComponent(enemyType.ai);
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
    enemy.tag = "enemy";
    return enemy;
}

export { EnemyFactory, EnemyIndex };
export type { Enemy };
