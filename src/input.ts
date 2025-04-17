import { Vector } from "./utils";

// utils for knowing when mouse events and key events occur

type ScrollCallback = (deltaY: number) => void;

enum InputLayer {
    GAME,
    INVENTORY,
}

// to be used as singleton
class Input {
    private _mouseDown = false; // true as long as mouse is pressed
    private _mouseReleased = false; // turns true when mouse released, false when the event is queried
    private _mousePressed = false; // turns true when mouse pressed, false when the event is queried.
    private _mousePosition = Vector.zero();
    private _keyDownMap = new Map<string, boolean>(); 
    private _keyPressedMap = new Map<string, boolean>();
    private _keyReleasedMap = new Map<string, boolean>();

    private scrollListeners: ScrollCallback[] = [];

    private _layer: InputLayer = InputLayer.GAME;

    constructor() {
        window.addEventListener("gamepadconnected", (ev) => {
            console.log(ev);
        });
        // initialize listeners
        window.addEventListener("mousedown", (e: MouseEvent) => {
            this._mouseDown = true;
            this._mousePressed = true;
            this._mouseReleased = false;
        }, true);
        const releaseMouse = (e: MouseEvent) => {
            this._mouseDown = false;
            this._mousePressed = false;
            this._mouseReleased = true;
        }   
        window.addEventListener("mouseup", releaseMouse, true);
        window.addEventListener("mouseleave", releaseMouse, true);
        window.addEventListener("mousemove", (e: MouseEvent) => {
            this._mousePosition.x = e.clientX; 
            this._mousePosition.y = e.clientY ;
        }, true);

        window.addEventListener("keydown", (ev: KeyboardEvent) => {
            // Prevent repeat calls (when key is held)
            if (ev.repeat) {
                return;
            }
            ev.preventDefault();
            this._keyDownMap.set(ev.code, true);
            this._keyPressedMap.set(ev.code, true); 
            this._keyReleasedMap.set(ev.code, false);            
        }, true);
        window.addEventListener("keyup", (ev: KeyboardEvent) => {
            ev.preventDefault();
            this._keyDownMap.set(ev.code, false);
            this._keyPressedMap.set(ev.code, false);         
            this._keyReleasedMap.set(ev.code, true);            
        }), true;
        window.onwheel = (ev: WheelEvent) => {
            this.scrollListeners.forEach(callback => {
                callback(ev.deltaY);
            });
        }

        window.addEventListener("blur", () => {
            this._keyDownMap.clear();
            this._keyPressedMap.clear();
        });
        window.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });         
    }

    public mouseDown(fromLayer: InputLayer=InputLayer.GAME) {
        if (fromLayer !== this._layer) {
            return false;
        }
        return this._mouseDown;
    }

    public get mousePosition() {
        return this._mousePosition;
    }

    public mousePressed(fromLayer: InputLayer=InputLayer.GAME) {
        if (fromLayer !== this._layer) {
            return false;
        }
        const ret = this._mousePressed;
        this._mousePressed = false;
        return ret;
    }

    public mouseReleased(fromLayer: InputLayer=InputLayer.GAME) {
        if (fromLayer !== this._layer) {
            return false;
        }
        const ret = this._mouseReleased;
        this._mouseReleased = false;
        return ret;
    }

    public isKeyDown(code: string, fromLayer: InputLayer=InputLayer.GAME): boolean {
        if (fromLayer !== this._layer) {
            return false;
        }
        return !!this._keyDownMap.get(code);
    }

    public isKeyPressed(code: string, fromLayer: InputLayer=InputLayer.GAME): boolean {
        if (fromLayer !== this._layer) {
            return false;
        }
        const returnValue = !!this._keyPressedMap.get(code);
        this._keyPressedMap.set(code, false);
        return returnValue;
    }

    public isKeyReleased(code: string, fromLayer: InputLayer=InputLayer.GAME): boolean {
        if (fromLayer !== this._layer) {
            return false;
        }
        const returnValue = !!this._keyReleasedMap.get(code);
        this._keyReleasedMap.set(code, false);
        return returnValue;
    }

    public registerScrollCallback(callback: ScrollCallback) {
        this.scrollListeners.push(callback);
    }

    public removeScrollCallback(callback: ScrollCallback) {
        this.scrollListeners.splice(
            this.scrollListeners.indexOf(callback), 1);
    }

    public get layer() {
        return this._layer;
    }

    public set layer(layer: InputLayer) {
        this._layer = layer;
    }
}

const input = new Input();

export default input;
export { InputLayer };
