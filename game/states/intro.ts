export const INTRO_STATE_DEFINITION = {
    id: 'intro',
    data: {},
    actions: {},
    transitions: [
        {
            target: 'atWork',
            condition: (game: any, state: any) => {
                return game.camera.position.z <= 1.8;
            }
        }
    ]
};
