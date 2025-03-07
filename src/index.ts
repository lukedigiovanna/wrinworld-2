const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d") as CanvasRenderingContext2D;

window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

setInterval(() => {
    context.fillStyle = "blue";
    context.fillRect(0, 0, canvas.width, canvas.height);
}, 50);