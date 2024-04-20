import * as THREE from 'three';
import RAPIER, { ActiveEvents, Collider } from '@dimforge/rapier2d-compat';
import { playerAnimations } from './game/animations/player-animations';
import { summonsReasons } from './game/lists/summons-reasons';
import { summonsPlaces } from './game/lists/summons-places';
import { pickOne } from './game/lib/pick-one';
import { loadAllLanguages, CHATTER_BOX } from './game/lib/chatter-box';
import { AnimatedSprite, AnimatedSpriteDirection } from './game/lib/animated-sprite';
import { portalAnimations } from './game/animations/portal-animations';
import { gobAnimations } from './game/animations/gob-animations';
import { Mesh } from 'three';
import { RapierGroupFactory } from './game/lib/rapier-group-factory';
import { SKYSCRAPER_TEXTURES, createSkyscraper } from './game/scenery/skyline';
import { stuffList } from './game/animations/stuff-list';
import { GameStateManager } from './game/lib/game-state-manager';
import { loadSky } from './game/scenery/sky';
import { INTRO_STATE_DEFINITION } from './game/states/intro';
import { AT_WORK_STATE_DEFINITION } from './game/states/at-work';
import { WORKING_STATE_DEFINITION } from './game/states/working';
import { SUMMONED_BY_PORTAL_STATE_DEFINITION } from './game/states/summoned-by-portal';
import { FIGHTING_GOBLINS_STATE_DEFINITION } from './game/states/fighting-goblins';
import { createClock, updateClock } from './game/scenery/clock';
import { HAS_BEEN_SUMMONED_STATE_DEFINITION } from './game/states/has-been-summoned';

RapierGroupFactory.createGroup('ground');
RapierGroupFactory.createGroup('player');
RapierGroupFactory.createGroup('gobs');
RapierGroupFactory.createGroup('summonsDocuments');
RapierGroupFactory.createGroup('summonedThings');

export class PhysicsGameSpriteEntity {
    id: number;
    public sprite: AnimatedSprite;
    public body: RAPIER.RigidBody;
    public collider: RAPIER.Collider;
}

const music = document.getElementById('music');

let playerHasBeenSummoned = false;
let isFighting = false;
const travellingSpeed = 0.005;
const moveStrength = 60;


const scene = new THREE.Scene();

const mousePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(50000, 50000, 1, 1),
    new THREE.MeshBasicMaterial({
        color: 0xff00ff, alphaTest: 0, visible: false
    })
);
scene.add(mousePlane);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.y = 160;
camera.position.z = 400;
camera.position.x = 10;

const stateManager = new GameStateManager(
    camera,
    {
        scene: scene,
        suckableThings: [] as Mesh[],
        currentDocumentProgression: 0,
        documentsBeforePortal: 1,
        completedDocuments: 0,
        obeyDiv: document.getElementById('obey') as HTMLDivElement,
        summonsTextDiv: document.getElementById('summons') as HTMLDivElement,
        summonsDocumentTextDiv: document.getElementById('summonsDocumentText') as HTMLDivElement,
        summonsContainerDiv: document.getElementById('summonsDocumentContainer') as HTMLDivElement,
        progressDiv: document.getElementById('progress') as HTMLDivElement,
        progressChildDiv: document.getElementById('progressChild') as HTMLDivElement,
    }
);

const INTRO_STATE = stateManager.addState(INTRO_STATE_DEFINITION);
const AT_WORK_STATE = stateManager.addState(AT_WORK_STATE_DEFINITION);
const WORKING_STATE = stateManager.addState(WORKING_STATE_DEFINITION);
const SUMMONED_BY_PORTAL_STATE = stateManager.addState(SUMMONED_BY_PORTAL_STATE_DEFINITION);
const FIGHTING_GOBLINS_STATE = stateManager.addState(FIGHTING_GOBLINS_STATE_DEFINITION);
const HAS_BEEN_SUMMONED_STATE = stateManager.addState(HAS_BEEN_SUMMONED_STATE_DEFINITION);


