import { MeleeAttackIndex, meleeAttacksCodex } from "../meleeAttacks";
import { Component, ComponentFactory, ParticleLayer } from "./index";
import { GameObject } from "../gameObjects";
import { Color, MathUtils, Vector } from "../utils";
import { fireMelee, fireProjectile, WeaponIndex } from "../weapons";
import { projectilesCodex, ProjectileIndex } from "../projectiles";

// system: when enemies are far they should wander
// .       enemy has a "sight" distance: if they have line of sight to player they follow
// .       enemy has a "sense" distance: if their target is within a distance, regardless of obstacles they will track
// .

const states = ["idle", "set_search_position", "search", "follow", "attack_windup", "attack", "slime_throw_self"] as const;
type EnemyAIState = typeof states[number];

class EnemyAIData {
    private self: GameObject;
    private state: EnemyAIState = "idle";
    private startTimeInState: number;
    private config: EnemyAIConfig;
    public targetPosition: Vector | undefined;
    public attacking: boolean = false;

    private _physics: Component;
    private _movementData: Component;
    private hitbox: Component;

    constructor(self: GameObject, config: EnemyAIConfig) {
        this.self = self;
        this.config = config;
        
        this._physics = self.getComponent("physics");

        this._movementData = self.getComponent("movement-data");
        this._movementData.data.baseSpeed = config.movementSpeed;
        
        this.hitbox = self.getComponent("hitbox");

        this.startTimeInState = self.game.time;
    }

    public get playerHitboxCenter() {
        return Vector.add(
            this.self.game.player.position,
            this.self.game.player.getComponent("hitbox").data.boxOffset
        );
    }

    public get distanceToPlayer() {
        return this.self.position.distanceTo(
            this.playerHitboxCenter
        );
    }

    public get hasLineOfSightToPlayer() {
        return this.self.raycastPhysicalColliders(
            this.self.position.directionTowards(
                Vector.add(
                    this.self.game.player.position,
                    this.self.game.player.getComponent("physical-collider").data.boxOffset
                )
            ), 
            true
        )?.hit === this.self.game.player;
    }

    public get collidingWithPlayer() {
        return this.hitbox.data.collidingWith.has(this.self.game.player);
    }

    public get timeInState() {
        return this.self.game.time - this.startTimeInState;
    }

    public get physics() {
        return this._physics;
    }

    public get movementData() {
        return this._movementData;
    }

    public update(dt: number) {
        if (this.movementData.data.isStunned()) { // No moving/attacking/etc.
            this.targetPosition = undefined;
            this._physics.data.velocity.setComponents(0, 0);
            return;
        }

        const newState = this.config.stateFunctions[this.state]?.(this.self, dt, this);
        if (newState !== undefined && newState !== this.state) {
            this.state = newState;
            this.startTimeInState = this.self.game.time;
        }
        if (this.targetPosition) {
            // const modifier = props.customSpeedModifier ? props.customSpeedModifier(gameObject, direction) : 1.0; 
            const direction = this.self.position.directionTowards(this.targetPosition);
            direction.normalize();
            const modifier = this.config.customSpeedModifier ? this.config.customSpeedModifier(this.self) : 1.0;
            direction.scale(this._movementData.data.getSpeed() * modifier);
            this._physics.data.velocity.set(direction);
            
            if (this.self.position.distanceTo(this.targetPosition) < 8) {
                this.targetPosition = undefined;
            }
        }
        else {
            this._physics.data.velocity.setComponents(0, 0);
        }
    }
}

type EnemyAIStateFunction = (gameObject: GameObject, dt: number, data: EnemyAIData) => EnemyAIState;

type EnemyAIStateFunctionMap = {
    [key in EnemyAIState]?: EnemyAIStateFunction;
}

interface EnemyAIConfig {
    stateFunctions: EnemyAIStateFunctionMap,
    movementSpeed: number;
    customSpeedModifier?: (gameObject: GameObject) => number;
}

function basicIdle(followDistance: number): EnemyAIStateFunction {
    return (gameObject: GameObject, dt: number, data: EnemyAIData) => {
        if (data.distanceToPlayer < 200 && data.hasLineOfSightToPlayer) {
            return "follow";
        }
        if (Math.random() < dt * 0.2) {
            data.targetPosition = Vector.add(gameObject.position, MathUtils.randomVector(MathUtils.random(16, 40)));
        }
        return "idle";
    }
}

const slimeAIConfig: EnemyAIConfig = {
    stateFunctions: {
        idle: basicIdle(200),
        follow(gameObject, dt, data) {
            if (data.distanceToPlayer > 250 || !data.hasLineOfSightToPlayer) {
                data.targetPosition = undefined;
                return "idle";
            }
            if (data.distanceToPlayer < 50) {
                return "attack_windup";
            }
            data.targetPosition = data.playerHitboxCenter;
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            data.targetPosition = undefined;
            const f = 1 - data.timeInState / 1 * 0.5;
            gameObject.color = new Color(f, f, 1, 1);
            if (data.timeInState > 1) {
                data.physics.data.impulse.add(
                    Vector.scaled(
                        Vector.normalized(gameObject.position.directionTowards(data.playerHitboxCenter)), 
                        112
                    )
                );
                return "slime_throw_self";
            }
            return "attack_windup";
        },
        slime_throw_self(gameObject, dt, data) {
            gameObject.color = new Color(0.5, 0.5, 1, 1);
            if (data.timeInState > 1.0) {
                return "follow";
            }
            if (data.collidingWithPlayer) {
                const magnitude = data.physics.data.impulse.magnitude / 30;
                gameObject.game.player.getComponent("health").data.damage(magnitude);
                gameObject.game.player.getComponent("physics").data.impulse.add(
                    Vector.scaled(
                        Vector.normalized(
                            gameObject.position.directionTowards(gameObject.game.player.position)
                        ),
                        100
                    )
                )
                return "follow";
            }
            return "slime_throw_self"
        }
    },
    movementSpeed: 36,
    customSpeedModifier(gameObject) {
        return (Math.sin(gameObject.age * 5) * 0.5 + 0.5) * 0.9 + 0.1;
    },
}

