// The turkey: jump physics with coyote time + jump buffer, a second flap,
// sliding, sprint stamina and the hurt/invulnerable state.
import { GROUND_Y, TUNING, TURKEY_X } from './config.js';

export function createTurkey() {
  return {
    x: TURKEY_X,
    y: GROUND_Y,
    vy: 0,
    w: 62,
    h: 76,
    onGround: true,
    coyote: 0,
    jumpBuffer: 0,
    jumpsUsed: 0,
    sliding: false,
    sprinting: false,
    stamina: TUNING.maxStamina,
    invulnerable: 0,
    flap: 0,
    runPhase: 0,
    hurtFlash: 0,
    slipping: 0,
    hidden: false,
  };
}

export function turkeyRect(t) {
  const h = t.sliding ? 46 : 76;
  return { x: t.x - 26, y: t.y - h, w: 52, h };
}

export function updateTurkey(t, input, dt, speed) {
  t.coyote = Math.max(0, t.coyote - dt);
  t.jumpBuffer = Math.max(0, t.jumpBuffer - dt);
  t.invulnerable = Math.max(0, t.invulnerable - dt);
  t.hurtFlash = Math.max(0, t.hurtFlash - dt);
  t.slipping = Math.max(0, t.slipping - dt);
  t.flap = Math.max(0, t.flap - dt * 3);

  if (input.consumeJump()) t.jumpBuffer = TUNING.jumpBuffer;

  t.sliding = input.sliding() && t.onGround;
  const wantSprint = input.sprinting() && t.stamina > 1 && !t.sliding;
  t.sprinting = wantSprint;
  if (wantSprint) t.stamina = Math.max(0, t.stamina - TUNING.sprintDrain * dt);
  else t.stamina = Math.min(TUNING.maxStamina, t.stamina + TUNING.staminaRegen * dt);

  if (t.jumpBuffer > 0) {
    if (t.onGround || t.coyote > 0) {
      t.vy = TUNING.jumpVelocity;
      t.onGround = false;
      t.coyote = 0;
      t.jumpBuffer = 0;
      t.jumpsUsed = 1;
      t.flap = 1;
      return 'jump';
    }
    if (t.jumpsUsed < 2) {
      t.vy = TUNING.doubleJumpVelocity;
      t.jumpsUsed = 2;
      t.jumpBuffer = 0;
      t.flap = 1;
      return 'flap';
    }
  }

  t.vy += TUNING.gravity * dt;
  t.y += t.vy * dt;
  if (t.y >= GROUND_Y) {
    t.y = GROUND_Y;
    t.vy = 0;
    if (!t.onGround) t.jumpsUsed = 0;
    t.onGround = true;
    t.coyote = TUNING.coyoteTime;
  } else {
    t.onGround = false;
  }

  if (t.onGround) {
    t.runPhase += dt * (t.sprinting ? 1.6 : 1);
    if (Math.abs(t.vy) < 1 && speed > 0) {
      // Footstep timing is handled by the caller via runPhase crossings.
    }
  }
  return null;
}

export function hurtTurkey(t) {
  if (t.invulnerable > 0) return false;
  t.invulnerable = TUNING.invulnerableTime;
  t.hurtFlash = 0.35;
  return true;
}
