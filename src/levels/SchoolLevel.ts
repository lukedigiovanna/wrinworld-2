import { Level, PortalDropPool } from "./";
import { PortalProperties, PropFactory } from "../gameObjects";
import { Game, PIXELS_PER_TILE } from "../game";
import { Tile, TileIndex, TileRotation } from "../tiles";
import { MathUtils, Vector } from "../utils";
import { PropIndex, propsCodex } from "../props";
import { getTexture } from "../assets/imageLoader";
import { Nullable, Pair, Side } from "../utils/types";

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

const rotationsMap: Record<Side, Pair<TileRotation, TileRotation>> = {
    "top": [3, 2],
    "bottom": [0, 1],
    "left": [0, 3],
    "right": [1, 2],
};
function placeDoor(grid: Grid<Tile>, doorPosition: GridPosition, radius: number, direction: Side) {
    const [r1, r2] = rotationsMap[direction];
    if (direction === "top" || direction === "bottom") {
        grid.set(doorPosition.row, doorPosition.col - radius, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER, rotation: r1 });
        for (let d = -(radius - 1); d <= radius - 1; d++) {
            grid.set(doorPosition.row, doorPosition.col + d, { index: TileIndex.SCHOOL_TILE, rotation: 0 })
        }
        grid.set(doorPosition.row, doorPosition.col + radius, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER, rotation: r2 });
    }
    else {
        grid.set(doorPosition.row - radius, doorPosition.col, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER, rotation: r1 });
        for (let d = -(radius - 1); d <= radius - 1; d++) {
            grid.set(doorPosition.row + d, doorPosition.col, { index: TileIndex.SCHOOL_TILE, rotation: 0 })
        }
        grid.set(doorPosition.row + radius, doorPosition.col, { index: TileIndex.SCHOOL_WALL_INSIDE_CORNER, rotation: r2 });
    }
}

class Room {
    readonly tileGrid: Grid<Tile>;
    readonly propGrid: Grid<Nullable<PropIndex>>;
    readonly doorPosition: GridPosition;
    readonly doorSide: Side;
    readonly doorRadius: number;

    constructor(width: number, height: number, doorSide: Side, doorOffset: number, doorRadius: number) {
        this.tileGrid = new Grid<Tile>(width, height, { index: TileIndex.SCHOOL_TILE, rotation: 0 });
        this.propGrid = new Grid<Nullable<PropIndex>>(width, height, null);
        switch (doorSide) {
            case "left": this.doorPosition = { row: doorOffset, col: 0 }; break;
            case "right": this.doorPosition = { row: doorOffset, col: width - 1 }; break;
            case "top": this.doorPosition = { row: height - 1, col: doorOffset }; break;
            case "bottom": this.doorPosition = { row: 0, col: doorOffset }; break;
        }
        this.doorSide = doorSide;
        this.doorRadius = doorRadius;
    }

    // Draws walls around the rectangle of this room.
    public drawWalls() {
        for (let c = 0; c < this.tileGrid.width; c++) {
            this.tileGrid.set(0, c, { index: TileIndex.SCHOOL_WALL_SIDE, rotation: 1 })
            this.tileGrid.set(this.tileGrid.height - 1, c, { index: TileIndex.SCHOOL_WALL_SIDE, rotation: 3 });
        }
        for (let r = 0; r < this.tileGrid.height; r++) {
            this.tileGrid.set(r, 0, { index: TileIndex.SCHOOL_WALL_SIDE, rotation: 0 });
            this.tileGrid.set(r, this.tileGrid.width - 1, { index: TileIndex.SCHOOL_WALL_SIDE, rotation: 2 });
        }
        this.tileGrid.set(0, 0, { index: TileIndex.SCHOOL_WALL_OUTSIDE_CORNER, rotation: 0 });
        this.tileGrid.set(0, this.tileGrid.width - 1, { index: TileIndex.SCHOOL_WALL_OUTSIDE_CORNER, rotation: 1 });
        this.tileGrid.set(this.tileGrid.height - 1, 0, { index: TileIndex.SCHOOL_WALL_OUTSIDE_CORNER, rotation: 3 });
        this.tileGrid.set(this.tileGrid.height - 1, this.tileGrid.width - 1, { index: TileIndex.SCHOOL_WALL_OUTSIDE_CORNER, rotation: 2 });
        
        placeDoor(this.tileGrid, this.doorPosition, this.doorRadius, this.doorSide);
    }

