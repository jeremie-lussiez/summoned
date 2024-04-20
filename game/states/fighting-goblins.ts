export const FIGHTING_GOBLINS_STATE_DEFINITION = {
    id: 'fightingGoblins',
    music: 'assets/audio/Goblinbane.mp3',
    data: {
        isFighting: false,
        playerHasBeenSummoned: false,
        documentsBeforePortal: 5,
    },
    actions: {},
    init: (game: any, state: any) => {
        state.isFighting = false;
        state.playerHasBeenSummoned = false;
        state.documentsBeforePortal = 5;
    },
    transitions: [
    ]
};
