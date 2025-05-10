import { Level } from "./";
import { Vector, MathUtils, CatmullRomParametricCurve, NumberRange, Permutation, Rectangle, Point, PerlinNoise, LinearParametricCurve } from "../utils";
import { Game } from "../game/game";
import { ChunkConstants } from "../game/Chunk";
import { Tile, TileIndex } from "../game/tiles";
import { EnemyIndex, PortalFactory, PortalProperties, PropFactory } from "../gameObjects";
import { ItemIndex } from "../game/items";
import { PropIndex, propsCodex } from "../game/props";
import { getTexture } from "../assets/imageLoader";
import { Grid } from "../utils/Grid";
import { Nullable } from "utils/types";

const portalTypes: PortalProperties[] = [
    { // Slime portal
        size: "medium",
        health: 25,
        difficulty: 0,
        packs: [
            {
                packSizeRange: new NumberRange(2, 4),
                cooldownRange: new NumberRange(8, 16),
                maxEnemies: 5,
                enemyIndex: EnemyIndex.SLIME
            }
        ]
    },
    { // Red slime portal
        size: "medium",
        health: 35,
        difficulty: 0.1,
        packs: [
            {
                packSizeRange: new NumberRange(4, 8),
                cooldownRange: new NumberRange(6, 14),
                maxEnemies: 10,
                enemyIndex: EnemyIndex.RED_SLIME
            }
        ]
    },
    { // Ground worm portal
        size: "medium",
        health: 35,
        difficulty: 0.1,
        packs: [
            {
                packSizeRange: new NumberRange(1, 2),
                cooldownRange: new NumberRange(8, 16),
                maxEnemies: 6,
                enemyIndex: EnemyIndex.GROUND_WORM
            }
        ]
    },
    { // Minion portal
        size: "medium",
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
        size: "medium",
        difficulty: 0.4,
        health: 60,
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
        size: "medium",
        difficulty: 0.6,
        health: 75,
        packs: [
            {
                cooldownRange: new NumberRange(12, 20),
                packSizeRange: new NumberRange(1, 1),
                maxEnemies: 2,
                enemyIndex: EnemyIndex.WRAITH
            }
        ]
    },
    { // Bunny portal
        size: "medium",
        difficulty: 0.3,
        health: 35,
        packs: [
            {
                cooldownRange: new NumberRange(8, 16),
                packSizeRange: new NumberRange(1, 3),
                maxEnemies: 6,
                enemyIndex: EnemyIndex.EVIL_BUNNY
            }
        ]
    },
    { // Husk portal
        size: "medium",
        difficulty: 0.6,
        health: 80,
        packs: [
            {
                cooldownRange: new NumberRange(12, 24),
                packSizeRange: new NumberRange(1, 2),
                maxEnemies: 4,
                enemyIndex: EnemyIndex.FUNGAL_HUSK
            }
        ]
    },
];

