interface ControlProps {
    code: string;
    display: string;
}

interface Controls {
    selectWeapon1: ControlProps;
    selectWeapon2: ControlProps;
    utility1: ControlProps;
    utility2: ControlProps;
    consumable: ControlProps;
    attackPortal: ControlProps;
    toggleInventory: ControlProps;
}

const controls: Controls = {
    selectWeapon1: {
        code: "Digit1",
        display: "1",
    },
    selectWeapon2: {
        code: "Digit2",
        display: "2",
    },
    utility1: {
        code: "KeyQ",
        display: "Q"
    },
    utility2: {
        code: "KeyE",
        display: "E",
    },
    consumable: {
        code: "KeyR",
        display: "R"
    },
    attackPortal: {
        code: "Space",
        display: "Space"
    },
    toggleInventory: {
        code: "Tab",
        display: "TAB"
    }
}

export type { Controls };
export default controls;
