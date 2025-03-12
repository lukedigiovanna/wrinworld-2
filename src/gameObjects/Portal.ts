import { spriteRenderer } from "../renderers";
import { Item } from "../items";
import { GameObjectFactory, GameObject } from "./index";
import { Vector, MathUtils } from "../utils";
import { Hitbox, ParticleEmitter, Health, HealthBarDisplayMode } from "../components";
import { EnemyFactory, EnemyIndex } from "./Enemy";

const PORTAL_ACTIVE_RADIUS = 6;

interface PortalSpawnPack {
    lowerBound: number;
    upperBound: number;
    enemyIndex: EnemyIndex;
}

interface PortalProperties {
    lowerBoundCooldown: number;
    upperBoundCooldown: number;
    maxEnemies: number;
    packs: PortalSpawnPack[];
}

const PortalFactory: GameObjectFactory = (properties: PortalProperties, position: Vector) => {
    const portal = new GameObject();
    portal.renderer = spriteRenderer("portal");
    portal.position.set(position);
    portal.scale.scale(4);
    portal.addComponent(Hitbox);
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
    ));
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
                if (distanceToPlayer < PORTAL_ACTIVE_RADIUS) {
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
        const data: any = {
            cooldown: properties.lowerBoundCooldown,
            enemiesSpawned: 0,
            lastSpawnedTime: undefined,
        };
        return {
            id: "portal-spawner",
            start() {
                data.lastSpawnedTime = gameObject.age;
            },
            update(dt) {
                if (data.enemiesSpawned >= properties.maxEnemies) {
                    data.lastSpawnedTime = gameObject.game.time;
                    return;
                }
                const elapsedTime = gameObject.game.time - data.lastSpawnedTime;
                if (elapsedTime >= data.cooldown) {
                    const pack = MathUtils.randomChoice(properties.packs);
                    let packSize = MathUtils.randomInt(pack.lowerBound, pack.upperBound);
                    if (packSize + data.enemiesSpawned > properties.maxEnemies) {
                        packSize = properties.maxEnemies - data.enemiesSpawned;
                    }
                    for (let i = 0; i < packSize; i++) {
                        const enemy = EnemyFactory(
                            gameObject.position, pack.enemyIndex
                        );
                        const physics = enemy.getComponent("physics");
                        if (physics) {
                            physics.data.impulse.add(MathUtils.randomVector(7));
                        }
                        const portalTracker = enemy.getComponent("portal-tracker");
                        if (portalTracker) {
                            portalTracker.data.portal = this;
                        }
                        gameObject.game.addGameObject(enemy);
                    }
                    data.enemiesSpawned += packSize;
                    data.lastSpawnedTime = gameObject.game.time;
                    data.cooldown = MathUtils.random(properties.lowerBoundCooldown, properties.upperBoundCooldown);
                }

                console.log(data.enemiesSpawned);
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

export { PortalFactory, PORTAL_ACTIVE_RADIUS };
export type { PortalSpawnPack, PortalProperties };