class ForestLevel implements Level {
    readonly name = "Corrupted Forest";
    readonly portalDrops = [
        [
            { itemIndex: ItemIndex.ARROW, count: new NumberRange(20, 36) },
            { itemIndex: ItemIndex.BOW }
        ],
        [ { itemIndex: ItemIndex.SHURIKEN, count: new NumberRange(4, 10) } ],
        [ { itemIndex: ItemIndex.SLINGSHOT } ],
        [ { itemIndex: ItemIndex.DAGGERS } ],
        [ { itemIndex: ItemIndex.BOOMERANG } ],
        [ { itemIndex: ItemIndex.BATTLE_HAMMER } ],
        [ { itemIndex: ItemIndex.ESSENCE_DRIPPED_DAGGER } ],
        [ { itemIndex: ItemIndex.POISON_ARROW, count: new NumberRange(16, 32) } ],
        [ { itemIndex: ItemIndex.FLAME_ARROW, count: new NumberRange(16, 32) } ],
        [ { itemIndex: ItemIndex.HEART } ],
        [ { itemIndex: ItemIndex.HEART_CRYSTAL } ],
        [ { itemIndex: ItemIndex.BASIC_SHIELD } ],
        [ { itemIndex: ItemIndex.LIGHT_BOOTS } ],
        [ { itemIndex: ItemIndex.ESSENCE_MAGNET } ],
        [ { itemIndex: ItemIndex.CRYSTAL_BOMB } ],
        [ { itemIndex: ItemIndex.ROOT_SNARE } ],
        [ { itemIndex: ItemIndex.TELEPORTATION_RUNE } ],
        [ { itemIndex: ItemIndex.STUN_FIDDLE } ],
        [ { itemIndex: ItemIndex.FLOWER_POWER } ],
        [ { itemIndex: ItemIndex.INVINCIBILITY_BUBBLE } ],
        [ { itemIndex: ItemIndex.HEALING_VIAL } ],
        [ { itemIndex: ItemIndex.ESSENCE_VIAL } ],
        [ { itemIndex: ItemIndex.QUICK_HAND_UPGRADE } ],
        [ { itemIndex: ItemIndex.DICE } ],
        [ { itemIndex: ItemIndex.RICOCHET_UPGRADE } ],
        // [ { itemIndex: ItemIndex.FLAME_UPGRADE } ],
        [ { itemIndex: ItemIndex.POISON_UPGRADE } ],
        [ { itemIndex: ItemIndex.STRENGTH_UPGRADE } ],
        [ { itemIndex: ItemIndex.SPROCKET_UPGRADE } ],
        [ { itemIndex: ItemIndex.GHOST_ARROWS }],
    ];

    readonly cameraBounds: Rectangle = new Rectangle(-10024, 10024, 64, 36400);
    readonly playerSpawnPosition = new Vector(0, 160);

