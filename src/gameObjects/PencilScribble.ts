import { Fade, Physics } from "../components";
import { GameObject, GameObjectFactory, Team } from "./";
import { spriteRenderer } from "../rendering/renderers";
import { Color, MathUtils, Permutation, Vector } from "../utils";

const PencilScribbleFactory: GameObjectFactory = (owner: GameObject, target: Vector) => {
    const scribble = new GameObject();
    scribble.lifespan = MathUtils.random(4, 6);
    scribble.tag = "scribble";
    scribble.position.set(
        owner.hitboxCenter.plus(
            target.minus(owner.hitboxCenter).normalized().scaled(MathUtils.random(14, 20))
        ).plus(
            MathUtils.randomVector(MathUtils.random(0, 5))
        )
    );
    scribble.renderer = spriteRenderer("square");
    const r = MathUtils.random(0.2, 0.4);
    scribble.color = new Color(r, r, r, 1);
    scribble.addComponent(Physics);
    scribble.addComponent((gameObject) => {
        return {
            id: "pencil-scribble",
            update(dt) {
                const width = Math.min(gameObject.age / 0.2, 1) * MathUtils.rescale(gameObject.birthMark, 0, 1, 8, 16);
                gameObject.scale.x = width;
                gameObject.renderer!.data.offset.setComponents(Math.cos(gameObject.rotation) * width / 2, Math.sin(gameObject.rotation) * width / 2);
                
                if (!this.data.attacking) {
                    const nearby = gameObject.game.getGameObjectsByFilter(other =>
                        other.tag === "scribble" &&
                        !other.getComponent("pencil-scribble").data.attacking &&
                        other.position.distanceTo(gameObject.position) < 16
                    );
                    if (nearby.length >= 7) {
                        let mostRecent = nearby[0];
                        for (let i = 1; i < nearby.length; i++) {
                            if (nearby[i].age < mostRecent.age) {
                                mostRecent = nearby[i];
                            }
                        }
                        const rainbow = [Color.hex("#e81416"), Color.hex("#ffa500"), Color.hex("#faeb36"), Color.hex("#79c314"), Color.hex("#487de7"), Color.hex("#4b369d"), Color.hex("#70369d")];
                        for (let i = 0; i < nearby.length; i++) {
                            const o = nearby[i];
                            o.color = rainbow[i % nearby.length];
                            const physics = o.getComponent("physics");
                            physics.data.velocity.set(
                                mostRecent.getComponent("pencil-scribble").data.target.minus(gameObject.position).normalized().scaled(150)
                            );
                            physics.data.angularVelocity = MathUtils.random(-10, 10);
                            o.renderer!.data.offset.setComponents(0, 0);
                            o.lifespan = o.age + 4;
                            o.getComponent("pencil-scribble").data.attacking = true;
                        }
                    }
                }
                else {
                    const nearestEnemy = gameObject.game.getNearestGameObjectWithFilter(gameObject.position, (other) => other.team !== Team.UNTEAMED && other.team !== owner.team);
                    if (nearestEnemy && nearestEnemy.distance < 16) {
                        nearestEnemy.object.getComponentOptional("health")?.data.damage(3);
                        gameObject.destroy();
                    }
                }
            },
            data: {
                attacking: false,
                target
            },
            destroy() {
                if (this.data.attacking) {
                    gameObject.game.addParticleExplosion(gameObject.position, gameObject.color, 24, 24);
                }
            }
        }
    });
    scribble.addComponent(Fade);
    scribble.rotation = MathUtils.random(0, 2 * Math.PI);
    scribble.scale.setComponents(1, 1);
    return scribble;
}

export { PencilScribbleFactory };
