type Settings = {
    showPhysicalColliders: boolean;
    showHitboxes: boolean;
    showFPS: boolean;
    showObjectCenters: boolean;
    showRotationPoint: boolean;
    showChunks: boolean;
    showCameraPosition: boolean;
}

const settings: Settings = {
    showFPS: true,
    showPhysicalColliders: false,
    showHitboxes: false,
    showObjectCenters: true,
    showRotationPoint: false,
    showChunks: true,
    showCameraPosition: true
}

export default settings;