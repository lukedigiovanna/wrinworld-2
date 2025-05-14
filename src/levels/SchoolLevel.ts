import { Level, LevelIndex, PortalDropPool } from "./";
import { EnemyIndex, PortalFactory, PortalProperties, PropFactory } from "../gameObjects";
import { Game } from "../game/game";
import { ChunkConstants } from "../game/Chunk";
import { Tile, TileIndex } from "../game/tiles";
import { MathUtils, NumberRange, Permutation, Point, Rectangle, Vector } from "../utils";
import { PropIndex, propsCodex } from "../game/props";
import { getTexture } from "../assets/imageLoader";
import { Nullable, Side } from "../utils/types";
import { ItemIndex } from "../game/items";
import { Grid, GridPosition }  from "../utils/Grid";

// school item ideas.. goal: 40 obtainable items
// also; need to ensure no duplicates with previously obtained items. each item
// should have a max obtainable prop (ex: upgrades can have multiple occurrences)

// reuse:
// boomerang, flower power, stun fiddle, water gun, sprocket upgrade, strength upgrade,
// essence_magnet, quick hand upgrade, invincibility bubble, slingshot, dice

// new:
// lunch box: heal consumable + temp speed boost
// milk carton: heal some but has a chance to also poison you
// orange soda: throw and explode on hit
// mystery pudding: applies a random buff, or maybe a debuff!
// pencil: melee -- sticks into enemy
// mechanical pencil: medium range -- shoots piercing lead
// fire alarm: panics nearby enemies
// spray paint: 
// composition notebook:
// textbook: 
// scissors: momentarily decapitate your head to move and attack without being damaged
// science fair volcano: spawns a vocano that randomly spews lava globs

interface DoorConfig {
    side: Side,
    offset: number,
}

class Room {
    readonly portalTypes: PortalProperties[];
    readonly width: number;
    readonly height: number;
    readonly tileGrid: Grid<Tile>;
    readonly propGrid: Grid<Nullable<PropIndex>>;
    readonly doorConfigs: DoorConfig[];

    constructor(portalTypes: PortalProperties[], width: number, height: number, doorConfigs: DoorConfig[]) {
        this.portalTypes = portalTypes;
        this.width = width;
        this.height = height;
        this.tileGrid = new Grid<Tile>(width, height, { index: TileIndex.SCHOOL_TILE, rotation: 0 });
        this.propGrid = new Grid<Nullable<PropIndex>>(width, height, null);
        this.doorConfigs = doorConfigs;
    }

    private computeDoorPosition(doorConfig: DoorConfig): GridPosition {
        switch (doorConfig.side) {
            case "left": return { row: doorConfig.offset, col: 0 };
            case "right": return { row: doorConfig.offset, col: this.width - 1 };
            case "top": return { row: this.height - 1, col: doorConfig.offset };
            case "bottom": return { row: 0, col: doorConfig.offset };
        }
    }

    public canBePlacedAt(worldGrid: Grid<Tile>, position: GridPosition, doorConfig: DoorConfig, padding=0) {
        const doorPosition = this.computeDoorPosition(doorConfig);
        for (let r = -padding; r < this.tileGrid.height + padding; r++) {
            for (let c = -padding; c < this.tileGrid.width + padding; c++) {
                const offR = r - doorPosition.row;
                const offC = c - doorPosition.col;
                const gridR = position.row + offR;
                const gridC = position.col + offC;
                if (!worldGrid.validCoord(gridR, gridC) || worldGrid.get(gridR, gridC)!.index !== TileIndex.SCHOOL_WALL) {
                    return false;
                }
            }
        }
        return true;
    }

    private placeInGrid<T>(grid: Grid<T>, worldGrid: Grid<T>, position: GridPosition, doorConfig: DoorConfig) {
        const doorPosition = this.computeDoorPosition(doorConfig);
        this.tileGrid.iterate((self, r, c) => {
            const offR = r - doorPosition.row;
            const offC = c - doorPosition.col;
            const gridR = position.row + offR;
            const gridC = position.col + offC;
            if (worldGrid.validCoord(gridR, gridC)) {
                worldGrid.set(gridR, gridC, grid.get(r, c)!);
            }
        });
    }

    public placeTilesInGrid(worldGrid: Grid<Tile>, position: GridPosition, doorConfig: DoorConfig) {
        this.placeInGrid(this.tileGrid, worldGrid, position, doorConfig);
    }

