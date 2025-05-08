type Settings = {
    showPhysicalColliders: boolean;
    showHitboxes: boolean;
    showFPS: boolean;
    showObjectCenters: boolean;
    showRotationPoint: boolean;
    showChunks: boolean;
    showCameraPosition: boolean;
    muted: boolean;
    sleepTime: number,
}

const settings: Settings = {
    showFPS: true,
    showPhysicalColliders: false,
    showHitboxes: true,
    showObjectCenters: false,
    showRotationPoint: false,
    showChunks: false,
    showCameraPosition: false,
    muted: true,
    sleepTime: 0,
}

export default settings;