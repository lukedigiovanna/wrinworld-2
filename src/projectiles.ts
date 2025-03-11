import { ItemDropFactory } from "./gameObjects";
import { GameObject } from "./gameObjects";
import { Vector } from "./utils";
import { Item, ItemIndex, itemsCodex } from "./items";

enum ProjectileIndex {
    ZOMBIE_BRAINS,
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
    // Amount to reduce the damage of this projectile by per hit when the maxHits > 1
    damageReductionPerHit: number;
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

    chanceOfBreaking?: number;
    // Any logic that should happen when this object dies (including after lifespan)
    onDestroy?: (gameObject: GameObject) => void;
}

function chanceDropItem(gameObject: GameObject, item: Item, chanceOfBreaking: number | undefined) {
    const chance = chanceOfBreaking ? chanceOfBreaking as number : 1;
    if (Math.random() > chance) {
        gameObject.game.addGameObject(
            ItemDropFactory(item, gameObject.position)
        );
    }
}

const projectilesCodex: Projectile[] = [
    { // ProjectileIndex.ZOMBIE_BRAINS
        homingSkill: 0,
        maxHits: 1,
        spriteID: "zombie_brains",
        damage: 1,
        damageReductionPerHit: 0,
        knockback: 3,
        lifespan: 10,
        size: 0.8,
        speed: 6,
        angularVelocity: 6,
        chanceOfBreaking: 0.2,
        hitboxSize: new Vector(0.25, 0.25),
        colliderOffset: new Vector(0.25, 0),
        colliderSize: new Vector(0.5, 0.5),
        onDestroy(gameObject) {
            chanceDropItem(gameObject, itemsCodex[ItemIndex.ZOMBIE_BRAINS], this.chanceOfBreaking);
        }
    },
    { // ProjectileIndex.SHURIKEN
        homingSkill: 0,
        maxHits: 20,
        spriteID: "shuriken",
        damage: 20,
        damageReductionPerHit: 0.5,
        knockback: 3,
        lifespan: 999,
        size: 0.5,
        speed: 20,
        angularVelocity: 20,
        colliderSize: new Vector(0.25, 0.25),
        chanceOfBreaking: 0.2,
        onDestroy(gameObject) {
            chanceDropItem(gameObject, itemsCodex[ItemIndex.SHURIKEN], this.chanceOfBreaking);
        },
    },
    {
        homingSkill: 0,
        maxHits: 10,
        spriteID: "arrow",
        damage: 10,
        damageReductionPerHit: 0.6,
        knockback: 3,
        lifespan: 4,
        size: 1,
        speed: 16,
        angularVelocity: 0,
        colliderSize: new Vector(0.25, 0.25),
        chanceOfBreaking: 0.5,
        onDestroy(gameObject) {
            chanceDropItem(gameObject, itemsCodex[ItemIndex.ARROW], this.chanceOfBreaking);
        }
    }
];

export { ProjectileIndex, projectilesCodex };
export type { Projectile };
