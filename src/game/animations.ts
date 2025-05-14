enum SpriteAnimationIndex {
    CHARACTER_IDLE_DOWN,
    CHARACTER_IDLE_UP,
    CHARACTER_IDLE_LEFT,
    CHARACTER_IDLE_RIGHT,
    CHARACTER_RUN_DOWN,
    CHARACTER_RUN_UP,
    CHARACTER_RUN_LEFT,
    CHARACTER_RUN_RIGHT,
    CHARACTER_IDLE_WATER,
    WATER_TILE,
    VOLCANO,
}

class SpriteAnimation {
    private readonly frames: string[];
    public readonly fps: number;
    private readonly rate: number;

    constructor(frames: string[], fps: number) {
        this.frames = frames;
        this.fps = fps;
        this.rate = 1.0 / fps;
    }

    public getFrame(time: number) {
        const index = Math.floor(time / this.rate) % this.frames.length;
        return this.frames[index];
    }

    public static fromSpritesheet(prefix: string, numFrames: number, fps: number) {
        const frames = [];
        for (let i = 0; i < numFrames; i++) {
            frames.push(`${prefix}_${i}`);
        }
        return new SpriteAnimation(frames, fps);
    }
}

const animationsCodex: Record<SpriteAnimationIndex, SpriteAnimation> = {
    [SpriteAnimationIndex.CHARACTER_IDLE_DOWN]: new SpriteAnimation(
        ["character_0"], 1),
    [SpriteAnimationIndex.CHARACTER_IDLE_RIGHT]: new SpriteAnimation(
        ["character_1"], 1),
    [SpriteAnimationIndex.CHARACTER_IDLE_UP]: new SpriteAnimation(
        ["character_2"], 1),
    [SpriteAnimationIndex.CHARACTER_IDLE_LEFT]: new SpriteAnimation(
        ["character_3"], 1),
    [SpriteAnimationIndex.CHARACTER_RUN_DOWN]: new SpriteAnimation(
        ["character_4", "character_5", "character_6", "character_7", "character_8", "character_9", "character_10", "character_11"], 12),
    [SpriteAnimationIndex.CHARACTER_RUN_UP]: new SpriteAnimation(
        ["character_12", "character_13", "character_14", "character_15", "character_16", "character_17", "character_18", "character_19"], 12),
    [SpriteAnimationIndex.CHARACTER_RUN_RIGHT]: new SpriteAnimation(
        ["character_20", "character_21", "character_22", "character_23", "character_24", "character_25", "character_26", "character_27"], 12),
    [SpriteAnimationIndex.CHARACTER_RUN_LEFT]: new SpriteAnimation(
        ["character_28", "character_29", "character_30", "character_31", "character_32", "character_33", "character_34", "character_35"], 12),
    
    [SpriteAnimationIndex.CHARACTER_IDLE_WATER]: new SpriteAnimation(
        ["character_idle_water_0", "character_idle_water_1"], 2),
    [SpriteAnimationIndex.WATER_TILE]: SpriteAnimation.fromSpritesheet("water", 40, 8),
    [SpriteAnimationIndex.VOLCANO]: SpriteAnimation.fromSpritesheet("volcano", 13, 2.5),
}

export { SpriteAnimationIndex, animationsCodex };
