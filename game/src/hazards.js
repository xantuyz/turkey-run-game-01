// Hazards and pickups: spawning per stage, movement, oven/knife timers,
// collision boxes and the pickup effects the player collects.
import { GROUND_Y, TUNING } from './config.js';
import { rangeRandom, pickFrom } from './random.js';
import { drawHazardArt, drawPickupArt } from './art.js';

export function createHazardField() {
  return {
    hazards: [],
    pickups: [],
    spawnTimer: 1.2,
    knifeTimer: 0,
    cornStreak: 0,
  };
}

function hazardBox(h) {
  switch (h.kind) {
    case 'fence':
      return { x: h.x, y: GROUND_Y - 64, w: 70, h: 64 };
    case 'haybale':
      return { x: h.x, y: GROUND_Y - 68, w: 80, h: 68 };
    case 'mud':
      return { x: h.x, y: GROUND_Y - 12, w: 140, h: 12 };
    case 'door':
      return { x: h.x, y: GROUND_Y - 150, w: 92, h: 150 };
    case 'knifeFall':
      return { x: h.x, y: h.y - 30, w: 40, h: 70 };
    case 'ovenBurst':
      return { x: h.x, y: GROUND_Y - 110, w: 110, h: 110 };
    case 'rollingPin':
      return { x: h.x, y: GROUND_Y - 28, w: 60, h: 28 };
    case 'oil':
      return { x: h.x, y: GROUND_Y - 10, w: 120, h: 10 };
    case 'ovenMouth':
      return { x: h.x, y: GROUND_Y - 190, w: 150, h: 190 };
    case 'chicken':
      return { x: h.x, y: GROUND_Y - 44, w: 44, h: 44 };
    case 'hideSpot':
      return { x: h.x, y: GROUND_Y - 90, w: 90, h: 90 };
    default:
      return { x: h.x, y: GROUND_Y - 60, w: 60, h: 60 };
  }
}

export function spawnHazard(field, stage, rng, distanceMeters) {
  const kind = pickFrom(rng, stage.hazards);
  const base = { kind, x: 1350, phase: rng() * Math.PI * 2, passed: false, swingPhase: rng() * 6, swing: 0 };
  if (kind === 'knifeFall') {
    base.y = -60;
    base.falling = false;
    base.telegraph = true;
    base.vy = 0;
  } else if (kind === 'ovenBurst') {
    base.cycle = 0;
    base.warn = false;
    base.bursting = false;
    base.flameH = 0;
  } else if (kind === 'rollingPin') {
    base.vx = 260;
    base.spin = 0;
  } else if (kind === 'chicken') {
    base.alerted = false;
  }
  // A final oven mouth guards the last 40 m of the Kitchen (see maybeSpawnOvenMouth).
  field.hazards.push(base);
  return base;
}

const STAGE_END_GUARD = 560;

export function maybeSpawnOvenMouth(field, stage, distanceMeters) {
  if (stage.id !== 3) return;
  if (distanceMeters < STAGE_END_GUARD) return;
  if (field.hazards.some((h) => h.kind === 'ovenMouth')) return;
  field.hazards.push({ kind: 'ovenMouth', x: 1350, phase: 0, passed: false });
}

export function spawnPickup(field, rng, kindOverride) {
  const roll = rng();
  let kind = kindOverride;
  if (!kind) {
    if (roll < 0.55) kind = 'corn';
    else if (roll < 0.78) kind = 'feather';
    else if (roll < 0.9) kind = 'gravy';
    else kind = 'egg';
  }
  const y = kind === 'corn' && rng() < 0.4 ? GROUND_Y - 150 : GROUND_Y - 60 - rng() * 60;
  field.pickups.push({ kind, x: 1350, y, phase: rng() * Math.PI * 2, taken: false });
}

