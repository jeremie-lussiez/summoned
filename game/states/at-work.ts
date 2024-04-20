export const AT_WORK_STATE_DEFINITION = {
    id: 'atWork',
    music: 'assets/audio/song.mp3',
    data: {
        hasWorked: false,
    },
    actions: {
        work(game: any, state: any) {
            state.hasWorked = true;
        }
    },
    init: (game: any, state: any) => {
        game.summonsTextDiv.style.display = 'block';
        game.progressDiv.style.display = 'block';
        game.obeyDiv.innerText = 'Draft summons !';
        game.obeyDiv.style.display = 'block';
        // sceneIsReady = true;
    },
    transitions: [
        {
            target: 'working',
            condition: (game: any, state: any) => {
                return state.hasWorked;
            }
        }
    ]
}