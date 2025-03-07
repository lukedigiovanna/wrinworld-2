import { Vector } from "./utils";

// utils for knowing when mouse events and key events occur

// to be used as singleton
class Input {
    private _mouseDown = false; // true as long as mouse is pressed
    private _mousePressed = false; // turns true when mouse pressed, false when the event is queried.
    private _mousePosition = Vector.zero();
    private _keyDownMap = new Map<string, boolean>(); 

    constructor() {
        // initialize listeners
        window.onmousedown = (e: MouseEvent) => {
            this._mouseDown = true;
            this._mousePressed = true;
        }
        const releaseMouse = (e: MouseEvent) => {
            this._mouseDown = false;
            this._mousePressed = false;
        }   
        window.onmouseup = releaseMouse;
        window.onmouseleave = releaseMouse;
        window.onmousemove = (e: MouseEvent) => {
            this._mousePosition.x = e.clientX; 
            this._mousePosition.y = e.clientY ;
        }

        window.onkeydown = (ev: KeyboardEvent) => {
            this._keyDownMap.set(ev.code, true);            
        }
        window.onkeyup = (ev: KeyboardEvent) => {
            this._keyDownMap.set(ev.code, false);
        }
    }

    public get mouseDown() {
        return this._mouseDown;
    }

    public get mousePosition() {
        return this._mousePosition;
    }

    public get mousePressed() {
        const ret = this._mousePressed;
        this._mousePressed = false;
        return ret;
    }

    public isKeyDown(code: string): boolean {
        return !!this._keyDownMap.get(code);
    }

}

const input = new Input();

export default input;