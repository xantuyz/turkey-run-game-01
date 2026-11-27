// Deterministic screenshot scenes: ?shot=start|play|barn|end&seed=1.
// Each scene composes a fixed, readable frame and freezes the game so a
// headless screenshot always catches exactly that frame.
import { createTurkey } from './turkey.js';
import { createFarmer, FARMER_STATES } from './farmer.js';
import { createHazardField } from './hazards.js';
import { stageAt } from './stages.js';
import { makeRng } from './random.js';
import { GROUND_Y } from './config.js';

function baseScene(game, stageIndex) {
  game.stageIndex = stageIndex;
  game.stage = stageAt(stageIndex);
  game.turkey = createTurkey();
  game.farmer = createFarmer();
  game.field = createHazardField();
  game.score = 0;
  game.lives = 3;
  game.distanceMeters = 0;
  game.scrollX = 0;
  game.time = 0;
  game.gobbleCooldown = 0;
  game.gravyTime = 0;
  game.gobbleStun = 0;
  game.shake = 0;
  game.particles = [];
}

export function applyShot(game, shot, seed) {
  const rng = makeRng(seed || 1);
  game.shotMode = true;
  game.shotName = shot;
  if (shot === 'start') {
    baseScene(game, 0);
    game.state = 'title';
    game.titleTurkeyX = 1060;
    return;
  }
  if (shot === 'barn') {
    baseScene(game, 1);
    game.state = 'play';
    game.distanceMeters = 240;
    game.scrollX = 240 * 12;
    game.score = 1240;
    game.turkey.y = GROUND_Y;
    game.turkey.runPhase = 2.4;
    game.farmer.x = 150;
    game.farmer.state = FARMER_STATES.SUSPICIOUS;
    game.farmer.bubble = '?';
    game.farmer.bubbleTime = 99;
    game.farmer.cone = 360;
    game.field.hazards = [
      { kind: 'door', x: 820, phase: 0.6, swingPhase: 1.1, swing: 0.9, passed: false },
      { kind: 'knifeFall', x: 1020, y: 260, falling: true, vy: 300, telegraph: false, phase: 0, passed: false },
      { kind: 'chicken', x: 620, phase: 0, alerted: true, passed: false },
      { kind: 'haybale', x: 1120, phase: 0, passed: false },
    ];
    game.field.pickups = [
      { kind: 'corn', x: 520, y: GROUND_Y - 90, phase: 0.4, taken: false },
      { kind: 'corn', x: 580, y: GROUND_Y - 90, phase: 1.2, taken: false },
      { kind: 'feather', x: 940, y: GROUND_Y - 120, phase: 0.2, taken: false },
    ];
    return;
  }
  if (shot === 'end') {
    baseScene(game, 2);
    game.state = 'caught';
    game.score = 4860;
    game.distanceMeters = 512;
    game.lives = 0;
    game.turkey.y = GROUND_Y;
    game.turkey.x = 350;
    game.farmer.x = 250;
    game.farmer.state = FARMER_STATES.CHASE;
    game.farmer.bubble = '!';
    game.farmer.bubbleTime = 99;
    game.field.hazards = [
      { kind: 'ovenBurst', x: 900, phase: 0, cycle: 1.9, warn: false, bursting: true, flameH: 100, passed: false },
    ];
    return;
  }
  // Default: 'play' — the cover. Kitchen chase, farmer lunging with knife.
  baseScene(game, 2);
  game.state = 'play';
  game.distanceMeters = 430;
  game.scrollX = 430 * 12;
  game.score = 3420;
  game.turkey.y = GROUND_Y - 150;
  game.turkey.vy = -300;
  game.turkey.onGround = false;
  game.turkey.flap = 0.7;
  game.turkey.runPhase = 3.1;
  game.farmer.x = 190;
  game.farmer.state = FARMER_STATES.LUNGE;
  game.farmer.stateTime = 0.7;
  game.farmer.windup = 1;
  game.farmer.bubble = '!';
  game.farmer.bubbleTime = 99;
  game.farmer.cone = 430;
  game.farmer.runPhase = 4.2;
  game.field.hazards = [
    { kind: 'ovenBurst', x: 700, phase: 0, cycle: 1.9, warn: false, bursting: true, flameH: 110, passed: false },
    { kind: 'knifeFall', x: 980, y: 200, falling: true, vy: 420, telegraph: false, phase: 0, passed: false },
    { kind: 'rollingPin', x: 1120, phase: 0, vx: 260, spin: 1.2, passed: false },
    { kind: 'oil', x: 520, phase: 0, passed: false },
  ];
  game.field.pickups = [
    { kind: 'corn', x: 460, y: GROUND_Y - 170, phase: 0.3, taken: false },
    { kind: 'corn', x: 520, y: GROUND_Y - 170, phase: 1.1, taken: false },
    { kind: 'gravy', x: 880, y: GROUND_Y - 140, phase: 0.7, taken: false },
  ];
  game.gravyTime = 6.5;
  void rng;
}