const audioListener = new THREE.AudioListener();
camera.add(audioListener);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const updateCamera = (): void => {
    const ratio = window.innerWidth / window.innerHeight;
    camera.aspect = ratio;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
};

let summonStuffSound: THREE.Audio;
new THREE.AudioLoader().load('assets/audio/throw.mp3', (buffer) => {
    summonStuffSound = new THREE.Audio(audioListener);
    summonStuffSound.setBuffer(buffer);
    summonStuffSound.setLoop(false);
    summonStuffSound.setVolume(0.5);
});

let hurtSound: THREE.Audio;
new THREE.AudioLoader().load('assets/audio/hurt.mp3', (buffer) => {
    hurtSound = new THREE.Audio(audioListener);
    hurtSound.setBuffer(buffer);
    hurtSound.setLoop(false);
    hurtSound.setVolume(0.5);
});


window.addEventListener('resize', () => {
    updateCamera();
}, false);

const buildingsMeshes: Mesh[] = [];

for (let i = 0; i < 200; i++) {
    const texture = SKYSCRAPER_TEXTURES[Math.floor(Math.random() * SKYSCRAPER_TEXTURES.length - 1) + 1];
    const x = Math.random() * 2000 - 1000;
    const z = Math.random() * 1000 - 500;
    const y = -z;
    const mesh = createSkyscraper(scene, texture, x, y, z);
    buildingsMeshes.push(mesh);
}

const jamesonBuildingLastFloor = 210;
const jamesonBuildingMesh = createSkyscraper(scene, SKYSCRAPER_TEXTURES[0], 0, jamesonBuildingLastFloor, 0);
buildingsMeshes.push(jamesonBuildingMesh);

const skyMesh = loadSky();
scene.add(skyMesh);

const loadGround = () => {
    const loader = new THREE.TextureLoader();
    const texture = loader.load('assets/textures/buildings/ground.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(400, 1);

    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    material.map.magFilter = THREE.NearestFilter;
    material.map.minFilter = THREE.NearestFilter;

    const geometry = new THREE.PlaneGeometry(32 * 400, 32, 1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

const loader = new THREE.TextureLoader();
const roomTexture = loader.load('assets/textures/buildings/rooms.png');
const roomMaterial = new THREE.MeshBasicMaterial({ map: roomTexture, transparent: true });
roomMaterial.map.magFilter = THREE.NearestFilter;
roomMaterial.map.minFilter = THREE.NearestFilter;
const roomGeometry = new THREE.PlaneGeometry(64, 64);
const roomMesh = new THREE.Mesh(roomGeometry, roomMaterial);
roomMesh.position.x = 9;
roomMesh.position.y = jamesonBuildingLastFloor - 34;
roomMesh.position.z = -20;
scene.add(roomMesh);

stateManager.data.roomPosition = roomMesh.position;
stateManager.data.roomMesh = roomMesh;


const clock = createClock();
clock.position.copy(roomMesh.position);
clock.position.z += 0.004;
clock.position.x += 17;
clock.position.y -= 9;
scene.add(clock);

const backgroundPlate = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000, 1, 1), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0, side: THREE.DoubleSide }));
backgroundPlate.position.copy(roomMesh.position);
backgroundPlate.position.z -= 1;
scene.add(backgroundPlate);

const animations = playerAnimations;

const playerSprite = new AnimatedSprite('assets/textures/buildings/isekaied-lawyer.png', 16, playerAnimations);
playerSprite.setAnimation('iddle');
const playerMesh = playerSprite.mesh;

const gobs: AnimatedSprite[] = [];

playerMesh.position.copy(roomMesh.position);
playerMesh.position.z += 0.01;
playerMesh.position.x += 3;
playerMesh.position.y -= 22;
scene.add(playerMesh);

stateManager.data.playerMesh = playerMesh;

let start = false;
let zoomInStart = 0;
window.addEventListener('click', (event) => {
    start = true;
});

loadSky();

