import * as THREE from 'three';

export const loadSky = () => {
    const loader = new THREE.TextureLoader();
    const skyTexture = loader.load('assets/textures/buildings/sky.png');
    skyTexture.wrapS = THREE.RepeatWrapping;
    skyTexture.repeat.set(400, 1);

    const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, transparent: true });
    skyMaterial.map.magFilter = THREE.NearestFilter;
    skyMaterial.map.minFilter = THREE.NearestFilter;

    const skyGeometry = new THREE.PlaneGeometry(16 * 400, 2000, 1, 1);
    const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);

    skyMesh.position.z = -500;

    return skyMesh;

}