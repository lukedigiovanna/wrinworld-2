import { Vector } from "../utils";
import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";
import { ChunkConstants } from "../game/Chunk";

const Physics: ComponentFactory = (gameObject: GameObject) => {
    const data = {
        velocity: Vector.zero(),
        impulse: Vector.zero(),
        gravity: 0,
        angularVelocity: 0,
        angularVelocityDrag: 0,
        drag: 0,
    }
    return {
        id: "physics",
        start() {},
        update(dt) {
            data.velocity.y -= data.gravity * dt;
            data.impulse.scale(Math.exp(-dt * 2));
            data.velocity.scale(Math.exp(-dt * data.drag));
            data.angularVelocity *= Math.exp(-dt * data.angularVelocityDrag);
            gameObject.rotation += data.angularVelocity * dt;
            const netVelocity = Vector.add(data.velocity, data.impulse);
            if (!netVelocity.isZero()) {
                gameObject.position.add(Vector.scaled(netVelocity, dt));
                const collider = gameObject.getComponentOptional("physical-collider");
                if (collider && !collider.data.disabled) {
                    let [l, r, t, b] = [
                        gameObject.position.x + collider.data?.boxOffset.x - collider.data?.boxSize.x / 2,
                        gameObject.position.x + collider.data?.boxOffset.x + collider.data?.boxSize.x / 2,
                        gameObject.position.y + collider.data?.boxOffset.y + collider.data?.boxSize.y / 2,
                        gameObject.position.y + collider.data?.boxOffset.y - collider.data?.boxSize.y / 2,
                    ];
                    gameObject.getAdjacentObjects().forEach((obj: GameObject) => {
                        if (gameObject === obj) {
                            return;
                        }
                        if (!obj.hasComponent("physical-collider")) {
                            return;
                        }
                        const other = obj.getComponent("physical-collider");
                        if (collider.data?.ignoreCollisionWith.has(obj.tag)) {
                            return;
                        }
                        if (other.data?.ignoreCollisionWith.has(gameObject.tag)) {
                            return;
                        }
                        // check for collision
                        const [ol, or, ot, ob] = [
                            obj.position.x + other.data?.boxOffset.x - other.data?.boxSize.x / 2,
                            obj.position.x + other.data?.boxOffset.x + other.data?.boxSize.x / 2,
                            obj.position.y + other.data?.boxOffset.y + other.data?.boxSize.y / 2,
                            obj.position.y + other.data?.boxOffset.y - other.data?.boxSize.y / 2,
                        ];
                        if (!(r <= ol || l >= or || t <= ob || b >= ot)) {
                            // choose the smallest overlap:
                            const choices: [number, Vector][] = [
                                [r - ol, new Vector(-(r - ol), 0)],
                                [or - l, new Vector(or - l, 0)],
                                [ot - b, new Vector(0, ot - b)],
                                [t - ob, new Vector(0, -(t - ob))]
                            ];
                            let smallest = 0;
                            for (let i = 1; i < 4; i++) {
                                if (choices[i][0] < choices[smallest][0]) {
                                    smallest = i;
                                }
                            }
                            gameObject.position.add(choices[smallest][1]);
                            l = gameObject.position.x + collider.data?.boxOffset.x - collider.data?.boxSize.x / 2;
                            r = gameObject.position.x + collider.data?.boxOffset.x + collider.data?.boxSize.x / 2;
                            t = gameObject.position.y + collider.data?.boxOffset.y + collider.data?.boxSize.y / 2;
                            b = gameObject.position.y + collider.data?.boxOffset.y - collider.data?.boxSize.y / 2;
                            gameObject.onPhysicalCollision(obj, false);
                        }
                    });
                    const corners = [new Vector(l, t), new Vector(r, t), new Vector(l, b), new Vector(r, b)];
                    for (const corner of corners) {
                        const tile = gameObject.game.getTileDataAtWorldPosition(corner);
                        if (tile.wall) {
                            // correct the collision
                            const x = Math.floor(corner.x / ChunkConstants.PIXELS_PER_TILE) * ChunkConstants.PIXELS_PER_TILE;
                            const y = Math.floor(corner.y / ChunkConstants.PIXELS_PER_TILE) * ChunkConstants.PIXELS_PER_TILE;
                            const [ol, or, ot, ob] = [
                                x,
                                x + ChunkConstants.PIXELS_PER_TILE,
                                y + ChunkConstants.PIXELS_PER_TILE,
                                y
                            ];
                            // choose the smallest overlap:
                            const choices: [number, Vector][] = [
                                [r - ol, new Vector(-(r - ol), 0)],
                                [or - l, new Vector(or - l, 0)],
                                [ot - b, new Vector(0, ot - b)],
                                [t - ob, new Vector(0, -(t - ob))]
                            ];
                            let smallest = 0;
                            for (let i = 1; i < 4; i++) {
                                if (choices[i][0] < choices[smallest][0]) {
                                    smallest = i;
                                }
                            }
                            gameObject.position.add(choices[smallest][1]);
                            l = gameObject.position.x + collider.data?.boxOffset.x - collider.data?.boxSize.x / 2;
                            r = gameObject.position.x + collider.data?.boxOffset.x + collider.data?.boxSize.x / 2;
                            t = gameObject.position.y + collider.data?.boxOffset.y + collider.data?.boxSize.y / 2;
                            b = gameObject.position.y + collider.data?.boxOffset.y - collider.data?.boxSize.y / 2;
                            gameObject.onPhysicalCollision(tile, true);
                        }
                    }    
                }
            }
        },
        data
    }
}

export { Physics };