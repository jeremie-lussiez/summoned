import * as THREE from 'three';
import RAPIER, { ActiveEvents, Collider } from '@dimforge/rapier2d-compat';
import { playerAnimations } from './game/animations/player-animations';
import { summonsReasons } from './game/lists/summons-reasons';
import { summonsPlaces } from './game/lists/summons-places';
import { pickOne } from './game/lists/pick-one';
import { loadAllLanguages, CHATTER_BOX } from './game/effects/chatter-box';
import { AnimatedSprite } from './game/animations/animated-sprite';
import { portalAnimations } from './game/animations/portal-animations';
import { gobAnimations } from './game/animations/gob-animations';
import { Mesh } from 'three';

const obeyDiv: HTMLDivElement = document.getElementById('obey') as HTMLDivElement;
const summonsTextDiv: HTMLDivElement = document.getElementById('summons') as HTMLDivElement;
const summonsDocumentTextDiv: HTMLDivElement = document.getElementById('summonsDocumentText') as HTMLDivElement;
const summonsContainerDiv: HTMLDivElement = document.getElementById('summonsDocumentContainer') as HTMLDivElement;
const music = document.getElementById('music');

let playerHasBeenSummoned = false;
let isFighting = false;
let documentsBeforePortal = 23;
const travellingSpeed = 0.0005;
const workingPower = 1000;
const moveStrength = 60;
const printerStrength = 100;
let suckStrength = 10.5;
let playerSuckStrength = 25;

const gameState = {
    index: 0,
    states: [
        {
            id: 'intro',
            actions: () => {
                isFighting = false;
                playerHasBeenSummoned = false;
                documentsBeforePortal = 5;
            }
        },
        {
            id: 'atWork',
            actions: () => {
                isFighting = false;
                playerHasBeenSummoned = false;
                documentsBeforePortal = 5;
            }
        },
        {
            id: 'working',
            actions: () => {
                isFighting = false;
                playerHasBeenSummoned = false;
                documentsBeforePortal = 5;
            }
        },
        {
            id: 'sucked',
            actions: () => {
                isFighting = false;
                playerHasBeenSummoned = false;
                documentsBeforePortal = 5;
            }
        }
    ]
}

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

const audioListener = new THREE.AudioListener();
camera.add(audioListener);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const repeatFloors = 100;

const updateCamera = (): void => {
    const ratio = window.innerWidth / window.innerHeight;
    camera.aspect = ratio;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
};

let summonStuffSound: THREE.Audio;
new THREE.AudioLoader().load('/public/assets/audio/throw.mp3', (buffer) => {
    summonStuffSound = new THREE.Audio(audioListener);
    summonStuffSound.setBuffer(buffer);
    summonStuffSound.setLoop(false);
    summonStuffSound.setVolume(0.5);
});

let hurtSound: THREE.Audio;
new THREE.AudioLoader().load('/public/assets/audio/hurt.mp3', (buffer) => {
    hurtSound = new THREE.Audio(audioListener);
    hurtSound.setBuffer(buffer);
    hurtSound.setLoop(false);
    hurtSound.setVolume(0.5);
});


window.addEventListener('resize', () => {
    updateCamera();
}, false);


const buildingsMeshes: Mesh[] = [];
const createBuilding = (texture, x: number, y: number, z: number): THREE.Mesh => {
    const topGeometry = new THREE.PlaneGeometry(texture.width, texture.height);
    const topMesh = new THREE.Mesh(topGeometry, texture.topMaterial);
    topMesh.position.x = x;
    topMesh.position.y = y;
    topMesh.position.z = z;
    const repeatGeometry = new THREE.PlaneGeometry(texture.width, texture.repeatHeight * repeatFloors);
    const repeatMesh = new THREE.Mesh(repeatGeometry, texture.repeatMaterial);
    repeatMesh.position.x = 0;
    repeatMesh.position.y = - texture.repeatHeight * repeatFloors / 2 - texture.height / 2;
    repeatMesh.position.z = 0;
    topMesh.add(repeatMesh);
    scene.add(topMesh);
    buildingsMeshes.push(topMesh);
    return topMesh;
}

const loader = new THREE.TextureLoader();

