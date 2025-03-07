import { Vector } from "../utils";
import { GameObject } from "../gameObjects/index";
import { ComponentFactory } from "./index";

const Physics: ComponentFactory = (gameObject: GameObject) => {
    const velocity = Vector.zero();
    return {
        id: "physics",
        start() {},
        update(dt) {
            if (!velocity.isZero()) {
                gameObject.position.add(Vector.scaled(velocity, dt));
                const collider = gameObject.getComponent("physical-collider");
                if (collider) {
                    const [l, r, t, b] = [
                        gameObject.position.x + collider.data?.boxOffset.x - collider.data?.boxSize.x / 2,
                        gameObject.position.x + collider.data?.boxOffset.x + collider.data?.boxSize.x / 2,
                        gameObject.position.y + collider.data?.boxOffset.y + collider.data?.boxSize.y / 2,
                        gameObject.position.y + collider.data?.boxOffset.y - collider.data?.boxSize.y / 2,
                    ];
                    gameObject.getAdjacentObjects().forEach((obj: GameObject) => {
                        if (gameObject === obj) return;
                        const other = obj.getComponent("physical-collider");
                        if (other) {
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
                            }
                        }
                    });
                    
                }
            }
        },
        data: { velocity }
    }
}

export { Physics };