import * as THREE from 'three';
import { CHATTER_BOX, loadAllLanguages } from './game/lib/effects/chatter-box';
import RAPIER, { ActiveEvents } from '@dimforge/rapier2d-compat';

let playerHasBeenSummoned = false;

const documentsBeforePortal = 50;
const travellingSpeed = 0.0005;
const workingPower = 1000;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.y = 160;
camera.position.z = 400;
camera.position.x = 10;

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

window.addEventListener('resize', () => {
    updateCamera();
}, false);

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
    return topMesh;
}

const loader = new THREE.TextureLoader();

const loadTexture = async (name, width, height, repeatHeight) => {
    const texture = {
        top: await loader.load('assets/textures/buildings/' + name + '.png'),
        repeat: await loader.load('assets/textures/buildings/' + name + '-repeat.png'),
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

const loadSky = async () => {
    const skyTexture = await loader.load('assets/textures/buildings/sky.png');
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

const loadPortal = async () => {
    const portalTexture = await loader.load('assets/textures/buildings/isekaied-portal.png');
    portalTexture.wrapS = THREE.RepeatWrapping;
    portalTexture.repeat.set(1 / 6, 1);

    const portalMaterial = new THREE.MeshBasicMaterial({ map: portalTexture, transparent: true });
    portalMaterial.map.magFilter = THREE.NearestFilter;
    portalMaterial.map.minFilter = THREE.NearestFilter;

    const portalGeometry = new THREE.PlaneGeometry(16, 16, 1, 1);
    const portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
    scene.add(portalMesh);

    portalMesh.position.z = -500;
    return portalMesh;
}

const textures = [
    await loadTexture('skyline-radio', 40, 64, 22),
    await loadTexture('skyline-skyscraper', 64, 22, 19),
]

const jamesonBuilding = await loadTexture('skyline-jameson', 85, 103, 48);

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

const roomTexture = await loader.load('assets/textures/buildings/rooms.png');
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

const spriteMap = new THREE.TextureLoader().load('assets/textures/buildings/isekaied-lawyer.png');
const spriteMaterial = new THREE.MeshBasicMaterial({ map: spriteMap, side: THREE.DoubleSide, transparent: true });

const frames = 32;
spriteMap.wrapS = THREE.ClampToEdgeWrapping;
spriteMap.magFilter = THREE.NearestFilter;
spriteMap.repeat.set(1 / frames, 1);
const spriteGeometry = new THREE.PlaneGeometry(16, 16, 1, 1);
const spriteMesh = new THREE.Mesh(spriteGeometry, spriteMaterial);
scene.add(spriteMesh);
spriteMesh.position.copy(roomMesh.position);
spriteMesh.position.z += 0.01;
spriteMesh.position.x += 3;
spriteMesh.position.y -= 22;
scene.add(spriteMesh);


const animations = {
    'typing': {
        start: 30,
        end: 31,
        speed: 100,
    },
    'sitting': {
        start: 29,
        end: 29,
        speed: 1000000,
    },
    'falling': {
        start: 1,
        end: 2,
        speed: 100,
    },
    'iddleRight': {
        start: 3,
        end: 3,
        speed: 150,
    },
    'walkingRight': {
        start: 3,
        end: 5,
        speed: 150,
    },
    'iddleLeft': {
        start: 6,
        end: 6,
        speed: 150,
    },
    'walkingLeft': {
        start: 6,
        end: 8,
        speed: 150,
    },
    'knightCastingRight': {
        start: 9,
        end: 10,
        speed: 75,
    },
    'knightCastingLeft': {
        start: 11,
        end: 12,
        speed: 75,
    },
    'knightSlashingRight': {
        start: 13,
        end: 14,
        speed: 150,
    },
    'knightSlashingLeft': {
        start: 15,
        end: 16,
        speed: 150,
    },
    'knightWalkingRight': {
        start: 17,
        end: 19,
        speed: 200,
    },
    'knightWalkingLeft': {
        start: 20,
        end: 22,
        speed: 200,
    },
    'groceriesIddleRight': {
        start: 23,
        end: 23,
        speed: 10000,
    },
    'groceriesWalkingRight': {
        start: 24,
        end: 25,
        speed: 200,
    },
    'groceriesIddleLeft': {
        start: 26,
        end: 26,
        speed: 10000,
    },
    'groceriesWalkingLeft': {
        start: 27,
        end: 28,
        speed: 200,
    },
};

let animation = animations['iddleLeft'];
let animationIndex = animation.start;
let animationStart = performance.now() + animation.speed;
spriteMap.offset.x = animationIndex / 32;

let portalAnimationIndex = 0;
let portalAnimationStart = performance.now() + 50;


let start = false;
let zoomInStart = 0;
window.addEventListener('click', (event) => {
    start = true;
});

await loadSky();

const portal = await loadPortal();

portal.position.copy(roomMesh.position);
portal.position.y -= 2;
portal.position.z += 0.02;
portal.position.x += 2;
portal.rotation.z = Math.PI * 0.5;
portal.visible = false;


const summonsDocuments: THREE.Mesh[] = [];
const summonsDocumentGeometry = new THREE.PlaneGeometry(3, 1, 1, 1);

let suck = false;
let lastTime = performance.now();
let sceneIsReady = false;
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;

    // const dayCycleOpacity = (Math.sin(now * 0.0005) * 0.5 + 0.5) * 0.9 + 0.1;

    // summonsDocumentMaterial.opacity = dayCycleOpacity;
    // roomMesh.material.opacity = dayCycleOpacity;

    summonsDocuments.forEach((summonsDocument) => {
        // summonsDocument.position.x -= 0.1;
        const distanceToPortal = portal.position.distanceTo(summonsDocument.position);
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

    if (suck && spriteMesh.userData) {
        spriteMesh.position.y = spriteMesh.userData.translation().y;
        spriteMesh.position.x = spriteMesh.userData.translation().x;
        spriteMesh.rotation.z = spriteMesh.userData.rotation();
        const distanceToPortal = portal.position.distanceTo(spriteMesh.position) - 8;
        if (distanceToPortal < 5) {
            spriteMesh.material.opacity = distanceToPortal / 5;
        } else {
            spriteMesh.material.opacity = 1;
        }
    }

    if (portalAnimationStart < now) {
        portalAnimationIndex += 1;
        if (portalAnimationIndex > 6) {
            portalAnimationIndex = 0;
        }
        portalAnimationStart = now + 50;
        portal.material.map.offset.x = portalAnimationIndex / 5.9999;
    }

    if (animationStart < now) {
        animationIndex += 1;
        if (animationIndex > animation.end) {
            animationIndex = animation.start;
        }
        animationStart = now + animation.speed;
        spriteMap.offset.x = animationIndex / 32;
    }

    if (!start) {
        zoomInStart = now;
    }

    if (camera.position.z > 1.8) {
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
        sceneIsReady = true;
        const obeyDiv: HTMLDivElement = document.getElementById('obey') as HTMLDivElement;
        obeyDiv.style.display = 'block';
        const summonsDiv: HTMLDivElement = document.getElementById('summons') as HTMLDivElement;
        summonsDiv.style.display = 'block';
    }

    bigHandPivot.rotation.z -= delta * 0.0002;
    smallHandPivot.rotation.z -= delta * 0.0002 / (Math.PI * 4);

}
animate();

const reasons = [
    'For failing to renew your annual breathing license',
    'For owning more books than the government mandated limit',
    'For using banned words from the Old Language during a casual conversation',
    'For unauthorized dreaming of non-state-approved scenarios',
    'For possession of an unregistered cat',
    'For possession of an unregistered dog',
    'For possession of an unregistered child',
    'For installing solar panels without the permission to harvest sunlight',
    'For laughing after 8 PM in a residential zone',
    'For failing to fill your mandatory happiness quota',
    'For maintaining eye contact less than five seconds with a statue of the Great Leader',
    'For keeping using an item that was scheduled to be obsolete',
    'For wearing mismatched socks on a day of national significance',
    'For unauthorized teleportation within restricted urban zones',
    'For refusing to participate in the mandatory annual Telepathy Test',
    'For holding an illegal opinion on the taste of state-produced food'
];

const places = [
    'Room 101, Jameson Building',
    'Kangaroo Court, Jameson Building',
    'Kafka street, Hight court of Treasonous Thoughts',
    'Room 404, Ministry of Truth',
    'Room 1984, Ministry of Love',
    'Room 451, Ministry of Happiness',
]

let world;

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
        .cuboid(60, 2)
        .setRestitution(0.4)
        .setActiveEvents(ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS);
    const groundCollider = world.createCollider(groundColliderDesc, groundRigidBody);

    const ceilingRigidBodyDesc = RAPIER.RigidBodyDesc
        .fixed()
        .setTranslation(roomMesh.position.x, roomMesh.position.y + 2)
        .setLinearDamping(0.95)
        .setCcdEnabled(true);
    const ceilingRigidBody = world.createRigidBody(ceilingRigidBodyDesc);
    const ceilingColliderDesc = RAPIER.ColliderDesc
        .cuboid(60, 2)
        .setRestitution(0.4)
        .setActiveEvents(ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS);
    const ceilingCollider = world.createCollider(ceilingColliderDesc, ceilingRigidBody);

    const leftWallRigidBodyDesc = RAPIER.RigidBodyDesc
        .fixed()
        .setTranslation(roomMesh.position.x - 32, roomMesh.position.y - 32)
        .setLinearDamping(0.95)
        .setCcdEnabled(true);
    const leftWallRigidBody = world.createRigidBody(leftWallRigidBodyDesc);
    const leftWallColliderDesc = RAPIER.ColliderDesc
        .cuboid(2, 60)
        .setRestitution(0.4)
        .setActiveEvents(ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS);
    const leftWallCollider = world.createCollider(leftWallColliderDesc, leftWallRigidBody);

    const rightWallRigidBodyDesc = RAPIER.RigidBodyDesc
        .fixed()
        .setTranslation(roomMesh.position.x + 32, roomMesh.position.y - 32)
        .setLinearDamping(0.95)
        .setCcdEnabled(true);
    const rightWallRigidBody = world.createRigidBody(rightWallRigidBodyDesc);
    const rightWallColliderDesc = RAPIER.ColliderDesc
        .cuboid(2, 60)
        .setRestitution(0.4)
        .setActiveEvents(ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS);
    const rightWallCollider = world.createCollider(rightWallColliderDesc, rightWallRigidBody);

    let lastPhysicsTime = performance.now();
    const timeScale = 1.0;

    let gameLoop = () => {
        const currentTime = performance.now();
        world.timestep = (currentTime - lastPhysicsTime) / 1000.0 * timeScale;
        lastPhysicsTime = currentTime;

        if (suck) {
            summonsDocuments.forEach((mesh) => {
                if (mesh.userData) {
                    const body = mesh.userData;
                    const suckStrength = 1.5;
                    let suckAngle = Math.atan2(
                        portal.position.y - body.translation().y,
                        portal.position.x - body.translation().x
                    );
                    let suckForce = {
                        x: Math.cos(suckAngle) * suckStrength,
                        y: Math.sin(suckAngle) * suckStrength
                    };
                    body.applyImpulse(suckForce, true);
                    let distance = Math.sqrt(
                        Math.pow(portal.position.x - body.translation().x, 2) +
                        Math.pow(portal.position.y - body.translation().y, 2)
                    );
                    if (distance < 3) {
                        world.removeRigidBody(body);
                        mesh.userData = null;
                    }
                }
            });

            if (spriteMesh.userData) {
                const body = spriteMesh.userData;
                const suckStrength = 25.5;
                let suckAngle = Math.atan2(
                    portal.position.y - body.translation().y,
                    portal.position.x - body.translation().x
                );
                let suckForce = {
                    x: Math.cos(suckAngle) * suckStrength,
                    y: Math.sin(suckAngle) * suckStrength
                };
                let distance = Math.sqrt(
                    Math.pow(portal.position.x - body.translation().x, 2) +
                    Math.pow(portal.position.y - body.translation().y, 2)
                ) - 8;
                if (distance < 0) {
                    // world.removeRigidBody(body);
                    playerHasBeenSummoned = true;
                    spriteMesh.userData = null;
                    console.log('Player has been summoned');
                    const obeyDiv: HTMLDivElement = document.getElementById('obey') as HTMLDivElement;
                    obeyDiv.style.display = 'block';
                    obeyDiv.innerText = 'YOU have been summoned !';
                }
                if (body) {
                    body.applyImpulse(suckForce, true);
                }
            }

        }

        world.step(eventQueue);
        setTimeout(gameLoop, 1000 / 60);
    };

    gameLoop();
});

const createSummonsDocument = (documentNumber: number): string => {
    const name = 'Jameson, Jameson, Jameson & Partners';
    const futureOffset = 3600 * 24 * 365 * 1000 * 10;
    const date = new Date(Date.now() + (3600 * 1000 * 24 * documentNumber) + futureOffset).toLocaleDateString();
    const time = `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
    const place = places[Math.floor(Math.random() * places.length)];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];

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
        .setRestitution(0.5)
        .setActiveEvents(ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS);
    const summonsDocumentCollider = world.createCollider(summonsDocumentColliderDesc, summonsDocumentRigidBody);
    summonsDocumentMesh.userData = summonsDocumentRigidBody;

    const printerImpulse = { x: -50, y: 0 };
    summonsDocumentRigidBody.applyImpulse(printerImpulse, true);

    summonsDocuments.push(summonsDocumentMesh);

    const text = `We, ${name}, hereby summon you to appear before the court on ${date} at ${time} in ${place} to answer the following charges: ${reason}. Failure to appear will result in a warrant for your arrest.`;

    const summonsContainerDiv: HTMLDivElement = document.getElementById('summonsDocumentContainer') as HTMLDivElement;
    const summonsTextDiv: HTMLDivElement = document.getElementById('summonsDocumentText') as HTMLDivElement;

    summonsTextDiv.innerText = text;
    summonsContainerDiv.style.display = 'block';


    return text;
}

let currentDocument = {
    progression: 0,
    documentNumber: 0,
    difficulty: 6000,
};

loadAllLanguages().then(() => {
    const toleratedDelay = 500;
    let lastKeyEvent = performance.now();
    let isTyping = false;

    const work = () => {
        const obeyDiv: HTMLDivElement = document.getElementById('obey') as HTMLDivElement;
        obeyDiv.style.display = 'none';
        CHATTER_BOX.start('keyboard2', 0.8, 0.25);
        lastKeyEvent = performance.now();
        if (!isTyping) {
            isTyping = true;
            animation = animations['typing'];
            animationIndex = animation.start;
            animationStart = performance.now() + animation.speed;
            spriteMap.offset.x = animationIndex / 32;
        }
        if (currentDocument.progression >= currentDocument.difficulty) {
            createSummonsDocument(currentDocument.documentNumber);
            currentDocument = {
                progression: 0,
                documentNumber: currentDocument.documentNumber + 1,
                difficulty: Math.random() * 10000 + 2000,
            };

            const summonsDiv: HTMLDivElement = document.getElementById('summons') as HTMLDivElement;
            summonsDiv.innerText = `Summons: ${currentDocument.documentNumber}`;

            if (currentDocument.documentNumber >= documentsBeforePortal) {
                const summonsContainerDiv: HTMLDivElement = document.getElementById('summonsDocumentContainer') as HTMLDivElement;
                summonsContainerDiv.style.display = 'none';
                portal.visible = true;
                animation = animations['falling'];
                animationIndex = animation.start;
                animationStart = performance.now() + animation.speed;
                spriteMap.offset.x = animationIndex / 32;

                const playerDocumentRigidBodyDesc = RAPIER.RigidBodyDesc
                    .dynamic()
                    .setTranslation(spriteMesh.position.x, spriteMesh.position.y)
                    .setLinearDamping(0.55)
                    .setCcdEnabled(true);
                const playerDocumentRigidBody = world.createRigidBody(playerDocumentRigidBodyDesc);
                const playerDocumentColliderDesc = RAPIER.ColliderDesc
                    .cuboid(4, 8)
                    .setRestitution(0.5)
                    .setActiveEvents(ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS);
                const playerDocumentCollider = world.createCollider(playerDocumentColliderDesc, playerDocumentRigidBody);
                spriteMesh.userData = playerDocumentRigidBody;

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
            animation = animations['sitting'];
            animationIndex = animation.start;
            animationStart = performance.now() + animation.speed;
            spriteMap.offset.x = animationIndex / 32;
        }
    };

    let lastKey = '';
    window.addEventListener('keydown', (event) => {
        if (event.key !== lastKey && sceneIsReady && portal.visible === false) {
            work();
            lastKey = event.key;
        }
    });

    window.setInterval(() => {
        if (portal.visible === false) {
            procrastinate();
        } else {
            CHATTER_BOX.stop();
        }
    }, toleratedDelay / 2);
});