    public placePropsInGrid(worldGrid: Grid<Nullable<PropIndex>>, position: GridPosition, doorConfig: DoorConfig) {
        this.placeInGrid(this.propGrid, worldGrid, position, doorConfig);
    }

    public placePortalTypeInGrid(worldGrid: Grid<Nullable<PortalProperties[]>>, position: GridPosition, doorConfig: DoorConfig) {
        const doorPosition = this.computeDoorPosition(doorConfig);
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                const offR = r - doorPosition.row;
                const offC = c - doorPosition.col;
                const gridR = position.row + offR;
                const gridC = position.col + offC;
                if (worldGrid.validCoord(gridR, gridC)) {
                    worldGrid.set(gridR, gridC, this.portalTypes);
                }
            }
        }
    }

    public copy(): Room {
        const newRoom = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        return newRoom;
    }
}

const slimePortal: PortalProperties = {
    size: "small",
    health: 1,
    packs: [
        {
            enemyIndex: EnemyIndex.SLIME,
            cooldownRange: new NumberRange(10, 15),
            packSizeRange: new NumberRange(1, 3),
            maxEnemies: 10,
        }
    ]
}

const bathroomPortals = [slimePortal];
const courtyardPortals = [slimePortal];
const hallwayPortals = [slimePortal];

const bathroom = new Room(bathroomPortals, 12, 6, [
    { side: "top", offset: 10 },
    { side: "bottom", offset: 10 },
    { side: "left", offset: 1 },
    { side: "right", offset: 1 },
]);
for (let r = 0; r < bathroom.tileGrid.height; r++) {
    for (let c = 0; c < bathroom.tileGrid.width; c++) {
        if ((r + c) % 2 === 0) {
            bathroom.tileGrid.set(r, c, { index: TileIndex.SCHOOL_TILE_BLACK, rotation: 0 });
        }
    }
}
for (let c = 0; c < 5; c++)
    bathroom.propGrid.set(5, 2 * c, PropIndex.TOILET);
bathroom.propGrid.set(4, 11, PropIndex.SINK);
bathroom.propGrid.set(2, 11, PropIndex.SINK);

const courtyard = new Room(courtyardPortals, 13, 13, [
    { side: "top", offset: 6 },
    { side: "bottom", offset: 6 },
    { side: "left", offset: 6 },
    { side: "right", offset: 6 },
]);
courtyard.tileGrid.iterate((self, r, c) => {
    self.set(r, c, { index: TileIndex.GRASS, rotation: 0 });
});
for (let x = 0; x < 13; x++) {
    if (Math.abs(x - 6) <= 1) continue;
    courtyard.tileGrid.set(6, x, { index: TileIndex.GRAY_BRICKS, rotation: 0 });
    courtyard.tileGrid.set(x, 6, { index: TileIndex.GRAY_BRICKS, rotation: 0 });
}
for (let x = 0; x < 5; x++) {
    courtyard.tileGrid.set(4, 4+x, { index: TileIndex.GRAY_BRICKS, rotation: 0 });
    courtyard.tileGrid.set(8, 4+x, { index: TileIndex.GRAY_BRICKS, rotation: 0 });
    courtyard.tileGrid.set(4+x, 4, { index: TileIndex.GRAY_BRICKS, rotation: 0 });
    courtyard.tileGrid.set(4+x, 8, { index: TileIndex.GRAY_BRICKS, rotation: 0 });
}
courtyard.propGrid.set(6, 6, PropIndex.EVERGREEN_TREE);
courtyard.propGrid.set(5, 6, PropIndex.RED_WILDFLOWER);
courtyard.propGrid.set(7, 6, PropIndex.RED_WILDFLOWER);
courtyard.propGrid.set(6, 5, PropIndex.RED_WILDFLOWER);
courtyard.propGrid.set(6, 7, PropIndex.RED_WILDFLOWER);
courtyard.propGrid.set(2, 2, PropIndex.BUSH);
courtyard.propGrid.set(2, 10, PropIndex.BUSH);
courtyard.propGrid.set(10, 2, PropIndex.BUSH);
courtyard.propGrid.set(10, 10, PropIndex.BUSH);