export function updateHazards(field, dt, speed, stage, rng, turkeyX, events) {
  const move = speed * dt;
  field.spawnTimer -= dt;
  if (field.spawnTimer <= 0) {
    spawnHazard(field, stage, rng, events.distanceMeters);
    if (rng() < 0.55) spawnPickup(field, rng);
    const gap = rangeRandom(rng, stage.hazardGap[0], stage.hazardGap[1]);
    field.spawnTimer = gap;
  }
  maybeSpawnOvenMouth(field, stage, events.distanceMeters);

  for (const h of field.hazards) {
    h.x -= move;
    if (h.kind === 'door') {
      h.swingPhase += dt * 2.2;
      h.swing = Math.abs(Math.sin(h.swingPhase));
    }
    if (h.kind === 'rollingPin') {
      h.x -= h.vx * dt;
      h.spin += dt * 9;
    }
    if (h.kind === 'knifeFall') {
      const near = h.x - turkeyX < 320 && h.x - turkeyX > -40;
      if (near && !h.falling) {
        h.falling = true;
        h.vy = 60;
        if (events.onKnifeDrop) events.onKnifeDrop();
      }
      if (h.falling) {
        h.vy += 2400 * dt;
        h.y += h.vy * dt;
        if (h.y > GROUND_Y - 50) h.y = GROUND_Y - 50;
      }
    }
    if (h.kind === 'ovenBurst') {
      h.cycle += dt;
      const t = h.cycle % 2.4;
      h.warn = t > 1.2 && t < 1.8;
      h.bursting = t >= 1.8;
      h.flameH = h.bursting ? 90 + Math.sin(h.cycle * 20) * 18 : 0;
    }
  }
  field.hazards = field.hazards.filter((h) => h.x > -220);

  for (const p of field.pickups) p.x -= move;
  field.pickups = field.pickups.filter((p) => p.x > -80 && !p.taken);
}

export function drawHazards(ctx, field, time) {
  for (const h of field.hazards) {
    if (h.kind === 'chicken') {
      // Chickens are drawn by art.js's chicken painter.
      const { drawChicken } = artChickenShim;
      drawChicken(ctx, h.x + 22, GROUND_Y, h.alerted);
    } else if (h.kind === 'hideSpot') {
      ctx.save();
      ctx.fillStyle = 'rgba(20,12,8,0.85)';
      ctx.fillRect(h.x, GROUND_Y - 90, 90, 90);
      ctx.fillStyle = '#f4d35e';
      ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDE!', h.x + 45, GROUND_Y - 96);
      ctx.restore();
    } else {
      drawHazardArt(ctx, h, time);
    }
  }
  for (const p of field.pickups) drawPickupArt(ctx, p, time);
}

// Lazy shim so hazards.js does not need a second import cycle with art.js.
import { drawChicken as _drawChicken } from './art.js';
const artChickenShim = { drawChicken: _drawChicken };

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function checkHazardHits(field, turkeyRect, turkey) {
  const hits = [];
  for (const h of field.hazards) {
    if (h.passed) continue;
    const box = hazardBox(h);
    if (!rectsOverlap(turkeyRect, box)) continue;
    if (h.kind === 'mud') {
      hits.push({ kind: 'mud', hazard: h });
      continue;
    }
    if (h.kind === 'oil') {
      hits.push({ kind: 'oil', hazard: h });
      h.passed = true;
      continue;
    }
    if (h.kind === 'hideSpot') {
      turkey.hidden = true;
      continue;
    }
    if (h.kind === 'chicken') {
      if (!h.alerted) {
        h.alerted = true;
        hits.push({ kind: 'chicken', hazard: h });
      }
      continue;
    }
    if (h.kind === 'ovenBurst' && !h.bursting) continue;
    if (h.kind === 'knifeFall' && !h.falling) continue;
    if (h.kind === 'door') {
      // The swinging panel only hurts while it is swung near-closed.
      if ((h.swing || 0) < 0.55) continue;
      hits.push({ kind: 'door', hazard: h });
      h.passed = true;
      continue;
    }
    hits.push({ kind: h.kind, hazard: h });
    h.passed = true;
  }
  return hits;
}

export function checkPickupHits(field, turkeyRect) {
  const got = [];
  for (const p of field.pickups) {
    if (p.taken) continue;
    const box = { x: p.x - 20, y: p.y - 22, w: 40, h: 44 };
    if (rectsOverlap(turkeyRect, box)) {
      p.taken = true;
      got.push(p.kind);
    }
  }
  return got;
}
