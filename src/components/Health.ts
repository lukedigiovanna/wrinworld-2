import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";

const Health: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        hp: 20,
        maximumHP: 20,
        regenerationRate: 0,
        showHealthBar: true,
        timeLastShowedHealthBar: -999,
        heal(amount: number) {
            this.hp = Math.min(this.maximumHP, this.hp + amount);
            this.timeLastShowedHealthBar = gameObject.game.time;
        },
        damage(amount: number) {
            this.hp = Math.max(0, this.hp - amount);
            this.timeLastShowedHealthBar = gameObject.game.time;
        }
    }
    return {
        id: "health",
        update(dt) {
            if (this.data.hp <= 0) {
                gameObject.destroy();
            }
        },
        render(camera) {
            const showHealthBarPeriod = 1.5;
            const timeSinceShowed = gameObject.game.time - data.timeLastShowedHealthBar;
            if (!data.showHealthBar || 
                timeSinceShowed > showHealthBarPeriod) {
                return;
            }
            const opacity = 4 / timeSinceShowed - 4 / showHealthBarPeriod;
            const topMargin = 0.2;
            const barWidth = Math.abs(gameObject.scale.x);
            const barHeight = 0.1;
            const padding = 0.025;
            camera.setFillColor(`rgba(0,0,0,${opacity})`);
            camera.fillRect(
                gameObject.position.x, 
                gameObject.position.y + gameObject.scale.y / 2 + topMargin, 
                barWidth, barHeight);
            camera.setFillColor(`rgba(0,255,0,${opacity})`);
            const realWidth = barWidth * data.hp / data.maximumHP - padding * 2;
            camera.fillRect(
                gameObject.position.x - barWidth / 2 + padding + realWidth / 2, 
                gameObject.position.y + gameObject.scale.y / 2 + topMargin, 
                realWidth - 0.1, barHeight - padding * 2)
        },
        data
    }
}

export { Health };