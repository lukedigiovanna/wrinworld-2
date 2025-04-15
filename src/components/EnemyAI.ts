import { MeleeAttackIndex, meleeAttacksCodex } from "../meleeAttacks";
import { Component, ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import { Color, MathUtils, Vector } from "../utils";
import { fireMelee, WeaponIndex } from "../weapons";

// system: when enemies are far they should wander
// .       enemy has a "sight" distance: if they have line of sight to player they follow
// .       enemy has a "sense" distance: if their target is within a distance, regardless of obstacles they will track
// .

const states = ["idle", "search", "follow", "attack", "slime_windup_attack", "slime_throw_self"] as const;
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
                return "slime_windup_attack";
            }
            data.targetPosition = data.playerHitboxCenter;
            return "follow";
        },
        slime_windup_attack(gameObject, dt, data) {
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
            return "slime_windup_attack";
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
            if (data.distanceToPlayer < 40) {
                return "slime_windup_attack";
            }
            data.targetPosition = data.playerHitboxCenter;
            return "follow";
        },
    },
    movementSpeed: 36,
};

const wretchedSkeletonAIConfig: EnemyAIConfig = {
    functions: {

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