const portalSprite = new AnimatedSprite('assets/textures/buildings/isekaied-portal.png', 16, portalAnimations);
const portalMesh = portalSprite.mesh;

const playerPortalSprite = new AnimatedSprite('assets/textures/buildings/isekaied-portal.png', 8, portalAnimations);
const playerPortalMesh = playerPortalSprite.mesh;
playerPortalMesh.material.opacity = 0.5;
playerPortalMesh.visible = false;
scene.add(playerPortalMesh);

portalMesh.position.copy(roomMesh.position);
portalMesh.position.y -= 2;
portalMesh.position.z += 0.02;
portalMesh.position.x += 2;
portalMesh.rotation.z = Math.PI * 0.5;
portalMesh.visible = false;
stateManager.data.portalMesh = portalMesh;
scene.add(portalMesh);


const summonsDocuments: THREE.Mesh[] = [];
const summonedThings: THREE.Mesh[] = [];

let suck = false;
let lastTime = performance.now();
let lastVelocityDirection = AnimatedSpriteDirection.Right;
let playerIsIddle = false;
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;

    // const dayCycleOpacity = (Math.sin(now * 0.0005) * 0.5 + 0.5) * 0.9 + 0.1;

    // summonsDocumentMaterial.opacity = dayCycleOpacity;

    updateClock(clock, now * 0.00001);

    stateManager.update();

    summonedThings.forEach((summonedThing) => {
        if (summonedThing.userData) {
            summonedThing.position.y = summonedThing.userData.translation().y;
            summonedThing.position.x = summonedThing.userData.translation().x;
            summonedThing.rotation.z = summonedThing.userData.rotation();
        }
    });

    if (playerMesh.userData) {
        if (suck && !isFighting) {
            playerMesh.position.y = playerMesh.userData.translation().y;
            playerMesh.position.x = playerMesh.userData.translation().x;
            playerMesh.rotation.z = playerMesh.userData.rotation();
            const distanceToPortal = portalMesh.position.distanceTo(playerMesh.position) - 8;
            if (distanceToPortal < 5) {
                playerMesh.material.opacity = distanceToPortal / 5;
            } else {
                playerMesh.material.opacity = 1;
            }
        } else if (isFighting) {
            playerMesh.position.y = playerMesh.userData.translation().y;
            playerMesh.position.x = playerMesh.userData.translation().x;
            playerMesh.rotation.z = playerMesh.userData.rotation();
            playerMesh.material.opacity = 1;
        }
    }

    if (playerMesh.userData?.translation) {
        playerMesh.position.y = playerMesh.userData.translation().y;
        playerMesh.position.x = playerMesh.userData.translation().x;
        playerMesh.rotation.z = playerMesh.userData.rotation();
    }


    portalSprite.update(now);
    playerSprite.update(now);
    playerPortalSprite.update(now);

    gobs.forEach((gob) => {
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
            }
        }
    });

    if (!start) {
        zoomInStart = now;
    }

    if (camera.position.z > 1.8 && !isFighting && !playerHasBeenSummoned) {
        camera.position.z = (Math.cos((now - zoomInStart) * travellingSpeed) * 250 + 250) - 1;
        const distance = camera.position.z;
        const opacityDistanceThreshold = 80;
        if (distance < opacityDistanceThreshold) {
            jamesonBuildingMesh.material.opacity = distance / opacityDistanceThreshold;
            jamesonBuildingMesh.children[0].material.opacity = distance / opacityDistanceThreshold;
            backgroundPlate.material.opacity = 1 - distance / opacityDistanceThreshold;
        } else {
            jamesonBuildingMesh.material.opacity = 1;
            jamesonBuildingMesh.children[0].material.opacity = 1;
            backgroundPlate.material.opacity = 0;
        }
    }/* else if (stateManager.currentState === INTRO_STATE) {
        music.volume = 0.2;
        music.play();
        sceneIsReady = true;

        buildingsMeshes.forEach((buildingMesh) => {
            buildingMesh.visible = false;
        });
    }*/

    if (isFighting) {
        camera.position.x = playerMesh.position.x;
        camera.position.y = playerMesh.position.y + 10;

        if (playerMesh.userData) {
            const body = playerMesh.userData;
            const velocity = body.linvel();
            if (Math.abs(velocity.x) < 0.01) {
                playerSprite.setAnimation('iddle', lastVelocityDirection);
                playerIsIddle = true;
            } else {
                const direction = velocity.x > 0 ? AnimatedSpriteDirection.Right : AnimatedSpriteDirection.Left;
                if (lastVelocityDirection !== direction || playerIsIddle) {
                    playerIsIddle = false;
                    playerSprite.setAnimation('walking', direction);
                    lastVelocityDirection = direction;
                }
            }
        }

    }

    stateManager.checkTransitions();

}
animate();

