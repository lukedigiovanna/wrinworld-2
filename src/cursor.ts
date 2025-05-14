// manages custom cursor

import { getImage } from "./assets/imageLoader";
import { MathUtils } from "./utils";

enum Cursor {
    DEFAULT,
    POINTER,
    NOT_ALLOWED,
    ATTACK_COOLDOWN,
    ATTACK_CHARGE,
}

const cursorFolderPath = "assets/images/cursors";

const cursorFrames: Record<Cursor, string[]> = {
[Cursor.DEFAULT]: ["default"],
[Cursor.POINTER]: ["pointer"],
[Cursor.NOT_ALLOWED]: ["not_allowed"],
[Cursor.ATTACK_COOLDOWN]: ["attack_cooldown_0"],
[Cursor.ATTACK_CHARGE]: []
}

function setCursor(cursor: Cursor, t: number=0) {
    t = MathUtils.clamp(t, 0, 1);
    const divisions = cursorFrames[cursor].length - 1;
    const frameNumber = t * divisions;
    const frameID = cursorFrames[cursor][frameNumber];
    const frameURL = `${cursorFolderPath}/${frameID}.png`;
    $("#cursor").css("background-image", `url(${frameURL})`);
}

function addHoverCursor(element: JQuery<Element>, cursor: Cursor, t: number=0) {
    element.on("mouseenter", () => {
        setCursor(cursor, t);
    });
    element.on("mouseleave", () => {
        setCursor(Cursor.DEFAULT);
    });
}

document.body.addEventListener("mousemove", (ev) => {
    $("#cursor").css("left", ev.clientX);
    $("#cursor").css("top", ev.clientY);
});

setCursor(Cursor.DEFAULT);

export { Cursor, setCursor, addHoverCursor };
