import * as THREE from 'three';

export const createClock = (): THREE.Object3D => {

    const smallHandMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const smallHandGeometry = new THREE.PlaneGeometry(0.5, 2, 1, 1);
    const bigHandMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const bigHandGeometry = new THREE.PlaneGeometry(0.5, 3, 1, 1);
    const smallHandMesh = new THREE.Mesh(smallHandGeometry, smallHandMaterial);
    const bigHandMesh = new THREE.Mesh(bigHandGeometry, bigHandMaterial);

    bigHandMesh.position.y = 1;
    smallHandMesh.position.y = 0.5;

    const bigHandPivot = new THREE.Object3D();
    bigHandPivot.add(bigHandMesh);

    const smallHandPivot = new THREE.Object3D();
    smallHandPivot.add(smallHandMesh);

    const clockPivot = new THREE.Object3D();
    clockPivot.add(bigHandPivot);
    clockPivot.add(smallHandPivot);

    return clockPivot;
};

export const updateClock = (clock: THREE.Object3D, time: number): void => {
    const bigHand = clock.children[1];
    const smallHand = clock.children[0];
    bigHand.rotation.z = -time * Math.PI * 2;
    smallHand.rotation.z = -time * Math.PI * 2 * 12;
}