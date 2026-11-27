// The farmer: PATROL -> SUSPICIOUS -> CHASE -> SEARCH -> RETURN.
// He spots the turkey inside his vision cone, chases, and when cornered
// winds up a telegraphed lunge. Every state change shows a comic bubble.
import { TUNING } from './config.js';

export const FARMER_STATES = {
  PATROL: 'PATROL',
  SUSPICIOUS: 'SUSPICIOUS',
  CHASE: 'CHASE',
  SEARCH: 'SEARCH',
  RETURN: 'RETURN',
  STUNNED: 'STUNNED',
  LUNGE: 'LUNGE',
};

export function createFarmer() {
  return {
    x: 60,
    y: 620,
    state: FARMER_STATES.PATROL,
    stateTime: 0,
    patrolDir: 1,
    patrolMin: 30,
    patrolMax: 220,
    suspicion: 0,
    bubble: null,
    bubbleTime: 0,
    cone: 300,
    runPhase: 0,
    windup: 0,
    lungeVx: 0,
    searchX: 0,
    speedMul: 1,
    lungeMul: 1,
  };
}

export function farmerSeesTurkey(f, turkey, stage) {
  if (turkey.hidden) return false;
  const dx = turkey.x - f.x;
  if (dx < 0 || dx > f.cone) return false;
  // The turkey is spotted if it is roughly at the farmer's eye level
  // (not hidden behind a low hide spot) — jumping over the cone still counts.
  return turkey.y > 380;
}

export function updateFarmer(f, dt, ctx) {
  // ctx: { turkey, stage, onSpotted, onCaught, gobbleStun }
  const turkey = ctx.turkey;
  const speed = ctx.speed || 300;
  f.stateTime += dt;
  f.bubbleTime = Math.max(0, f.bubbleTime - dt);
  if (f.bubbleTime <= 0) f.bubble = null;
  if (ctx.gobbleStun > 0) {
    if (f.state !== FARMER_STATES.STUNNED) {
      f.state = FARMER_STATES.STUNNED;
      f.stateTime = 0;
      f.bubble = 'Zzz';
      f.bubbleTime = 0.4;
    }
    return;
  }

  // Farmer speeds are relative to the scrolling world: he only gains on the
  // turkey while chasing faster than the turkey runs, so sprinting escapes.
  const chaseSpeed = TUNING.farmerChaseSpeed * f.speedMul - speed;
  const patrolSpeed = 60 * f.speedMul - speed * 0.25;
  const walkSpeed = 60 * f.speedMul;

  switch (f.state) {
    case FARMER_STATES.STUNNED: {
      // The gobble stun already elapsed (ctx.gobbleStun hit 0); shake it off.
      f.state = FARMER_STATES.PATROL;
      f.stateTime = 0;
      f.suspicion = 0;
      break;
    }
    case FARMER_STATES.PATROL: {
      f.x += f.patrolDir * patrolSpeed * dt;
      f.runPhase += dt;
      if (f.x < f.patrolMin) f.patrolDir = 1;
      if (f.x > f.patrolMax) f.patrolDir = -1;
      if (farmerSeesTurkey(f, turkey, ctx.stage)) {
        f.suspicion += dt * 1.0;
        if (f.suspicion > 0.45) {
          f.state = FARMER_STATES.SUSPICIOUS;
          f.stateTime = 0;
          f.bubble = '?';
          f.bubbleTime = 1.0;
          if (ctx.onSpotted) ctx.onSpotted('suspicious');
        }
      } else {
        f.suspicion = Math.max(0, f.suspicion - dt);
      }
      break;
    }
    case FARMER_STATES.SUSPICIOUS: {
      if (farmerSeesTurkey(f, turkey, ctx.stage)) {
        f.suspicion += dt * 2.5;
        if (f.suspicion > 1.1) {
          f.state = FARMER_STATES.CHASE;
          f.stateTime = 0;
          f.bubble = '!';
          f.bubbleTime = 1.2;
          if (ctx.onSpotted) ctx.onSpotted('chase');
        }
      } else {
        f.state = FARMER_STATES.PATROL;
        f.suspicion = 0;
      }
      break;
    }
    case FARMER_STATES.CHASE: {
      const gap = turkey.x - f.x;
      f.runPhase += dt * 1.5;
      if (turkey.hidden) {
        f.state = FARMER_STATES.SEARCH;
        f.stateTime = 0;
        f.searchX = turkey.x - 40;
        f.bubble = '?';
        f.bubbleTime = 1.0;
        break;
      }
      if (gap < 190 && f.stateTime > 1.2) {
        // Cornered: telegraphed lunge with a comic wind-up.
        f.state = FARMER_STATES.LUNGE;
        f.stateTime = 0;
        f.windup = 0;
        f.bubble = '!';
        f.bubbleTime = 0.9;
        break;
      }
      f.x += chaseSpeed * dt;
      if (!farmerSeesTurkey(f, turkey, ctx.stage) && gap > f.cone) {
        f.state = FARMER_STATES.SEARCH;
        f.stateTime = 0;
        f.searchX = turkey.x - 40;
        f.bubble = '?';
        f.bubbleTime = 1.0;
      }
      break;
    }
    case FARMER_STATES.LUNGE: {
      f.windup = Math.min(1, f.stateTime / 0.55);
      if (f.stateTime >= 0.55 && f.stateTime < 0.95) {
        f.x += (TUNING.farmerLungeSpeed * f.lungeMul - speed) * dt;
        f.lungeVx = TUNING.farmerLungeSpeed * f.lungeMul;
      } else {
        f.lungeVx = 0;
      }
      if (f.stateTime >= 0.95) {
        f.state = FARMER_STATES.SEARCH;
        f.stateTime = 0;
        f.searchX = turkey.x - 40;
      }
      break;
    }
    case FARMER_STATES.SEARCH: {
      f.runPhase += dt;
      const dir = Math.sign(f.searchX - f.x) || 1;
      f.x += dir * walkSpeed * 1.4 * dt;
      if (farmerSeesTurkey(f, turkey, ctx.stage)) {
        f.state = FARMER_STATES.CHASE;
        f.stateTime = 0;
        f.bubble = '!';
        f.bubbleTime = 1.2;
        if (ctx.onSpotted) ctx.onSpotted('chase');
      } else if (f.stateTime > 2.6) {
        f.state = FARMER_STATES.RETURN;
        f.stateTime = 0;
      }
      break;
    }
    case FARMER_STATES.RETURN: {
      f.runPhase += dt;
      f.x += Math.sign(90 - f.x) * walkSpeed * dt;
      if (Math.abs(f.x - 90) < 8 || f.stateTime > 3) {
        f.state = FARMER_STATES.PATROL;
        f.stateTime = 0;
        f.suspicion = 0;
      }
      if (farmerSeesTurkey(f, turkey, ctx.stage)) {
        f.state = FARMER_STATES.SUSPICIOUS;
        f.stateTime = 0;
        f.suspicion = 0.5;
      }
      break;
    }
    default:
      break;
  }

  if (f.state === FARMER_STATES.CHASE || f.state === FARMER_STATES.LUNGE) {
    const gap = turkey.x - f.x;
    if (gap <= TUNING.farmerCatchDistance && ctx.onCaught) ctx.onCaught();
  }
}

export function farmerAlert(f, amount) {
  f.suspicion = Math.min(1.5, f.suspicion + amount);
  if (f.state === FARMER_STATES.PATROL && f.suspicion > 0.45) {
    f.state = FARMER_STATES.SUSPICIOUS;
    f.stateTime = 0;
    f.bubble = '?';
    f.bubbleTime = 1.0;
  }
}
