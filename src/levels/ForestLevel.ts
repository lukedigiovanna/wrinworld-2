import { Level } from "./";
import { Vector, MathUtils, CatmullRomParametricCurve, NumberRange, Permutation, Rectangle, Point, PerlinNoise, LinearParametricCurve, cantorPairIndex } from "../utils";
import { Game } from "../game/game";
import { ChunkConstants } from "../game/Chunk";
import { Tile, TileIndex } from "../game/tiles";
import { EnemyIndex, PortalFactory, PortalProperties, PropFactory } from "../gameObjects";
import { ItemIndex } from "../game/items";
import { PropIndex, propsCodex } from "../game/props";
import { getTexture } from "../assets/imageLoader";
import { Grid } from "../utils/Grid";
import { Nullable, Pair } from "../utils/types";
import { DefaultMap } from "../utils/DefaultMap";
import { Graph } from "../utils/Graph";

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

interface VertexData {
    point: Point,
    neighbors: Set<number>
}

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

    readonly gridSize = 224;
    readonly margin = 24;

    readonly cameraBounds: Rectangle = new Rectangle(
        (-this.gridSize / 2) * ChunkConstants.PIXELS_PER_TILE, 
        (this.gridSize / 2) * ChunkConstants.PIXELS_PER_TILE, 
        (this.margin / 2) * ChunkConstants.PIXELS_PER_TILE, 
        (this.gridSize - this.margin / 2) * ChunkConstants.PIXELS_PER_TILE
    );
    readonly playerSpawnPosition = new Vector(0, (this.margin / 2 + 4) * ChunkConstants.PIXELS_PER_TILE);

    generate(game: Game) {
        const worldTileGrid = new Grid<Tile>(this.gridSize, this.gridSize, { index: TileIndex.GRASS, rotation: 0 }); 
        const worldPropGrid = new Grid<Nullable<PropIndex>>(this.gridSize, this.gridSize, null);
        console.log(`Generating forest with size ${this.gridSize} x ${this.gridSize}`);
        const noise = new PerlinNoise(MathUtils.randomInt(1000, 10000));
        const getNoise = (x: number, y: number) => noise.get(x / 16.43 + 1000, y / 16.32 + 1000);

        worldTileGrid.iterate((self, r, c) => {
            let noiseValue = getNoise(c, r);
            const distanceToStart = Math.sqrt(r ** 2 + (c - this.gridSize / 2) ** 2);
            if (distanceToStart < 24 + this.margin) {
                noiseValue = MathUtils.clamp(noiseValue, 0.45, 0.7);
            }
            const distanceToEnd = Math.sqrt((this.gridSize - r) ** 2 + (c - this.gridSize / 2) ** 2);
            if (distanceToEnd < 24 + this.margin) {
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
                    worldPropGrid.set(r, c, PropIndex.EVERGREEN_TREE);
                }
            }
        });

        const graph = new Graph<number, Vector>();
        const resolution = 8;
        const round = (x: number) => Math.floor(x / resolution) * resolution;
        for (let r = round(this.margin); r <= this.gridSize - round(this.margin); r += resolution) {
            for (let c = round(this.margin); c <= this.gridSize - round(this.margin); c += resolution) {
                if (worldTileGrid.get(r, c).index !== TileIndex.GRASS) {
                    continue;
                }
                const index = cantorPairIndex(r, c);
                graph.addVertex(index, new Vector(c, r));
                for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                    const nr = r + dr * resolution;
                    const nc = c + dc * resolution;
                    const neighborIndex = cantorPairIndex(nr, nc);
                    if (worldTileGrid.validCoord(nr, nc) && 
                        worldTileGrid.get(nr, nc).index === TileIndex.GRASS && 
                        graph.hasVertex(neighborIndex)) {
                        graph.addEdge(index, neighborIndex);
                    }
                }
            }
        }

        // Perform a maze generation via a uniform spanning tree (UST)
        // Wilson's Algorithm:
        //  1. Choose a random vertex not in the Tree
        //  2. Perform a random walking starting on this vertex until we hit a
        //     vertex in the tree
        //  3. Add the loop erasure of the path to the tree.
        //  4. Repeat until all nodes have been hit.

        const remainingVertices = new Set<number>(graph.getVertexKeys());
        const tree = new Graph<number>();
        const randomNode = () => {
            return MathUtils.randomChoice(Array.from(remainingVertices));
        }
        const initialNode = randomNode();
        remainingVertices.delete(initialNode);
        tree.addVertex(initialNode);
        for (let i = 0; remainingVertices.size > 0 && i < 1000; i++) {
            // Random walk until we reach a vertex in the tree
            const start = randomNode();
            const walk = [start];
            let foundTree = false;
            for (let j = 0; j < 50000; j++) {
                const last = walk[walk.length - 1];
                const neighbors = graph.getVertexNeighbors(last);
                if (neighbors.length === 0) {
                    remainingVertices.delete(last);
                    break;
                }
                const randomNeighbor = MathUtils.randomChoice(neighbors);
                walk.push(randomNeighbor);
                if (tree.hasVertex(randomNeighbor)) {
                    foundTree = true;
                    break;
                }
            }
            if (!foundTree) {
                continue;
            }
            // Remove all cycles in the walk
            const cycleFreeWalk = [];
            const seen = new Map<number, number>();
            for (const vertex of walk) {
                if (seen.has(vertex)) { // Cycle! Remove all nodes since the last time we saw this vertex.
                    const removedVertices = cycleFreeWalk.splice(seen.get(vertex)! + 1);
                    for (const removedVertex of removedVertices) {
                        seen.delete(removedVertex);
                    }
                }
                else {
                    seen.set(vertex, cycleFreeWalk.length);
                    cycleFreeWalk.push(vertex);
                }
            }
            // Note: the walk is from a new node to a node in the tree
            // Add the walk to the UST
            for (let j = cycleFreeWalk.length - 2; j >= 0; j--) {
                const thisNode = cycleFreeWalk[j];
                const nextNode = cycleFreeWalk[j + 1]; // Should be in the tree
                tree.addVertex(thisNode);
                tree.addEdge(thisNode, nextNode);
                remainingVertices.delete(thisNode);
                
            }
        }

        try {
            const middle = round(this.gridSize / 2);
            const mainPath = tree.dfsSearch(
                cantorPairIndex(round(this.margin), middle), // start
                cantorPairIndex(round(this.gridSize - this.margin), middle) // end
            );
            if (!mainPath) {
            throw Error("something bad...");
            }
            const paths = [mainPath];
            for (let i = 0; i < 5; i++) {
                const pathPoint = MathUtils.randomChoice(mainPath);
                const randomPoint = MathUtils.randomChoice(tree.getVertexKeys());
                paths.push(tree.dfsSearch(pathPoint, randomPoint)!);
            }
            for (const path of paths) {
                if (!path) {
                    throw Error("something bad!");
                }
                const pathPoints = path.map((vertex) => graph.getVertexData(vertex));
                if (path === mainPath) {
                    for (let i = 0; i < this.margin; i += resolution) {
                        pathPoints.push(new Vector(middle, i));
                        pathPoints.unshift(new Vector(middle, this.gridSize - 1 - i));
                    }
                }
                const curve = new CatmullRomParametricCurve(pathPoints);
                for (let t = 0; t <= 1; t += 0.001) {
                    const po = Point.from(curve.getPosition(t));
                    for (let xo = 0; xo <= 1; xo++) {
                        for (let yo = 0; yo <= 1; yo++) {
                            worldTileGrid.set(po.y + yo, po.x + xo, { index: TileIndex.PATH, rotation: 0 });
                            worldPropGrid.set(po.y + yo, po.x + xo, null);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error(error)
        }

        for (const vertex of graph.getVertexKeys().map(key => graph.getVertexData(key))) {
            worldTileGrid.set(vertex.y, vertex.x, { index: TileIndex.RAINBOW_TARGET, rotation: 0 });
        }
        
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
    }
};

export { ForestLevel };
