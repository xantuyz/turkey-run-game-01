// Gravy Train — tuning, stage definitions and the autumn palette.
// Every number the game balances on lives here so tuning never hides in logic.
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GROUND_Y = 620;
export const TURKEY_X = 300;
export const STAGE_METERS = 600;
export const PIXELS_PER_METER = 12;

export const PALETTE = {
  skyTop: '#f7b267',
  skyMid: '#f4845f',
  skyLow: '#e76f51',
  sun: '#ffd166',
  ground: '#7a4a21',
  groundDark: '#5d3617',
  grass: '#c98f2e',
  pumpkin: '#e85d04',
  wheat: '#f4d35e',
  barnRed: '#b23a2e',
  cream: '#fff3d6',
  ink: '#2b1a12',
  farmerBlue: '#3d5a80',
  farmerHat: '#e9c46a',
  turkeyBrown: '#8b5a2b',
  turkeyCream: '#f6e7c1',
  wattle: '#d90429',
  danger: '#e63946',
  leaf: '#588157',
};

export const TUNING = {
  gravity: 2600,
  jumpVelocity: -980,
  doubleJumpVelocity: -820,
  coyoteTime: 0.12,
  jumpBuffer: 0.14,
  baseSpeed: 300,
  sprintSpeed: 430,
  sprintDrain: 34,
  staminaRegen: 22,
  maxStamina: 100,
  gobbleCooldown: 6,
  gobbleStun: 0.9,
  gobbleRange: 420,
  invulnerableTime: 1.5,
  maxLives: 3,
  cornScore: 50,
  goldenEggScore: 250,
  featherStamina: 40,
  gravyDuration: 10,
  farmerCatchDistance: 46,
  farmerBaseSpeed: 205,
  farmerChaseSpeed: 380,
  farmerLungeSpeed: 640,
};

export const STAGE_DEFS = [
  {
    id: 1,
    name: 'FARMYARD',
    subtitle: 'Stage 1 — The Farmyard',
    threat: 'Low fences, hay bales & mud puddles',
    sky: ['#f7b267', '#f4845f', '#e76f51'],
    ground: '#7a4a21',
    accent: '#c98f2e',
    speedBonus: 0,
    hazardGap: [1.05, 1.7],
    farmerSpeed: 1.0,
    coneWidth: 300,
    lungeSpeed: 1.0,
    hazards: ['fence', 'haybale', 'mud', 'cornRow'],
  },
  {
    id: 2,
    name: 'THE BARN',
    subtitle: 'Stage 2 — The Barn',
    threat: 'Swinging doors, falling knives & chatty chickens',
    sky: ['#8d6b4a', '#6b4a2f', '#4a2f1d'],
    ground: '#5d3617',
    accent: '#b23a2e',
    speedBonus: 45,
    hazardGap: [0.9, 1.5],
    farmerSpeed: 1.12,
    coneWidth: 360,
    lungeSpeed: 1.15,
    hazards: ['door', 'knifeFall', 'chicken', 'haybale', 'hideSpot'],
  },
  {
    id: 3,
    name: 'THE KITCHEN',
    subtitle: 'Stage 3 — The Kitchen',
    threat: 'Oven bursts, carving knives & the final oven mouth',
    sky: ['#8a4a3a', '#6b2f2f', '#4a2020'],
    ground: '#3a2a1a',
    accent: '#e85d04',
    speedBonus: 90,
    hazardGap: [0.75, 1.3],
    farmerSpeed: 1.25,
    coneWidth: 430,
    lungeSpeed: 1.3,
    hazards: ['ovenBurst', 'knifeFall', 'rollingPin', 'oil', 'door', 'ovenMouth'],
  },
];

export const CONTROLS_TEXT = [
  'SPACE / UP / CLICK — jump (double-tap for a flap)',
  'DOWN / S — slide under things',
  'SHIFT — sprint (uses stamina)',
  'G / RIGHT-CLICK — GOBBLE! startle the farmer',
  'P — pause    M — mute    R — restart',
];
