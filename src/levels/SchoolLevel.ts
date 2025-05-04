import { Level, PortalDropPool } from "./";
import { EnemyIndex, PortalFactory, PortalProperties, PropFactory } from "../gameObjects";
import { Game, PIXELS_PER_TILE } from "../game";
import { Tile, TileIndex, TileRotation } from "../tiles";
import { MathUtils, NumberRange, Permutation, Vector } from "../utils";
import { PropIndex, propsCodex } from "../props";
import { getTexture } from "../assets/imageLoader";
import { Direction, Nullable, Pair, Side } from "../utils/types";
import { ItemIndex } from "../items";

class Grid<T> {
    private cells: T[];
    public readonly width: number;
    public readonly height: number;

    constructor(width: number, height: number, defaultValue: T) {
        this.width = width;
        this.height = height;
        this.cells = Array.from({ length: width * height }, () => defaultValue);
    }

    public drawHorizontalLine(row: number, c0: number, c1: number, value: T) {
        let d = Math.sign(c1 - c0);
        while (c0 !== c1) {
            // Allow draw if drawing on an existing cell or the sides are clear
            if (this.get(row, c0) || (!this.get(row + 1, c0) && !this.get(row - 1, c0))) {
                this.set(row, c0, value);
                c0 += d;
            }
            else {
                return;
            }
        }
        this.set(row, c0, value);
    }
    
    public drawVerticalLine(col: number, r0: number, r1: number, value: T) {
        let d = Math.sign(r1 - r0);
        while (r0 !== r1) {
            if (this.get(r0, col) || (!this.get(r0, col + 1) && !this.get(r0, col - 1))) {
                this.set(r0, col, value);
                r0 += d;
            }
            else {
                return;
            }
        }
        this.set(r0, col, value);
    }

    public set(row: number, col: number, value: T) {
        this.cells[row * this.width + col] = value;
    }

    public get(row: number, col: number): T | undefined {
        if (!this.validCoord(row, col)) {
            return undefined;
        }
        return this.cells[row * this.width + col];
    }

    public validCoord(row: number, col: number): boolean {
        return row >= 0 && row < this.height && col >= 0 && col < this.width;
    }

    // Applies the given function over the grid.
    public iterate(func: (self: Grid<T>, row: number, col: number) => void) {
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                func(this, r, c);
            }
        }
    }

    public copy(): Grid<T> {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }

    public prettyPrint() {
        let out = "";
        for (let r = this.height - 1; r >= 0; r--) {
            let rowStr = "|";
            for (let c = 0; c < this.width; c++) {
                rowStr += this.get(r, c) ? this.get(r, c) + " " : "  ";
            }
            out += rowStr + "|\n";
        }
        console.log(out);
    }
}

interface GridPosition {
    row: number;
    col: number;
}

interface DoorConfig {
    side: Side,
    offset: number,
    radius: number;
}

class Room {
    readonly portalTypes: PortalProperties[];
    readonly width: number;
    readonly height: number;
    readonly tileGrid: Grid<Tile>;
    readonly propGrid: Grid<Nullable<PropIndex>>;
    private _doorPosition: GridPosition;

    constructor(portalTypes: PortalProperties[], width: number, height: number, doorConfig: DoorConfig) {
        this.portalTypes = portalTypes;
        this.width = width;
        this.height = height;
        this.tileGrid = new Grid<Tile>(width, height, { index: TileIndex.SCHOOL_TILE, rotation: 0 });
        this.propGrid = new Grid<Nullable<PropIndex>>(width, height, null);
        this._doorPosition = this.computeDoorPosition(doorConfig);
    }

    private computeDoorPosition(doorConfig: DoorConfig): GridPosition {
        switch (doorConfig.side) {
            case "left": return { row: doorConfig.offset, col: 0 };
            case "right": return { row: doorConfig.offset, col: this.width - 1 };
            case "top": return { row: this.height - 1, col: doorConfig.offset };
            case "bottom": return { row: 0, col: doorConfig.offset };
        }
    }

    public setDoor(doorConfig: DoorConfig): Room {
        this._doorPosition = this.computeDoorPosition(doorConfig);
        return this;
    }

    public get doorPosition() {
        return this._doorPosition;
    }

    public canBePlacedAt(worldGrid: Grid<Tile>, doorPosition: GridPosition, padding=0) {
        for (let r = -padding; r < this.tileGrid.height + padding; r++) {
            for (let c = -padding; c < this.tileGrid.width + padding; c++) {
                const offR = r - this.doorPosition.row;
                const offC = c - this.doorPosition.col;
                const gridR = doorPosition.row + offR;
                const gridC = doorPosition.col + offC;
                if (!worldGrid.validCoord(gridR, gridC) || worldGrid.get(gridR, gridC)!.index !== TileIndex.SCHOOL_WALL) {
                    return false;
                }
            }
        }
        return true;
    }

    private placeInGrid<T>(grid: Grid<T>, worldGrid: Grid<T>, doorPosition: GridPosition) {
        this.tileGrid.iterate((self, r, c) => {
            const offR = r - this.doorPosition.row;
            const offC = c - this.doorPosition.col;
            const gridR = doorPosition.row + offR;
            const gridC = doorPosition.col + offC;
            if (worldGrid.validCoord(gridR, gridC)) {
                worldGrid.set(gridR, gridC, grid.get(r, c)!);
            }
        });
    }

    public placeTilesInGrid(worldGrid: Grid<Tile>, doorPosition: GridPosition) {
        this.placeInGrid(this.tileGrid, worldGrid, doorPosition);
    }

