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
        // Tiles
        loadImage("grass", "assets/images/tiles/grass.png"),
        loadImage("water", "assets/images/tiles/water.png"),
        loadImage("rocks", "assets/images/tiles/rocks.png"),
        loadImage("path", "assets/images/tiles/path.png"),
        loadImage("sand", "assets/images/tiles/sand.png"),
        loadImage("planks", "assets/images/tiles/planks.png"),
        loadImage("cursed_grass", "assets/images/tiles/cursed_grass.png"),
        loadImage("cursed_path", "assets/images/tiles/cursed_path.png"),
        loadImage("cursed_sand", "assets/images/tiles/cursed_sand.png"),
        loadImage("cursed_planks", "assets/images/tiles/cursed_planks.png"),

        // Entities
        loadImage("peach", "assets/images/peach.png"),
        loadImage("peach_water", "assets/images/peach_water.png"),

        loadImage("zombie", "assets/images/enemies/zombie.png"),
        loadImage("zombie_water", "assets/images/enemies/zombie_water.png"),
        loadImage("minion", "assets/images/enemies/minion.png"),
        loadImage("minion_water", "assets/images/enemies/minion_water.png"),
        loadImage("slime", "assets/images/enemies/slime.png"),
        loadImage("revenant_eye", "assets/images/enemies/revenant_eye.png"),
        loadImage("wraith", "assets/images/enemies/wraith.png"),
        loadImage("wretched_skeleton", "assets/images/enemies/wretched_skeleton.png"),

        loadImage("portal", "assets/images/portal.png"),
        loadImage("essence_orb", "assets/images/essence_orb.png"),

        // Props
        loadImage("tree", "assets/images/props/tree.png"),
        loadImage("evergreen", "assets/images/props/evergreen.png"),
        
        // Projectiles
        loadImage("arrow", "assets/images/projectiles/arrow.png"),
        loadImage("tear_drop", "assets/images/projectiles/tear_drop.png"),
        loadImage("wraith_attack", "assets/images/projectiles/wraith_attack.png"),

        // Item icons
        loadImage("zombie_brains", "assets/images/items/zombie_brains.png"),
        loadImage("zombie_flesh", "assets/images/items/zombie_flesh.png"),
        loadImage("broad_sword_icon", "assets/images/items/broad_sword_icon.png"),
        loadImage("shuriken", "assets/images/items/shuriken.png"),
        loadImage("bow", "assets/images/items/bow.png"),
        loadImage("arrow_icon", "assets/images/items/arrow_icon.png"),
        loadImage("healing_vial", "assets/images/items/healing_vial.png"),
        loadImage("battle_hammer",  "assets/images/items/battle_hammer.png"),
        loadImage("crystal_bomb", "assets/images/items/crystal_bomb.png"),
        loadImage("daggers", "assets/images/items/daggers.png"),
        loadImage("essence_dripped_dagger", "assets/images/items/essence_dripped_dagger.png"),
        loadImage("essence_vial", "assets/images/items/essence_vial.png"),
        loadImage("flame_upgrade", "assets/images/items/flame_upgrade.png"),
        loadImage("heart_crystal", "assets/images/items/heart_crystal.png"),
        loadImage("heart", "assets/images/items/heart.png"),
        loadImage("poison_arrow_icon", "assets/images/items/poison_arrow.png"),
        loadImage("flame_arrow_icon", "assets/images/items/flame_arrow_icon.png"),
        loadImage("poison_upgrade", "assets/images/items/poison_upgrade.png"),
        loadImage("slingshot", "assets/images/items/slingshot.png"),
        loadImage("strength_upgrade", "assets/images/items/strength_upgrade.png"),
        loadImage("stun_fiddle", "assets/images/items/stun_fiddle.png"),
        loadImage("teleportation_rune", "assets/images/items/teleportation_rune.png"),
        loadImage("root_snare", "assets/images/items/root_snare.png"),
        loadImage("basic_shield", "assets/images/items/basic_shield.png"),
        loadImage("quick_bow", "assets/images/items/quick_bow.png"),

        // Particle sprites
        loadImage("portal_particle", "assets/images/particles/portal_particle.png"),
        loadImage("sword_spark", "assets/images/particles/sword_spark.png"),
        loadImage("slime_particle", "assets/images/particles/slime_particle.png"),
    
        // UI
        loadImage("hotbar_slot", "assets/images/ui/hotbar_slot.png"),
        loadImage("hotbar_slot_selected", "assets/images/ui/hotbar_slot_selected.png"),
        
        loadImage("essence_jar_small_0", "assets/images/ui/essence_jar_small_0.png"),
        loadImage("essence_jar_small_1", "assets/images/ui/essence_jar_small_1.png"),
        loadImage("essence_jar_small_2", "assets/images/ui/essence_jar_small_2.png"),
        loadImage("essence_jar_small_3", "assets/images/ui/essence_jar_small_3.png"),
        loadImage("essence_jar_small_4", "assets/images/ui/essence_jar_small_4.png"),
        loadImage("essence_jar_small_5", "assets/images/ui/essence_jar_small_5.png"),
        loadImage("essence_jar_small_6", "assets/images/ui/essence_jar_small_6.png"),
        loadImage("essence_jar_small_7", "assets/images/ui/essence_jar_small_7.png"),
        loadImage("essence_jar_small_8", "assets/images/ui/essence_jar_small_8.png"),
        
        loadImage("attack_reload_0", "assets/images/ui/attack_reload_0.png"),
        loadImage("attack_reload_1", "assets/images/ui/attack_reload_1.png"),
        loadImage("attack_reload_2", "assets/images/ui/attack_reload_2.png"),
        loadImage("attack_reload_3", "assets/images/ui/attack_reload_3.png"),
        loadImage("attack_reload_4", "assets/images/ui/attack_reload_4.png"),
        loadImage("attack_reload_5", "assets/images/ui/attack_reload_5.png"),
        loadImage("attack_reload_6", "assets/images/ui/attack_reload_6.png"),
        loadImage("attack_reload_7", "assets/images/ui/attack_reload_7.png"),
        loadImage("attack_reload_8", "assets/images/ui/attack_reload_8.png"),
        loadImage("attack_reload_9", "assets/images/ui/attack_reload_9.png"),

        // Misc.
        loadImage("square",  "assets/images/square.png"),
        loadImage("undefined", "assets/images/undefined.png"),

        // -- SOUNDS --
        loadSound("item_pickup", "assets/sounds/item_pickup.wav", 5),
        loadSound("essence_pickup", "assets/sounds/essence_pickup.wav", 1),
        loadSound("peach_damage", "assets/sounds/peach_damage.wav", 1),
        loadSound("peach_die", "assets/sounds/peach_die.wav", 1),
        loadSound("hitmarker", "assets/sounds/hitmarker.mp3", 1),
        loadSound("portal_break", "assets/sounds/portal_break.mp3", 1),
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
