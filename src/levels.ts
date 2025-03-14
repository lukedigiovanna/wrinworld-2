import { Vector, MathUtils, CatmullRomParametricCurve} from "./utils";
import { Game } from "./game";
import { TileIndex } from "./tiles";
import { EnemyIndex, GameObject, PortalFactory, PortalProperties } from "./gameObjects";
import { spriteRenderer } from "./renderers";
import { PhysicalCollider } from "./components";

interface Level {
    regionName: string;
    generate: (game: Game) => void;    
}

const level1PortalTypes: PortalProperties[] = [
    { // Slime portal
        lowerBoundCooldown: 8,
        upperBoundCooldown: 16,
        maxEnemies: 10,
        health: 25,
        packs: [
            {
                lowerBound: 2,
                upperBound: 6,
                enemyIndex: EnemyIndex.SLIME
            }
        ]
    },
    { // Minion portal
        lowerBoundCooldown: 4,
        upperBoundCooldown: 10,
        difficulty: 0.2,
        maxEnemies: 16,
        health: 50,
        packs: [
            {
                lowerBound: 1,
                upperBound: 3,
                enemyIndex: EnemyIndex.MINION
            },
            {
                lowerBound: 1,
                upperBound: 1,
                enemyIndex: EnemyIndex.WRETCHED_SKELETON
            }
        ]
    }, 
    { // Revenant eye portal
        lowerBoundCooldown: 12,
        upperBoundCooldown: 20,
        difficulty: 0.7,
        maxEnemies: 4,
        health: 70,
        packs: [
            {
                lowerBound: 1,
                upperBound: 2,
                enemyIndex: EnemyIndex.REVENANT_EYE
            }
        ]
    },
    { // Wraith portal
        lowerBoundCooldown: 12,
        upperBoundCooldown: 20,
        difficulty: 0.7,
        maxEnemies: 4,
        health: 80,
        packs: [
            {
                lowerBound: 1,
                upperBound: 1,
                enemyIndex: EnemyIndex.WRAITH
            }
        ]
    }
];

const level1PortalDrops = [

];

// LEVEL 1
const LEVEL_1: Level = {
    regionName: "Corrupted Forest",
    generate(game) {
        const width = 64;
        const height = 96;
        const marginTrail = 24;
        const marginSidesRocks = 32;
        const left = -width / 2, right = width / 2 - 1;
        const bottom = 0, top = height + marginTrail * 2;
        const start = new Vector(0, bottom);
        const end = new Vector(0, top);
        const N = 10;

        // 1. Set Grass Background
        for (let x = left; x <= right; x++) {
            for (let y = bottom; y < top; y++) {
                game.setTile(new Vector(x, y), TileIndex.GRASS);
            }
        }
        
        // 2. Add ponds
        for (let x = left; x <= right; x++) {
            for (let y = marginTrail; y <= height + marginTrail; y++) {
                const noise = game.noise.get(x / 16.32 + 1000, y / 16.543 + 1000);
                if (noise > 0.6) {
                    game.setTile(new Vector(x, y), TileIndex.WATER);
                }
                else if (noise > 0.55) {
                    game.setTile(new Vector(x, y), TileIndex.SAND);
                }
            }
        }

        // 3. Fill a path from the bottom to top of the world
        const pathPoints = [];
        pathPoints.push(start);
        pathPoints.push(Vector.add(start, new Vector(0, marginTrail)))
        for (let i = 0; i < N; i++) {
            const ps = i / N;
            const pt = (i + 1) / N;
            const x = MathUtils.randomInt(left + 6, right - 6);
            const y = marginTrail + MathUtils.randomInt(ps * height, pt * height);
            pathPoints.push(new Vector(x, y));
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
                    game.setTile(po, tile);
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
                game.setTile(new Vector(x, y), TileIndex.ROCKS);
                game.setTile(new Vector(x, top - y), TileIndex.ROCKS);
            }
        }

        // 5. Put rock wall in side margins
        for (let y = bottom; y <= top; y++) {
            const offset = game.noise.get(0.342, y / 4) * 12 - 12;
            for (let x = offset; x <= marginSidesRocks; x++) {
                game.setTile(new Vector(left - 1 - x, y), TileIndex.ROCKS);
                game.setTile(new Vector(right + 1 + x, y), TileIndex.ROCKS);
            }
        }

        // 6. Place portals
        const portalPositions = [];
        const minDistance = 8;
        for (let i = 0; i < 10; i++) {
            let position;
            let invalid;
            do {
                position = new Vector(
                    MathUtils.randomInt(left, right) + 0.5,
                    MathUtils.randomInt(bottom + marginTrail, top - marginTrail) + 0.5
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
            const progression = (position.y - marginTrail) / height;
            const validChoices = level1PortalTypes.filter(type => (type.difficulty ? type.difficulty : 0) <= progression);
            console.log(progression, validChoices);
            if (validChoices.length === 0) {
                throw Error("Cannot generate portal for position: " + position + " progressio " + progression + " because no portal has low enough difficulty");
            }
            const properties = MathUtils.randomChoice(validChoices);
            game.addGameObject(PortalFactory(properties, position));
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
                            game.setTile(po, TileIndex.CURSED_GRASS);
                        }
                        else if (tile === TileIndex.PATH) {
                            game.setTile(po, TileIndex.CURSED_PATH);
                        }
                        else if (tile === TileIndex.SAND) {
                            game.setTile(po, TileIndex.CURSED_SAND);
                        }
                        else if (tile === TileIndex.PLANKS) {
                            game.setTile(po, TileIndex.CURSED_PLANKS);
                        }
                    }
                }
            }
        }

        // 7. Place trees
        const TREE_RATE = 0.25;
        for (let x = left; x <= right; x++) {
            for (let y = bottom; y <= top; y++) {
                if (Math.random() > TREE_RATE) {
                    continue;
                }
                const position = new Vector(x, y);
                let tooCloseToPortal = false;
                for (let j = 0; j < portalPositions.length; j++) {
                    if (Vector.subtract(portalPositions[j], position).magnitude < 3) {
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
                const tree = new GameObject();
                if (Math.random() < 0.9) {
                    tree.scale.scale(3);
                    tree.renderer = spriteRenderer("tree");
                }
                else {
                    tree.scale.setComponents(2, 3);
                    tree.renderer = spriteRenderer("evergreen");
                }
                const collider = tree.addComponent(PhysicalCollider);
                collider.data?.boxOffset.setComponents(0, -1.3);
                collider.data?.boxSize.setComponents(0.2, 0.4);
                tree.position.setComponents(position.x + 0.5, position.y + 1.5);
                game.addGameObject(tree);
            }
        }
    }
};

export { LEVEL_1 };
export type { Level };
