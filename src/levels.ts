import { Vector, MathUtils, CatmullRomParametricCurve, NumberRange } from "./utils";
import { Game, PIXELS_PER_TILE } from "./game";
import { TileIndex } from "./tiles";
import { EnemyIndex, PortalFactory, PortalProperties, PortalDrop, PropFactory } from "./gameObjects";
import { ItemIndex } from "./items";

interface Level {
    regionName: string;
    generate: (game: Game) => void;    
}

const level1PortalTypes: PortalProperties[] = [
    { // Slime portal
        health: 25,
        difficulty: 0,
        packs: [
            {
                packSizeRange: new NumberRange(2, 6),
                cooldownRange: new NumberRange(5, 10),
                maxEnemies: 10,
                enemyIndex: EnemyIndex.SLIME
            }
        ]
    },
    { // Minion portal
        difficulty: 0.2,
        health: 40,
        packs: [
            {
                cooldownRange: new NumberRange(4, 10),
                packSizeRange: new NumberRange(1, 4),
                maxEnemies: 10,
                enemyIndex: EnemyIndex.MINION
            },
            {
                cooldownRange: new NumberRange(12, 24),
                packSizeRange: new NumberRange(1, 1),
                maxEnemies: 1,
                enemyIndex: EnemyIndex.WRETCHED_SKELETON
            }
        ]
    }, 
    { // Revenant eye portal
        difficulty: 0.4,
        health: 70,
        packs: [
            {
                cooldownRange: new NumberRange(12, 20),
                packSizeRange: new NumberRange(1, 2),
                maxEnemies: 3,
                enemyIndex: EnemyIndex.REVENANT_EYE
            }
        ]
    },
    { // Wraith portal
        difficulty: 0.7,
        health: 80,
        packs: [
            {
                cooldownRange: new NumberRange(12, 20),
                packSizeRange: new NumberRange(1, 1),
                maxEnemies: 2,
                enemyIndex: EnemyIndex.WRAITH
            }
        ]
    }
];

interface PortalDropPool {
    drops: PortalDrop[];
    rarity: number; // low number = more rare
}

