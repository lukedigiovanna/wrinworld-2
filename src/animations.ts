enum SpriteAnimationIndex {
    CHARACTER_IDLE
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
        console.log(time, index);
        return this.frames[index];
    }
}

const animationsCodex: Record<SpriteAnimationIndex, SpriteAnimation> = {
    [SpriteAnimationIndex.CHARACTER_IDLE]: new SpriteAnimation(
        ["character_idle_0", "character_idle_1"], 3),
}

export { SpriteAnimationIndex, animationsCodex };
