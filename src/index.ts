import { Game } from "./game";
import { loadImage, loadImageAndTexture, loadImageAndTextureSpritesheet } from "./imageLoader";
import { loadSound } from "./soundLoader";
import { ShaderProgram } from "./shader";
import { vertexShaderCode, fragmentShaderCode } from "./shaderCode";
import settings from "./settings";

let lastTime = new Date().getTime();
let game: Game | undefined = undefined;
let fpsAverage = 0;
let accumulator = 0;
const gameTickRate = 60;
const gameTickPeriod = 1 / gameTickRate;
const fpsSamples = 5;
let canvas: HTMLCanvasElement | undefined;
let gl: WebGLRenderingContext | null = null;
let shaderProgram: ShaderProgram | null = null;

const mainLoop = () => {
    if (!game || !canvas || !gl || !shaderProgram) {
        throw Error("Cannot run mainLoop without canvas or gl context or shaderProgram");
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
        $("#debug-info").css("visibility", "visible");
        $("#fps").text(Math.round(1 / dt));
        $("#objs").text(game.totalObjects);
        $("#active-objs").text(game.totalActiveObjects);
    }
    else {
        $("#debug-info").css("visibility", "hidden");
    }

    window.requestAnimationFrame(mainLoop);
}

window.onload = async () => {
    canvas = document.getElementById('game-canvas') as HTMLCanvasElement;    
    gl = canvas.getContext('webgl', { antialias: false });

    if (!gl) {
        throw Error("Fatal: failed to get context");
    }

    console.log("[LOADING ASSETS...]");
    await Promise.all([
        // Tiles
        loadImageAndTexture(gl, "grass", "assets/images/tiles/grass.png"),
        loadImageAndTexture(gl, "water", "assets/images/tiles/water.png"),
        loadImageAndTexture(gl, "rocks", "assets/images/tiles/rocks.png"),
        loadImageAndTexture(gl, "path", "assets/images/tiles/path.png"),
        loadImageAndTexture(gl, "sand", "assets/images/tiles/sand.png"),
        loadImageAndTexture(gl, "planks", "assets/images/tiles/planks.png"),
        loadImageAndTexture(gl, "cursed_grass", "assets/images/tiles/cursed_grass.png"),
        loadImageAndTexture(gl, "cursed_path", "assets/images/tiles/cursed_path.png"),
        loadImageAndTexture(gl, "cursed_sand", "assets/images/tiles/cursed_sand.png"),
        loadImageAndTexture(gl, "cursed_planks", "assets/images/tiles/cursed_planks.png"),

        // Entities
        loadImageAndTexture(gl, "peach", "assets/images/peach.png"),
        loadImageAndTexture(gl, "peach_water", "assets/images/peach_water.png"),
        loadImageAndTexture(gl, "character", "assets/images/character.png"),
        loadImageAndTextureSpritesheet(gl, "character_idle", "assets/images/character_idle.png", 24, 42),
        loadImageAndTextureSpritesheet(gl, "character_run", "assets/images/character_run.png", 24, 42),
        loadImageAndTextureSpritesheet(gl, "character_idle_water", "assets/images/character_idle_water.png", 24, 42),

        loadImageAndTexture(gl, "minion", "assets/images/enemies/minion.png"),
        loadImageAndTexture(gl, "minion_water", "assets/images/enemies/minion_water.png"),
        loadImageAndTexture(gl, "minion_dead", "assets/images/enemies/minion_dead.png"),
        loadImageAndTexture(gl, "slime", "assets/images/enemies/slime.png"),
        loadImageAndTexture(gl, "slime_water", "assets/images/enemies/slime_water.png"),
        loadImageAndTexture(gl, "slime_dead", "assets/images/enemies/slime_dead.png"),
        loadImageAndTexture(gl, "revenant_eye", "assets/images/enemies/revenant_eye.png"),
        loadImageAndTexture(gl, "revenant_eye_attack", "assets/images/enemies/revenant_eye_attack.png"),
        loadImageAndTexture(gl, "revenant_eye_dead", "assets/images/enemies/revenant_eye_dead.png"),
        loadImageAndTexture(gl, "wraith", "assets/images/enemies/wraith.png"),
        loadImageAndTexture(gl, "wretched_skeleton", "assets/images/enemies/wretched_skeleton.png"),
        loadImageAndTexture(gl, "wretched_skeleton_water", "assets/images/enemies/wretched_skeleton_water.png"),
        loadImageAndTexture(gl, "wretched_skeleton_attack", "assets/images/enemies/wretched_skeleton_attack.png"),
        loadImageAndTexture(gl, "wretched_skeleton_dead", "assets/images/enemies/wretched_skeleton_dead.png"),

        loadImageAndTexture(gl, "portal", "assets/images/portal_medium.png"),
        loadImageAndTexture(gl, "essence_orb_small", "assets/images/essence_orb_small.png"),

        // Props
        loadImageAndTexture(gl, "tree", "assets/images/props/tree.png"),
        loadImageAndTexture(gl, "evergreen", "assets/images/props/evergreen.png"),
        loadImageAndTexture(gl, "flower", "assets/images/props/flower.png"),
        loadImageAndTexture(gl, "tall_grass", "assets/images/props/tall_grass.png"),
        
        // Projectiles
        loadImageAndTexture(gl, "arrow", "assets/images/projectiles/arrow.png"),
        loadImageAndTexture(gl, "poison_arrow", "assets/images/projectiles/poison_arrow.png"),
        loadImageAndTexture(gl, "ricochet_arrow", "assets/images/projectiles/ricochet_arrow.png"),
        loadImageAndTexture(gl, "tear_drop", "assets/images/projectiles/tear_drop.png"),
        loadImageAndTexture(gl, "wraith_attack", "assets/images/projectiles/wraith_attack.png"),
        loadImageAndTexture(gl, "rock", "assets/images/projectiles/rock.png"),
        loadImageAndTexture(gl, "crystal_shard", "assets/images/projectiles/crystal_shard.png"),
        loadImageAndTexture(gl, "flower_power_petal", "assets/images/projectiles/flower_petal.png"),

        // Item icons
        loadImageAndTexture(gl, "broad_sword_icon", "assets/images/items/broad_sword_icon.png"),
        loadImageAndTexture(gl, "shuriken", "assets/images/items/shuriken.png"),
        loadImageAndTexture(gl, "bow", "assets/images/items/bow.png"),
        loadImageAndTexture(gl, "arrow_icon", "assets/images/items/arrow_icon.png"),
        loadImageAndTexture(gl, "healing_vial", "assets/images/items/healing_vial.png"),
        loadImageAndTexture(gl, "battle_hammer",  "assets/images/items/battle_hammer.png"),
        loadImageAndTexture(gl, "crystal_bomb", "assets/images/items/crystal_bomb.png"),
        loadImageAndTexture(gl, "daggers", "assets/images/items/daggers.png"),
        loadImageAndTexture(gl, "essence_dripped_dagger", "assets/images/items/essence_dripped_dagger.png"),
        loadImageAndTexture(gl, "essence_vial", "assets/images/items/essence_vial.png"),
        loadImageAndTexture(gl, "flame_upgrade", "assets/images/items/flame_upgrade.png"),
        loadImageAndTexture(gl, "heart_crystal", "assets/images/items/heart_crystal.png"),
        loadImageAndTexture(gl, "heart", "assets/images/items/heart.png"),
        loadImageAndTexture(gl, "poison_arrow_icon", "assets/images/items/poison_arrow.png"),
        loadImageAndTexture(gl, "flame_arrow_icon", "assets/images/items/flame_arrow.png"),
        loadImageAndTexture(gl, "poison_upgrade", "assets/images/items/poison_upgrade.png"),
        loadImageAndTexture(gl, "slingshot", "assets/images/items/slingshot.png"),
        loadImageAndTexture(gl, "strength_upgrade", "assets/images/items/strength_upgrade.png"),
        loadImageAndTexture(gl, "stun_fiddle", "assets/images/items/stun_fiddle.png"),
        loadImageAndTexture(gl, "teleportation_rune", "assets/images/items/teleportation_rune.png"),
        loadImageAndTexture(gl, "root_snare", "assets/images/items/root_snare.png"),
        loadImageAndTexture(gl, "basic_shield", "assets/images/items/basic_shield.png"),
        loadImageAndTexture(gl, "quick_bow", "assets/images/items/quick_bow.png"),
        loadImageAndTexture(gl, "dice", "assets/images/items/dice.png"),
        loadImageAndTexture(gl, "ghost_arrows", "assets/images/items/ghost_arrows.png"),
        loadImageAndTexture(gl, "ghost_bow", "assets/images/items/ghost_bow.png"),
        loadImageAndTexture(gl, "strong_sword", "assets/images/items/strong_sword.png"),
        loadImageAndTexture(gl, "poison_strong_sword", "assets/images/items/poison_strong_sword.png"),
        loadImageAndTexture(gl, "poison_broad_sword", "assets/images/items/poison_broad_sword.png"),
        loadImageAndTexture(gl, "boomerang", "assets/images/items/boomerang.png"),
        loadImageAndTexture(gl, "ricochet_boomerang", "assets/images/items/ricochet_boomerang.png"),
        loadImageAndTexture(gl, "ricochet_upgrade", "assets/images/items/ricochet_upgrade.png"),
        loadImageAndTexture(gl, "ricochet_bow", "assets/images/items/ricochet_bow.png"),
        loadImageAndTexture(gl, "sprocket_upgrade", "assets/images/items/sprocket_upgrade.png"),
        loadImageAndTexture(gl, "reinforced_slingshot", "assets/images/items/reinforced_slingshot.png"),
        loadImageAndTexture(gl, "machine_gun_slingshot", "assets/images/items/machine_gun_slingshot.png"),
        loadImageAndTexture(gl, "invincibility_bubble", "assets/images/items/invincibility_bubble.png"),
        loadImageAndTexture(gl, "poison_battle_hammer", "assets/images/items/poison_battle_hammer.png"),
        loadImageAndTexture(gl, "quick_battle_hammer", "assets/images/items/quick_battle_hammer.png"),
        loadImageAndTexture(gl, "quick_broad_sword", "assets/images/items/quick_broad_sword.png"),
        loadImageAndTexture(gl, "quick_hand_upgrade", "assets/images/items/quick_hand_upgrade.png"),
        loadImageAndTexture(gl, "flower_power", "assets/images/items/flower_power.png"),
        loadImageAndTexture(gl, "light_boots", "assets/images/items/light_boots.png"),
        loadImageAndTexture(gl, "essence_magnet", "assets/images/items/essence_magnet.png"),
        loadImageAndTexture(gl, "power_bow", "assets/images/items/power_bow.png"),
        

        // Particle sprites
        loadImageAndTexture(gl, "portal_particle", "assets/images/particles/portal_particle.png"),
        loadImageAndTexture(gl, "sword_spark", "assets/images/particles/sword_spark.png"),
        loadImageAndTexture(gl, "slime_particle", "assets/images/particles/slime_particle.png"),
        loadImageAndTexture(gl, "poison_particle", "assets/images/particles/poison.png"),
        loadImageAndTexture(gl, "flame_particle", "assets/images/particles/flame.png"),
        loadImageAndTexture(gl, "stun_particle", "assets/images/particles/stun.png"),
    
        loadImageAndTextureSpritesheet(gl, "pixel_font", "assets/images/font_small.png", 5, 5, ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]),

        // UI
        loadImage("inventory_slot", "assets/images/ui/inventory_slot.png"),
        loadImage("selected_slot", "assets/images/ui/selected_slot.png"),
        loadImage("buff_slot", "assets/images/ui/buff_slot.png"),
        loadImage("consumable_slot", "assets/images/ui/consumable_slot.png"),
        loadImage("selected_consumable_slot", "assets/images/ui/selected_consumable_slot.png"),
        loadImage("quiver_slot", "assets/images/ui/quiver_slot.png"),
        loadImage("utility_slot", "assets/images/ui/utility_slot.png"),
        loadImage("selected_utility_slot", "assets/images/ui/selected_utility_slot.png"),
        loadImage("weapon_slot", "assets/images/ui/weapon_slot.png"),
        loadImage("selected_weapon_slot", "assets/images/ui/selected_weapon_slot.png"),
        loadImage("upgrade_slot", "assets/images/ui/upgrade_slot.png"),
        
        loadImage("essence_jar_small_0", "assets/images/ui/essence_jar_small_0.png"),
        loadImage("essence_jar_small_1", "assets/images/ui/essence_jar_small_1.png"),
        loadImage("essence_jar_small_2", "assets/images/ui/essence_jar_small_2.png"),
        loadImage("essence_jar_small_3", "assets/images/ui/essence_jar_small_3.png"),
        loadImage("essence_jar_small_4", "assets/images/ui/essence_jar_small_4.png"),
        loadImage("essence_jar_small_5", "assets/images/ui/essence_jar_small_5.png"),
        loadImage("essence_jar_small_6", "assets/images/ui/essence_jar_small_6.png"),
        loadImage("essence_jar_small_7", "assets/images/ui/essence_jar_small_7.png"),
        loadImage("essence_jar_small_8", "assets/images/ui/essence_jar_small_8.png"),
        
        loadImage("attack_cooldown_0", "assets/images/ui/attack_reload_0.png"),
        loadImage("attack_cooldown_1", "assets/images/ui/attack_reload_1.png"),
        loadImage("attack_cooldown_2", "assets/images/ui/attack_reload_2.png"),
        loadImage("attack_cooldown_3", "assets/images/ui/attack_reload_3.png"),
        loadImage("attack_cooldown_4", "assets/images/ui/attack_reload_4.png"),
        loadImage("attack_cooldown_5", "assets/images/ui/attack_reload_5.png"),
        loadImage("attack_cooldown_6", "assets/images/ui/attack_reload_6.png"),
        loadImage("attack_cooldown_7", "assets/images/ui/attack_reload_7.png"),
        loadImage("attack_cooldown_8", "assets/images/ui/attack_reload_8.png"),
        loadImage("attack_cooldown_9", "assets/images/ui/attack_reload_9.png"),

        loadImage("attack_charge_0", "assets/images/ui/attack_charge_0.png"),
        loadImage("attack_charge_1", "assets/images/ui/attack_charge_1.png"),
        loadImage("attack_charge_2", "assets/images/ui/attack_charge_2.png"),
        loadImage("attack_charge_3", "assets/images/ui/attack_charge_3.png"),
        loadImage("attack_charge_4", "assets/images/ui/attack_charge_4.png"),
        loadImage("attack_charge_5", "assets/images/ui/attack_charge_5.png"),
        loadImage("attack_charge_6", "assets/images/ui/attack_charge_6.png"),
        loadImage("attack_charge_7", "assets/images/ui/attack_charge_7.png"),
        loadImage("attack_charge_8", "assets/images/ui/attack_charge_8.png"),
        loadImage("attack_charge_9", "assets/images/ui/attack_charge_9.png"),

        loadImage("cooldown_0", "assets/images/ui/cooldown_0.png"),
        loadImage("cooldown_1", "assets/images/ui/cooldown_1.png"),
        loadImage("cooldown_2", "assets/images/ui/cooldown_2.png"),
        loadImage("cooldown_3", "assets/images/ui/cooldown_3.png"),
        loadImage("cooldown_4", "assets/images/ui/cooldown_4.png"),
        loadImage("cooldown_5", "assets/images/ui/cooldown_5.png"),
        loadImage("cooldown_6", "assets/images/ui/cooldown_6.png"),
        loadImage("cooldown_7", "assets/images/ui/cooldown_7.png"),
        loadImage("cooldown_8", "assets/images/ui/cooldown_8.png"),
        loadImage("cooldown_9", "assets/images/ui/cooldown_9.png"),
        loadImage("cooldown_10", "assets/images/ui/cooldown_10.png"),
        loadImage("cooldown_11", "assets/images/ui/cooldown_11.png"),
        loadImage("cooldown_12", "assets/images/ui/cooldown_12.png"),
        loadImage("cooldown_13", "assets/images/ui/cooldown_13.png"),
        loadImage("cooldown_14", "assets/images/ui/cooldown_14.png"),
        loadImage("cooldown_15", "assets/images/ui/cooldown_15.png"),
        
        loadImage("status_effect_slot", "assets/images/ui/status_effect_slot.png"),
        
        loadImage("invincibility_effect_icon", "assets/images/status_effects/invincibility_icon.png"),
        loadImage("poison_effect_icon", "assets/images/status_effects/poison_icon.png"),
        loadImage("flame_effect_icon", "assets/images/status_effects/flame_icon.png"),

        // Misc.
        loadImageAndTexture(gl, "square",  "assets/images/square.png"),
        loadImageAndTexture(gl, "undefined", "assets/images/undefined.png"),
        loadImageAndTexture(gl, "right_arrow", "assets/images/right_arrow.png"),

        // -- SOUNDS --
        loadSound("item_pickup", "assets/sounds/item_pickup.wav", 5),
        loadSound("essence_pickup", "assets/sounds/essence_pickup.wav", 1),
        loadSound("peach_damage", "assets/sounds/peach_damage.wav", 1),
        loadSound("peach_die", "assets/sounds/peach_die.wav", 1),
        loadSound("hitmarker", "assets/sounds/hitmarker.mp3", 1),
        loadSound("portal_break", "assets/sounds/portal_break.mp3", 1),
    ]);
    console.log("[FINISHED LOADING ASSETS...]");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.onresize = () => {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    shaderProgram = new ShaderProgram(gl, vertexShaderCode, fragmentShaderCode);

    shaderProgram.use();
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);  

    game = new Game(canvas, gl, shaderProgram);

    window.requestAnimationFrame(mainLoop);
}
