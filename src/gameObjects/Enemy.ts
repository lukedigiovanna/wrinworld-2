import { GameObject, GameObjectFactory } from "./";
import { spriteRenderer } from "../renderers";
import { Vector } from "../utils";
import { Health, Hitbox, ComponentFactory, ZombieAI, Physics, PhysicalCollider } from "../components";

enum EnemyIndex {
    ZOMBIE
}

interface Enemy {
    spriteID: string;
    scale: Vector;
    physicalColliderOffset: Vector;
    physicalColliderSize: Vector;
    ai: ComponentFactory;
}

const enemyCodex: Enemy[] = [
    {
        spriteID: "zombie",
        scale: new Vector(1, 2.33),
        physicalColliderOffset: new Vector(0, -1),
        physicalColliderSize: new Vector(0.8, 0.3),
        ai: ZombieAI
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
    enemy.addComponent(Health);
    enemy.addComponent(Hitbox);
    enemy.addComponent(Physics);
    enemy.addComponent(enemyType.ai);
    const collider = enemy.addComponent(PhysicalCollider);
    collider.data.boxOffset = enemyType.physicalColliderOffset.copy();
    collider.data.boxSize = enemyType.physicalColliderSize.copy();
    enemy.tag = "enemy";
    return enemy;
}

export { EnemyFactory, EnemyIndex };
export type { Enemy };
