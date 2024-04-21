import RAPIER, { Collider } from "@dimforge/rapier2d-compat";
import { AnimatedSprite } from "../lib/animated-sprite";
import { RapierGroupFactory } from "../lib/rapier-group-factory";
import { gobAnimations } from "../animations/gob-animations";
import { update } from "three/examples/jsm/libs/tween.module.js";

export const FIGHTING_GOBLINS_STATE_DEFINITION = {
    id: 'fightingGoblins',
    music: 'assets/audio/Goblinbane.mp3',
    data: {
        goblins: [],
        fadeIntervalId: 0,
        backgroundFade: 1,
    },
    actions: {},
    update: (game: any, state: any, delta: number) => {
        const now = performance.now();
        state.goblins.forEach((gob) => {
            gob.update(now);
            const currentGobMesh = gob.mesh;
            if (currentGobMesh.userData) {
                const body = currentGobMesh.userData;

                currentGobMesh.position.y = body.translation().y;
                currentGobMesh.position.x = body.translation().x;
                currentGobMesh.rotation.z = body.rotation();

                if (!gob.mesh.isDead) {
                    const velocity = body.linvel();
                    if (Math.abs(velocity.x) < 0.01) {
                        gob.setAnimation('iddle');
                    } else {
                        gob.setAnimation('walking');
                    }
                    if (Math.random() < 0.05) {
                        const strength = 400;
                        body.applyImpulse({ x: Math.random() * strength - strength / 2, y: Math.random() * strength - strength / 2 }, true);
                    }
                    body.setRotation(0, true);
                }
            }
        });
    },
    init: (game: any, state: any) => {

        const cameraTarget = game.camera.position.z + 20;

        state.fadeIntervalId = window.setInterval(() => {
            if (state.backgroundFade > 0) {
                state.backgroundFade -= 0.01;
                state.backgroundFade = Math.max(0, state.backgroundFade);
                game.backgroundPlate.material.opacity = state.backgroundFade;
                if (game.camera.position.z < cameraTarget) {
                    game.camera.position.z += 0.01 * 20;
                }
            } else {
                game.obeyDiv.style.display = 'block';
                game.obeyDiv.innerText = 'Use your summoning experience to defeat the goblins !';
                game.camera.position.z = cameraTarget;
                clearInterval(state.fadeIntervalId);
                game.playerMesh.visible = true;
                game.playerMesh.opacity = 1;
            }
        }, 20);

        game.groundMesh.visible = true;

        game.leftWallCollider.setCollisionGroups(0x00000000);
        game.rightWallCollider.setCollisionGroups(0x00000000);
        game.ceilingCollider.setCollisionGroups(0x00000000);

        for (let g = 0; g < game.completedDocuments; g++) {
            const gobSprite = new AnimatedSprite('assets/textures/buildings/isekaied-gob.png', 16, gobAnimations);
            gobSprite.randomAnimation();
            const mesh = gobSprite.mesh;
            mesh.position.copy(game.playerMesh.position);
            mesh.position.z -= 0.01
            mesh.position.x += Math.random() * 500 - 250;

            const rigidBodyDesc = RAPIER.RigidBodyDesc
                .dynamic()
                .setTranslation(mesh.position.x, mesh.position.y)
                .setLinearDamping(0.55)
                .setCcdEnabled(true);
            const rigidBody = game.world.createRigidBody(rigidBodyDesc);
            const colliderDesc = RAPIER.ColliderDesc
                .capsule(7, 1)
                .setCollisionGroups(RapierGroupFactory.composeGroups(['gobs'], ['ground', 'summonedThings']))
                .setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.DYNAMIC_DYNAMIC)
                .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
                .setRestitution(0.5);
            const collider: Collider = game.world.createCollider(colliderDesc, rigidBody);
            mesh.userData = rigidBody;

            gobSprite.mesh.collider = collider;
            gobSprite.mesh.life = 500;

            state.goblins.push(gobSprite);
            game.scene.add(mesh);
        }
    },
    transitions: [
    ]
};
