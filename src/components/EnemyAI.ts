import { WeaponIndex } from "../weapons";
import { TileIndex } from "../tiles";
import { Vector } from "../utils";
import { ComponentFactory } from "./index";

const ZombieAI: ComponentFactory = (gameObject) => {
    const data: any = {
        speed: 0.8,
        waterSpeed: 0.4,
        target: undefined,
        physics: undefined,
        weaponManager: undefined,
    };
    return {
        id: "zombie-ai",
        start() {
            data.target = gameObject.game.player.position;
            data.physics = gameObject.getComponent("physics");
            data.weaponManager = gameObject.getComponent("weapon-manager");
        },
        update(dt) {
            if (gameObject.age < 1.5) return;
            const direction = Vector.subtract(data.target, gameObject.position);
            let speed = data.speed;
            if (gameObject.game.getTileIndex(gameObject.position) === TileIndex.WATER) {
                speed = data.waterSpeed;
            }
            direction.normalize()
            direction.scale(speed);
            data.physics.data.velocity.set(direction);
            if (direction.x < 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x) * -1;
            }
            else if (direction.x > 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x);
            }

            if (Vector.subtract(gameObject.position, data.target).magnitude < 1) {
                data.weaponManager.data.fire(WeaponIndex.ZOMBIE_ATTACK, data.target);
            }
        },
        data
    }
}

const MinionAI: ComponentFactory = (gameObject) => {
    const data: any = {
        speed: 1.2,
        waterSpeed: 0.6,
        target: undefined,
        physics: undefined,
        weaponManager: undefined,
    };
    return {
        id: "minion-ai",
        start() {
            data.target = gameObject.game.player.position;
            data.physics = gameObject.getComponent("physics");
            data.weaponManager = gameObject.getComponent("weapon-manager");
        },
        update(dt) {
            if (gameObject.age < 1.5) return;
            const direction = Vector.subtract(data.target, gameObject.position);
            let speed = data.speed;
            if (gameObject.game.getTileIndex(gameObject.position) === TileIndex.WATER) {
                speed = data.waterSpeed;
            }
            direction.normalize()
            direction.scale(speed);
            data.physics.data.velocity.set(direction);
            if (direction.x < 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x) * -1;
            }
            else if (direction.x > 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x);
            }

            if (Vector.subtract(gameObject.position, data.target).magnitude < 1) {
                data.weaponManager.data.fire(WeaponIndex.MINION_ATTACK, data.target);
            }
        },
        data
    }
}

const RevenantEyeAI: ComponentFactory = (gameObject) => {
    const data: any = {
        speed: 0.6,
        waterSpeed: 0.6,
        target: undefined,
        physics: undefined,
        weaponManager: undefined,
    };
    return {
        id: "revenant-eye-ai",
        start() {
            data.target = gameObject.game.player.position;
            data.physics = gameObject.getComponent("physics");
            data.weaponManager = gameObject.getComponent("weapon-manager");
        },
        update(dt) {
            if (gameObject.age < 1.5) return;
            const direction = Vector.subtract(data.target, gameObject.position);
            let speed = data.speed;
            if (gameObject.game.getTileIndex(gameObject.position) === TileIndex.WATER) {
                speed = data.waterSpeed;
            }
            
            if (Vector.subtract(gameObject.position, data.target).magnitude < 8) {
                data.weaponManager.data.fire(WeaponIndex.REVENANT_EYE_ATTACK, data.target);
                data.physics.data.velocity.set(Vector.zero());
            }
            else {
                direction.normalize()
                direction.scale(speed);
                data.physics.data.velocity.set(direction);
            }

            if (direction.x < 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x) * -1;
            }
            else if (direction.x > 0) {
                gameObject.scale.x = Math.abs(gameObject.scale.x);
            }
        },
        data
    }
}

export { ZombieAI, MinionAI, RevenantEyeAI };
