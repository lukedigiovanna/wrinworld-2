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

interface BasicFollowAndAttackProperties {
    // How close the target must be before we can start attacking
    followDistance: number;
    // Movement speed
    speed: number;
    // Movement speed in water
    waterSpeed: number;
    // How close the target must be to start attacking
    attackRange: number;
    // The weapon to use on attack
    weaponIndex: WeaponIndex;
    //
    customVelocityFunction?: (gameObject: GameObject, direction: Vector) => Vector;
}

const BasicFollowAndAttackAI: (props: BasicFollowAndAttackProperties) => ComponentFactory = 
(props) => {
    return (gameObject) => {
        const data: any = {
            target: undefined,
            physics: undefined,
            weaponManager: undefined,
        }
        return {
            id: "basic-follow-and-attack-ai",
            start() {
                data.target = gameObject.game.player;
                data.physics = gameObject.getComponent("physics");
                data.weaponManager = gameObject.getComponent("weapon-manager");
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

                let speed = props.speed;
                if (gameObject.game.getTileIndex(gameObject.position) === TileIndex.WATER) {
                    speed = props.waterSpeed;
                }

                if (distance <= props.attackRange) {
                    data.weaponManager.data.fire(props.weaponIndex, targetPosition);
                    data.physics.data.velocity.set(Vector.zero());
                }
                else {
                    direction.normalize()
                    direction.scale(speed);
                    if (props.customVelocityFunction) {
                        data.physics.data.velocity.set(props.customVelocityFunction(gameObject, direction));
                    }
                    else {
                        data.physics.data.velocity.set(direction);
                    }
                }   
            },
            data
        }
    }
}

export { BasicFollowAndAttackAI };
