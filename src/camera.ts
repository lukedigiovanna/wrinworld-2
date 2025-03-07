import input from "./input";
import { Vector, MathUtils } from "./utils";

class Camera {
    public position: Vector; // center of camera view
    private alignedPosition: Vector;
    public height: number;

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    public target: Vector = Vector.zero();

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.position = Vector.zero();
        this.alignedPosition = Vector.zero();
        this.height = 18;
    }

    public update(dt: number) {
        const diff = Vector.subtract(this.target, this.position);
        if (diff.magnitude > this.height / 8) {
            diff.subtract(Vector.scaled(Vector.normalized(diff), this.height / 8));
            diff.scale(dt * 3);
            if (diff.magnitude > 0.025)
                this.position.add(diff);
        }

        if (input.isKeyDown("Equal")) {
            this.height *= 0.95;
        }
        if (input.isKeyDown("Minus")) {
            this.height *= 1 / 0.95;
        }
        this.height = MathUtils.clamp(this.height, 1, 100);
    }

    // sets the color for future draw operations
    public setFillColor(color: string) {
        this.ctx.fillStyle = color;
    }

    public setStrokeColor(color: string) {
        this.ctx.strokeStyle = color;
    }

    public setLineWidth(width: number) {
        this.ctx.lineWidth = width;
    }

    // clears the camera view
    public clear() {
        const scale = 32;
        this.alignedPosition.setComponents(
            Math.round(this.position.x * scale) / scale, 
            Math.round(this.position.y * scale) / scale
        );
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Fills a rectangle using the given world coordinates where the x,y denotes the center of the rectangle
    public fillRect(x: number, y: number, w: number, h: number) {
        this.ctx.fillRect(
            this.worldXToScreenX(x - w / 2),
            this.worldYToScreenY(y + h / 2),
            this.worldWidthToScreenWidth(w),
            this.worldHeightToScreenHeight(h),
        );
    }

    public strokeRect(x: number, y: number, w: number, h: number) {
        this.ctx.strokeRect(
            this.worldXToScreenX(x - w / 2),
            this.worldYToScreenY(y + h / 2),
            this.worldWidthToScreenWidth(w),
            this.worldHeightToScreenHeight(h),
        );
    }

    public fillEllipse(x: number, y: number, w: number, h: number) {
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.worldXToScreenX(x), 
            this.worldYToScreenY(y), 
            this.worldWidthToScreenWidth(w / 2), 
            this.worldHeightToScreenHeight(h / 2), 
            0, 0, 2 * Math.PI
        );
        this.ctx.fill();

    }

    public drawImage(img: HTMLImageElement, x: number, y: number, w: number, h: number, angle: number=0, rotationPointOffset=Vector.zero()) {
        this.ctx.imageSmoothingEnabled = false;
        // this.ctx.translate(this.worldXToScreenX(x - w / 2), this.worldYToScreenY(y + h / 2));
        // this.ctx.scale(Math.sign(w), 1);
        this.ctx.translate(this.worldXToScreenX(x + rotationPointOffset.x), this.worldYToScreenY(y + rotationPointOffset.y))
        this.ctx.rotate(-angle);
        this.ctx.translate(this.worldWidthToScreenWidth(-w / 2 - rotationPointOffset.x), this.worldHeightToScreenHeight(-h / 2 - rotationPointOffset.y));
        this.ctx.scale(Math.sign(w), 1);
        const sw = this.worldWidthToScreenWidth(w);
        this.ctx.drawImage(img, (Math.sign(w) - 1) * 0.5 * sw, 0, sw, this.worldHeightToScreenHeight(h));
        // this.ctx.drawImage(img, 0, 0, sw, this.worldHeightToScreenHeight(h));
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // space transformation utilities:

    public get width() {
        return this.canvas.width / this.canvas.height * this.height;
    }

    private worldXToScreenX(x: number): number {
        const offset = x - (this.alignedPosition.x - this.width / 2);
        const p = offset / this.width;
        const screenX = p * this.canvas.width;
        return Math.round(screenX);
    }

    private worldYToScreenY(y: number): number {
        const offset = (this.alignedPosition.y + this.height / 2) - y;
        const p = offset / this.height;
        const screenY = p * this.canvas.height;
        return Math.round(screenY);
    }

    private worldPosToScreenPos(pos: Vector): Vector {
        return new Vector(this.worldXToScreenX(pos.x), this.worldYToScreenY(pos.y));
    }

    private worldWidthToScreenWidth(w: number): number {
        return Math.ceil(w / this.width * this.canvas.width);
    }

    private worldHeightToScreenHeight(h: number): number {
        return Math.ceil(h / (this.canvas.height / this.canvas.width * this.width) * this.canvas.height);
    }

    public screenToWorldPosition(pos: Vector) {
        const p = Vector.divide(pos, new Vector(this.canvas.width, this.canvas.height));
        p.multiply(new Vector(this.width, this.height));
        p.add(this.alignedPosition);
        p.subtract(new Vector(this.width / 2, this.height / 2));
        p.y = 2 * this.alignedPosition.y - p.y;
        return p;
    }
}

export { Camera };