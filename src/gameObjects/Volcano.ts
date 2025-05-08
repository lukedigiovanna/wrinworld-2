import { getTexture } from "../assets/imageLoader";
import { GameObjectFactory, GameObject, Team } from "./";
import { spriteRenderer } from "../rendering/renderers";
import { Color, MathUtils, Vector } from "../utils";
import { AnimationManager, Fade, Hitbox, ParticleEmitter, Physics } from "../components";
import { SpriteAnimationIndex } from "../game/animations";
import { StatusEffectIndex } from "../game/statusEffects";

const FloorMagmaFactory: GameObjectFactory = (position: Vector, owner: GameObject) => {
    const magma = new GameObject();
    magma.position.set(position);
    const texture = getTexture("magma_floor");
    magma.scale.setComponents(texture.width, texture.height);
    magma.renderer = spriteRenderer("magma_floor");
    const hitbox = magma.addComponent(Hitbox);
    hitbox.data.boxSize.setComponents(8, 4);
    hitbox.data.boxOffset.setComponents(0, -2);
    magma.addComponent((gameObject) => {
        return {
            id: "magma_floor",
            update(dt) {
                const hitbox = gameObject.getComponent("hitbox");
                for (const collision of hitbox.data.collidingWith) {
                    if (collision.team !== Team.UNTEAMED && collision.team !== owner.team) {
                        collision.getComponentOptional("status-effect-manager")?.data.applyEffect(StatusEffectIndex.FLAME, 3, 5);           
                    }
                }
            }
        }
    })
    magma.lifespan = MathUtils.random(4, 8);
    magma.addComponent(Fade);
    return magma;
}

const MagmaFactory: GameObjectFactory = (position: Vector, owner: GameObject) => {
    const magma = new GameObject();
    magma.position.set(position);
    const texture = getTexture("magma_ball");
    magma.scale.setComponents(texture.width, texture.height);
    magma.renderer = spriteRenderer("magma_ball");
    const physics = magma.addComponent(Physics);
    physics.data.velocity.set(new Vector(MathUtils.random(-32, 32), 60));
    physics.data.gravity = 100;
    physics.data.angularVelocity = MathUtils.random(-6, 6);
    magma.addComponent(ParticleEmitter({
        color: () => {
            const r = MathUtils.random(-0.25, 0.25);
            return Color.add(Color.ORANGE, new Color(r, r, r, 1));
        }, 
        velocity: () => MathUtils.randomVector(MathUtils.random(5, 20)),
        angularVelocity: () => MathUtils.random(-6, 6),
        rate: () => 10,
    }));
    magma.lifespan = MathUtils.random(1, 2);
    magma.addComponent((gameObject) => {
        return {
            id: "magma_ball",
            destroy() {
                gameObject.game.addParticleExplosion(gameObject.position, Color.ORANGE, 24, 24);
                gameObject.game.addGameObject(FloorMagmaFactory(gameObject.position, owner));
            }
        }
    })
    return magma;
}

const VolcanoFactory: GameObjectFactory = (position: Vector, owner: GameObject) => {
    const volcano = new GameObject();
    const texture = getTexture("volcano_0");
    volcano.renderer = spriteRenderer("volcano");
    volcano.scale.setComponents(texture.width, texture.height);
    volcano.position.set(position);
    const animationManager = volcano.addComponent(AnimationManager);
    animationManager.data.animation = SpriteAnimationIndex.VOLCANO;
    volcano.addComponent((gameObject) => {
        return {
            id: "volcano",
            data: {
                timer: 0
            },
            update(dt) {
                this.data.timer += dt;
                while (this.data.timer >= 0.6) {
                    this.data.timer -= 0.6;
                    gameObject.game.addGameObject(
                        MagmaFactory(gameObject.position.plus(new Vector(0, gameObject.scale.y / 2)), owner)
                    );
                }
            },
            destroy() {
                gameObject.game.addParticleExplosion(gameObject.position, Color.hex("#420402"), 50, 70);
                gameObject.game.addParticleExplosion(gameObject.position, Color.hex("#dc530d"), 30, 50);
            }
        }
    });
    volcano.lifespan = 15;
    return volcano;
}

export { VolcanoFactory };