const minionAIConfig: EnemyAIConfig = {
    stateFunctions: {
        idle: basicIdle(240),
        follow(gameObject, dt, data) {
            if (data.distanceToPlayer > 250 || !data.hasLineOfSightToPlayer) {
                data.targetPosition = undefined;
                return "idle";
            }
            if (data.distanceToPlayer < 24) {
                return "attack_windup";
            }
            data.targetPosition = data.playerHitboxCenter;
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            data.targetPosition = undefined;
            if (data.distanceToPlayer > 36) {
                return "follow";
            }
            const f = 1 - data.timeInState / 1 * 0.5;
            gameObject.color = new Color(1, f, f, 1);
            if (data.timeInState > 1) {
                return "attack";
            }
            return "attack_windup";
        },
        attack(gameObject, dt, data) {
            fireMelee(
                {
                    ...meleeAttacksCodex[MeleeAttackIndex.BASIC],
                    damage: 4,
                    knockback: 32,
                    range: 16
                }, gameObject, data.playerHitboxCenter);
            return "follow";
        }
    },
    movementSpeed: 36,
};

const wretchedSkeletonAIConfig: EnemyAIConfig = {
    stateFunctions: {
        idle: basicIdle(300),
        follow(gameObject, dt, data) {
            if (data.distanceToPlayer > 300) {
                // Still track to last known position
                return "idle";
            }
            if (!data.hasLineOfSightToPlayer) {
                return "set_search_position";
            }
            if (data.distanceToPlayer < 100) {
                return "attack_windup";
            }
            data.targetPosition = data.playerHitboxCenter;
            return "follow";
        },
        set_search_position(gameObject, dt, data) {
            data.targetPosition = Vector.add(gameObject.position, MathUtils.randomVector(32));
            return "search";
        },
        search(gameObject, dt, data) {
            if (data.timeInState > 0.5) {
                return "follow";
            }
            return "search";
        },
        attack_windup(gameObject, dt, data) {
            data.attacking = true;
            if (data.timeInState > 1.5) {
                return "attack";
            }
            data.targetPosition = undefined;
            return "attack_windup";
        },
        attack(gameObject, dt, data) {
            fireProjectile(
                {
                    ...projectilesCodex[ProjectileIndex.ARROW],
                    damage: 6,
                    maxHits: 1,
                }, gameObject, data.playerHitboxCenter);
            data.attacking = false;
            return "set_search_position";
        }
    },
    movementSpeed: 28,
};

const revenantEyeAIConfig: EnemyAIConfig = {
    stateFunctions: {
        idle: basicIdle(300),
        follow(gameObject, dt, data) {
            if (data.distanceToPlayer > 300) {
                // Still track to last known position
                return "idle";
            }
            if (data.distanceToPlayer < 120) {
                return "attack_windup";
            }
            data.targetPosition = data.playerHitboxCenter;
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            if (Math.random() < dt * 0.4) {
                for (let i = 0; i < 24; i++) {
                    const f = MathUtils.random(0.4, 1);
                    const s = MathUtils.randomInt(1, 2);
                    gameObject.game.addPartialParticle({
                        position: gameObject.position.copy(),
                        velocity: MathUtils.randomVector(MathUtils.random(4, 16)),
                        lifetime: MathUtils.random(0.4, 1.2),
                        color: new Color(f, 0.1, 0.2, 1),
                        size: new Vector(s, s),
                        angularVelocity: MathUtils.random(-3, 3),
                        layer: ParticleLayer.ABOVE_OBJECTS
                    });
                }
                gameObject.position.add(MathUtils.randomVector(MathUtils.random(16, 64)));
            }
            if (data.timeInState > 1.25) {
                return "attack";
            }
            data.attacking = true;
            data.targetPosition = undefined;
            return "attack_windup";
        },
        attack(gameObject, dt, data) {
            fireProjectile(
                projectilesCodex[ProjectileIndex.TEAR_DROP], 
                gameObject, 
                data.playerHitboxCenter
            );
            data.attacking = false;
            return "follow";
        }
    },
    movementSpeed: 32,
};

const wraithAIConfig: EnemyAIConfig = {
    stateFunctions: {

    },
    movementSpeed: 44,
}

const EnemyAI: (config: EnemyAIConfig) => ComponentFactory = (config) => {
    return (gameObject) => {
        return {
            id: "enemy-ai",
            data: undefined,
            start() {
                this.data = new EnemyAIData(gameObject, config);
            },
            update(dt) {
                if (gameObject.age < 1.5) {
                    return;
                }
                if (gameObject.game.player.destroyed) {
                    return;
                }
                this.data.update(dt);
            }
        }
    }
}

export { EnemyAI, slimeAIConfig, minionAIConfig, wretchedSkeletonAIConfig, 
         revenantEyeAIConfig, wraithAIConfig };
