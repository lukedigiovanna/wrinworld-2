import settings from "./settings";
import { Game } from "./game";
import { loadImage } from "./imageLoader";
import { Vector } from "./utils";

let lastTime = new Date().getTime();
let game: Game | undefined = undefined;
let fpsAverage = 0;
let accumulator = 0;
const gameTickRate = 60;
const gameTickPeriod = 1 / gameTickRate;
const fpsSamples = 5;
let canvas: HTMLCanvasElement | undefined;
let ctx: CanvasRenderingContext2D | null = null;

const mainLoop = () => {
    if (!game || !canvas || !ctx) {
        throw Error("Cannot run main loop without initialized game");
    }
    const nowTime = new Date().getTime();
    const dt = (nowTime - lastTime) / 1000;
    fpsAverage = (fpsAverage * (fpsSamples - 1) + (1.0 / dt)) / fpsSamples;
    lastTime = nowTime;
    
    accumulator += dt;
    // Don't allow accumulator to exceed a second of elapsed time -- too much of a jump
    accumulator = Math.min(1, accumulator);
    while (accumulator >= gameTickPeriod) {
        game.preUpdate();
        game.update(gameTickPeriod);
        accumulator -= gameTickPeriod;
    }

    game.draw();

    if (settings.showFPS) {
        ctx.fillStyle = "red";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(`FPS: ${Math.round(fpsAverage)}`, 10, 25);
        ctx.fillText(`OBJS: ${game.totalObjects}`, 10, 50);
        ctx.fillText(`ACTIVE: ${game.totalActiveObjects}`, 10, 75);
    }

    window.requestAnimationFrame(mainLoop);
}

window.onload = async () => {
    await Promise.all([
        loadImage("grass", "assets/images/grass.png"),
        loadImage("water", "assets/images/water.png"),
        loadImage("rocks", "assets/images/rocks.png"),
        loadImage("path", "assets/images/path.png"),

        loadImage("edge_merge_path_grass", "assets/images/edge_merge_path_grass.png"),

        loadImage("peach", "assets/images/peach.png"),
        loadImage("peach_water", "assets/images/peach_water.png"),
        loadImage("chicken", "assets/images/chicken.png"),
        loadImage("portal", "assets/images/portal.png"),

        loadImage("tree", "assets/images/tree.png"),
        loadImage("evergreen", "assets/images/evergreen.png"),
        loadImage("rose", "assets/images/rose.png"),
        loadImage("tallgrass", "assets/images/tallgrass.png"),
        
        loadImage("fireball", "assets/images/fireball.webp"),
        loadImage("kfc", "assets/images/kfc.png"),
        
        loadImage("feather", "assets/images/feather.png"),
        loadImage("spark", "assets/images/spark.png"),
        loadImage("smoke", "assets/images/smoke.webp"),
        loadImage("portal_particle", "assets/images/portal_particle.png")
    ]);

    canvas = document.getElementById('game-canvas') as HTMLCanvasElement;    
    ctx = canvas.getContext('2d');

    if (!ctx) {
        throw Error("Fatal: failed to get context");
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.onresize = () => {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    game = new Game(canvas, ctx);

    window.requestAnimationFrame(mainLoop);
}