const classroom = new Room(bathroomPortals, 13, 11, [
    { side: "top", offset: 2 },
    { side: "bottom", offset: 10 },
    { side: "left", offset: 8 },
    { side: "right", offset: 8 },
]);
classroom.propGrid.set(10, 6, PropIndex.CHALK_BOARD);
for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
        classroom.propGrid.set(2 + r * 2, 2 + c * 2, PropIndex.SCHOOL_DESK);
    }
}

const gym = new Room(bathroomPortals, 20, 10, [
    { side: "top", offset: 18 },
    { side: "bottom", offset: 18 },
    { side: "left", offset: 8 },
    { side: "right", offset: 8 },
]);
gym.tileGrid.iterate((self, r, c) => {
    self.set(r, c, { index: TileIndex.GYM_FLOOR, rotation: 0 });
});
gym.propGrid.set(3, 5, PropIndex.BASKETBALL);
gym.propGrid.set(5, 2, PropIndex.BASKETBALL);
gym.propGrid.set(6, 13, PropIndex.BASKETBALL);

const cafeteria = new Room(bathroomPortals, 17, 17, [
    { side: "top", offset: 8 },
    { side: "bottom", offset: 8 },
    { side: "left", offset: 8 },
    { side: "right", offset: 8 },
]);
cafeteria.tileGrid.iterate((self, r, c) => {
    if ((r + c) % 2 === 0) {
        self.set(r, c, { index: TileIndex.SCHOOL_TILE_BLACK, rotation: 0 });
    }
});
for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
        cafeteria.propGrid.set(3 + r * 5, 3 + c * 5, PropIndex.LUNCH_TABLE);
    }
}

const rooms = [bathroom, classroom, courtyard, gym, cafeteria];

interface Endpoint {
    row: number;
    col: number;
    direction: "horizontal" | "vertical";
}

// Generates a grid representing the hallway map
function generateHallwayMap() {
    const W = 31;
    const grid = new Grid<number>(W, W, 0);
    const C = Math.floor(W / 2);

    const endpoints: Endpoint[] = [];
    grid.drawVerticalLine(C, 0, 4, 1);
    endpoints.push({ row: 4, col: C, direction: "vertical" });
    grid.drawVerticalLine(C, W - 1, W - 5, 1);
    endpoints.push({ row: W - 5, col: C, direction: "vertical" });

    for (let i = 0; i < 45; i++) {
        if (endpoints.length === 0) break;
        const endpoint = endpoints.splice(0, 1)[0];
        let dLow = MathUtils.randomInt(0, 12);
        let dHigh = MathUtils.randomInt(0, 12);
        if (dLow < 3) dLow = 0;
        if (dHigh < 3) dHigh = 0;
        if (endpoint.direction === "vertical") {
            if (dLow > 0) {
                const left = Math.max(0, endpoint.col - dLow);
                grid.drawHorizontalLine(endpoint.row, endpoint.col, left, 1);
                endpoints.push({ row: endpoint.row, col: left, direction: "horizontal" })
            }
            if (dHigh > 0) {
                const right = Math.min(W - 1, endpoint.col + dHigh);
                grid.drawHorizontalLine(endpoint.row, endpoint.col, right, 1);
                endpoints.push({ row: endpoint.row, col: right, direction: "horizontal" })
            }
        }
        else {
            if (dLow > 0) {
                const bottom = Math.max(3, endpoint.row - dLow);
                grid.drawVerticalLine(endpoint.col, endpoint.row, bottom, 1);
                endpoints.push({ col: endpoint.col, row: bottom, direction: "vertical" })
            }
            if (dHigh > 0) {
                const top = Math.min(W - 4, endpoint.row + dHigh);
                grid.drawVerticalLine(endpoint.col, endpoint.row, top, 1);
                endpoints.push({ col: endpoint.col, row: top, direction: "vertical" })
            }
        }
        grid.set(endpoint.row, endpoint.col, 2);
    }
    grid.prettyPrint();

    return grid;
}

