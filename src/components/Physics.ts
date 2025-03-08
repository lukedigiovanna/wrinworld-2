import { Vector } from "../utils";
import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";

const Physics: ComponentFactory = (gameObject: GameObject) => {
    const data = {
        velocity: Vector.zero()
    }
    return {
        id: "physics",
        start() {},
        update(dt) {
            if (!data.velocity.isZero()) {
                gameObject.position.add(Vector.scaled(data.velocity, dt));
                const collider = gameObject.getComponent("physical-collider");
                if (collider) {
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
                        const other = obj.getComponent("physical-collider");
                        if (!other) {
                            return;
                        }
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
                        const tile = gameObject.game.getTile(corner);
                        if (tile.wall) {
                            // correct the collision
                            const [ol, or, ot, ob] = [
                                Math.floor(corner.x),
                                Math.floor(corner.x) + 1,
                                Math.floor(corner.y) + 1,
                                Math.floor(corner.y)
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