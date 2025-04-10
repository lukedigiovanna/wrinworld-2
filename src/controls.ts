interface ControlProps {
    code: string;
    display: string;
}

interface Controls {
    selectWeapon1: ControlProps;
    selectWeapon2: ControlProps;
    utility: ControlProps;
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
    utility: {
        code: "KeyQ",
        display: "Q"
    },
    consumable: {
        code: "KeyR",
        display: "R"
    },
    attackPortal: {
        code: "Space",
        display: "SPACE"
    },
    toggleInventory: {
        code: "KeyE",
        display: "E"
    }
}

export type { Controls };
export default controls;
