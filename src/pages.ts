import { Game } from "./game";
import settings from "./settings";
import { ShaderProgram } from "./shader";
import { fragmentShaderCode, vertexShaderCode } from "./shaderCode";
import { loadAssets } from "./loadAssets";

enum PageIndex {
    GAME,
    MAIN,
}

interface Page {
    htmlFile: string;
    load: () => Promise<void>;
    unload: () => void;
}

class GamePage implements Page {
    public readonly htmlFile = "game.html";

    public readonly GAME_TICK_RATE = 60;
    public readonly GAME_TICK_PERIOD = 1 / this.GAME_TICK_RATE;

    private game?: Game;
    private lastTime = 0;
    private fpsAverage = 0;
    private readonly fpsSamples = 5;
    private accumulator = 0;

    private canvas?: HTMLCanvasElement;
    private gl: WebGLRenderingContext | null = null;
    private shaderProgram?: ShaderProgram;

    private terminate = false;

    private mainLoop() {
        if (this.terminate) {
            this.shaderProgram?.delete();
            return;
        }

        if (!this.game || !this.canvas || !this.gl || !this.shaderProgram) {
            throw Error("Cannot run GamePage.mainLoop without canvas, gl, or shaderProgram");
        }

        const nowTime = new Date().getTime();
        const dt = (nowTime - this.lastTime) / 1000;
        this.fpsAverage = (this.fpsAverage * (this.fpsSamples - 1) + (1.0 / dt)) / this.fpsSamples;
        this.lastTime = nowTime;
        
        this.accumulator += dt;
        // Don't allow accumulator to exceed a second of elapsed time -- too much of a jump
        this.accumulator = Math.min(1, this.accumulator);
        while (this.accumulator >= this.GAME_TICK_PERIOD) {
            this.game.preUpdate();
            this.game.update(this.GAME_TICK_PERIOD);
            this.accumulator -= this.GAME_TICK_PERIOD;
        }

        this.game.draw();

        if (settings.showFPS) {
            $("#debug-info").css("visibility", "visible");
            $("#fps").text(Math.round(1 / dt));
            $("#objs").text(this.game.totalObjects);
            $("#active-objs").text(this.game.totalActiveObjects);
        }
        else {
            $("#debug-info").css("visibility", "hidden");
        }

        window.requestAnimationFrame(this.mainLoop.bind(this));
    }

    public async load() {
        this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;    
        this.gl = this.canvas.getContext('webgl', { antialias: false });
        if (!this.gl) {
            throw Error("Fatal: failed to get context");
        }

        await loadAssets(this.gl);

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        window.onresize = () => {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        this.shaderProgram = new ShaderProgram(this.gl, vertexShaderCode, fragmentShaderCode);

        this.shaderProgram.use();
        
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);  

        this.game = new Game(this.canvas, this.gl, this.shaderProgram);

        $("button#quit-game").on("click", () => {
            loadPage(PageIndex.MAIN);
        });

        console.log("[starting main game loop]");

        this.lastTime = new Date().getTime();
        this.terminate = false;
        window.requestAnimationFrame(this.mainLoop.bind(this));
    }

    public unload() {
        this.terminate = true;
    }
}

class MainPage implements Page {
    public readonly htmlFile = "main.html";

    async load() {
        $("button#start-game").on("click", () => {
            loadPage(PageIndex.GAME);
        });
    }

    unload() {

    }
}

const pages: Record<PageIndex, Page> = {
[PageIndex.GAME]: new GamePage(),
[PageIndex.MAIN]: new MainPage(),
};

let currentPage: PageIndex | undefined = undefined;

async function loadPage(pageIndex: PageIndex) {
    if (pageIndex === currentPage) {
        return;
    }
    if (currentPage !== undefined) {
        console.log(`[unloading page ${currentPage}]`)
        pages[currentPage].unload();
    }
    console.log(`[loading page ${pageIndex}]`);
    const page = pages[pageIndex];
    const response = await fetch(page.htmlFile);
    const html = await response.text();
    $("#root").html(html);
    await page.load();
    currentPage = pageIndex;
}

export { PageIndex, loadPage };