let world: RAPIER.World;

const groundMesh = loadGround();
groundMesh.position.copy(roomMesh.position);
groundMesh.position.z -= 0.01;
groundMesh.position.y -= 46;
groundMesh.visible = false;
scene.add(groundMesh);

let leftWallCollider;
let rightWallCollider;
let ceilingCollider;

let isRight = false;
let isLeft = false;
let isUp = false;
let isDown = false;

window.addEventListener('keydown', (event) => {
    isUp = event.key === 'ArrowUp' ? true : isUp;
    isDown = event.key === 'ArrowDown' ? true : isDown;
    isLeft = event.key === 'ArrowLeft' ? true : isLeft;
    isRight = event.key === 'ArrowRight' ? true : isRight;
});

window.addEventListener('keyup', (event) => {
    isUp = event.key === 'ArrowUp' ? false : isUp;
    isDown = event.key === 'ArrowDown' ? false : isDown;
    isLeft = event.key === 'ArrowLeft' ? false : isLeft;
    isRight = event.key === 'ArrowRight' ? false : isRight;
});

window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

RAPIER.init().then(() => {

    let eventQueue = new RAPIER.EventQueue(true);

    let gravity = { x: 0.0, y: -9.81 };
    world = new RAPIER.World(gravity);

    stateManager.data.world = world;
    stateManager.setState(INTRO_STATE.id);

    // const debugMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    // const debugGeometry = new THREE.PlaneGeometry(120, 4, 1, 1);
    // const debugMesh = new THREE.Mesh(debugGeometry, debugMaterial);
    // debugMesh.position.copy(roomMesh.position);
    // debugMesh.position.z += 0.02;
    // debugMesh.position.y += 2;
    // debugMesh.position.x += 0;
    // scene.add(debugMesh);

    const groundRigidBodyDesc = RAPIER.RigidBodyDesc
        .fixed()
        .setTranslation(roomMesh.position.x, roomMesh.position.y - 32)
        .setLinearDamping(0.95)
        .setCcdEnabled(true);
    const groundRigidBody = world.createRigidBody(groundRigidBodyDesc);
    const groundColliderDesc = RAPIER.ColliderDesc
        .cuboid(1000, 2)
        .setCollisionGroups(RapierGroupFactory.composeGroups(['ground']))
        .setRestitution(0.4);
    const groundCollider = world.createCollider(groundColliderDesc, groundRigidBody);

    const ceilingRigidBodyDesc = RAPIER.RigidBodyDesc
        .fixed()
        .setTranslation(roomMesh.position.x, roomMesh.position.y + 2)
        .setLinearDamping(0.95)
        .setCcdEnabled(true);
    const ceilingRigidBody = world.createRigidBody(ceilingRigidBodyDesc);
    const ceilingColliderDesc = RAPIER.ColliderDesc
        .cuboid(60, 2)
        .setCollisionGroups(RapierGroupFactory.composeGroups(['ground']))
        .setRestitution(0.4);
    ceilingCollider = world.createCollider(ceilingColliderDesc, ceilingRigidBody);

    const leftWallRigidBodyDesc = RAPIER.RigidBodyDesc
        .fixed()
        .setTranslation(roomMesh.position.x - 32, roomMesh.position.y - 32)
        .setLinearDamping(0.95)
        .setCcdEnabled(true);
    const leftWallRigidBody = world.createRigidBody(leftWallRigidBodyDesc);
    const leftWallColliderDesc = RAPIER.ColliderDesc
        .cuboid(2, 60)
        .setCollisionGroups(RapierGroupFactory.composeGroups(['ground']))
        .setRestitution(0.4);
    leftWallCollider = world.createCollider(leftWallColliderDesc, leftWallRigidBody);

    const rightWallRigidBodyDesc = RAPIER.RigidBodyDesc
        .fixed()
        .setTranslation(roomMesh.position.x + 32, roomMesh.position.y - 32)
        .setLinearDamping(0.95)
        .setCcdEnabled(true);
    const rightWallRigidBody = world.createRigidBody(rightWallRigidBodyDesc);
    const rightWallColliderDesc = RAPIER.ColliderDesc
        .cuboid(2, 60)
        .setCollisionGroups(RapierGroupFactory.composeGroups(['ground']))
        .setRestitution(0.4);
    rightWallCollider = world.createCollider(rightWallColliderDesc, rightWallRigidBody);

    stateManager.data.leftWallCollider = leftWallCollider;
    stateManager.data.rightWallCollider = rightWallCollider;
    stateManager.data.ceilingCollider = ceilingCollider;


    const playerRigidBodyDesc = RAPIER.RigidBodyDesc
        .dynamic()
        .setTranslation(playerMesh.position.x, playerMesh.position.y)
        .setLinearDamping(0.5)
        .setCcdEnabled(true);
    const playerRigidBody = world.createRigidBody(playerRigidBodyDesc);
    const playerColliderDesc = RAPIER.ColliderDesc
        .cuboid(4, 8)
        .setCollisionGroups(RapierGroupFactory.composeGroups(['player'], ['ground']))
        .setRestitution(0.5);
    const playerCollider = world.createCollider(playerColliderDesc, playerRigidBody);
    playerMesh.userData = playerRigidBody;

    let lastPhysicsTime = performance.now();
    const timeScale = 1.0;

    let gameLoop = () => {
        const currentTime = performance.now();
        world.timestep = (currentTime - lastPhysicsTime) / 1000.0 * timeScale;
        lastPhysicsTime = currentTime;

        stateManager.action('suck');

        gobs.forEach((gob) => {
            if (gob.mesh.userData) {
                const body = gob.mesh.userData;
                if (!gob.mesh.isDead) {
                    if (Math.random() < 0.05) {
                        const strength = 400;
                        body.applyImpulse({ x: Math.random() * strength - strength / 2, y: Math.random() * strength - strength / 2 }, true);
                    }
                    body.setRotation(0, true);
                }
            }
        });

        if (isFighting) {

            if (playerMesh.userData) {
                const body = playerMesh.userData;
                if (isRight) {
                    body.applyImpulse({ x: moveStrength, y: 0 }, true);
                }
                if (isLeft) {
                    body.applyImpulse({ x: -moveStrength, y: 0 }, true);
                }
            }

            playerMesh.userData.setRotation(0, true);
        }

        world.step(eventQueue);

        eventQueue.drainCollisionEvents((handle1, handle2, started) => {

            if (started) {
                // let handle1 = event.collider1();
                // let handle2 = event.collider2();

                let gob;
                let stuff;

                if (handle1) {
                    gob = gobs.find((gob) => {
                        if (gob.mesh.userData && gob.mesh.collider.handle === handle1) {
                            return true;
                        }
                    });
                    stuff = summonedThings.find((summonedThing) => {
                        if (summonedThing.userData && summonedThing.collider.handle === handle1) {
                            return true;
                        }
                    });
                }

                if (handle2) {
                    if (!gob) {
                        gob = gobs.find((gob) => {
                            if (gob.mesh.userData && gob.mesh.collider.handle === handle2) {
                                return true;
                            }
                        });
                    }
                    if (!stuff) {
                        stuff = summonedThings.find((summonedThing) => {
                            if (summonedThing.userData && summonedThing.collider.handle === handle2) {
                                return true;
                            }
                        });
                    }
                }

                if (gob && stuff) {
                    if (!gob.mesh.isDead) {
                        hurtSound.play();
                        gob.mesh.life -= 100;
                        if (gob.mesh.life <= 0) {
                            currentDocument.documentNumber--;
                            summonsTextDiv.innerText = `Summons: ${currentDocument.documentNumber}`;
                            gob.mesh.isDead = true;
                            gob.setAnimation('dead');
                        }
                        if (currentDocument.documentNumber === 0) {
                            summonsTextDiv.innerText = `Go back to the portal!`;
                            isFighting = false;
                            playerSprite.setAnimation('falling');
                        }
                    }
                }
            }

        });

        setTimeout(gameLoop, 1000 / 60);
    };

    gameLoop();
});

