import { SpriteAnimation } from "../lib/sprite-animation";

export const gobAnimations: Record<string, SpriteAnimation> = {
    'iddle': {
        start: 0,
        end: 0,
        speed: 100000,
    },
    'walking': {
        start: 0,
        end: 2,
        speed: 100,
    },
    'attackLeft': {
        start: 3,
        end: 4,
        speed: 200,
    },
    'attackRight': {
        start: 5,
        end: 6,
        speed: 200,
    },
    'dead': {
        start: 7,
        end: 7,
        speed: 200000,
    },
}