    public placePropsInGrid(worldGrid: Grid<Nullable<PropIndex>>, doorPosition: GridPosition) {
        this.placeInGrid(this.propGrid, worldGrid, doorPosition);
    }

    public placePortalTypeInGrid(worldGrid: Grid<Nullable<PortalProperties[]>>, doorPosition: GridPosition) {
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                const offR = r - this.doorPosition.row;
                const offC = c - this.doorPosition.col;
                const gridR = doorPosition.row + offR;
                const gridC = doorPosition.col + offC;
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

const bathroomNorth = new Room(bathroomPortals, 12, 6, { side: "bottom", offset: 10, radius: 1 });
for (let r = 0; r < bathroomNorth.tileGrid.height; r++) {
    for (let c = 0; c < bathroomNorth.tileGrid.width; c++) {
        if ((r + c) % 2 === 0) {
            bathroomNorth.tileGrid.set(r, c, { index: TileIndex.SCHOOL_TILE_BLACK, rotation: 0 });
        }
    }
}
for (let c = 0; c < 5; c++)
    bathroomNorth.propGrid.set(5, 2 * c, PropIndex.TOILET);
bathroomNorth.propGrid.set(4, 11, PropIndex.SINK);
bathroomNorth.propGrid.set(2, 11, PropIndex.SINK);
const bathroomSouth = bathroomNorth.copy().setDoor({ side: "top", offset: 10, radius: 1 });
const bathroomEast = bathroomNorth.copy().setDoor({ side: "left", offset: 1, radius: 1 });
const bathroomWest = bathroomNorth.copy().setDoor({ side: "right", offset: 1, radius: 1 });

const courtyardNorth = new Room(courtyardPortals, 13, 13, { side: "bottom", offset: 6, radius: 1 });
courtyardNorth.tileGrid.iterate((self, r, c) => {
    self.set(r, c, { index: TileIndex.GRASS, rotation: 0 });
});
courtyardNorth.propGrid.set(6, 6, PropIndex.EVERGREEN_TREE);
courtyardNorth.propGrid.set(5, 6, PropIndex.RED_WILDFLOWER);
courtyardNorth.propGrid.set(7, 6, PropIndex.RED_WILDFLOWER);
courtyardNorth.propGrid.set(6, 5, PropIndex.RED_WILDFLOWER);
courtyardNorth.propGrid.set(6, 7, PropIndex.RED_WILDFLOWER);

const possibleRooms: Record<Direction, Room[]> = {
    "north": [bathroomNorth, courtyardNorth],
    "south": [bathroomSouth],
    "east": [bathroomEast],
    "west": [bathroomWest]
};

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
        const value = tileGrid.get(r, c);
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
    readonly portalTypes: PortalProperties[] = [];
    readonly portalDrops: PortalDropPool[] = [
        [ { itemIndex: ItemIndex.WATER_BOTTLE, count: new NumberRange(12, 30) } ] 
    ];

    readonly playerSpawnPosition = new Vector(0, 600);

    generate(game: Game) {
        const hallwayMap = generateHallwayMap();
        const padding = 32;
        const gridCellSize = 4;
        // convert hallwayMap to a world grid
        const worldWidth = padding * 2 + hallwayMap.width * gridCellSize;
        const worldHeight = padding * 2 + hallwayMap.height * gridCellSize;
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
            const directions: [Direction, number, number][] = [["east",0,1],["west",0,-1],["north",1,0],["south",-1,0]];
            for (const [direction, dr, dc] of directions) {
                if (!self.get(r + dr, c + dc)) {
                    if (Math.random() < 0.5) {
                        const room = MathUtils.randomChoice(possibleRooms[direction]);
                        const roomPosition = {
                            row: padding + (r + dr) * gridCellSize, 
                            col: padding + (c + dc) * gridCellSize
                        };
                        switch (direction) {
                            case "north": roomPosition.row += 1; break;
                            case "south": roomPosition.row += gridCellSize - 2; break;
                            case "east": roomPosition.col += 1; break;
                            case "west": roomPosition.col += gridCellSize - 2; break;
                        }
                        if (room.canBePlacedAt(worldTileGrid, roomPosition, 1)) {
                            worldTileGrid.set(roomPosition.row - dr, roomPosition.col - dc, { index: TileIndex.SCHOOL_TILE, rotation: 0 })
                            worldTileGrid.set(roomPosition.row - 2 * dr, roomPosition.col - 2 * dc, { index: TileIndex.SCHOOL_TILE, rotation: 0 })
                            room.placeTilesInGrid(worldTileGrid, roomPosition);
                            room.placePropsInGrid(worldPropGrid, roomPosition);
                            room.placePortalTypeInGrid(worldPortalTypeGrid, roomPosition);
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
            game.setTileWithTilemapCoordinate(new Vector(x, y), tile.index, tile.rotation);
            
            const prop = worldPropGrid.get(r, c);
            if (prop !== null) {
                const texture = getTexture(propsCodex[prop as PropIndex].spriteID);
                const position = new Vector((x + 0.5) * PIXELS_PER_TILE, y * PIXELS_PER_TILE + texture.height / 2);
                game.addGameObject(PropFactory(prop, position));
            }
        });

        let numPortals = 0;
        // const dropsPermutation = new Permutation(this.portalDrops);
        while (numPortals < 16) {
            const r = MathUtils.randomInt(0, worldHeight);
            const c = MathUtils.randomInt(0, worldWidth);
            const portalTypes = worldPortalTypeGrid.get(r, c);
            if (!portalTypes) {
                continue;
            }
            const portalProps = MathUtils.randomChoice(portalTypes);
            const position = new Vector((c - worldWidth / 2) * PIXELS_PER_TILE, r * PIXELS_PER_TILE);
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
