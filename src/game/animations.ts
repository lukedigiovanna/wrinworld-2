enum SpriteAnimationIndex {
    CHARACTER_IDLE,
    CHARACTER_RUN,
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
    [SpriteAnimationIndex.CHARACTER_IDLE]: new SpriteAnimation(
        ["character_idle_0", "character_idle_1"], 3),
    [SpriteAnimationIndex.CHARACTER_RUN]: new SpriteAnimation(
        ["character_run_0", "character_run_1"], 3),
    [SpriteAnimationIndex.CHARACTER_IDLE_WATER]: new SpriteAnimation(
        ["character_idle_water_0", "character_idle_water_1"], 2),
    [SpriteAnimationIndex.WATER_TILE]: SpriteAnimation.fromSpritesheet("water", 40, 8),
    [SpriteAnimationIndex.VOLCANO]: SpriteAnimation.fromSpritesheet("volcano", 13, 2.5),
}

export { SpriteAnimationIndex, animationsCodex };