    public canBePlacedAt(worldGrid: Grid<Tile>, doorPosition: GridPosition) {
        for (let r = 0; r < this.tileGrid.height; r++) {
            for (let c = 0; c < this.tileGrid.width; c++) {
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
        for (let r = 0; r < this.tileGrid.height; r++) {
            for (let c = 0; c < this.tileGrid.width; c++) {
                const offR = r - this.doorPosition.row;
                const offC = c - this.doorPosition.col;
                const gridR = doorPosition.row + offR;
                const gridC = doorPosition.col + offC;
                if (worldGrid.validCoord(gridR, gridC)) {
                    worldGrid.set(gridR, gridC, grid.get(r, c)!);
                }
            }
        }
    }

    public placeTilesInGrid(worldGrid: Grid<Tile>, doorPosition: GridPosition) {
        this.placeInGrid(this.tileGrid, worldGrid, doorPosition);
    }

    public placePropsInGrid(worldGrid: Grid<Nullable<PropIndex>>, doorPosition: GridPosition) {
        this.placeInGrid(this.propGrid, worldGrid, doorPosition);
    }    
}

const bathroomTopDoorRoom = new Room(14, 8, "top", 11, 1);
for (let r = 0; r < bathroomTopDoorRoom.tileGrid.height; r++) {
    for (let c = 0; c < bathroomTopDoorRoom.tileGrid.width; c++) {
        if ((r + c) % 2 === 0) {
            bathroomTopDoorRoom.tileGrid.set(r, c, { index: TileIndex.SCHOOL_TILE_BLACK, rotation: 0 });
        }
    }
}
bathroomTopDoorRoom.drawWalls();   
for (let c = 0; c < 5; c++)
bathroomTopDoorRoom.propGrid.set(6, 2 * c + 1, PropIndex.TOILET);
bathroomTopDoorRoom.propGrid.set(5, 12, PropIndex.SINK);
bathroomTopDoorRoom.propGrid.set(3, 12, PropIndex.SINK);

const bathroomBottomDoorRoom = new Room(14, 8, "bottom", 11, 1);
bathroomBottomDoorRoom.drawWalls();
for (let c = 0; c < 5; c++)
bathroomBottomDoorRoom.propGrid.set(6, 2 * c + 1, PropIndex.TOILET);
bathroomBottomDoorRoom.propGrid.set(5, 12, PropIndex.SINK);
bathroomBottomDoorRoom.propGrid.set(3, 12, PropIndex.SINK);

const bathroomLeftDoorRoom = new Room(14, 8, "left", 2, 1);
bathroomLeftDoorRoom.drawWalls();
for (let c = 0; c < 5; c++)
bathroomLeftDoorRoom.propGrid.set(6, 2 * c + 1, PropIndex.TOILET);
bathroomLeftDoorRoom.propGrid.set(5, 12, PropIndex.SINK);
bathroomLeftDoorRoom.propGrid.set(3, 12, PropIndex.SINK);

const bathroomRightDoorRoom = new Room(14, 8, "right", 2, 1);
bathroomRightDoorRoom.drawWalls();
for (let c = 0; c < 5; c++)
bathroomRightDoorRoom.propGrid.set(6, 2 * c + 1, PropIndex.TOILET);
bathroomRightDoorRoom.propGrid.set(5, 12, PropIndex.SINK);
bathroomRightDoorRoom.propGrid.set(3, 12, PropIndex.SINK);

const possibleRooms: Record<Side, Room[]> = {
    "bottom": [bathroomBottomDoorRoom],
    "top": [bathroomTopDoorRoom],
    "left": [bathroomLeftDoorRoom],
    "right": [bathroomRightDoorRoom]
};

interface Endpoint {
    row: number;
    col: number;
    direction: "horizontal" | "vertical";
}

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

function convertHallwayMapToWorldGrid(grid: Grid<number>, gridCellSize: number): Pair<Grid<Tile>,Pair<Room, GridPosition>[]>  {
    const gridWorldWidth = grid.width * gridCellSize;
    const gridWorldHeight = grid.height * gridCellSize;
    const worldGrid = new Grid<Tile>(gridWorldWidth, gridWorldHeight, { index: TileIndex.SCHOOL_WALL, rotation: 0 });
    const rooms: Pair<Room, GridPosition>[] = [];
    for (let row = 0; row < grid.height; row++) {
        for (let col = 0; col < grid.width; col++) {
            const value = grid.get(row, col);
            if (value) {
                const leftWall = !grid.get(row, col - 1);
                const rightWall = !grid.get(row, col + 1);
                const topWall = !grid.get(row + 1, col);
                const bottomWall = !grid.get(row - 1, col);
                const leftBottomCorner = grid.get(row - 1, col) && grid.get(row, col - 1) && !grid.get(row - 1, col - 1);
                const rightBottomCorner = grid.get(row - 1, col) && grid.get(row, col + 1) && !grid.get(row - 1, col + 1);
                const leftTopCorner = grid.get(row + 1, col) && grid.get(row, col - 1) && !grid.get(row + 1, col - 1);
                const rightTopCorner = grid.get(row + 1, col) && grid.get(row, col + 1) && !grid.get(row + 1, col + 1);
                if (bottomWall && Math.random() < 0.5) {
                    rooms.push([MathUtils.randomChoice(possibleRooms.top), { row: row * gridCellSize - 1, col: col * gridCellSize + gridCellSize / 2 }])
                }
                if (topWall && Math.random() < 0.5) {
                    rooms.push([MathUtils.randomChoice(possibleRooms.bottom), { row: (row + 1) * gridCellSize, col: col * gridCellSize + gridCellSize / 2 }])
                }
                if (leftWall && Math.random() < 0.5) {
                    rooms.push([MathUtils.randomChoice(possibleRooms.right), { row: row * gridCellSize + gridCellSize / 2, col: col * gridCellSize - 1 }])
                }
                if (rightWall && Math.random() < 0.5) {
                    rooms.push([MathUtils.randomChoice(possibleRooms.left), { row: row * gridCellSize + gridCellSize / 2, col: (col + 1) * gridCellSize }])
                }
                for (let dc = 0; dc < gridCellSize; dc++) {
                    for (let dr = 0; dr < gridCellSize; dr++) {
                        let index = TileIndex.SCHOOL_TILE;
                        let rotation: TileRotation = MathUtils.randomInt(0, 3) as TileRotation;
                        if (dc === 0 && dr === 0 && leftBottomCorner) {
                            index = TileIndex.SCHOOL_WALL_INSIDE_CORNER;
                            rotation = 0;
                        }
                        else if (dc === gridCellSize - 1 && dr === 0 && rightBottomCorner) {
                            index = TileIndex.SCHOOL_WALL_INSIDE_CORNER;
                            rotation = 1;
                        }
                        else if (dc === 0 && dr === gridCellSize - 1 && leftTopCorner) {
                            index = TileIndex.SCHOOL_WALL_INSIDE_CORNER;
                            rotation = 3;
                        }
                        else if (dc === gridCellSize - 1 && dr === gridCellSize - 1 && rightTopCorner) {
                            index = TileIndex.SCHOOL_WALL_INSIDE_CORNER;
                            rotation = 2;
                        }
                        else if (dc === 0 && dr === 0 && leftWall && bottomWall) {
                            index = TileIndex.SCHOOL_WALL_OUTSIDE_CORNER;
                            rotation = 0;
                        }
                        else if (dc === gridCellSize - 1 && dr === 0 && rightWall && bottomWall) {
                            index = TileIndex.SCHOOL_WALL_OUTSIDE_CORNER;
                            rotation = 1;
                        }
                        else if (dc === 0 && dr === gridCellSize - 1 && leftWall && topWall) {
                            index = TileIndex.SCHOOL_WALL_OUTSIDE_CORNER;
                            rotation = 3;
                        }
                        else if (dc === gridCellSize - 1 && dr === gridCellSize - 1 && rightWall && topWall) {
                            index = TileIndex.SCHOOL_WALL_OUTSIDE_CORNER;
                            rotation = 2;
                        }
                        else if (dc === 0 && leftWall) {
                            index = TileIndex.SCHOOL_WALL_SIDE;
                            rotation = 0;
                        }
                        else if (dc === gridCellSize - 1 && rightWall) {
                            index = TileIndex.SCHOOL_WALL_SIDE;
                            rotation = 2;
                        }
                        else if (dr === 0 && bottomWall) {
                            index = TileIndex.SCHOOL_WALL_SIDE;
                            rotation = 1;
                        }
                        else if (dr === gridCellSize - 1 && topWall) {
                            index = TileIndex.SCHOOL_WALL_SIDE;
                            rotation = 3;
                        }
                        worldGrid.set(row * gridCellSize + dr, col * gridCellSize + dc, { index, rotation });
                    }
                }
            }
        }
    }
    return [worldGrid, rooms];
}

class SchoolLevel implements Level {
    readonly name = "School";
    readonly portalTypes: PortalProperties[] = [

    ];
    readonly portalDrops: PortalDropPool[] = [

    ];

    readonly playerSpawnPosition = new Vector(0, 200);

    generate(game: Game) {
        const grid = generateHallwayMap();
        const gridCellSize = 6;
        const [worldTileGrid, rooms] = convertHallwayMapToWorldGrid(grid, gridCellSize);
        const worldPropsGrid = new Grid<Nullable<PropIndex>>(worldTileGrid.width, worldTileGrid.height, null);
        for (const [room, position] of rooms) {
            if (room.canBePlacedAt(worldTileGrid, position)) {
                switch (room.doorSide) {
                case "top":
                    placeDoor(worldTileGrid, {row: position.row + 1, col: position.col}, room.doorRadius, "bottom");
                    break;
                case "bottom":
                    placeDoor(worldTileGrid, {row: position.row - 1, col: position.col}, room.doorRadius, "top");
                    break;
                case "right":
                    placeDoor(worldTileGrid, {row: position.row, col: position.col + 1}, room.doorRadius, "left");
                    break;
                case "left":
                    placeDoor(worldTileGrid, {row: position.row, col: position.col - 1}, room.doorRadius, "right");
                    break;
                }
                
                room.placeTilesInGrid(worldTileGrid, position);
                room.placePropsInGrid(worldPropsGrid, position);
            }
        }

        // Convert world grids to actual game world
        for (let r = 0; r < worldTileGrid.height; r++) {
            for (let c = 0; c < worldTileGrid.width; c++) {
                let x = c - worldTileGrid.width / 2;
                let y = r;
                const tile = worldTileGrid.get(r, c)!;
                game.setTileWithTilemapCoordinate(new Vector(x, y), tile.index, tile.rotation);
                const prop = worldPropsGrid.get(r, c);
                if (prop !== null) {
                    const texture = getTexture(propsCodex[prop as PropIndex].spriteID);
                    const position = new Vector((x + 0.5) * PIXELS_PER_TILE, y * PIXELS_PER_TILE + texture.height / 2);
                    game.addGameObject(PropFactory(prop, position));
                }
            }
        }
    }
}

export { SchoolLevel };
