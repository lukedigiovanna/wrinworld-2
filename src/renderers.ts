import { getImage, getTexture } from "./imageLoader";
import { Camera } from "./camera";
import { GameObject } from "./gameObjects";
import { Color, Vector } from "./utils";

type Renderer = {
    render: (camera: Camera, gameObject: GameObject) => void
    data?: any;
};

const rectangleRenderer: (color: string) => Renderer = (color: string) => {
    const data = {
        color
    };
    return {
        render(camera: Camera, gameObject: GameObject) {
            // camera.setFillColor(data.color);
            // camera.fillRect(gameObject.position.x, gameObject.position.y, gameObject.scale.x, gameObject.scale.y);
        },
        data
    }
}

const spriteRenderer: (id: string) => Renderer = (id: string) => {
    return {
        render(camera: Camera, gameObject: GameObject) {
            const pos = Vector.add(gameObject.position, this.data.offset);
            camera.color = gameObject.color;
            camera.drawTexture(getTexture(this.data.spriteID), pos.x, pos.y, gameObject.scale.x, gameObject.scale.y, gameObject.rotation, gameObject.rotationPointOffset);
        },
        data: {
            spriteID: id,
            offset: Vector.zero()
        }
    }
}

export { Renderer, rectangleRenderer, spriteRenderer };