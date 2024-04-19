import * as THREE from 'three';

export interface GameState {
    id: string;
    data: any;
    music?: string;
    transitions: GameStateTransition[];
    actions: Record<string, (global: any, local: any) => void>;
    init?: (global: any, local: any) => void;
    reset?: (global: any, local: any) => void;
}

export interface GameStateTransition {
    target: string;
    condition: (global: any, local: any) => boolean;
}

export class GameStateManager {

    private data: any = {};

    private states: Record<string, GameState> = {};

    private currentMusic: THREE.Audio;
    private jukebox: Record<string, THREE.Audio> = {};

    private audioListener = new THREE.AudioListener();

    public currentState: GameState;

    public constructor(camera: THREE.Camera, data: any) {
        this.data = data;
        this.data.camera = camera;
        this.data.camera.add(this.audioListener);
    }

    public addState(gameState: GameState): GameState {
        this.states[gameState.id] = gameState;
        if (gameState.music) {
            new THREE.AudioLoader().load(gameState.music, (buffer) => {
                if (gameState.music) {
                    const stateMusic = new THREE.Audio(this.audioListener);
                    stateMusic.setBuffer(buffer);
                    stateMusic.setLoop(true);
                    stateMusic.setVolume(0.5);
                    this.jukebox[gameState.music] = stateMusic;
                }
            });
        }
        return gameState;
    }

    public setState(id: string): GameState {
        this.currentState = this.states[id];
        if (this.currentState.init) {
            this.currentState.init(this.data, this.currentState.data);
            if (this.currentState.music) {
                if (this.currentMusic) {
                    this.currentMusic.stop();
                }
                this.tryPlayingMusic(this.currentState.music);
            }
        }
        return this.currentState;
    }

    public checkTransitions(): void {
        const transition = this.currentState.transitions.find(transition => transition.condition(this.data, this.currentState.data));
        if (transition) {
            this.setState(transition.target);
        }
    }

    public action(action: string): void {
        if (this.currentState.actions[action]) {
            this.currentState.actions[action](this.data, this.currentState.data);
        }
    }

    private tryPlayingMusic(music: string): void {
        if (this.jukebox[music]) {
            this.currentMusic = this.jukebox[music];
            this.currentMusic.play();
        } else {
            window.setTimeout(() => this.tryPlayingMusic(music), 1000);
        }
    }

}