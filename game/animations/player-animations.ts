import { SpriteAnimation } from "../lib/sprite-animation";

export const playerAnimations: Record<string, SpriteAnimation> = {
    'typing': {
        start: 17,
        end: 18,
        speed: 100,
    },
    'sitting': {
        start: 16,
        end: 16,
        speed: 1000000,
    },
    'falling': {
        start: 1,
        end: 2,
        speed: 100,
    },
    'iddle': {
        start: 3,
        end: 3,
        speed: 150,
    },
    'walking': {
        start: 3,
        end: 5,
        speed: 150,
    },
    'running': {
        start: 3,
        end: 5,
        speed: 75,
    },
    'knightCasting': {
        start: 6,
        end: 7,
        speed: 75,
    },
    'knightSlashing': {
        start: 8,
        end: 9,
        speed: 150,
    },
    'knightIddle': {
        start: 10,
        end: 10,
        speed: 200000,
    },
    'knightWalking': {
        start: 10,
        end: 12,
        speed: 200,
    },
    'groceriesIddle': {
        start: 13,
        end: 13,
        speed: 10000,
    },
    'groceriesWalking': {
        start: 14,
        end: 15,
        speed: 200,
    },
}