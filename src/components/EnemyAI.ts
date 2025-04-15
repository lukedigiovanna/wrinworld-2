import { MeleeAttackIndex, meleeAttacksCodex } from "../meleeAttacks";
import { Component, ComponentFactory } from "./index";
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

    private _physics: Component;
    private _movementData: Component;

    constructor(self: GameObject, config: EnemyAIConfig) {
        this.self = self;
        this.config = config;
        this._physics = self.getComponent("physics");
        this._movementData = self.getComponent("movement-data");
        this._movementData.data.baseSpeed = config.movementSpeed;
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
            return;
        }

        const newState = this.config.functions[this.state]?.(this.self, dt, this);
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
    functions: EnemyAIStateFunctionMap,
    movementSpeed: number;
    customSpeedModifier?: (gameObject: GameObject) => number;
}

function basicIdle(followDistance: number, changePositionRate: number): EnemyAIStateFunction {
    return (gameObject: GameObject, dt: number, data: EnemyAIData) => {
        if (data.distanceToPlayer < 200 && data.hasLineOfSightToPlayer) {
            return "follow";
        }
        if (Math.random() < dt * 0.1) {
            data.targetPosition = Vector.add(gameObject.position, MathUtils.randomVector(MathUtils.random(16, 40)));
        }
        return "idle";
    }
}

const slimeAIConfig: EnemyAIConfig = {
    functions: {
        idle: basicIdle(200, 0.1),
        follow(gameObject, dt, data) {
            if (data.distanceToPlayer > 250 || !data.hasLineOfSightToPlayer) {
                data.targetPosition = undefined;
                return "idle";
            }
            if (data.distanceToPlayer < 40) {
                return "attack_windup";
            }
            data.targetPosition = data.playerHitboxCenter;
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            data.targetPosition = undefined;
            if (data.timeInState > 0.75) {
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
            if (data.timeInState > 0.5) {
                fireMelee(
                    {
                        ...meleeAttacksCodex.get(MeleeAttackIndex.BASIC),
                        damage: 2,
                        knockback: 40,
                    }, gameObject, data.playerHitboxCenter);
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
    functions: {
        idle: basicIdle(240, 0.1),
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
                    ...meleeAttacksCodex.get(MeleeAttackIndex.BASIC),
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
    functions: {
        idle: basicIdle(300, 0.1),
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
            gameObject.renderer!.data.spriteID = "wretched_skeleton_attack";
            if (data.timeInState > 1.5) {
                return "attack";
            }
            data.targetPosition = undefined;
            return "attack_windup";
        },
        attack(gameObject, dt, data) {
            fireProjectile(projectilesCodex.get(ProjectileIndex.ARROW), gameObject, data.playerHitboxCenter);
            return "search";
        }
    },
    movementSpeed: 28,
};

const revenantEyeAIConfig: EnemyAIConfig = {
    functions: {

    },
    movementSpeed: 32,
};

const wraithAIConfig: EnemyAIConfig = {
    functions: {

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
                this.data.update(dt);
            },
        }
    }
}

export { EnemyAI, slimeAIConfig, minionAIConfig, wretchedSkeletonAIConfig, 
         revenantEyeAIConfig, wraithAIConfig };
