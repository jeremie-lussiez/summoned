export interface GameState {
    id: string;
    data: any;
    music: string;
    transitions: GameStateTransition[];
}

export interface GameStateTransition {
    condition: () => string;
}

export class GameStateManager {

    data: any;
    states: Record<string, GameState> = {};
    currentState: GameState;

    setState(id: string): GameState {
        this.currentState = this.states[id];
        return this.currentState;
    }

}