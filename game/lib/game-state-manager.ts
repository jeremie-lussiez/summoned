export interface GameState {
    id: string;
    data: any;
    music?: string;
    transitions: GameStateTransition[];
    init?: (globalData: any, localData: any) => void;
    reset?: (globalData: any, localData: any) => void;
}

export interface GameStateTransition {
    target: string;
    condition: () => boolean;
}

export class GameStateManager {

    data: any = {};
    states: Record<string, GameState> = {};
    currentState: GameState;

    public addState(gameState: GameState): GameState {
        this.states[gameState.id] = gameState;
        return gameState;
    }

    public setState(id: string): GameState {
        this.currentState = this.states[id];
        return this.currentState;
    }

    public checkTransitions(): void {
        const transition = this.currentState.transitions.find(transition => transition.condition());
        if (transition) {
            this.setState(transition.target);
        }
    }

}