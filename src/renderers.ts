import { getImage } from "./imageLoader";
import { Camera } from "./camera";
import { GameObject } from "./gameObjects";
import { Vector } from "./utils";

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
            camera.setFillColor(data.color);
            camera.fillRect(gameObject.position.x, gameObject.position.y, gameObject.scale.x, gameObject.scale.y);
        },
        data
    }
}

const spriteRenderer: (id: string) => Renderer = (id: string) => {
    const data = {
        spriteID: id,
        offset: Vector.zero()
    };
    return {
        render(camera: Camera, gameObject: GameObject) {
            const pos = Vector.add(gameObject.position, data.offset);
            const collider = gameObject.getComponent("physical-collider");
            if (collider) {
                camera.setFillColor(`rgba(32,32,32,0.25)`);
                camera.fillEllipse(pos.x + collider.data.boxOffset.x, pos.y + collider.data.boxOffset.y - 0.1, collider.data.boxSize.x, collider.data.boxSize.y);
            }
            camera.drawImage(getImage(data.spriteID), pos.x, pos.y, gameObject.scale.x, gameObject.scale.y, gameObject.rotation, gameObject.rotationPointOffset);
        },
        data
    }
}

export { Renderer, rectangleRenderer, spriteRenderer };