import { getSound } from "../soundLoader";
import { GameObject } from "../gameObjects/index";
import { ComponentFactory, Physics } from "./index";
import { Color, MathUtils } from "../utils";
import { textRenderer } from "../renderers";

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
        resistance: 0, // percent damage avoided
        invincibleCount: 0,
        lastHitTime: -999,
        healthBarDisplayMode: HealthBarDisplayMode.NONE,
        timeLastShowedHealthBar: -999,
        damageSoundEffectID: undefined,
        deathSoundEffectID: undefined,
        barColor: Color.GREEN,
        initializeHealth(hp: number) {
            this.hp = hp;
            this.maximumHP = hp;
        },
        setMaximumHP(maximumHP: number) {
            this.maximumHP = maximumHP;
            this.hp = Math.min(this.hp, this.maximumHP);
        },
        // Returns the amount actually healed
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
            if (this.invincibleCount > 0) {
                return;
            }
            if (this.damageSoundEffectID) {
                getSound(this.damageSoundEffectID).play();
            }
            amount *= (1 - this.resistance);
            this.hp = Math.max(0, this.hp - amount);
            this.lastHitTime = gameObject.game.time;
            if (this.healthBarDisplayMode !== HealthBarDisplayMode.NONE) {
                this.timeLastShowedHealthBar = gameObject.game.time;
            }
            
            const damageMarker = new GameObject();
            damageMarker.renderer = textRenderer("pixel_font", `${Math.floor(amount)}`);
            damageMarker.position.set(gameObject.position);
            damageMarker.zIndex = 1000;
            damageMarker.lifespan = 0.8;
            const physics = damageMarker.addComponent(Physics);
            physics.data.gravity = 100;
            physics.data.velocity.setComponents(MathUtils.random(-15, 15), 40);
            damageMarker.addComponent((gameObject) => {
                return {
                    id: "fade",
                    update(dt) {
                        gameObject.color = new Color(1, 0.1, 0.1, 1 - Math.pow(gameObject.age / gameObject.lifespan!, 6));
                    },
                }
            });
            gameObject.game.addGameObject(damageMarker);
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
            this.data.hp = Math.min(this.data.maximumHP, this.data.hp + this.data.regenerationRate * dt);
            if (this.data.healthBarDisplayMode === HealthBarDisplayMode.ACTIVE) {
                this.data.timeLastShowedHealthBar = gameObject.game.time;
            }

            const timeSinceLastHit = gameObject.game.time - this.data.lastHitTime;
            if (timeSinceLastHit < 0.25) {
                const c = (16 * (timeSinceLastHit - 0.125));
                const f = 0.8 / (c * c + 1);
                gameObject.color = new Color(1, 1 - f, 1 - f, 1);
            }
            else {
                gameObject.color = Color.WHITE;
            }
        },
        render(camera) {
            const showHealthBarPeriod = 1.5;
            const timeSinceShowed = gameObject.game.time - data.timeLastShowedHealthBar;
            const opacity = timeSinceShowed === 0 ? 1 : 4 / timeSinceShowed - 4 / showHealthBarPeriod;
            if (opacity <= 0) {
                return;
            }
            const topMargin = 3;
            // Includes the width of the border
            const barWidth = Math.abs(gameObject.scale.x);
            const barHeight = 3;
            const borderWidth = 1;
            camera.color = new Color(0, 0, 0, opacity);
            camera.fillRect(
                gameObject.position.x, 
                gameObject.position.y + gameObject.scale.y / 2 + topMargin, 
                barWidth, barHeight);
            camera.color = new Color(data.barColor.r, data.barColor.g, data.barColor.b, opacity);
            const realWidth = barWidth * data.hp / data.maximumHP - borderWidth * 2;
            camera.fillRect(
                gameObject.position.x - barWidth / 2 + borderWidth + realWidth / 2, 
                gameObject.position.y + gameObject.scale.y / 2 + topMargin, 
                realWidth, barHeight - borderWidth * 2)
        },
        data
    }
}

export { Health, HealthBarDisplayMode };