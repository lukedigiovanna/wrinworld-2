enum SpriteAnimationIndex {
    CHARACTER_IDLE,
    CHARACTER_RUN,
    CHARACTER_IDLE_WATER,
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
}

const animationsCodex: Record<SpriteAnimationIndex, SpriteAnimation> = {
    [SpriteAnimationIndex.CHARACTER_IDLE]: new SpriteAnimation(
        ["character_idle_0", "character_idle_1"], 3),
    [SpriteAnimationIndex.CHARACTER_RUN]: new SpriteAnimation(
        ["character_run_0", "character_run_1"], 3),
    [SpriteAnimationIndex.CHARACTER_IDLE_WATER]: new SpriteAnimation(
        ["character_idle_water_0", "character_idle_water_1"], 2),
}

export { SpriteAnimationIndex, animationsCodex };
