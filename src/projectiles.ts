import { ItemDropFactory } from "./gameObjects";
import { GameObject } from "./gameObjects";
import { Vector } from "./utils";
import { ItemIndex, itemsCodex } from "./items";

enum ProjectileIndex {
    FIREBALL,
    SHURIKEN,
    ARROW,
}

interface Projectile {
    // 0 to 1 - how good the projectile is at tracking the target. 0 is no homing, 1 is perfect homing
    homingSkill: number;
    // How many distinct mobs this projectile can hit
    maxHits: number;
    // The sprite this projectile should represent as (invisible if undefined)
    spriteID: string;
    // Amount of HP to deal upon hit
    damage: number;
    // How much knockback force to apply
    knockback: number;
    // How long until the projectile should self-destruct
    lifespan: number;
    // How large the projectile is -- scales to the aspect ratio of the sprite
    // or is the width/height is no sprite is attached.
    size: number;
    // how fast the projectile should go
    speed: number;
    // how fast the projectile should rotate
    angularVelocity: number;
    // hitbox properties (optional... defaults to size of projectile)
    hitboxOffset?: Vector,
    hitboxSize?: Vector,
    // collider properties (optional... defaults to size of projectile)
    colliderOffset?: Vector,
    colliderSize?: Vector,
    // Any logic that should happen when this object dies (including after lifespan)
    onDestroy?: (gameObject: GameObject) => void;
}

const projectilesCodex: Projectile[] = [
    { // ProjectileIndex.FIREBALL
        homingSkill: 0,
        maxHits: 1,
        spriteID: "fireball",
        damage: 15,
        knockback: 3,
        lifespan: 3,
        size: 1,
        speed: 15,
        angularVelocity: 0,
        hitboxOffset: new Vector(0.25, 0),
        hitboxSize: new Vector(0.25, 0.25),
        colliderOffset: new Vector(0.25, 0),
        colliderSize: new Vector(0.5, 0.5),
        onDestroy(gameObject) {

        }
    },
    { // ProjectileIndex.SHURIKEN
        homingSkill: 0,
        maxHits: 1,
        spriteID: "shuriken",
        damage: 10,
        knockback: 3,
        lifespan: 999,
        size: 0.5,
        speed: 20,
        angularVelocity: 20,
        colliderSize: new Vector(0.25, 0.25),
        onDestroy(gameObject) {
            gameObject.game.addGameObject(
                ItemDropFactory(itemsCodex[ItemIndex.SHURIKEN], gameObject.position)
            );
        },
    },
    {
        homingSkill: 0,
        maxHits: 1,
        spriteID: "arrow",
        damage: 10,
        knockback: 3,
        lifespan: 4,
        size: 1,
        speed: 16,
        angularVelocity: 0,
        colliderSize: new Vector(0.25, 0.25),
        onDestroy(gameObject) {
            gameObject.game.addGameObject(
                ItemDropFactory(itemsCodex[ItemIndex.ARROW], gameObject.position)
            );
        }
    }
];

export { ProjectileIndex, projectilesCodex };
export type { Projectile };
