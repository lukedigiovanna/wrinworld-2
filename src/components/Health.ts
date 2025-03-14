import { getSound } from "../soundLoader";
import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";

enum HealthBarDisplayMode {
    NONE,
    ON_HIT,
    ACTIVE,
}

const Health: ComponentFactory = (gameObject: GameObject) => {
    const data: any = {
        hp: 20,
        maximumHP: 20,
        regenerationRate: 0,
        healthBarDisplayMode: HealthBarDisplayMode.NONE,
        timeLastShowedHealthBar: -999,
        damageSoundEffectID: undefined,
        deathSoundEffectID: undefined,
        barColor: [0, 255, 0],
        initializeHealth(hp: number) {
            this.hp = hp;
            this.maximumHP = hp;
        },
        heal(amount: number) {
            if (this.hp + amount > this.maximumHP) {
                amount = this.maximumHP - this.hp;
            }
            this.hp += amount;
            if (this.healthBarDisplayMode !== HealthBarDisplayMode.NONE) {
                this.timeLastShowedHealthBar = gameObject.game.time;
            }
            return amount;
        },
        damage(amount: number) {
            if (data.damageSoundEffectID) {
                getSound(data.damageSoundEffectID).play();
            }
            this.hp = Math.max(0, this.hp - amount);
            if (this.healthBarDisplayMode !== HealthBarDisplayMode.NONE) {
                this.timeLastShowedHealthBar = gameObject.game.time;
            }
        }
    }
    return {
        id: "health",
        update(dt) {
            if (this.data.hp <= 0) {
                if (data.deathSoundEffectID) {
                    getSound(data.deathSoundEffectID).play();
                }
                gameObject.destroy();
            }
            this.data.hp += this.data.regenerationRate * dt;
            if (this.data.healthBarDisplayMode === HealthBarDisplayMode.ACTIVE) {
                this.data.timeLastShowedHealthBar = gameObject.game.time;
            }
        },
        render(camera) {
            const showHealthBarPeriod = 1.5;
            const timeSinceShowed = gameObject.game.time - data.timeLastShowedHealthBar;
            const opacity = timeSinceShowed === 0 ? 1 : 4 / timeSinceShowed - 4 / showHealthBarPeriod;
            if (opacity <= 0) {
                return;
            }
            const topMargin = 0.2;
            const barWidth = Math.abs(gameObject.scale.x);
            const barHeight = 0.1;
            const padding = 0.025;
            camera.setFillColor(`rgba(0,0,0,${opacity})`);
            camera.fillRect(
                gameObject.position.x, 
                gameObject.position.y + gameObject.scale.y / 2 + topMargin, 
                barWidth, barHeight);
            camera.setFillColor(`rgba(
                ${data.barColor[0]},
                ${data.barColor[1]},
                ${data.barColor[2]},
                ${opacity})`);
            const realWidth = barWidth * data.hp / data.maximumHP - padding * 2;
            camera.fillRect(
                gameObject.position.x - barWidth / 2 + padding + realWidth / 2, 
                gameObject.position.y + gameObject.scale.y / 2 + topMargin, 
                realWidth, barHeight - padding * 2)
        },
        data
    }
}

export { Health, HealthBarDisplayMode };