import * as THREE from 'three';
import RAPIER from "@dimforge/rapier2d-compat";
import { pickOne } from "../lib/pick-one";
import { RapierGroupFactory } from "../lib/rapier-group-factory";
import { summonsPlaces } from "../lists/summons-places";
import { summonsReasons } from "../lists/summons-reasons";

const PRINTER_STRENGTH = 100;

let PRINTER_SOUND_BUFFER: AudioBuffer;
new THREE.AudioLoader().load('assets/audio/printer.mp3', (buffer) => {
    PRINTER_SOUND_BUFFER = buffer;
});

const SUMMONS_DOCUMENT_GEOMETRY = new THREE.PlaneGeometry(3, 1, 1, 1);
const SUMMONS_DOCUMENT_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });

const createSummonsDocument = (game: any): void => {

    const printerSound = new THREE.Audio(game.audioListener);
    printerSound.setBuffer(PRINTER_SOUND_BUFFER);
    printerSound.setLoop(false);
    printerSound.setVolume(0.20);
    printerSound.play();

    window.setTimeout(() => {
        const summonsDocumentMesh = new THREE.Mesh(SUMMONS_DOCUMENT_GEOMETRY, SUMMONS_DOCUMENT_MATERIAL);
        summonsDocumentMesh.position.copy(game.roomPosition);
        summonsDocumentMesh.position.z += 0.2;
        summonsDocumentMesh.position.x += 20;
        summonsDocumentMesh.position.y -= 24;
        const summonsDocumentRigidBodyDesc = RAPIER.RigidBodyDesc
            .dynamic()
            .setTranslation(summonsDocumentMesh.position.x, summonsDocumentMesh.position.y)
            .setLinearDamping(0.55)
            .setCcdEnabled(true);
        const summonsDocumentRigidBody = game.world.createRigidBody(summonsDocumentRigidBodyDesc);
        const summonsDocumentColliderDesc = RAPIER.ColliderDesc
            .cuboid(1.5, 0.5)
            .setCollisionGroups(RapierGroupFactory.composeGroups(['summonsDocuments'], ['ground', 'summonsDocuments']))
            .setRestitution(0.5);
        const summonsDocumentCollider = game.world.createCollider(summonsDocumentColliderDesc, summonsDocumentRigidBody);
        summonsDocumentMesh.userData = summonsDocumentRigidBody;
        summonsDocumentMesh.collider = summonsDocumentCollider;

        const printerImpulse = { x: -PRINTER_STRENGTH, y: 10 };
        summonsDocumentRigidBody.applyImpulse(printerImpulse, true);

        game.suckableThings.push(summonsDocumentMesh);
        game.scene.add(summonsDocumentMesh);

        const name = 'Jameson, Jameson, Jameson & Partners';
        const futureOffset = 3600 * 24 * 365 * 1000 * 10;
        const date = new Date(Date.now() + (3600 * 1000 * 24 * game.completedDocuments) + futureOffset).toLocaleDateString();
        const time = `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
        const place = pickOne(summonsPlaces);
        const reason = pickOne(summonsReasons);
        
        const text = `We, ${name}, hereby summon you to appear before the court on ${date} at ${time} in ${place} to answer the following charges: ${reason}. Failure to appear will result in a warrant for your arrest.`;
    
        game.summonsDocumentTextDiv.innerText = text;
        game.summonsContainerDiv.style.display = 'block';

    }, 2000);
}


export const WORKING_STATE_DEFINITION = {
    id: 'working',
    data: {
        currentDocumentDifficulty: 5000,
        workingPower: 800,
    },
    actions: {
        work(game: any, state: any) {
            if (game.currentDocumentProgression >= state.currentDocumentDifficulty) {
                game.completedDocuments += 1;
                createSummonsDocument(game);
                game.currentDocumentProgression = 0;
                state.currentDocumentDifficulty = Math.random() * 10000 + 2000;
                game.summonsTextDiv.innerText = `Summons: ${game.completedDocuments}`;
                game.progressChildDiv.style.width = '0%';
            } else {
                game.currentDocumentProgression += (state.workingPower * Math.random() / 2) + state.workingPower / 2;
                game.currentDocumentProgression = Math.min(game.currentDocumentProgression, state.currentDocumentDifficulty);
                game.progressChildDiv.style.width = `${(game.currentDocumentProgression / state.currentDocumentDifficulty) * 100}%`;
            }
        }
    },
    init: (game: any, state: any) => {
        game.obeyDiv.style.display = 'none';
    },
    update: (game: any, state: any) => {
        game.suckableThings.forEach((summonsDocument) => {
            if (summonsDocument.userData) {
                summonsDocument.position.y = summonsDocument.userData.translation().y;
                summonsDocument.position.x = summonsDocument.userData.translation().x;
                summonsDocument.rotation.z = summonsDocument.userData.rotation();
            }
        });
    },
    transitions: [
        {
            target: 'summonedByPortal',
            condition: (game: any, state: any) => {
                return game.completedDocuments >= game.documentsBeforePortal;
            }
        }
    ]
};