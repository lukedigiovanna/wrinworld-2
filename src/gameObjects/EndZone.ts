import { GameObject, GameObjectFactory } from "./";
import { Hitbox } from "../components";
import { addNotification } from "../notifications";
import { Rectangle } from "../utils";

const EndZoneFactory: GameObjectFactory = (hitbox: Rectangle) => {
    const endzone = new GameObject();
    endzone.position.set(hitbox.center);
    endzone.scale.setComponents(hitbox.width, hitbox.height);
    endzone.tag = "endzone";
    endzone.addComponent(Hitbox);
    endzone.addComponent((gameObject) => {
        return {
            id: "endzone",
            onHitboxCollisionEnter(collision) {
                if (collision.tag === "player") {
                    if (false && gameObject.game.portals.length > 0) {
                        collision.getComponent("physics").data.impulse.add(
                            collision.position.minus(gameObject.position).normalized().scaled(500)
                        );
                        addNotification({
                            text: "You still have more portals to close!",
                            color: "magenta"
                        });
                    }
                    else {
                        // start boss battle
                        gameObject.game.startBossBattle();
                    }
                }
            },
        }
    });
    return endzone;
}

export { EndZoneFactory };
