import { MeleeAttackIndex, meleeAttacksCodex } from "../game/meleeAttacks";
import { Component, ComponentFactory, ParticleLayer } from "./index";
import { EnemyFactory, EnemyIndex, GameObject } from "../gameObjects";
import { Color, Ease, MathUtils, Vector } from "../utils";
import { fireMelee, fireProjectile } from "../game/weapons";
import { projectilesCodex, ProjectileIndex } from "../game/projectiles";
import { StatusEffectIndex } from "../game/statusEffects";

const states = ["idle", "set_search_position", "search", "follow", "attack_windup", "attack", "slime_throw_self", "husk_shake"] as const;
type EnemyAIState = typeof states[number];

class EnemyAIData {
    private self: GameObject;
    private _state: EnemyAIState = "idle";
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
        return this.self.game.player.hitboxCenter;
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

    public set state(newState: EnemyAIState) {
        if (newState !== undefined && newState !== this._state) {
            this._state = newState;
            this.startTimeInState = this.self.game.time;
        }
    }

    public get state() {
        return this._state;
    }

    public update(dt: number) {
        if (this.movementData.data.isStunned()) { // No moving/attacking/etc.
            this.targetPosition = undefined;
            this._physics.data.velocity.setComponents(0, 0);
            return;
        }

        const newState = this.config.stateFunctions[this._state]?.(this.self, dt, this);
        if (newState !== undefined) {
            this.state = newState;
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

    public destroy() {
        this.config.onDestroy?.(this.self, this);
    }
    
    public damage(amount: number) {
        this.config.onDamage?.(this.self, this, amount);
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
    onDestroy?: (gameObject: GameObject, data: EnemyAIData) => void;
    onDamage?: (gameObject: GameObject, data: EnemyAIData, amount: number) => void;
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
                    gameObject.position.directionTowards(gameObject.game.player.position)
                                       .normalized()
                                       .scaled(100)
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

const redSlimeAIConfig: EnemyAIConfig = {
    stateFunctions: {
        idle: basicIdle(200),
        follow(gameObject, dt, data) {
            if (data.distanceToPlayer > 250 || !data.hasLineOfSightToPlayer) {
                data.targetPosition = undefined;
                return "idle";
            }
            if (data.distanceToPlayer < 75) {
                return "attack_windup";
            }
            data.targetPosition = data.playerHitboxCenter;
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            data.targetPosition = undefined;
            const f = 1 - data.timeInState / 1 * 0.75;
            gameObject.color = new Color(1, f, f, 1);
            gameObject.renderer!.data.offset = MathUtils.randomVector(MathUtils.random(0, data.timeInState * 2));
            if (data.timeInState > 1) {
                data.physics.data.impulse.add(
                    Vector.scaled(
                        Vector.normalized(gameObject.position.directionTowards(data.playerHitboxCenter)), 
                        200
                    )
                );
                return "slime_throw_self";
            }
            return "attack_windup";
        },
        slime_throw_self(gameObject, dt, data) {
            gameObject.color = new Color(1, 0.25, 0.25, 1);
            if (data.timeInState > 0.6) {
                if (data.distanceToPlayer < 32) {
                    const damage = (1 - data.distanceToPlayer / 32) * 8;
                    gameObject.game.player.getComponent("health").data.damage(damage);
                    gameObject.game.player.getComponent("physics").data.impulse.add(
                        gameObject.position.directionTowards(gameObject.game.player.position)
                        .normalized()
                        .scaled(100)
                    )
                    gameObject.game.addParticleExplosion(gameObject.position, Color.RED, 32, 32);
                    gameObject.getComponent("essence-dropper").data.disabled = true;
                    gameObject.destroy();
                }
                return "follow";
            }
            return "slime_throw_self"
        }
    },
    movementSpeed: 44,
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
                    chanceOfBreaking: 1
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
            if (data.distanceToPlayer < 100) {
                return "attack_windup";
            }
            data.targetPosition = data.playerHitboxCenter;
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            if (Math.random() < dt * 0.4) {
                gameObject.game.addParticleExplosion(gameObject.position, new Color(0.7, 0.1, 0.2, 1), 16, 24);
                gameObject.position.add(MathUtils.randomVector(MathUtils.random(16, 64)));
            }
            if (data.timeInState > 1.75) {
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
        idle: basicIdle(400),
        follow(gameObject, dt, data) {
            if (data.distanceToPlayer > 420) {
                // Still track to last known position
                return "idle";
            }
            if (data.distanceToPlayer < 160) {
                return "attack_windup";
            }
            data.targetPosition = data.playerHitboxCenter;
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            data.targetPosition = undefined;
            if (Math.random() < dt * 16) {
                const f = MathUtils.random(0, 0.2);
                gameObject.game.addPartialParticle({
                    position: gameObject.position.copy(),
                    layer: ParticleLayer.ABOVE_OBJECTS,
                    color: new Color(f, f, f, 1),
                    scale: MathUtils.random(1, 2),
                    velocity: MathUtils.randomVector(MathUtils.random(2, 14)),
                    angularVelocity: MathUtils.random(-2, 2),
                });
            }
            if (data.timeInState > 3) {
                return "attack";
            }
            return "attack_windup";
        },
        attack(gameObject, dt, data) {
            fireProjectile(projectilesCodex[ProjectileIndex.WRAITH_ATTACK], gameObject, data.playerHitboxCenter);
            return "follow";
        }
    },
    movementSpeed: 44,
}

const groundWormAI: EnemyAIConfig = {
    stateFunctions: {
        idle(gameObject, dt, data) {
            if (Math.random() < dt / 2 || !data.targetPosition || gameObject.position.distanceTo(data.targetPosition) < 4) {
                data.targetPosition = gameObject.position.plus(MathUtils.randomVector(MathUtils.random(16, 64)));
            }
            if (Math.random() < dt * 2 && data.distanceToPlayer < 64) {
                data.targetPosition = data.playerHitboxCenter;
            }
            gameObject.getComponent("health").data.invincibleCount = 1;
            gameObject.renderer!.data.hidden = true;
            gameObject.castsShadow = false;
            if (Math.random() < dt * 8) {
                gameObject.game.addPartialParticle({
                    position: gameObject.position.copy(),
                    spriteID: "cracks_particle"
                });
            }
            if (Math.random() < dt * (0.25 + 1 - Ease.linear(data.distanceToPlayer / 64))) {
                return "attack_windup";
            }
            return "idle";
        },
        attack_windup(gameObject, dt, data) {
            data.targetPosition = undefined;
            gameObject.getComponent("health").data.invincibleCount = 0;
            gameObject.renderer!.data.hidden = false;
            gameObject.castsShadow = true;
            gameObject.getComponent("physics").data.angularVelocity = 6;
            if (data.timeInState > 0.25) {
                return "attack";
            }
            if (Math.random() < dt / 2) {
                return "idle";
            }
            return "attack_windup";
        },
        attack(gameObject, dt, data) {
            if (data.collidingWithPlayer) {
                gameObject.game.player.getComponent("health").data.damage(1);
            }
            return "attack_windup";
        }
    },
    movementSpeed: 100
}

const evilBunnyAI: EnemyAIConfig = {
    stateFunctions: {
        idle: basicIdle(300),
        follow(gameObject, dt, data) {
            if (data.distanceToPlayer > 320) {
                return "idle";
            }
            if (Math.random() < dt / 6) {
                return "attack_windup";
            }
            if (data.distanceToPlayer < 54) {
                data.targetPosition = data.playerHitboxCenter.plus(
                                            data.playerHitboxCenter.directionTowards(gameObject.position)
                                                                   .normalized()
                                                                   .scaled(54));
            }
            else {
                const towards = gameObject.position.directionTowards(data.playerHitboxCenter).normalized()
                const normal = towards.getNormal();
                const p = Ease.linear((data.distanceToPlayer - 64) / 64);
                data.targetPosition = gameObject.position.plus(
                    Vector.add(
                        normal.scaled((1 - p) * 10), 
                        towards.scaled(p * 10)
                    ));
            }
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            data.targetPosition = undefined;
            data.attacking = true;
            if (data.timeInState >= 1.5) {
                return "attack";
            }
            return "attack_windup";
        },
        attack(gameObject, dt, data) {
            data.attacking = false;
            const projectile = MathUtils.randomWeightedChoice(
                [ProjectileIndex.PLAYING_CARD, ProjectileIndex.DOVE, ProjectileIndex.RUBBER_CHICKEN], 
                [3, 1, 1]
            ) as ProjectileIndex;
            fireProjectile(projectilesCodex[projectile], gameObject, data.playerHitboxCenter);
            return "follow";
        }
    },
    customSpeedModifier(gameObject) {
        return Math.pow(Math.sin(gameObject.age * 6), 4);
    },
    movementSpeed: 110,
};

const fungalHuskAI: EnemyAIConfig = {
    stateFunctions: {
        idle: basicIdle(300),
        follow(gameObject, dt, data) {
            data.targetPosition = data.playerHitboxCenter;
            if (data.distanceToPlayer < 32) {
                return "attack_windup";
            }
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            if (data.distanceToPlayer > 48) {
                data.attacking = false;
                return "follow";
            }
            data.targetPosition = undefined;
            if (data.timeInState > 1) {
                return "attack";
            }
            data.attacking = true;
            return "attack_windup";
        },
        attack(gameObject, dt, data) {
            data.attacking = false;
            fireMelee({
                ...meleeAttacksCodex[MeleeAttackIndex.BASIC],
                damage: 10,
                range: 24,
                knockback: 50,
                onHit(gameObject, data, hit) {
                    hit.getComponentOptional("status-effect-manager")?.data?.applyEffect(StatusEffectIndex.POISON, 1, 2);
                },
            }, gameObject, data.playerHitboxCenter);
            return "follow";
        },
        husk_shake(gameObject, dt, data) {
            if (data.timeInState > 0.25) {
                return "follow";
            }
            gameObject.renderer!.data.offset = MathUtils.randomVector(1);
            return "husk_shake";
        }
    },
    onDestroy(gameObject, data) {
        if (data.distanceToPlayer < 48) {
            gameObject.game.player.getComponent("status-effect-manager").data.applyEffect(StatusEffectIndex.POISON, 1, (1 - data.distanceToPlayer / 48) * 5);
        }
        gameObject.game.addParticleExplosion(gameObject.position, Color.WHITE, 32, 12, "husk_particle", 1);
    },
    onDamage(gameObject, data, amount) {
        if (Math.random() < amount / 10) {
            data.state = "husk_shake";
            const spirit = EnemyFactory(gameObject.position, EnemyIndex.FUNGAL_SPIRIT)
            spirit.getComponent("physics").data.impulse.add(MathUtils.randomVector(MathUtils.random(48, 64)));
            gameObject.game.addGameObject(spirit);
        }
    },
    movementSpeed: 10
};

const fungalSpiritAI: EnemyAIConfig = {
    stateFunctions: {
        idle: basicIdle(200),
        follow(gameObject, dt, data) {
            if (data.distanceToPlayer > 200) {
                return "idle";
            }
            data.targetPosition = data.playerHitboxCenter;
            if (data.distanceToPlayer < 20) {
                return "attack_windup";
            }
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            data.targetPosition = data.playerHitboxCenter;
            if (data.timeInState > 0.5) {
                return "attack";
            }
            return "attack_windup";
        },
        attack(gameObject, dt, data) {
            if (data.collidingWithPlayer) {
                gameObject.game.player.getComponent("health").data.damage(2);
            }
            return "follow";
        }
    },
    movementSpeed: 60
}

const corruptedDeerAI: EnemyAIConfig = {
    stateFunctions: {
        idle: basicIdle(300),
        follow(gameObject, dt, data) {
            if (data.hasLineOfSightToPlayer && Math.random() < dt / 8) {
                return "attack_windup";
            }
            if (data.distanceToPlayer < 100) {
                data.targetPosition = data.playerHitboxCenter.plus(
                                            data.playerHitboxCenter.directionTowards(gameObject.position)
                                                                   .normalized()
                                                                   .scaled(100));
            }
            else if (Math.random() < dt) {
                data.targetPosition = gameObject.position.plus(MathUtils.randomVector(MathUtils.random(16, 72)));
            }
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            data.attacking = true;
            if (Math.random() < dt * 4) {
                gameObject.game.addPartialParticle({
                    position: gameObject.position.copy(),
                    spriteID: "husk_particle",
                    velocity: MathUtils.randomVector(MathUtils.random(2, 24)),
                    layer: ParticleLayer.ABOVE_OBJECTS
                });
            }
            gameObject.renderer!.data.offset = MathUtils.randomVector(1);
            if (data.timeInState > 1.5) {
                const distance = data.distanceToPlayer;
                data.targetPosition = gameObject.position.plus(
                    gameObject.position.directionTowards(data.playerHitboxCenter)
                                       .normalized()
                                       .scaled(distance + 64)
                );
                gameObject.getComponent("movement-data").data.miscellaneousModifier += 3;
                gameObject.getComponent("physical-collider").data.ignoreCollisionWith.add("player");
                return "attack";
            }
            return "attack_windup";
        },
        attack(gameObject, dt, data) {
            gameObject.renderer!.data.offset = MathUtils.randomVector(1);
            if (data.timeInState > 2.5 || !data.targetPosition || gameObject.position.distanceTo(data.targetPosition) < 8) {
                data.attacking = false;
                gameObject.getComponent("movement-data").data.miscellaneousModifier -= 3;
                gameObject.getComponent("physical-collider").data.ignoreCollisionWith.delete("player");
                gameObject.renderer!.data.offset = Vector.zero();
                return "follow";
            }
            if (data.collidingWithPlayer) {
                gameObject.game.player.getComponent("health").data.damage(30 * dt);
                gameObject.game.player.getComponent("physics").data.impulse.add(
                    gameObject.getComponent("physics").data.velocity.normalized().scaled(10)
                )
            }
            return "attack";
        }
    },
    onDamage(gameObject, data, amount) {
        if (data.state !== "attack") {
            data.state = "attack_windup";
        }
    },
    movementSpeed: 80,
}

const popQuizTeacherAI: EnemyAIConfig = {
    stateFunctions: {
        idle: basicIdle(300),
        follow(gameObject, dt, data) {
            data.targetPosition = data.playerHitboxCenter;
            if (data.distanceToPlayer < 120) {
                return "attack_windup";
            }
            return "follow";
        },
        attack_windup(gameObject, dt, data) {
            data.targetPosition = undefined;
            if (data.timeInState > 0.5) {
                return "attack";
            }
            return "attack_windup";
        },
        attack(gameObject, dt, data) {
            fireProjectile(projectilesCodex[ProjectileIndex.POP_QUIZ], gameObject, data.playerHitboxCenter); 
            return "follow";
        }
    },
    movementSpeed: 50
}

const dummyAI: EnemyAIConfig = {
    stateFunctions: {

    },
    movementSpeed: 0
}

const EnemyAI: (config: EnemyAIConfig) => ComponentFactory = (config) => {
    return (gameObject) => {
        return {
            id: "enemy-ai",
            data: undefined,
            start() {
                this.data = new EnemyAIData(gameObject, config);
                const health = gameObject.getComponent("health");
                health.data.onDamage = this.data.damage.bind(this.data);
            },
            update(dt) {
                if (gameObject.age < 1.5) {
                    return;
                }
                if (gameObject.game.player.destroyed) {
                    return;
                }
                this.data.update(dt);
            },
            destroy() {
                this.data.destroy();
            },
        }
    }
}

export { EnemyAI, slimeAIConfig, redSlimeAIConfig, minionAIConfig, wretchedSkeletonAIConfig, 
         revenantEyeAIConfig, wraithAIConfig, groundWormAI, evilBunnyAI, fungalHuskAI, 
         fungalSpiritAI, corruptedDeerAI, popQuizTeacherAI, dummyAI };
