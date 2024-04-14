import * as THREE from 'three';
import RAPIER, { ActiveEvents } from '@dimforge/rapier2d-compat';
import { playerAnimations } from './game/animations/player-animations';
import { summonsReasons } from './game/lists/summons-reasons';
import { summonsPlaces } from './game/lists/summons-places';
import { pickOne } from './game/lists/pick-one';
import { loadAllLanguages, CHATTER_BOX } from './game/effects/chatter-box';

let playerHasBeenSummoned = false;
const documentsBeforePortal = 5;
const travellingSpeed = 0.005;
const workingPower = 1000;
const printerStrength = 100;

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

const loadPortal = () => {
    const portalTexture = loader.load('assets/textures/buildings/isekaied-portal.png');
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


const animations = playerAnimations;

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

loadSky();

const portal = loadPortal();

portal.position.copy(roomMesh.position);
portal.position.y -= 2;
portal.position.z += 0.02;
portal.position.x += 2;
portal.rotation.z = Math.PI * 0.5;
portal.visible = false;


const summonsDocuments: THREE.Mesh[] = [];
const summonedThings: THREE.Mesh[] = [];
const summonsDocumentGeometry = new THREE.PlaneGeometry(3, 1, 1, 1);

let suck = false;
let lastTime = performance.now();
let sceneIsReady = false;
let darken = 1;
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

    summonedThings.forEach((summonedThing) => {
        if (summonedThing.userData) {
            summonedThing.position.y = summonedThing.userData.translation().y;
            summonedThing.position.x = summonedThing.userData.translation().x;
            summonedThing.rotation.z = summonedThing.userData.rotation();
        }
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
        const music = document.getElementById('music')
        music.volume = 0.2;
        music.play();
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
        .setRestitution(0.5)
        .setActiveEvents(ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS);
    const summonsDocumentCollider = world.createCollider(summonsDocumentColliderDesc, summonsDocumentRigidBody);
    summonsDocumentMesh.userData = summonsDocumentRigidBody;

    const printerImpulse = { x: -printerStrength, y: 10 };
    summonsDocumentRigidBody.applyImpulse(printerImpulse, true);

    summonsDocuments.push(summonsDocumentMesh);

    const text = `We, ${name}, hereby summon you to appear before the court on ${date} at ${time} in ${place} to answer the following charges: ${reason}. Failure to appear will result in a warrant for your arrest.`;

    const summonsContainerDiv: HTMLDivElement = document.getElementById('summonsDocumentContainer') as HTMLDivElement;
    const summonsTextDiv: HTMLDivElement = document.getElementById('summonsDocumentText') as HTMLDivElement;

    summonsTextDiv.innerText = text;
    summonsContainerDiv.style.display = 'block';
}

let currentDocument = {
    progression: 0,
    documentNumber: 0,
    difficulty: 6000,
};

mousePlane.position.z = roomMesh.position.z;

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
cube.position.copy(mousePlane.position);
scene.add(cube);

const geometry2 = new THREE.BoxGeometry(1, 1, 1);
const material2 = new THREE.MeshBasicMaterial({ color: 0xff8800 });
const cube2 = new THREE.Mesh(geometry2, material2);
cube2.position.copy(mousePlane.position);
scene.add(cube2);

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
        .setRestitution(0.5)
        .setActiveEvents(ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS);
    const stuffCollider = world.createCollider(stuffColliderDesc, stuffRigidBody);
    stuffMesh.userData = stuffRigidBody;

    const stuffImpulse = { x: Math.cos(angle) * force, y: Math.sin(angle) * force };
    stuffRigidBody.applyImpulse(stuffImpulse, true);

    scene.add(stuffMesh);

    summonedThings.push(stuffMesh);

}

let isFighting = false;

addEventListener('click', (event) => {
    if (isFighting) {

        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const intersects = raycaster.intersectObjects([mousePlane]);

        const xPos = intersects[0].point.x;
        const yPos = intersects[0].point.y;

        const distanceToSprite = Math.sqrt(Math.pow(spriteMesh.position.x - xPos, 2) + Math.pow(spriteMesh.position.y - yPos, 2));

        console.log('distance:', distanceToSprite, xPos, yPos);

        const angle = Math.atan2(yPos - spriteMesh.position.y, xPos - spriteMesh.position.x);

        cube2.position.x = spriteMesh.position.x + Math.cos(angle) * 8;
        cube2.position.y = spriteMesh.position.y + Math.sin(angle) * 8;

        summonStuff(cube2.position.x, cube2.position.y, spriteMesh.position.z + 0.01, distanceToSprite * 20 + 5, angle);
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

        const angle = Math.atan2(yPos - spriteMesh.position.y, xPos - spriteMesh.position.x);

        cube.position.x = spriteMesh.position.x + Math.cos(angle) * 8;
        cube.position.y = spriteMesh.position.y + Math.sin(angle) * 8;
    }

});


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
