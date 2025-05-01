import { Level, PortalDropPool } from "./";
import { PortalProperties } from "../gameObjects";
import { Game } from "../game";
import { TileIndex } from "../tiles";
import { MathUtils, Vector } from "../utils";

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
        console.log(`drawHorizontalLine(${row},${c0},${c1},${value})`)
        let d = Math.sign(c1 - c0);
        while (c0 !== c1) {
            if (this.get(row, c0) ||  (!this.get(row + 1, c0) && !this.get(row - 1, c0))) {
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
        console.log(`drawVerticalLine(${col},${r0},${r1},${value})`)
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

    public getLeft(row: number, col: number, direction: Direction): T | undefined {
        if (direction === "up") return this.get(row, col - 1);
        if (direction === "down") return this.get(row, col + 1);
        if (direction === "left") return this.get(row - 1, col);
        if (direction === "right") return this.get(row + 1, col);
    }

    public getRight(row: number, col: number, direction: Direction): T | undefined {
        if (direction === "up") return this.get(row, col + 1);
        if (direction === "down") return this.get(row, col - 1);
        if (direction === "left") return this.get(row + 1, col);
        if (direction === "right") return this.get(row - 1, col);
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

type Direction = "up" | "left" | "down" | "right";

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
        // const index = MathUtils.randomInt(0, endpoints.length - 1);
        const endpoint = endpoints.splice(0, 1)[0];
        
        console.log(endpoint);
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
        grid.prettyPrint();
    }

    return grid;
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
        grid.prettyPrint();
        const gridCellSize = 6;
        const gridWorldWidth = grid.width * gridCellSize;
        const gridWorldHeight = grid.height * gridCellSize;
        for (let x = 0; x < gridWorldWidth; x++) {
            for (let y = 0; y < gridWorldHeight; y++) {
                game.setTileWithTilemapCoordinate(new Vector(x - gridWorldWidth / 2, y), TileIndex.SCHOOL_WALL);
            }
        }
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
                    for (let dx = 0; dx < gridCellSize; dx++) {
                        for (let dy = 0; dy < gridCellSize; dy++) {
                            let index = TileIndex.SCHOOL_TILE;
                            let rotation = MathUtils.randomInt(0, 3);
                            if (dx === 0 && dy === 0 && leftBottomCorner) {
                                index = TileIndex.SCHOOL_WALL_INSIDE_CORNER;
                                rotation = 0;
                            }
                            else if (dx === gridCellSize - 1 && dy === 0 && rightBottomCorner) {
                                index = TileIndex.SCHOOL_WALL_INSIDE_CORNER;
                                rotation = 1;
                            }
                            else if (dx === 0 && dy === gridCellSize - 1 && leftTopCorner) {
                                index = TileIndex.SCHOOL_WALL_INSIDE_CORNER;
                                rotation = 3;
                            }
                            else if (dx === gridCellSize - 1 && dy === gridCellSize - 1 && rightTopCorner) {
                                index = TileIndex.SCHOOL_WALL_INSIDE_CORNER;
                                rotation = 2;
                            }
                            else if (dx === 0 && dy === 0 && leftWall && bottomWall) {
                                index = TileIndex.SCHOOL_WALL_OUTSIDE_CORNER;
                                rotation = 0;
                            }
                            else if (dx === gridCellSize - 1 && dy === 0 && rightWall && bottomWall) {
                                index = TileIndex.SCHOOL_WALL_OUTSIDE_CORNER;
                                rotation = 1;
                            }
                            else if (dx === 0 && dy === gridCellSize - 1 && leftWall && topWall) {
                                index = TileIndex.SCHOOL_WALL_OUTSIDE_CORNER;
                                rotation = 3;
                            }
                            else if (dx === gridCellSize - 1 && dy === gridCellSize - 1 && rightWall && topWall) {
                                index = TileIndex.SCHOOL_WALL_OUTSIDE_CORNER;
                                rotation = 2;
                            }
                            else if (dx === 0 && leftWall) {
                                index = TileIndex.SCHOOL_WALL_SIDE;
                                rotation = 0;
                            }
                            else if (dx === gridCellSize - 1 && rightWall) {
                                index = TileIndex.SCHOOL_WALL_SIDE;
                                rotation = 2;
                            }
                            else if (dy === 0 && bottomWall) {
                                index = TileIndex.SCHOOL_WALL_SIDE;
                                rotation = 1;
                            }
                            else if (dy === gridCellSize - 1 && topWall) {
                                index = TileIndex.SCHOOL_WALL_SIDE;
                                rotation = 3;
                            }
                            game.setTileWithTilemapCoordinate(
                                new Vector(col * gridCellSize + dx - gridWorldWidth / 2, row * gridCellSize + dy), 
                                index, rotation as 0 | 1 | 2 | 3
                            );
                        }
                    }
                }
            }
        }
    }
}

export { SchoolLevel };
