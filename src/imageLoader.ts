import { Rectangle } from "utils";

interface Texture {
    image: HTMLImageElement;
    texture: WebGLTexture | null;
    clipRect?: Rectangle;
}

const images = new Map<string, HTMLImageElement>();
const textures = new Map<string, Texture>();

const usedImageIDs: string[] = [];
const usedTextureIDs: string[] = [];

const loadImage = (id: string, url: string) => {
    usedImageIDs.push(id);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
        images.set(id, img);
    });
}  

const getImage = (id: string): HTMLImageElement => {
    const img = images.get(id);
    if (!img) {
      console.error("Warning: getting an undefined image... returning the undefined sprite")
        return getImage("undefined");
    }
    return img;
}

const imageExists = (id: string): boolean => {
    return images.has(id);
}

// Loads a WebGLTexture object from the given source image.
const loadTexture = (gl: WebGLRenderingContext, id: string) => {
    usedTextureIDs.push(id);
    const texture = gl.createTexture();
    const image = getImage(id);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    textures.set(id, {
        texture, image
    });
}

const getTexture = (id: string) => {
    const texture = textures.get(id);
    if (!texture) {
      console.error("Warning: getting an undefined texture... returning the undefined texture")
        return getTexture("undefined");
    }
    return texture;
}

// Loads the given image from the url and creates an image and texture object
// in the global registry.
const loadImageAndTexture = (gl: WebGLRenderingContext, id: string, url: string) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            loadTexture(gl, id);
            return resolve(img);
        }
        img.onerror = reject;
        img.src = url;
        images.set(id, img);
    });
}

const textureExists = (id: string) => {
    return textures.has(id);
}

export { loadImage, getImage, imageExists, loadTexture, getTexture, 
         loadImageAndTexture, textureExists, usedImageIDs, usedTextureIDs };
export type { Texture };
