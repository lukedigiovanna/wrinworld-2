import { spriteRenderer } from "../renderers";
import { GameObjectFactory, GameObject } from "./index";
import { Vector, MathUtils, NumberRange } from "../utils";
import { ParticleEmitter, Health, HealthBarDisplayMode } from "../components";
import { EnemyFactory, EnemyIndex } from "./Enemy";
import { enemiesCodex } from "../enemies";
import { getSound } from "../soundLoader";

const PORTAL_ACTIVE_RADIUS = 6;

interface PortalSpawnPack {
    packSizeRange: NumberRange; // Range of possible spawn pack sizes
    cooldownRange: NumberRange; // Range of time to wait between spawns
    maxEnemies: number; // Max active enemies of this type at once
    enemyIndex: EnemyIndex; // Type of enemy to spawn in this pack
}

interface PortalProperties {
    difficulty?: number; // 0/undefined means portal can spawn anywhere, higher number means portal can only spawn further in the level
    health: number;
    packs: PortalSpawnPack[];
}

const PortalFactory: GameObjectFactory = (properties: PortalProperties, position: Vector) => {
    const portal = new GameObject();
    portal.renderer = spriteRenderer("portal");
    portal.position.set(position);
    portal.scale.scale(4);
    portal.addComponent(ParticleEmitter(
        {
            spriteID: () => "portal_particle",
            rate: () => 16,
            size: () => new Vector(0.35, 0.35),
            spawnBoxSize: () => Vector.zero(),
            rotation: () => MathUtils.randomAngle(),
            velocity: () => MathUtils.randomVector(MathUtils.random(1, 1.5)),
            lifetime: () => MathUtils.random(0.3, 1.2)
        }
    ));
    const enemyParticles = properties.packs.map(pack => enemiesCodex.get(pack.enemyIndex).particleID).filter(p => p !== undefined);
    if (enemyParticles.length > 0) {
        portal.addComponent(ParticleEmitter(
            {
                spriteID: () => MathUtils.randomChoice(enemyParticles),
                size: () => new Vector(0.25, 0.25),
                spawnBoxSize: () => Vector.zero(),
                rotation: () => MathUtils.randomAngle(),
                velocity: () => MathUtils.randomVector(MathUtils.random(1, 1.5)),
                lifetime: () => MathUtils.random(0.3, 1.2)
            },
            "enemy-particles"
        ));
    }
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
                    particles?.data.emit();
                getSound("portal_break").play();
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
            cooldowns: [],
            enemiesSpawned: [],
            lastSpawnedTimes: [],
        };
        return {
            id: "portal-spawner",
            start() {
                for (let i = 0; i < properties.packs.length; i++) {
                    data.cooldowns.push(properties.packs[i].cooldownRange.random());
                    data.enemiesSpawned.push(0);
                    data.lastSpawnedTimes.push(gameObject.age);
                }
            },
            update(dt) {
                for (let i = 0; i < properties.packs.length; i++) {
                    const pack = properties.packs[i];
                    const enemiesSpawned = data.enemiesSpawned[i];
                    if (enemiesSpawned >= pack.maxEnemies) {
                        data.lastSpawnedTimes[i] = gameObject.game.time;
                    }
                    const cooldown = data.cooldowns[i];
                    const lastSpawnedTime = data.lastSpawnedTimes[i];
                    const elapsedTime = gameObject.game.time - lastSpawnedTime;
                    if (elapsedTime < cooldown) {
                        continue;
                    }
                    // Do the spawning
                    let packSize = pack.packSizeRange.randomInt();
                    if (packSize + enemiesSpawned > pack.maxEnemies) {
                        packSize = pack.maxEnemies - enemiesSpawned;
                    }
                    for (let j = 0; j < packSize; j++) {
                        const enemy = EnemyFactory(
                            gameObject.position, pack.enemyIndex
                        );
                        const physics = enemy.getComponent("physics");
                        if (physics) {
                            physics.data.impulse.add(MathUtils.randomVector(6));
                        }
                        const portalTracker = enemy.getComponent("portal-tracker");
                        if (portalTracker) {
                            portalTracker.data.portal = this;
                            portalTracker.data.index = i;
                        }
                        gameObject.game.addGameObject(enemy);
                    }
                    data.enemiesSpawned[i] += packSize;
                    data.lastSpawnedTimes[i] = gameObject.game.time;
                    data.cooldowns[i] = pack.cooldownRange.random();
                }
            },
            data
        }
    });

    const health = portal.addComponent(Health);
    health.data.initializeHealth(properties.health);
    health.data.barColor = [0, 225, 255];
    health.data.healthBarDisplayMode = HealthBarDisplayMode.NONE;

    portal.tag = "portal";
    return portal;
}

export { PortalFactory, PORTAL_ACTIVE_RADIUS };
export type { PortalSpawnPack, PortalProperties };