mousePlane.position.z = roomMesh.position.z;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const stuffSize = 8;
const summonStuff = (x: number, y: number, z: number, force: number, angle: number) => {

    const stuffSprite = new AnimatedSprite('assets/textures/buildings/stuff.png', stuffSize, stuffList);
    const definition = stuffSprite.randomAnimation();

    const stuffMesh = stuffSprite.mesh;
    stuffMesh.position.z = z;
    stuffMesh.position.x = x;
    stuffMesh.position.y = y;

    if (definition.width && definition.height) {
        const stuffRigidBodyDesc = RAPIER.RigidBodyDesc
            .dynamic()
            .setTranslation(stuffMesh.position.x, stuffMesh.position.y)
            .setLinearDamping(0.55)
            .setCcdEnabled(true);
        const stuffRigidBody = world.createRigidBody(stuffRigidBodyDesc);
        const stuffColliderDesc = RAPIER.ColliderDesc
            .cuboid(definition.width / 2, definition.height / 2)
            .setCollisionGroups(RapierGroupFactory.composeGroups(['summonedThings'], ['ground', 'gobs']))
            .setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.DYNAMIC_DYNAMIC)
            .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS)
            .setRestitution(0.5);
        const stuffCollider = world.createCollider(stuffColliderDesc, stuffRigidBody);
        stuffMesh.userData = stuffRigidBody;
        stuffMesh.collider = stuffCollider;

        const stuffImpulse = { x: Math.cos(angle) * force, y: Math.sin(angle) * force };
        stuffRigidBody.applyImpulse(stuffImpulse, true);
    }
    scene.add(stuffMesh);

    summonStuffSound.play();

    summonedThings.push(stuffMesh);

}

