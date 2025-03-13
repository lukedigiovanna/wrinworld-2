

class AudioPool {
    private pool: HTMLAudioElement[];
    private index: number;
    
    constructor(url: string, size: number) {
        this.pool = Array.from({ length: size });        
        for (let i = 0; i < size; i++) {
            this.pool[i] = new Audio(url);
        }
        this.index = 0;
    }

    public play() {
        return;
        const audio = this.pool[this.index];
        audio.currentTime = 0;
        audio.play();
        this.index = (this.index + 1) % this.pool.length;
    }
}

const sounds = new Map<string, AudioPool>();

const loadSound = (id: string, url: string, size: number) => {
    return new Promise((resolve, reject) => {
        const sound = new AudioPool(url, size);
        sounds.set(id, sound);
        resolve(sound);
    });
  }
  

const getSound = (id: string): AudioPool => {
    const sound = sounds.get(id);
    if (!sound) {
        throw new Error(`No sound found with id ${id}`);
    }
    return sound;
}

const soundExists = (id: string): boolean => {
  return sounds.has(id);
}

export { loadSound, getSound, soundExists };
