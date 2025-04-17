type Settings = {
    showPhysicalColliders: boolean;
    showHitboxes: boolean;
    showFPS: boolean;
    showObjectCenters: boolean;
    showRotationPoint: boolean;
    showChunks: boolean;
    showCameraPosition: boolean;
    muted: boolean;
}

const settings: Settings = {
    showFPS: true,
    showPhysicalColliders: true,
    showHitboxes: true,
    showObjectCenters: false,
    showRotationPoint: false,
    showChunks: false,
    showCameraPosition: false,
    muted: true,
}

export default settings;