    generate(game: Game) {
        const gridSize = 200;
        const worldTileGrid = new Grid<Tile>(gridSize, gridSize, { index: TileIndex.GRASS, rotation: 0 }); 
        const worldPropGrid = new Grid<Nullable<PropIndex>>(gridSize, gridSize, null);
        console.log(`Generating forest with size ${gridSize} x ${gridSize}`);
        const noise = new PerlinNoise(MathUtils.randomInt(1000, 10000));
        const getNoise = (x: number, y: number) => noise.get(x / 16.43 + 1000, y / 16.32 + 1000);

        worldTileGrid.iterate((self, r, c) => {
            let noiseValue = getNoise(c, r);
            const distanceToStart = Math.sqrt(r ** 2 + (c - gridSize / 2) ** 2);
            if (distanceToStart < 24) {
                noiseValue = MathUtils.clamp(noiseValue, 0.45, 0.7);
            }
            const distanceToEnd = Math.sqrt((gridSize - r) ** 2 + (c - gridSize / 2) ** 2);
            if (distanceToEnd < 24) {
                noiseValue = MathUtils.clamp(noiseValue, 0.45, 0.7);
            }

            if (noiseValue < 0.4) {
                self.set(r, c, { index: TileIndex.WATER, rotation: 0 });
            }
            else if (noiseValue < 0.45) {
                self.set(r, c, { index: TileIndex.SAND, rotation: 0 });
            }
            else if (noiseValue > 0.7) {
                self.set(r, c, { index: TileIndex.ROCKS, rotation: 0 });
            }
            else {
                // is grass
                if (Math.random() < 0.05) {
                    // worldPropGrid.set(r, c, PropIndex.EVERGREEN_TREE);
                }
            }
        });

        let points = [];
        let current = new Vector(gridSize / 2, 0);
        points.push(current);
        let attempts = 0;
        for (let i = 0; i < 5000; i++) {
            if (!current) {
                console.error("Somehow current became undefined");
                break;
            }
            const deltaAngle = MathUtils.random(-0.5, Math.PI + 0.5);
            const deltaDistance = 5;
            const delta = new Vector(Math.cos(deltaAngle) * deltaDistance, Math.sin(deltaAngle) * deltaDistance);
            const candidate = current.plus(delta);
            const candidatePoint = Point.from(candidate);
            if (!worldTileGrid.validCoord(candidatePoint.y, candidatePoint.x) || 
                worldTileGrid.get(candidatePoint.y, candidatePoint.x).index !== TileIndex.GRASS) {
                console.log("Candidate failed");
                attempts++;
                if (attempts >= 6) {
                    console.log("6 failed attempts, drawing the curve and going back 5.")
                    const back = MathUtils.clamp(points.length - 2, 0, 8);
                    current = points[points.length - back];
                    const slice = points.splice(points.length - back + 1);
                    if (slice.length >= 2) {
                        const path = new LinearParametricCurve(slice);
                        for (let t = 0; t <= 1; t += 0.01) {
                            const point = path.getPosition(t);
                            for (let xo = 0; xo <= 1; xo += 1) {
                                for (let yo = 0; yo <= 1; yo += 1) {
                                    worldTileGrid.set(Math.floor(point.y + yo), Math.floor(point.x + xo), { index: TileIndex.CURSED_PATH, rotation: 0 });
                                    worldPropGrid.set(Math.floor(point.y + yo), Math.floor(point.x + xo), null);
                                }
                            }
                        }
                    }
                } 
                worldTileGrid.set(candidatePoint.y, candidatePoint.x, { index: TileIndex.GRAY_BRICKS, rotation: 0 });

                continue;
            }
            current = candidate;
            if (current.y >= gridSize - 10) {
                console.log(i);
                break;
            }
            points.push(current);
            attempts = 0;
        }

        console.log(points);

        const path = new LinearParametricCurve(points);
        for (let t = 0; t <= 1; t += 0.001) {
            const point = path.getPosition(t);
            for (let xo = 0; xo <= 1; xo += 1) {
                for (let yo = 0; yo <= 1; yo += 1) {
                    worldTileGrid.set(Math.floor(point.y + yo), Math.floor(point.x + xo), { index: TileIndex.PATH, rotation: 0 });
                    worldPropGrid.set(Math.floor(point.y + yo), Math.floor(point.x + xo), null);
                }
            }
        }

        // console.log(possiblePathPoints);
        // console.log(graph);

        // const pathPoints = [];  
        // const pathPointsIndices = [];
        // let current = 0;
        // const visited = new Set<number>();
        // while (true) {
        //     console.log("Visiting", current);
        //     pathPoints.push(possiblePathPoints[current]);
        //     if (possiblePathPoints[current].y >= gridSize - D) {
        //         break;
        //     }
        //     pathPointsIndices.push(current);
        //     visited.add(current);
        //     const neighbors = graph.get(current)!;
        //     const validNeighbors = neighbors.filter(n => !visited.has(n));
        //     if (validNeighbors.length == 0) {
        //         console.log("No valid neighbors... backtracking");
        //         console.log(pathPointsIndices);
        //         pathPoints.pop();
        //         pathPointsIndices.pop();
        //         if (pathPointsIndices.length === 0) {
        //             alert("Failed to generate path.")
        //             break;
        //         }
        //         current = pathPointsIndices[pathPointsIndices.length - 1];
        //     }
        //     else {
        //         current = MathUtils.randomChoice(validNeighbors); 
        //     }
        // }

        // console.log(pathPoints);

        

        // Generate a path from (0, 0) to (0, gridSize) that avoids obstalces. 
        // That is, we can only use tiles that have a noise value between 0.45 and 0.7.

        worldTileGrid.iterate((self, r, c) => {
            let x = c - self.width / 2;
            let y = r;
            const tile = self.get(r, c)!;
            game.setTileAtTilePosition(new Point(x, y), tile.index, tile.rotation);
            
            const prop = worldPropGrid.get(r, c);
            if (prop !== null) {
                const texture = getTexture(propsCodex[prop as PropIndex].spriteID);
                const position = new Vector((x + 0.5) * ChunkConstants.PIXELS_PER_TILE, y * ChunkConstants.PIXELS_PER_TILE + texture.height / 2);
                game.addGameObject(PropFactory(prop, position));
            }
        });

        // this desperately needs an overhaul!
        // const width = 128;
        // const height = 192;
        // const marginTrail = 24;
        // const marginSidesRocks = 32;
        // const left = -width / 2, right = width / 2 - 1;
        // const bottom = 0, top = height + marginTrail * 2;
        // const start = new Vector(0, bottom);
        // const end = new Vector(0, top);
        // const N = 30;
        // const numPortals = 15;
        // const minDistance = 8 * ChunkConstants.PIXELS_PER_TILE;

        // // 1. Set Grass Background
        // for (let x = left; x <= right; x++) {
        //     for (let y = bottom; y < top; y++) {
        //         game.setTileAtTilePosition(new Point(x, y), TileIndex.GRASS);
        //     }
        // }
        
        // // 2. Add ponds
        // for (let x = left; x <= right; x++) {
        //     for (let y = marginTrail; y <= height + marginTrail; y++) {
        //         const noise = game.noise.get(x / 16.32 + 1000, y / 16.543 + 1000);
        //         if (noise > 0.6) {
        //             game.setTileAtTilePosition(new Point(x, y), TileIndex.WATER);
        //         }
        //         else if (noise > 0.55) {
        //             game.setTileAtTilePosition(new Point(x, y), TileIndex.SAND);
        //         }
        //     }
        // }

        // // 3. Fill a path from the bottom to top of the world
        // const pathPoints = [];
        // pathPoints.push(start);
        // pathPoints.push(Vector.add(start, new Vector(0, marginTrail)));
        // let lastX = 0;
        // const R = 30;
        // for (let i = 0; i < N; i++) {
        //     const ps = i / N;
        //     const pt = (i + 1) / N;
        //     const x = MathUtils.clamp(lastX + MathUtils.randomInt(-R, R), left + 6, right - 6);
        //     const y = marginTrail + MathUtils.randomInt(ps * height, pt * height);
        //     pathPoints.push(new Vector(x, y));
        //     lastX = x;
        // }
        // pathPoints.push(Vector.subtract(end, new Vector(0, marginTrail)));
        // pathPoints.push(end);

        // const curve = new CatmullRomParametricCurve(pathPoints);
        // for (let t = bottom; t < height; t+=0.1) {
        //     const p = t / height;
        //     const position = curve.getPosition(p);
        //     const R = 1;
        //     for (let xo = -R; xo <= R; xo++) {
        //         for (let yo = -R; yo <= R; yo++) {
        //             const po = Vector.add(position, new Vector(xo, yo));
        //             const currTile = game.getTileAtWorldPosition(po);
        //             if (currTile === TileIndex.PATH || currTile === TileIndex.PLANKS) {
        //                 continue;
        //             }
        //             let tile = TileIndex.PATH;
        //             if (currTile === TileIndex.WATER || currTile === TileIndex.SAND) {
        //                 tile = TileIndex.PLANKS;
        //             }
        //             game.setTileAtTilePosition(new Point(Math.floor(po.x), Math.floor(po.y)), tile);
        //         }
        //     }
        // }

        // // 4. Put rock wall in trail margined areas.
        // for (let x = left; x <= right; x++) {
        //     const offset = game.noise.get(x / 8 + 1000, 1000.342) * 4;
        //     for (let y = 0; y < marginTrail - 4 + offset; y++) {
        //         const xoff = game.noise.get(1000.632, y / 8 + 1000) * 4;
        //         if (Math.abs(x) + xoff <= 7) {
        //             continue;
        //         }
        //         game.setTileAtTilePosition(new Point(x, y), TileIndex.ROCKS);
        //         game.setTileAtTilePosition(new Point(x, top - y), TileIndex.ROCKS);
        //     }
        // }

        // // 5. Put rock wall in side margins
        // for (let y = bottom; y <= top; y++) {
        //     const offset = game.noise.get(0.342, y / 4) * 12 - 12;
        //     for (let x = Math.floor(offset); x <= marginSidesRocks; x++) {
        //         game.setTileAtTilePosition(new Point(left - 1 - x, y), TileIndex.ROCKS);
        //         game.setTileAtTilePosition(new Point(right + 1 + x, y), TileIndex.ROCKS);
        //     }
        // }

        // // 6. Place portals
        // const portalPositions = [];
        // const dropsPermutation = new Permutation(this.portalDrops);
        // for (let i = 0; i < numPortals; i++) {
        //     let position;
        //     let invalid;
        //     do {
        //         position = new Vector(
        //             (MathUtils.randomInt(left, right) + 0.5) * ChunkConstants.PIXELS_PER_TILE,
        //             (MathUtils.randomInt(bottom + marginTrail, top - marginTrail) + 0.5) * ChunkConstants.PIXELS_PER_TILE
        //         );
        //         invalid = game.isTileWithPropertyInArea(position, 2, "canSpawnPortal", false);
        //         if (!invalid) {
        //             for (const other of portalPositions) {
        //                 if (position.distanceTo(other) <= minDistance) {
        //                     invalid = true;
        //                     break;
        //                 }
        //             }
        //         }
        //     } while (invalid);
        //     const progression = (position.y / ChunkConstants.PIXELS_PER_TILE - marginTrail) / height;
        //     const validChoices = portalTypes.filter(type => (type.difficulty ? type.difficulty : 0) <= progression);
        //     if (validChoices.length === 0) {
        //         throw Error("Cannot generate portal for position: " + position + " progressio " + progression + " because no portal has low enough difficulty");
        //     }
        //     const properties = MathUtils.randomChoice(validChoices);
        //     const dropPool = dropsPermutation.next;
        //     game.addGameObject(PortalFactory(properties, dropPool, position));
        //     portalPositions.push(position);
        //     const R = 5;
        //     for (let xo = -R; xo <= R; xo++) {
        //         for (let yo = -R; yo <= R; yo++) {
        //             const dist = Math.sqrt(xo * xo + yo * yo);
        //             const chance = 1 - dist / 4;
        //             if (Math.random() < chance) {
        //                 const po = Vector.add(new Vector(xo * ChunkConstants.PIXELS_PER_TILE, yo * ChunkConstants.PIXELS_PER_TILE), position);
        //                 const tile = game.getTileAtWorldPosition(po);
        //                 if (tile === TileIndex.GRASS) {
        //                     game.setTileAtWorldPosition(po, TileIndex.CURSED_GRASS);
        //                 }
        //                 else if (tile === TileIndex.PATH) {
        //                     game.setTileAtWorldPosition(po, TileIndex.CURSED_PATH);
        //                 }
        //                 else if (tile === TileIndex.SAND) {
        //                     game.setTileAtWorldPosition(po, TileIndex.CURSED_SAND);
        //                 }
        //                 else if (tile === TileIndex.PLANKS) {
        //                     game.setTileAtWorldPosition(po, TileIndex.CURSED_PLANKS);
        //                 }
        //             }
        //         }
        //     }
        // }

        // // 7. Place props
        // for (let x = left; x <= right; x++) {
        //     for (let y = bottom; y <= top; y++) {
        //         const c = MathUtils.randomWeightedChoice(
        //             [PropIndex.TREE, PropIndex.EVERGREEN_TREE, PropIndex.STONE_1, PropIndex.WHITE_STONE_1, PropIndex.RED_WILDFLOWER, PropIndex.YELLOW_WILDFLOWER, PropIndex.BUSH, PropIndex.TALL_GRASS, PropIndex.UNLIT_CAMPFIRE, PropIndex.TREE_STUMP, PropIndex.MOSSY_FALLEN_TREE, null],
        //             [4,             2,                        1,                 1,                       2,                        1,                           1,              26,                    0.1,                      0.25,                  0.25, 70]
        //         )
        //         if (c !== null) {
        //             const texture = getTexture(propsCodex[c as PropIndex].spriteID);
        //             const position = new Vector((x + 0.5) * ChunkConstants.PIXELS_PER_TILE, y * ChunkConstants.PIXELS_PER_TILE + texture.height / 2);
        //             let tooCloseToPortal = false;
        //             for (let j = 0; j < portalPositions.length; j++) {
        //                 if (Vector.subtract(portalPositions[j], position).magnitude < 64) {
        //                     tooCloseToPortal = true;
        //                     break;
        //                 }
        //             }
        //             if (tooCloseToPortal) {
        //                 continue;
        //             }
        //             const tile = game.getTileDataAtWorldPosition(new Vector((x + 0.5) * ChunkConstants.PIXELS_PER_TILE, (y + 0.5) * ChunkConstants.PIXELS_PER_TILE)); 
        //             if (!tile.canGrowPlants) {
        //                 continue;
        //             }
        //             game.addGameObject(PropFactory(c, position));
        //         }
        //     }
        // }
    }
};

export { ForestLevel };