const level1PortalDrops: PortalDropPool[] = [
    { // Bow and Arrow
        drops: [
            {
                itemIndex: ItemIndex.ARROW,
                count: new NumberRange(12, 24)
            },
            {
                itemIndex: ItemIndex.BOW,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    },
    { // Shurikens
        drops: [
            {
                itemIndex: ItemIndex.SHURIKEN,
                count: new NumberRange(4, 10)
            }
        ],
        rarity: 1,
    },
    { // Healing vials
        drops: [
            {
                itemIndex: ItemIndex.HEALING_VIAL,
                count: new NumberRange(1, 4)
            }
        ],
        rarity: 1,
    },
    { // Slingshot
        drops: [
            {
                itemIndex: ItemIndex.SLINGSHOT,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    },
    { // Quick bow and Arrows
        drops: [
            {
                itemIndex: ItemIndex.QUICK_BOW,
                count: new NumberRange(1, 1)
            },
            {
                itemIndex: ItemIndex.ARROW,
                count: new NumberRange(24, 32),
            }
        ],
        rarity: 1
    },
    { // Daggers
        drops: [
            {
                itemIndex: ItemIndex.DAGGERS,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    },
    { // Battle Hammer
        drops: [
            {
                itemIndex: ItemIndex.BATTLE_HAMMER,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    },
    { // Essence Dripped Dagger and Essence Vial
        drops: [
            {
                itemIndex: ItemIndex.ESSENCE_DRIPPED_DAGGER,
                count: new NumberRange(1, 1)
            },
            {
                itemIndex: ItemIndex.ESSENCE_VIAL,
                count: new NumberRange(1, 4)
            }
        ],
        rarity: 1
    },
    { // Poison arrows
        drops: [
            {
                itemIndex: ItemIndex.POISON_ARROW,
                count: new NumberRange(16, 32),
            }
        ],
        rarity: 1
    },
    { // Flame arrows
        drops: [
            {
                itemIndex: ItemIndex.FLAME_ARROW,
                count: new NumberRange(16, 32),
            }
        ],
        rarity: 1
    },
    { // Crystal bombs and essence vials
        drops: [
            {
                itemIndex: ItemIndex.CRYSTAL_BOMB,
                count: new NumberRange(1, 4)
            },
            {
                itemIndex: ItemIndex.ESSENCE_VIAL,
                count: new NumberRange(1, 4)
            }
        ],
        rarity: 1
    },
    { // Root snares
        drops: [
            {
                itemIndex: ItemIndex.ROOT_SNARE,
                count: new NumberRange(2, 5),
            }
        ],
        rarity: 1
    },
    { // Flame upgrade
        drops: [
            {
                itemIndex: ItemIndex.FLAME_UPGRADE,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    },
    { // Poison upgrade
        drops: [
            {
                itemIndex: ItemIndex.POISON_UPGRADE,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    },
    { // Strength upgrade
        drops: [
            {
                itemIndex: ItemIndex.STRENGTH_UPGRADE,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    },
    { // Heart buff
        drops: [
            {
                itemIndex: ItemIndex.HEART,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    },
    { // Heart crystal buff
        drops: [
            {
                itemIndex: ItemIndex.HEART_CRYSTAL,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    },
    { // Basic shield buff
        drops: [
            {
                itemIndex: ItemIndex.BASIC_SHIELD,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    },
    { // Teleportation rune
        drops: [
            {
                itemIndex: ItemIndex.TELEPORTATION_RUNE,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    },
    { // Stun fiddle
        drops: [
            {
                itemIndex: ItemIndex.STUN_FIDDLE,
                count: new NumberRange(1, 1)
            }
        ],
        rarity: 1
    }
];

// LEVEL 1
const LEVEL_1: Level = {
    regionName: "Corrupted Forest",
    generate(game) {
        const width = 128;
        const height = 192;
        const marginTrail = 24;
        const marginSidesRocks = 32;
        const left = -width / 2, right = width / 2 - 1;
        const bottom = 0, top = height + marginTrail * 2;
        const start = new Vector(0, bottom);
        const end = new Vector(0, top);
        const N = 30;
        const numPortals = 15;
        const minDistance = 8 * PIXELS_PER_TILE;
        const treeRate = 0.05;
        const grassRate = 0.3;
        const flowerPatches = 24;

        // 1. Set Grass Background
        for (let x = left; x <= right; x++) {
            for (let y = bottom; y < top; y++) {
                game.setTileWithTilemapCoordinate(new Vector(x, y), TileIndex.GRASS);
            }
        }
        
        // 2. Add ponds
        for (let x = left; x <= right; x++) {
            for (let y = marginTrail; y <= height + marginTrail; y++) {
                const noise = game.noise.get(x / 16.32 + 1000, y / 16.543 + 1000);
                if (noise > 0.6) {
                    game.setTileWithTilemapCoordinate(new Vector(x, y), TileIndex.WATER);
                }
                else if (noise > 0.55) {
                    game.setTileWithTilemapCoordinate(new Vector(x, y), TileIndex.SAND);
                }
            }
        }

        // 3. Fill a path from the bottom to top of the world
        const pathPoints = [];
        pathPoints.push(start);
        pathPoints.push(Vector.add(start, new Vector(0, marginTrail)));
        let lastX = 0;
        const R = 30;
        for (let i = 0; i < N; i++) {
            const ps = i / N;
            const pt = (i + 1) / N;
            const x = MathUtils.clamp(lastX + MathUtils.randomInt(-R, R), left + 6, right - 6);
            const y = marginTrail + MathUtils.randomInt(ps * height, pt * height);
            pathPoints.push(new Vector(x, y));
            lastX = x;
        }
        pathPoints.push(Vector.subtract(end, new Vector(0, marginTrail)));
        pathPoints.push(end);

        const curve = new CatmullRomParametricCurve(pathPoints);
        for (let t = bottom; t < height; t+=0.1) {
            const p = t / height;
            const position = curve.getPosition(p);
            const R = 1;
            for (let xo = -R; xo <= R; xo++) {
                for (let yo = -R; yo <= R; yo++) {
                    const po = Vector.add(position, new Vector(xo, yo));
                    const currTile = game.getTileIndex(po);
                    if (currTile === TileIndex.PATH || currTile === TileIndex.PLANKS) {
                        continue;
                    }
                    let tile = TileIndex.PATH;
                    if (currTile === TileIndex.WATER || currTile === TileIndex.SAND) {
                        tile = TileIndex.PLANKS;
                    }
                    game.setTileWithTilemapCoordinate(po, tile);
                }
            }
        }

        // 4. Put rock wall in trail margined areas.
        for (let x = left; x <= right; x++) {
            const offset = game.noise.get(x / 8 + 1000, 1000.342) * 4;
            for (let y = 0; y < marginTrail - 4 + offset; y++) {
                const xoff = game.noise.get(1000.632, y / 8 + 1000) * 4;
                if (Math.abs(x) + xoff <= 7) {
                    continue;
                }
                game.setTileWithTilemapCoordinate(new Vector(x, y), TileIndex.ROCKS);
                game.setTileWithTilemapCoordinate(new Vector(x, top - y), TileIndex.ROCKS);
            }
        }

        // 5. Put rock wall in side margins
        for (let y = bottom; y <= top; y++) {
            const offset = game.noise.get(0.342, y / 4) * 12 - 12;
            for (let x = offset; x <= marginSidesRocks; x++) {
                game.setTileWithTilemapCoordinate(new Vector(left - 1 - x, y), TileIndex.ROCKS);
                game.setTileWithTilemapCoordinate(new Vector(right + 1 + x, y), TileIndex.ROCKS);
            }
        }

        // 6. Place portals
        const portalPositions = [];
        const dropChances = [];
        let totalRarity = 0;
        for (let i = 0; i < level1PortalDrops.length; i++) {
            totalRarity += level1PortalDrops[i].rarity;
        }
        for (let i = 0; i < level1PortalDrops.length; i++) {
            dropChances.push(level1PortalDrops[i].rarity / totalRarity);
        }
        for (let i = 0; i < numPortals; i++) {
            let position;
            let invalid;
            do {
                position = new Vector(
                    (MathUtils.randomInt(left, right) + 0.5) * PIXELS_PER_TILE,
                    (MathUtils.randomInt(bottom + marginTrail, top - marginTrail) + 0.5) * PIXELS_PER_TILE
                );
                invalid = game.isTileWithPropertyInArea(position, 2, "canSpawnPortal", false);
                if (!invalid) {
                    for (const other of portalPositions) {
                        if (position.distanceTo(other) <= minDistance) {
                            invalid = true;
                            break;
                        }
                    }
                }
            } while (invalid);
            const progression = (position.y / PIXELS_PER_TILE - marginTrail) / height;
            const validChoices = level1PortalTypes.filter(type => (type.difficulty ? type.difficulty : 0) <= progression);
            if (validChoices.length === 0) {
                throw Error("Cannot generate portal for position: " + position + " progressio " + progression + " because no portal has low enough difficulty");
            }
            const properties = MathUtils.randomChoice(validChoices);
            const dropPool = MathUtils.randomWeightedChoice(level1PortalDrops, dropChances);
            game.addGameObject(PortalFactory(properties, dropPool.drops, position));
            portalPositions.push(position);
            const R = 3;
            for (let xo = -R; xo <= R; xo++) {
                for (let yo = -R; yo <= R; yo++) {
                    const dist = Math.sqrt(xo * xo + yo * yo);
                    const chance = 1 - dist / 4;
                    if (Math.random() < chance) {
                        const po = Vector.add(new Vector(xo, yo), position);
                        const tile = game.getTileIndex(po);
                        if (tile === TileIndex.GRASS) {
                            game.setTileWithTilemapCoordinate(po, TileIndex.CURSED_GRASS);
                        }
                        else if (tile === TileIndex.PATH) {
                            game.setTileWithTilemapCoordinate(po, TileIndex.CURSED_PATH);
                        }
                        else if (tile === TileIndex.SAND) {
                            game.setTileWithTilemapCoordinate(po, TileIndex.CURSED_SAND);
                        }
                        else if (tile === TileIndex.PLANKS) {
                            game.setTileWithTilemapCoordinate(po, TileIndex.CURSED_PLANKS);
                        }
                    }
                }
            }
        }

        // 7. Place trees
        for (let x = left; x <= right; x++) {
            for (let y = bottom; y <= top; y++) {
                const c = MathUtils.randomWeightedChoice(["tree", "tall_grass", null],[treeRate, grassRate, 1 - treeRate - grassRate])
                if (c !== null) {
                    const position = new Vector((x + 0.5) * PIXELS_PER_TILE, (y + 0.5) * PIXELS_PER_TILE);
                    let tooCloseToPortal = false;
                    for (let j = 0; j < portalPositions.length; j++) {
                        if (Vector.subtract(portalPositions[j], position).magnitude < 96) {
                            tooCloseToPortal = true;
                            break;
                        }
                    }
                    if (tooCloseToPortal) {
                        continue;
                    }
                    const tile = game.getTile(position); 
                    if (!tile.canGrowPlants) {
                        continue;
                    }
                    if (c === "tree") {
                        game.addGameObject(PropFactory(position, c));
                    }
                    else {
                        game.addGameObject(PropFactory(position, c, false));
                    }
                }
            }
        }

        // 8. Grow flowers
        for (let i = 0; i < flowerPatches; i++) {
            // choose a random location in the world
            const x = MathUtils.randomInt(left, right);
            const y = MathUtils.randomInt(bottom, top);
            const R = 8;
            for (let dx = -R; dx <= R; dx++) {
                for (let dy = -R; dy <= R; dy++) {
                    const p = 1 / (dx * dx + dy * dy + 1);
                    if (Math.random() < p) {
                        // place a flower
                        const position = new Vector((x + dx + 0.5) * PIXELS_PER_TILE, (y + dy + 0.5) * PIXELS_PER_TILE);
                        const tile = game.getTile(position); 
                        if (!tile.canGrowPlants) {
                            continue;
                        }
                        game.addGameObject(PropFactory(position, "flower", false));
                    }
                }
            }
        }
    }
};

export { LEVEL_1 };
export type { Level };
