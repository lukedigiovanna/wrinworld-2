import { spriteRenderer } from "../renderers";
import { Item } from "../items";
import { GameObjectFactory, GameObject } from "./index";
import { Vector, MathUtils } from "../utils";
import { Hitbox, ParticleEmitter, Health, HealthBarDisplayMode } from "../components";
import { EnemyFactory, EnemyIndex } from "./Enemy";

const PortalFactory: GameObjectFactory = (position: Vector) => {
    const portal = new GameObject();
    portal.renderer = spriteRenderer("portal");
    portal.position.set(position);
    portal.scale.scale(4);
    portal.addComponent(Hitbox)
    portal.addComponent(ParticleEmitter(
        {
            spriteID: () => "portal_particle",
            rate: () => 16,
            size: () => new Vector(0.35, 0.35),
            spawnBoxSize: () => Vector.zero(),
            rotation: () => MathUtils.random(0, Math.PI * 2),
            velocity: () => MathUtils.randomVector(MathUtils.random(1, 1.5)),
            lifetime: () => MathUtils.random(0.3, 1.2)
        }
    ))
    portal.addComponent((gameObject: GameObject) => {
        const data: any = {
            health: undefined,
        };
        return {
            id: "portal-effects",
            start() {
                this.data.health = gameObject.getComponent("health");
            },
            destroy() {
                const particles = gameObject.getComponent("particle-emitter");
                for (let i = 0; i < 50; i++)
                particles?.data.emit()
            },
            update(dt) {
                gameObject.rotation = gameObject.age * 3;
                const distanceToPlayer = Vector.subtract(gameObject.position, gameObject.game.player.position).magnitude;
                if (distanceToPlayer < 5) {
                    this.data.health.data.healthBarDisplayMode = HealthBarDisplayMode.ACTIVE;
                }
                else {
                    this.data.health.data.healthBarDisplayMode = HealthBarDisplayMode.NONE;
                }
            },
            data,
        }
    });
    portal.addComponent((gameObject: GameObject) => {
        const data = {
            timer: 0,
            rate: 0.2
        }
        return {
            id: "portal-spawner",
            update(dt) {
                data.timer += dt;
                if (data.timer > 1 / data.rate) {
                    data.timer -= 1 / data.rate;
                    const enemy = EnemyFactory(
                        gameObject.position, MathUtils.randomChoice([
                            EnemyIndex.MINION, EnemyIndex.SLIME, EnemyIndex.ZOMBIE
                        ])
                    );
                    const physics = enemy.getComponent("physics");
                    if (physics) {
                        physics.data.impulse.add(MathUtils.randomVector(7));
                    }
                    gameObject.game.addGameObject(enemy);
                }
            },
            data
        }
    });

    const health = portal.addComponent(Health);
    health.data.initializeHealth(100);
    health.data.barColor = [0, 255, 255];
    health.data.healthBarDisplayMode = HealthBarDisplayMode.NONE;

    portal.tag = "portal";
    return portal;
}

export { PortalFactory };