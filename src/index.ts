import settings from "./settings";
import { Game } from "./game";
import { loadImage } from "./imageLoader";
import { loadSound } from "./soundLoader";

let lastTime = new Date().getTime();
let game: Game | undefined = undefined;
let fpsAverage = 0;
let accumulator = 0;
const gameTickRate = 60;
const gameTickPeriod = 1 / gameTickRate;
const fpsSamples = 5;
let canvas: HTMLCanvasElement | undefined;
let ctx: CanvasRenderingContext2D | null = null;

// const testCanvas = document.createElement("canvas");
// testCanvas.width = 60;
// testCanvas.height = 10;
// const testContext = testCanvas.getContext("2d");
// if (testContext) {
//     testContext.fillStyle = "red";
//     testContext.fillRect(0, 0, 60, 10);
// }
// testCanvas.

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
    console.log("[LOADING ASSETS...]");
    await Promise.all([
        loadImage("grass", "assets/images/grass.png"),
        loadImage("water", "assets/images/water.png"),
        loadImage("rocks", "assets/images/rocks.png"),
        loadImage("path", "assets/images/path.png"),

        loadImage("peach", "assets/images/peach.png"),
        loadImage("peach_water", "assets/images/peach_water.png"),
        loadImage("zombie", "assets/images/zombie.png"),
        loadImage("zombie_water", "assets/images/zombie_water.png"),

        loadImage("portal", "assets/images/portal.png"),

        loadImage("tree", "assets/images/tree.png"),
        loadImage("evergreen", "assets/images/evergreen.png"),
        
        loadImage("arrow", "assets/images/arrow.png"),

        loadImage("zombie_brains", "assets/images/zombie_brains.png"),
        loadImage("zombie_flesh", "assets/images/zombie_flesh.png"),
        loadImage("broad_sword_icon", "assets/images/broad_sword_icon.png"),
        loadImage("shuriken", "assets/images/shuriken.png"),
        loadImage("bow", "assets/images/bow.png"),
        loadImage("arrow-icon", "assets/images/arrow-icon.png"),

        loadImage("portal_particle", "assets/images/portal_particle.png"),
    
        loadImage("hotbar_slot", "assets/images/hotbar_slot.png"),
        loadImage("hotbar_slot_selected", "assets/images/hotbar_slot_selected.png"),
        
        loadImage("essence_orb", "assets/images/essence_orb.png"),
        
        loadImage("essence_jar_small_0", "assets/images/essence_jar_small_0.png"),
        loadImage("essence_jar_small_1", "assets/images/essence_jar_small_1.png"),
        loadImage("essence_jar_small_2", "assets/images/essence_jar_small_2.png"),
        loadImage("essence_jar_small_3", "assets/images/essence_jar_small_3.png"),
        loadImage("essence_jar_small_4", "assets/images/essence_jar_small_4.png"),
        loadImage("essence_jar_small_5", "assets/images/essence_jar_small_5.png"),
        loadImage("essence_jar_small_6", "assets/images/essence_jar_small_6.png"),
        loadImage("essence_jar_small_7", "assets/images/essence_jar_small_7.png"),
        loadImage("essence_jar_small_8", "assets/images/essence_jar_small_8.png"),
        
        loadImage("square",  "assets/images/square.png"),

        // -- SOUNDS --
        loadSound("item_pickup", "assets/sounds/item_pickup.wav", 5),
        loadSound("essence_pickup", "assets/sounds/essence_pickup.wav", 10),
        loadSound("peach_damage", "assets/sounds/peach_damage.wav", 1),
        loadSound("peach_die", "assets/sounds/peach_die.wav", 1),
        loadSound("hitmarker", "assets/sound/hitmarker.mp3", 5),
    ]);
    console.log("[FINISHED LOADING ASSETS...]");

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