const loadTexture = (name, width, height, repeatHeight) => {
    const texture = {
        top: loader.load('assets/textures/buildings/' + name + '.png'),
        repeat: loader.load('assets/textures/buildings/' + name + '-repeat.png'),
        width: width,
        height: height,
        repeatHeight: repeatHeight,
    }

    texture.repeat.wrapS = THREE.RepeatWrapping;
    texture.repeat.wrapT = THREE.RepeatWrapping;
    texture.repeat.repeat.set(1, 70);

    const topMaterial = new THREE.MeshBasicMaterial({ map: texture.top, transparent: true });
    topMaterial.map.magFilter = THREE.NearestFilter;
    topMaterial.map.minFilter = THREE.NearestFilter;

    texture.topMaterial = topMaterial;

    const repeatMaterial = new THREE.MeshBasicMaterial({ map: texture.repeat, transparent: true });
    repeatMaterial.map.magFilter = THREE.NearestFilter;
    repeatMaterial.map.minFilter = THREE.NearestFilter;

    texture.repeatMaterial = repeatMaterial;

    return texture;
}

const loadSky = () => {
    const skyTexture = loader.load('assets/textures/buildings/sky.png');
    skyTexture.wrapS = THREE.RepeatWrapping;
    skyTexture.repeat.set(400, 1);

    const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, transparent: true });
    skyMaterial.map.magFilter = THREE.NearestFilter;
    skyMaterial.map.minFilter = THREE.NearestFilter;

    const skyGeometry = new THREE.PlaneGeometry(16 * 400, 2000, 1, 1);
    const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyMesh);

    skyMesh.position.z = -500;

}

const loadGround = () => {
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

const textures = [
    loadTexture('skyline-radio', 40, 64, 22),
    loadTexture('skyline-skyscraper', 64, 22, 19),
]

const jamesonBuilding = loadTexture('skyline-jameson', 85, 103, 48);

for (let i = 0; i < 200; i++) {
    const texture = textures[Math.floor(Math.random() * textures.length)];
    const shade = Math.random() * 100 + 155;
    const x = Math.random() * 2000 - 1000;
    const z = Math.random() * 1000 - 500;
    const y = -z;
    createBuilding(texture, x, y, z);
}


const jamesonBuildingLastFloor = 210;
const jamesonBuildingMesh = createBuilding(jamesonBuilding, 0, jamesonBuildingLastFloor, 0);

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

const smallHandMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const smallHandGeometry = new THREE.PlaneGeometry(1, 2, 1, 1);
const bigHandMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const bigHandGeometry = new THREE.PlaneGeometry(1, 3, 1, 1);
const smallHandMesh = new THREE.Mesh(smallHandGeometry, smallHandMaterial);
const bigHandMesh = new THREE.Mesh(bigHandGeometry, bigHandMaterial);

bigHandMesh.position.y = 1;
smallHandMesh.position.y = 0.5;

const bigHandPivot = new THREE.Object3D();
bigHandPivot.position.copy(roomMesh.position);
bigHandPivot.position.z += 0.004;
bigHandPivot.position.x += 17;
bigHandPivot.position.y -= 9;
bigHandPivot.add(bigHandMesh);

const smallHandPivot = new THREE.Object3D();
smallHandPivot.position.copy(roomMesh.position);
smallHandPivot.position.z += 0.005;
smallHandPivot.position.x += 17;
smallHandPivot.position.y -= 9;
smallHandPivot.add(smallHandMesh);

scene.add(bigHandPivot);
scene.add(smallHandPivot);

const backgroundPlate = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000, 1, 1), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0, side: THREE.DoubleSide }));
backgroundPlate.position.copy(roomMesh.position);
backgroundPlate.position.z -= 1;
scene.add(backgroundPlate);

const animations = playerAnimations;

const playerSprite = new AnimatedSprite('/assets/textures/buildings/isekaied-lawyer.png', 16, playerAnimations);
playerSprite.setAnimation('iddleRight');
const playerMesh = playerSprite.mesh;

const gobs: AnimatedSprite[] = [];

playerMesh.position.copy(roomMesh.position);
playerMesh.position.z += 0.01;
playerMesh.position.x += 3;
playerMesh.position.y -= 22;
scene.add(playerMesh);

let start = false;
let zoomInStart = 0;
window.addEventListener('click', (event) => {
    start = true;
});

loadSky();

const portalSprite = new AnimatedSprite('/assets/textures/buildings/isekaied-portal.png', 16, portalAnimations);
const portalMesh = portalSprite.mesh;