let backgroundFade = 1;
let fadeIntervalId = 0;
addEventListener('click', (event) => {

    if (playerHasBeenSummoned && !isFighting) {
        // isFighting = true;
        // playerSprite.setAnimation('knightSlashingRight');
        // setTimeout(() => {
        //     isFighting = false;
        //     playerSprite.setAnimation('knightSlashingLeft');
        // }, 1000);
        obeyDiv.style.display = 'none';

        groundMesh.visible = true;

        const cameraTarget = camera.position.z + 20;

        leftWallCollider.setCollisionGroups(0x00000000);
        rightWallCollider.setCollisionGroups(0x00000000);
        ceilingCollider.setCollisionGroups(0x00000000);

        for (let g = 0; g < currentDocument.documentNumber; g++) {
            const gobSprite = new AnimatedSprite('assets/textures/buildings/isekaied-gob.png', 16, gobAnimations);
            gobSprite.randomAnimation();
            const mesh = gobSprite.mesh;
            mesh.position.copy(playerMesh.position);
            mesh.position.z -= 0.01
            mesh.position.x += Math.random() * 50 - 25;

            const rigidBodyDesc = RAPIER.RigidBodyDesc
                .dynamic()
                .setTranslation(mesh.position.x, mesh.position.y)
                .setLinearDamping(0.55)
                .setCcdEnabled(true);
            const rigidBody = world.createRigidBody(rigidBodyDesc);
            const colliderDesc = RAPIER.ColliderDesc
                .capsule(7, 1)
                .setCollisionGroups(RapierGroupFactory.composeGroups(['gobs'], ['ground', 'summonedThings']))
                .setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.DYNAMIC_DYNAMIC)
                .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
                .setRestitution(0.5);
            const collider: Collider = world.createCollider(colliderDesc, rigidBody);
            mesh.userData = rigidBody;

            gobSprite.mesh.collider = collider;
            gobSprite.mesh.life = 500;

            gobs.push(gobSprite);
            scene.add(mesh);
        }

        fadeIntervalId = window.setInterval(() => {
            if (backgroundFade > 0) {
                backgroundFade -= 0.01;
                backgroundFade = Math.max(0, backgroundFade);
                backgroundPlate.material.opacity = backgroundFade;
                camera.position.z += 0.01 * 20;
            } else {

                obeyDiv.style.display = 'block';
                obeyDiv.innerText = 'Use your summoning experience to defeat the goblins !';
                isFighting = true;
                camera.position.z = cameraTarget;
                clearInterval(fadeIntervalId);
            }
        }, 20);

    }

    if (isFighting) {

        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const intersects = raycaster.intersectObjects([mousePlane]);

        const xPos = intersects[0].point.x;
        const yPos = intersects[0].point.y;

        const distanceToSprite = Math.sqrt(Math.pow(playerMesh.position.x - xPos, 2) + Math.pow(playerMesh.position.y - yPos, 2));

        const angle = Math.atan2(yPos - playerMesh.position.y, xPos - playerMesh.position.x);

        playerPortalMesh.visible = true;

        playerPortalMesh.position.z = playerMesh.position.z;
        playerPortalMesh.position.x = playerMesh.position.x + Math.cos(angle) * 8;
        playerPortalMesh.position.y = playerMesh.position.y + Math.sin(angle) * 8;

        summonStuff(playerPortalMesh.position.x, playerPortalMesh.position.y, playerMesh.position.z + 0.01, distanceToSprite * 20 + 5, angle);

        window.setTimeout(() => {
            playerPortalMesh.visible = false;
        }, 200);
    }

});

