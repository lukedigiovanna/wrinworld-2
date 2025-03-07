import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";

const Health: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        hp: 20,
        maximumHP: 20,
        regenerationRate: 0,
        showHealthBar: true
    }
    return {
        id: "health",
        update(dt) {
            if (this.data.hp <= 0) {
                gameObject.destroy();
            }
        },
        render(camera) {
            if (!data.showHealthBar) {
                return;
            }
            const topMargin = 0.2;
            const barWidth = Math.abs(gameObject.scale.x);
            const barHeight = 0.2;
            const padding = 0.025;
            camera.setFillColor("black");
            camera.fillRect(
                gameObject.position.x, 
                gameObject.position.y + gameObject.scale.y / 2 + topMargin, 
                barWidth, barHeight);
            camera.setFillColor("lime");
            const realWidth = barWidth * data.hp / data.maximumHP - padding * 2;
            camera.fillRect(
                gameObject.position.x - barWidth / 2 + padding + realWidth / 2, 
                gameObject.position.y + gameObject.scale.y / 2 + topMargin, 
                realWidth - 0.1, 0.15)
        },
        data
    }
}

export { Health };