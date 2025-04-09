
interface Notification {
    text: string;
    color: string; // CSS color
}

let idCounter = 0;

function addNotification(notification: Notification) {
    const id = `notification-${idCounter}`;
    idCounter++;
    const element = $(`
        <div id="${id}" class="notification" style="color: ${notification.color}">
            ${notification.text}
        </div>
    `);
    $("#notifications").prepend(element);
    setTimeout(() => {
        $(`#${id}`).css("opacity", "0%");
    }, 1000);
    setTimeout(() => {
        $(`#${id}`).remove();
    }, 1500);
}

export { addNotification };
export type { Notification };
