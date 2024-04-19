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
    'attack': {
        start: 3,
        end: 4,
        speed: 200,
    },
    'dead': {
        start: 5,
        end: 5,
        speed: 200000,
    },
}