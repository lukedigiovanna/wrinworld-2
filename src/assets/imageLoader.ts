import { Rectangle } from "../utils";

class Texture {
    private _image: HTMLImageElement;
    private _texture: WebGLTexture | null;
    private _clipRect?: Rectangle;

    constructor(image: HTMLImageElement, texture: WebGLTexture | null, clipRect?: Rectangle) {
        this._image = image;
        this._texture = texture;
        this._clipRect = clipRect;
    }

    public get image() {
        return this._image;
    }

    public get texture() {
        return this._texture;
    }

    public get clipRect() {
        return this._clipRect;
    }

    public get width() {
        const p = this.clipRect ? this.clipRect.right - this.clipRect.left : 1;
        return this.image.width * p; 
    }

    public get height() {
        const p = this.clipRect ? this.clipRect.top - this.clipRect.bottom : 1;
        return this.image.height * p;
    }
}

const images = new Map<string, HTMLImageElement>();
const textures = new Map<string, Texture>();

const usedImageIDs: string[] = [];
const usedTextureIDs: string[] = [];

function loadImage(id: string, url: string) {
    usedImageIDs.push(id);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
        images.set(id, img);
    });
}  

function getImage(id: string): HTMLImageElement {
    const img = images.get(id);
    if (!img) {
      console.error(`Warning: getting an undefined image of id "${id}". Returning the undefined sprite`)
        return getImage("undefined");
    }
    return img;
}

function imageExists(id: string): boolean {
    return images.has(id);
}

function createTexture(gl: WebGLRenderingContext, image: HTMLImageElement) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
}

// Loads a WebGLTexture object from the given source image.
function loadTexture(gl: WebGLRenderingContext, id: string) {
    usedTextureIDs.push(id)
    const image = getImage(id);
    const texture = createTexture(gl, image);
    textures.set(id, new Texture(image, texture));
}

function loadTexturesFromSpritesheet(gl: WebGLRenderingContext, id: string, cellWidth: number, cellHeight: number, customIDs?: string[]) {
    const spritesheetImage = getImage(id);
    const spriteSheetTexture = createTexture(gl, spritesheetImage);
    const w = spritesheetImage.width;
    const h = spritesheetImage.height;
    let i = 0;
    for (let y = 0; y < h; y += cellHeight) {
        for (let x = 0; x < w; x += cellWidth) {
            const clipRect: Rectangle = {
                left: x / w,
                right: (x + cellWidth) / w,
                bottom: y / h,
                top: (y + cellHeight) / h,
            }
            let cellID;
            if (customIDs && i < customIDs.length) {
                cellID = `${id}_${customIDs[i]}`;   
            }
            else {
                cellID = `${id}_${i}`;
            }
            usedTextureIDs.push(cellID);
            textures.set(cellID, new Texture(spritesheetImage, spriteSheetTexture, clipRect));
            i++;
        }
    }
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
function loadImageAndTexture(gl: WebGLRenderingContext, id: string, url: string) {
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

function loadImageAndTextureSpritesheet(gl: WebGLRenderingContext, id: string, url: string, cellWidth: number, cellHeight: number, customIDs?: string[]) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            loadTexturesFromSpritesheet(gl, id, cellWidth, cellHeight, customIDs);
            return resolve(img);
        }
        img.onerror = reject;
        img.src = url;
        images.set(id, img);
    });
}

function textureExists(id: string) {
    return textures.has(id);
}

export { loadImage, getImage, imageExists, loadTexture, loadTexturesFromSpritesheet, getTexture, 
         loadImageAndTexture, loadImageAndTextureSpritesheet, textureExists, usedImageIDs, usedTextureIDs,
        Texture };