// Places appropriate wall tiles along any *regular* wall tile adjacent to a non-wall tile.
function placeSchoolWalls(tileGrid: Grid<Tile>) {
    const isWall = (r: number, c: number) => {
        const value = tileGrid.getOptional(r, c);
        if (value === undefined) {
            return true;
        }
        else {
            const index = value.index;
            return index === TileIndex.SCHOOL_WALL || 
                   index === TileIndex.SCHOOL_WALL_DOUBLE_SIDE ||
                   index === TileIndex.SCHOOL_WALL_SIDE || 
                   index === TileIndex.SCHOOL_WALL_INSIDE_CORNER || 
                   index === TileIndex.SCHOOL_WALL_INSIDE_CORNER_OUTSIDE_CORNER || 
                   index === TileIndex.SCHOOL_WALL_U ||
                   index === TileIndex.SCHOOL_WALL_OUTSIDE_CORNER ||
                   index === TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_TOP ||
                   index === TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_BOTTOM ||
                   index === TileIndex.SCHOOL_WALL_SIDE_DOUBLE_OUTSIDE_CORNER;
        }
    }
    for (let r = 0; r < tileGrid.height; r++) {
        for (let c = 0; c < tileGrid.width; c++) {
            const tileIndex = tileGrid.get(r, c)!.index;
            if (tileIndex !== TileIndex.SCHOOL_WALL) {
                continue;
            }
            const n =  !isWall(r + 1, c);
            const ne = !isWall(r + 1, c + 1);
            const e =  !isWall(r, c + 1);
            const se = !isWall(r - 1, c + 1);
            const s =  !isWall(r - 1, c);
            const sw = !isWall(r - 1, c - 1);
            const w =  !isWall(r, c - 1);
            const nw = !isWall(r + 1, c - 1);
            if (w && n && e) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_U, rotation: 0 });
            }
            else if (n && e && s) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_U, rotation: 3 });
            }
            else if (e && s && w) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_U, rotation: 2 });
            }
            else if (s && w && n) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_U, rotation: 1 });
            }
            else if (n && e && sw) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER_OUTSIDE_CORNER, rotation: 0 });
            }
            else if (e && s && nw) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER_OUTSIDE_CORNER, rotation: 3 });
            }
            else if (s && w && ne) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER_OUTSIDE_CORNER, rotation: 2 });   
            }
            else if (w && n && se) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER_OUTSIDE_CORNER, rotation: 1 });
            }
            else if (n && e) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER, rotation: 0 });
            }
            else if (e && s) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER, rotation: 3 });
            }
            else if (s && w) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER, rotation: 2 });
            }
            else if (w && n) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER, rotation: 1 });
            }
            else if (n && s) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_DOUBLE_SIDE, rotation: 1 });
            }
            else if (e && w) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_DOUBLE_SIDE, rotation: 0 });
            }
            else if (e && nw) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_TOP, rotation: 0 });
            }
            else if (e && sw) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_BOTTOM, rotation: 0 });
            }
            else if (s && ne) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_TOP, rotation: 3 });
            }
            else if (s && nw) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_BOTTOM, rotation: 3 });
            }
            else if (w && se) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_TOP, rotation: 2 });
            }
            else if (w && ne) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_BOTTOM, rotation: 2 });
            }
            else if (n && sw) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_TOP, rotation: 1 });
            }
            else if (n && se) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE_OUTSIDE_CORNER_BOTTOM, rotation: 1 });
            }
            else if (n) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE, rotation: 1 });
            }
            else if (e) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE, rotation: 0 });
            }
            else if (s) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE, rotation: 3 });
            }
            else if (w) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_SIDE, rotation: 2 });
            }
            else if (ne) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_OUTSIDE_CORNER, rotation: 0 });
            }
            else if (se){
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_OUTSIDE_CORNER, rotation: 3 });
            }
            else if (sw) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_OUTSIDE_CORNER, rotation: 2 });
            }
            else if (nw) {
                tileGrid.set(r, c, { index: TileIndex.SCHOOL_WALL_OUTSIDE_CORNER, rotation: 1 });
            }
        }
    }
}

class SchoolLevel implements Level {
    readonly name = "School";
    readonly type = "regular";
    readonly portalDrops: PortalDropPool[] = [
        [ { itemIndex: ItemIndex.WATER_BOTTLE, count: new NumberRange(12, 30) } ] 
    ];

    public cameraBounds = new Rectangle(0, 0, 0, 0);
    readonly endzone = new Rectangle(0, 0, 0, 0);
    readonly playerSpawnPosition = new Vector(0, 600);
    readonly nextLevels: LevelIndex[] = [];

