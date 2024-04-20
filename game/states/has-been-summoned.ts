import * as THREE from 'three';

let DUNDUNDUN_SOUND_BUFFER: AudioBuffer;
new THREE.AudioLoader().load('assets/audio/dundundun.mp3', (buffer) => {
    DUNDUNDUN_SOUND_BUFFER = buffer;
});

export const HAS_BEEN_SUMMONED_STATE_DEFINITION = {
    id: 'hasBeenSummoned',
    music: 'STOP',
    data: {},
    init: (game: any, state: any) => {
        game.obeyDiv.style.display = 'block';
        game.obeyDiv.innerText = 'YOU have been summoned!';
        const dundundunSound = new THREE.Audio(game.audioListener);
        dundundunSound.setBuffer(DUNDUNDUN_SOUND_BUFFER);
        dundundunSound.setLoop(false);
        dundundunSound.setVolume(0.50);
        dundundunSound.play();
    },
    actions: {},
    transitions: []
};
