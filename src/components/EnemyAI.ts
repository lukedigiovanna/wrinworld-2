import { ComponentFactory } from "./index";
import { GameObject } from "../gameObjects";
import { TileIndex } from "../tiles";
import { Vector } from "../utils";
import { WeaponIndex } from "../weapons";

// system: when enemies are far they should wander
// .       enemy has a "sight" distance: if they have line of sight to player they follow
// .       enemy has a "sense" distance: if their target is within a distance, regardless of obstacles they will track
// .       

enum EnemyAIState {
    IDLE,
    SEARCH,
    FOLLOW,
    ATTACK,
}

class EnemyAIData {
    private self: GameObject;
    public targetPosition: Vector | undefined;

    constructor(self: GameObject) {
        this.self = self;
    }

    public get distanceToPlayer() {
        return this.self.position.distanceTo(this.self.game.player.position);
    }

    public get hasLineOfSightToPlayer() {
        return this.self.raycastPhysicalColliders(
            this.self.position.directionTowards(this.self.game.player.position), 
            true
        )?.hit === this.self.game.player;
    }
}

interface EnemyAIConfig {
    idle: (gameObject: GameObject, data: EnemyAIData) => EnemyAIState;
}


const slimeAIConfig: EnemyAIConfig = {
    idle(gameObject, data) {
        if (data.distanceToPlayer < 200 && data.hasLineOfSightToPlayer) {
            return EnemyAIState.FOLLOW;
        }
        if (data.distanceToPlayer < 300) {
            return EnemyAIState.SEARCH;
        }
        return EnemyAIState.IDLE
    }
}

const EnemyAI: (config: EnemyAIConfig) => ComponentFactory = (config) => {
    return (gameObject) => {
        return {
            id: "enemy-ai",
            data: {
                aiData: new EnemyAIData(gameObject),
                
            },
            start() {

            },
            update(dt) {
                
            },
        }
    }
}

interface BasicFollowAndAttackProperties {
    // How close the target must be before we can start attacking
    followDistance: number;
    // How close the target must be to start attacking
    attackRange: number;
    // The weapon to use on attack
    weaponIndex: WeaponIndex;
    //
    customSpeedModifier?: (gameObject: GameObject, direction: Vector) => number;
}

const BasicFollowAndAttackAI: (props: BasicFollowAndAttackProperties) => ComponentFactory = 
(props) => {
    return (gameObject) => {
        const data: any = {
            target: undefined,
            physics: undefined,
            weaponManager: undefined,
            movementData: undefined,
        }
        return {
            id: "basic-follow-and-attack-ai",
            start() {
                data.target = gameObject.game.player;
                data.physics = gameObject.getComponent("physics");
                data.weaponManager = gameObject.getComponent("weapon-manager");
                data.movementData = gameObject.getComponent("movement-data");
            },
            update(dt) {
                if (gameObject.age < 1.5) {
                    return;
                }
                
                const targetPosition = data.target.position;
                const direction = Vector.subtract(targetPosition, gameObject.position);
                const distance = direction.magnitude;
                if (distance > props.followDistance) {
                    data.physics.data.velocity.setComponents(0, 0);
                    return;
                }

                
                if (distance <= props.attackRange) {
                    data.weaponManager.data.press(props.weaponIndex, targetPosition);
                    data.weaponManager.data.release(props.weaponIndex, targetPosition);
                    data.physics.data.velocity.set(Vector.zero());
                }
                else {
                    const modifier = props.customSpeedModifier ? props.customSpeedModifier(gameObject, direction) : 1.0; 
                    direction.normalize()
                    direction.scale(this.data.movementData.data.getSpeed() * modifier);
                    data.physics.data.velocity.set(direction);
                }   
            },
            data
        }
    }
}

export { BasicFollowAndAttackAI };