const playerPortalSprite = new AnimatedSprite('/assets/textures/buildings/isekaied-portal.png', 8, portalAnimations);
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
scene.add(portalMesh);


const summonsDocuments: THREE.Mesh[] = [];
const summonedThings: THREE.Mesh[] = [];
const summonsDocumentGeometry = new THREE.PlaneGeometry(3, 1, 1, 1);

let suck = false;
let lastTime = performance.now();
let sceneIsReady = false;
let darken = 1;
let lastVelocityDirection = '';
let playerIsIddle = false;
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;

    // const dayCycleOpacity = (Math.sin(now * 0.0005) * 0.5 + 0.5) * 0.9 + 0.1;

    // summonsDocumentMaterial.opacity = dayCycleOpacity;

    if (suck) {
        roomMesh.material.opacity = darken;
        darken -= delta * 0.0005;
        darken = Math.max(0, Math.min(1, darken));
    }

    summonsDocuments.forEach((summonsDocument) => {
        // summonsDocument.position.x -= 0.1;
        const distanceToPortal = portalMesh.position.distanceTo(summonsDocument.position);
        if (distanceToPortal < 10) {
            summonsDocument.material.opacity = 1 - distanceToPortal / 10;
        } else {
            summonsDocument.material.opacity = 1;
        }
        if (distanceToPortal < 3) {
            // scene.remove(summonsDocument);
            summonsDocument.visible = false;
        }
        if (summonsDocument.userData) {
            summonsDocument.position.y = summonsDocument.userData.translation().y;
            summonsDocument.position.x = summonsDocument.userData.translation().x;
            summonsDocument.rotation.z = summonsDocument.userData.rotation();
        }
        // summonsDocument.material.opacity -= 0.01;
        // if (summonsDocument.material.opacity <= 0) {
        //     scene.remove(summonsDocument);
        // }
    });

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
    } else if (!sceneIsReady) {
        music.volume = 0.2;
        music.play();
        sceneIsReady = true;
        obeyDiv.style.display = 'block';
        summonsTextDiv.style.display = 'block';
        buildingsMeshes.forEach((buildingMesh) => {
            buildingMesh.visible = false;
        });
    }

    bigHandPivot.rotation.z -= delta * 0.0002;
    smallHandPivot.rotation.z -= delta * 0.0002 / (Math.PI * 4);

    if (isFighting) {
        camera.position.x = playerMesh.position.x;
        camera.position.y = playerMesh.position.y + 10;

        if (playerMesh.userData) {
            const body = playerMesh.userData;
            const velocity = body.linvel();
            if (Math.abs(velocity.x) < 0.01) {
                playerSprite.setAnimation('iddle' + lastVelocityDirection);
                playerIsIddle = true;
            } else {
                const direction: string = velocity.x > 0 ? 'Right' : 'Left';
                if (lastVelocityDirection !== direction || playerIsIddle) {
                    playerIsIddle = false;
                    playerSprite.setAnimation('walking' + direction);
                    lastVelocityDirection = direction;
                }
            }
        }

    }

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
        .setCollisionGroups(0x0001000f)
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
        // .setCollisionGroups(0x00010007)
        .setCollisionGroups(0x00000000)
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
        .setCollisionGroups(0x0001000f)
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
        .setCollisionGroups(0x0001000f)
        .setRestitution(0.4);
    rightWallCollider = world.createCollider(rightWallColliderDesc, rightWallRigidBody);

    let lastPhysicsTime = performance.now();
    const timeScale = 1.0;

    let gameLoop = () => {
        const currentTime = performance.now();
        world.timestep = (currentTime - lastPhysicsTime) / 1000.0 * timeScale;
        lastPhysicsTime = currentTime;

        if (suck) {
            summonsDocuments.forEach((mesh) => {
                if (mesh.userData) {
                    const body = mesh.userData as RAPIER.RigidBody;
                    let suckAngle = Math.atan2(
                        portalMesh.position.y - body.translation().y,
                        portalMesh.position.x - body.translation().x
                    );
                    let suckForce = {
                        x: Math.cos(suckAngle) * suckStrength,
                        y: Math.sin(suckAngle) * suckStrength
                    };
                    body.applyImpulse(suckForce, true);
                    let distance = Math.sqrt(
                        Math.pow(portalMesh.position.x - body.translation().x, 2) +
                        Math.pow(portalMesh.position.y - body.translation().y, 2)
                    );
                    if (distance < 5) {
                        world.removeCollider(body.collider(0), true);
                        world.removeRigidBody(body);
                        mesh.visible = false;
                        mesh.userData = null;
                    }
                }
            });

            if (playerMesh.userData && !isFighting) {
                const body = playerMesh.userData;
                let suckAngle = Math.atan2(
                    portalMesh.position.y - body.translation().y,
                    portalMesh.position.x - body.translation().x
                );
                let suckForce = {
                    x: Math.cos(suckAngle) * playerSuckStrength,
                    y: Math.sin(suckAngle) * playerSuckStrength
                };
                let distance = Math.sqrt(
                    Math.pow(portalMesh.position.x - body.translation().x, 2) +
                    Math.pow(portalMesh.position.y - body.translation().y, 2)
                ) - 8;
                if (distance < 0) {
                    // world.removeRigidBody(body);
                    playerHasBeenSummoned = true;
                    // playerMesh.userData = null;
                    obeyDiv.style.display = 'block';
                    obeyDiv.innerText = 'YOU have been summoned !';
                    // backgroundPlate.material.opacity = 0;
                    smallHandMesh.visible = false;
                    bigHandMesh.visible = false;
                }
                if (body) {
                    body.applyImpulse(suckForce, true);
                }
            }

        }

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

const createSummonsDocument = (documentNumber: number): void => {
    const name = 'Jameson, Jameson, Jameson & Partners';
    const futureOffset = 3600 * 24 * 365 * 1000 * 10;
    const date = new Date(Date.now() + (3600 * 1000 * 24 * documentNumber) + futureOffset).toLocaleDateString();
    const time = `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
    const place = pickOne(summonsPlaces);
    const reason = pickOne(summonsReasons);

    const summonsDocumentMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const summonsDocumentMesh = new THREE.Mesh(summonsDocumentGeometry, summonsDocumentMaterial);
    summonsDocumentMesh.position.copy(roomMesh.position);
    summonsDocumentMesh.position.z += 0.2;
    summonsDocumentMesh.position.x += 20;
    summonsDocumentMesh.position.y -= 24;
    scene.add(summonsDocumentMesh);


    const summonsDocumentRigidBodyDesc = RAPIER.RigidBodyDesc
        .dynamic()
        .setTranslation(summonsDocumentMesh.position.x, summonsDocumentMesh.position.y)
        .setLinearDamping(0.55)
        .setCcdEnabled(true);
    const summonsDocumentRigidBody = world.createRigidBody(summonsDocumentRigidBodyDesc);
    const summonsDocumentColliderDesc = RAPIER.ColliderDesc
        .cuboid(1.5, 0.5)
        .setCollisionGroups(0x00080001)
        .setRestitution(0.5);
    const summonsDocumentCollider = world.createCollider(summonsDocumentColliderDesc, summonsDocumentRigidBody);
    summonsDocumentMesh.userData = summonsDocumentRigidBody;
    summonsDocumentMesh.collider = summonsDocumentCollider;

    const printerImpulse = { x: -printerStrength, y: 10 };
    summonsDocumentRigidBody.applyImpulse(printerImpulse, true);

    summonsDocuments.push(summonsDocumentMesh);

    const text = `We, ${name}, hereby summon you to appear before the court on ${date} at ${time} in ${place} to answer the following charges: ${reason}. Failure to appear will result in a warrant for your arrest.`;

    summonsDocumentTextDiv.innerText = text;
    summonsContainerDiv.style.display = 'block';
}

let currentDocument = {
    progression: 0,
    documentNumber: 0,
    difficulty: 6000,
};

mousePlane.position.z = roomMesh.position.z;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const stuffDefinitions = [
    {
        id: 'rubberDuck',
        index: 0,
        width: 3,
        height: 3,
        material: null,
    },
    {
        id: 'anvil',
        index: 1,
        width: 5,
        height: 4,
        material: null,
    },
    {
        id: 'paperClip',
        index: 2,
        width: 4,
        height: 3,
        material: null,
    },
    {
        id: 'boomBox',
        index: 3,
        width: 8,
        height: 4,
        material: null,
    },
    {
        id: 'boozeBottle',
        index: 4,
        width: 1,
        height: 5,
        material: null,
    },
    {
        id: 'shovel',
        index: 5,
        width: 1,
        height: 8,
        material: null,
    },
    {
        id: 'rubberChicken',
        index: 6,
        width: 1,
        height: 6,
        material: null,
    }
];

const stuffFrames = 7;
const stuffSize = 8;

stuffDefinitions.forEach((definition) => {
    const texture = new THREE.TextureLoader().load('assets/textures/buildings/stuff.png');
    const stuffMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.repeat.set(1 / stuffFrames, 1);
    stuffMaterial.map.offset.x = definition.index / stuffFrames;
    definition.material = stuffMaterial;
});

const summonStuff = (x: number, y: number, z: number, force: number, angle: number) => {

    const definition = stuffDefinitions[Math.floor(Math.random() * stuffDefinitions.length)];

    const stuffGeometry = new THREE.PlaneGeometry(stuffSize, stuffSize, 1, 1);
    const stuffMesh = new THREE.Mesh(stuffGeometry, definition.material);
    stuffMesh.position.z = z;
    stuffMesh.position.x = x;
    stuffMesh.position.y = y;
    scene.add(stuffMesh);

    const stuffRigidBodyDesc = RAPIER.RigidBodyDesc
        .dynamic()
        .setTranslation(stuffMesh.position.x, stuffMesh.position.y)
        .setLinearDamping(0.55)
        .setCcdEnabled(true);
    const stuffRigidBody = world.createRigidBody(stuffRigidBodyDesc);
    const stuffColliderDesc = RAPIER.ColliderDesc
        .cuboid(definition.width / 2, definition.height / 2)
        .setCollisionGroups(0x00040003)
        .setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.DYNAMIC_DYNAMIC)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS)
        .setRestitution(0.5);
    const stuffCollider = world.createCollider(stuffColliderDesc, stuffRigidBody);
    stuffMesh.userData = stuffRigidBody;
    stuffMesh.collider = stuffCollider;

    const stuffImpulse = { x: Math.cos(angle) * force, y: Math.sin(angle) * force };
    stuffRigidBody.applyImpulse(stuffImpulse, true);

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

        // 0x00010007
        leftWallCollider.setCollisionGroups(0x00000000);
        rightWallCollider.setCollisionGroups(0x00000000);
        ceilingCollider.setCollisionGroups(0x00000000);

        for (let g = 0; g < currentDocument.documentNumber; g++) {
            const gobSprite = new AnimatedSprite('/assets/textures/buildings/isekaied-gob.png', 16, gobAnimations);
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
                .setCollisionGroups(0x00020005)
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

        obeyDiv.style.display = 'none';

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
        obeyDiv.style.display = 'none';
        CHATTER_BOX.start('keyboard2', 0.8, 0.25);
        lastKeyEvent = performance.now();
        if (!isTyping) {
            isTyping = true;
            playerSprite.setAnimation('typing');
        }
        if (currentDocument.progression >= currentDocument.difficulty) {
            createSummonsDocument(currentDocument.documentNumber);
            currentDocument = {
                progression: 0,
                documentNumber: currentDocument.documentNumber + 1,
                difficulty: Math.random() * 10000 + 2000,
            };

            summonsTextDiv.innerText = `Summons: ${currentDocument.documentNumber}`;

            if (currentDocument.documentNumber >= documentsBeforePortal) {
                summonsContainerDiv.style.display = 'none';
                portalMesh.visible = true;
                playerSprite.setAnimation('falling');

                const playerRigidBodyDesc = RAPIER.RigidBodyDesc
                    .dynamic()
                    .setTranslation(playerMesh.position.x, playerMesh.position.y)
                    .setLinearDamping(0.5)
                    .setCcdEnabled(true);
                const playerRigidBody = world.createRigidBody(playerRigidBodyDesc);
                const playerColliderDesc = RAPIER.ColliderDesc
                    .cuboid(4, 8)
                    .setCollisionGroups(0x00010001)
                    .setRestitution(0.5);
                const playerCollider = world.createCollider(playerColliderDesc, playerRigidBody);
                playerMesh.userData = playerRigidBody;

                suck = true;
            }

        } else {
            currentDocument.progression += workingPower;
        }
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
        if (event.key !== lastKey && sceneIsReady && portalMesh.visible === false) {
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
