import { SpriteAnimation } from "../lib/sprite-animation";

export const playerAnimations: Record<string, SpriteAnimation> = {
    'typing': {
        start: 30,
        end: 31,
        speed: 100,
    },
    'sitting': {
        start: 29,
        end: 29,
        speed: 1000000,
    },
    'falling': {
        start: 1,
        end: 2,
        speed: 100,
    },
    'iddleRight': {
        start: 3,
        end: 3,
        speed: 150,
    },
    'walkingRight': {
        start: 3,
        end: 5,
        speed: 150,
    },
    'iddleLeft': {
        start: 6,
        end: 6,
        speed: 150,
    },
    'walkingLeft': {
        start: 6,
        end: 8,
        speed: 150,
    },
    'knightCastingRight': {
        start: 9,
        end: 10,
        speed: 75,
    },
    'knightCastingLeft': {
        start: 11,
        end: 12,
        speed: 75,
    },
    'knightSlashingRight': {
        start: 13,
        end: 14,
        speed: 150,
    },
    'knightSlashingLeft': {
        start: 15,
        end: 16,
        speed: 150,
    },
    'knightIddleRight': {
        start: 17,
        end: 17,
        speed: 200000,
    },
    'knightWalkingRight': {
        start: 17,
        end: 19,
        speed: 200,
    },
    'knightIddleLeft': {
        start: 20,
        end: 20,
        speed: 200000,
    },
    'knightWalkingLeft': {
        start: 20,
        end: 22,
        speed: 200,
    },
    'groceriesIddleRight': {
        start: 23,
        end: 23,
        speed: 10000,
    },
    'groceriesWalkingRight': {
        start: 24,
        end: 25,
        speed: 200,
    },
    'groceriesIddleLeft': {
        start: 26,
        end: 26,
        speed: 10000,
    },
    'groceriesWalkingLeft': {
        start: 27,
        end: 28,
        speed: 200,
    },
}