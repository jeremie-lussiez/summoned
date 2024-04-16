import * as THREE from 'three';
import { Mesh, PlaneGeometry, TextureLoader, MeshBasicMaterial, Material, Texture, Scene } from "three";


const REPEAT_FLOORS = 100;

interface SkyscraperTexture {
    topTexture: Texture;
    floorsTexture: Texture;
    width: number;
    height: number;
    repeatHeight: number;
    topMaterial: Material;
    floorsMaterial: Material;
}


const loader = new TextureLoader();

export const createSkyscraper = (scene: Scene, texture: SkyscraperTexture, x: number, y: number, z: number): Mesh => {
    const topGeometry = new PlaneGeometry(texture.width, texture.height);
    const topMesh = new Mesh(topGeometry, texture.topMaterial);
    topMesh.position.x = x;
    topMesh.position.y = y;
    topMesh.position.z = z;
    const repeatGeometry = new PlaneGeometry(texture.width, texture.repeatHeight * REPEAT_FLOORS);
    const floorsMesh = new Mesh(repeatGeometry, texture.floorsMaterial);
    floorsMesh.position.x = 0;
    floorsMesh.position.y = - texture.repeatHeight * REPEAT_FLOORS / 2 - texture.height / 2;
    floorsMesh.position.z = 0;
    topMesh.add(floorsMesh);
    scene.add(topMesh);
    return topMesh;
}

export const loadSkyscraperTexture = (name, width, height, repeatHeight): SkyscraperTexture => {

    const topTexture = loader.load('assets/textures/buildings/' + name + '.png');
    const floorsTexture = loader.load('assets/textures/buildings/' + name + '-repeat.png');

    floorsTexture.wrapS = THREE.RepeatWrapping;
    floorsTexture.wrapT = THREE.RepeatWrapping;
    floorsTexture.repeat.set(1, 70);

    const topMaterial = new MeshBasicMaterial({ map: topTexture, transparent: true });
    if (topMaterial.map) {
        topMaterial.map.magFilter = THREE.NearestFilter;
        topMaterial.map.minFilter = THREE.NearestFilter;
    }

    const floorsMaterial = new MeshBasicMaterial({ map: floorsTexture, transparent: true });
    if (floorsMaterial.map) {
        floorsMaterial.map.magFilter = THREE.NearestFilter;
        floorsMaterial.map.minFilter = THREE.NearestFilter;
    }

    return {
        width: width,
        height: height,
        repeatHeight: repeatHeight,
        topMaterial: topMaterial,
        floorsMaterial: floorsMaterial,
        topTexture: topTexture,
        floorsTexture: floorsTexture,
    };
}

export const SKYSCRAPER_TEXTURES = [
    loadSkyscraperTexture('skyline-jameson', 85, 103, 48),
    loadSkyscraperTexture('skyline-radio', 40, 64, 22),
    loadSkyscraperTexture('skyline-skyscraper', 64, 22, 19),
]
