import { getTexture } from "../assets/imageLoader";
import { Camera } from "./camera";
import { GameObject } from "../gameObjects";
import { Vector } from "../utils";

type Renderer = {
    render: (camera: Camera, gameObject: GameObject) => void
    data?: any;
};

function spriteRenderer(id: string): Renderer {
    return {
        render(camera: Camera, gameObject: GameObject) {
            if (!this.data.hidden) {
                const pos = Vector.add(gameObject.position, this.data.offset);
                camera.color = gameObject.color;
                camera.drawTexture(getTexture(this.data.spriteID), pos.x, pos.y, gameObject.scale.x, gameObject.scale.y, gameObject.rotation, gameObject.rotationPointOffset);
                
            }
        },
        data: {
            spriteID: id,
            hidden: false,
            offset: Vector.zero()
        }
    }
}

const alphabet = "abcdefghijklmnopqrstuvwxyz1234567890";
function textRenderer(fontID: string, text: string): Renderer {
    return {
        render(camera, gameObject) {
            let x = gameObject.position.x;
            for (const c of this.data.text) {
                if (c === ' ') {
                    x += 5;
                }
                if (alphabet.indexOf(c) >= 0) {
                    const texture = getTexture(`${fontID}_${c}`);
                    camera.color = gameObject.color;
                    camera.drawTexture(texture, x, gameObject.position.y, texture.width, texture.height);
                    x += texture.width + 1;
                }
            }
        },
        data: {
            text
        }
    }
}

export { Renderer, spriteRenderer, textRenderer };