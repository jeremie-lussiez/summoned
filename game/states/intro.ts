import { init } from "@dimforge/rapier2d-compat";
import { update } from "three/examples/jsm/libs/tween.module.js";

export const INTRO_STATE_DEFINITION = {
    id: 'intro',
    data: {
        zoomInStart: null,
        travellingSpeed: 0.0005,
        hasDoneSomething: false,
    },
    actions: {
        click: (game: any, state: any) => {
            state.hasDoneSomething = true;
        },
    },
    update: (game: any, state: any, delta: number) => {
        if (state.hasDoneSomething) {
            const now = performance.now();
            if (state.zoomInStart === null) {
                state.zoomInStart = now;
            }
            if (game.camera.position.z > 1.8) {
                game.camera.position.z = (Math.cos((now - state.zoomInStart) * state.travellingSpeed) * 250 + 250) - 1;
                const distance = game.camera.position.z;
                const opacityDistanceThreshold = 80;
                if (distance < opacityDistanceThreshold) {
                    game.jamesonBuildingMesh.material.opacity = distance / opacityDistanceThreshold;
                    game.jamesonBuildingMesh.children[0].material.opacity = distance / opacityDistanceThreshold;
                    game.backgroundPlate.material.opacity = 1 - distance / opacityDistanceThreshold;
                } else {
                    game.jamesonBuildingMesh.material.opacity = 1;
                    game.jamesonBuildingMesh.children[0].material.opacity = 1;
                    game.backgroundPlate.material.opacity = 0;
                }
            }
        }
    },
    init: (game: any, state: any) => {
        // cos(0) = 1 but I leave it here for clarity
        game.camera.position.z = (Math.cos(0) * 250 + 250) - 1;
    },
    transitions: [
        {
            target: 'atWork',
            condition: (game: any, state: any) => {
                return game.camera.position.z <= 1.8;
            }
        }
    ]
};