window.addEventListener('mousemove', (event) => {

    if (isFighting) {

        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const intersects = raycaster.intersectObjects([mousePlane]);

        const xPos = intersects[0].point.x;
        const yPos = intersects[0].point.y;

        const angle = Math.atan2(yPos - playerMesh.position.y, xPos - playerMesh.position.x);

        playerPortalMesh.position.z = playerMesh.position.z;
        playerPortalMesh.position.x = playerMesh.position.x + Math.cos(angle) * 8;
        playerPortalMesh.position.y = playerMesh.position.y + Math.sin(angle) * 8;
    }

});


loadAllLanguages().then(() => {
    const toleratedDelay = 500;
    let lastKeyEvent = performance.now();
    let isTyping = false;

    const work = () => {
        CHATTER_BOX.start('keyboard2', 0.8, 0.25);
        lastKeyEvent = performance.now();
        if (!isTyping) {
            isTyping = true;
            playerSprite.setAnimation('typing');
        }

        // createSummonsDocument(currentDocument.documentNumber);
        stateManager.action('work');
        stateManager.checkTransitions();
    }

    const procrastinate = () => {
        const now = performance.now();
        if (isTyping && now - lastKeyEvent > toleratedDelay) {
            isTyping = false;
            CHATTER_BOX.stop();
            playerSprite.setAnimation('sitting');
        }
    };

    let lastKey = '';
    window.addEventListener('keydown', (event) => {
        if (event.key !== lastKey && stateManager.currentState === AT_WORK_STATE || stateManager.currentState === WORKING_STATE) {
            work();
            lastKey = event.key;
        }
    });

    window.setInterval(() => {
        if (portalMesh.visible === false) {
            procrastinate();
        } else {
            CHATTER_BOX.stop();
        }
    }, toleratedDelay / 2);
});