    generate(game: Game) {
        const hallwayMap = generateHallwayMap();
        const padding = 32;
        const gridCellSize = 4;
        // convert hallwayMap to a world grid
        const worldWidth = padding * 2 + hallwayMap.width * gridCellSize;
        const worldHeight = padding * 2 + hallwayMap.height * gridCellSize;
        this.cameraBounds = new Rectangle(
            -worldWidth / 2 * ChunkConstants.PIXELS_PER_TILE, 
            worldWidth / 2 * ChunkConstants.PIXELS_PER_TILE, 
            padding * ChunkConstants.PIXELS_PER_TILE, 
            (padding + (hallwayMap.height * gridCellSize)) * ChunkConstants.PIXELS_PER_TILE
        );
        const worldTileGrid = new Grid<Tile>(worldWidth, worldHeight, {index: TileIndex.SCHOOL_WALL, rotation: 0});
        const worldPropGrid = new Grid<Nullable<PropIndex>>(worldWidth, worldHeight, null);
        const worldPortalTypeGrid = new Grid<Nullable<PortalProperties[]>>(worldWidth, worldHeight, null);
        // Place the hallway into the grid
        hallwayMap.iterate((self, r, c) => {
            const hasHallway = self.get(r, c);
            if (!hasHallway) {
                return;
            }
            for (let dr = 0; dr < gridCellSize; dr++) {
                for (let dc = 0; dc < gridCellSize; dc++) {
                    const nr = padding + r * gridCellSize + dr;
                    const nc = padding + c * gridCellSize + dc;
                    worldTileGrid.set(nr, nc, { index: TileIndex.SCHOOL_TILE, rotation: 0 });
                    // worldPortalTypeGrid.set(nr, nc, hallwayPortals);
                }
            }
        });
        hallwayMap.iterate((self, r, c) => {
            const hasHallway = self.get(r, c);
            if (!hasHallway) {
                return;
            }
            const directions: [Side, number, number][] = [["left",0,1],["right",0,-1],["bottom",1,0],["top",-1,0]];
            for (const [side, dr, dc] of directions) {
                if (!self.getOptional(r + dr, c + dc)) {
                    if (Math.random() < 0.5) {
                        const room = MathUtils.randomChoice(rooms);
                        const possibleDoorConfigs = room.doorConfigs.filter(config => config.side === side)
                        if (possibleDoorConfigs.length === 0) {
                            continue;
                        }
                        const doorConfig = MathUtils.randomChoice(possibleDoorConfigs);
                        const roomPosition = {
                            row: padding + (r + dr) * gridCellSize, 
                            col: padding + (c + dc) * gridCellSize
                        };
                        switch (side) {
                            case "bottom": roomPosition.row += 1; break;
                            case "top": roomPosition.row += gridCellSize - 2; break;
                            case "left": roomPosition.col += 1; break;
                            case "right": roomPosition.col += gridCellSize - 2; break;
                        }
                        if (room.canBePlacedAt(worldTileGrid, roomPosition, doorConfig, 1)) {
                            worldTileGrid.set(roomPosition.row - dr, roomPosition.col - dc, { index: TileIndex.SCHOOL_TILE, rotation: 0 })
                            worldTileGrid.set(roomPosition.row - 2 * dr, roomPosition.col - 2 * dc, { index: TileIndex.SCHOOL_TILE, rotation: 0 })
                            room.placeTilesInGrid(worldTileGrid, roomPosition, doorConfig);
                            room.placePropsInGrid(worldPropGrid, roomPosition, doorConfig);
                            room.placePortalTypeInGrid(worldPortalTypeGrid, roomPosition, doorConfig);
                        }
                    }
                }
            }
        })

        placeSchoolWalls(worldTileGrid);

        // Convert world grids to actual game world
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

        let numPortals = 0;
        // const dropsPermutation = new Permutation(this.portalDrops);
        while (numPortals < 16) {
            const r = MathUtils.randomInt(0, worldHeight - 1);
            const c = MathUtils.randomInt(0, worldWidth - 1);
            const portalTypes = worldPortalTypeGrid.get(r, c);
            if (!portalTypes) {
                continue;
            }
            const portalProps = MathUtils.randomChoice(portalTypes);
            const position = new Vector((c - worldWidth / 2) * ChunkConstants.PIXELS_PER_TILE, r * ChunkConstants.PIXELS_PER_TILE);
            if (game.isTileWithPropertyInArea(position, 2, "canSpawnPortal", false)) {
                continue;
            }
            const portal = PortalFactory(portalProps, this.portalDrops[0], position);
            game.addGameObject(portal);
            numPortals++;
        }
    }
}

export { SchoolLevel };
