// Gravy Train — A Turkey's Great Escape.
// Main loop, state machine (title / intro / play / paused / caught / escaped),
// collisions, scoring, stage flow and every screen the player sees.
import {
  GAME_WIDTH, GAME_HEIGHT, GROUND_Y, TUNING, STAGE_METERS,
  PIXELS_PER_METER, PALETTE, CONTROLS_TEXT,
} from './config.js';
import { makeRng } from './random.js';
import { SoundEngine } from './audio.js';
import { createInput } from './input.js';
import { createTurkey, updateTurkey, turkeyRect, hurtTurkey } from './turkey.js';
import { createFarmer, updateFarmer, farmerAlert, FARMER_STATES } from './farmer.js';
import {
  createHazardField, updateHazards, drawHazards, checkHazardHits,
  checkPickupHits,
} from './hazards.js';
import { stageAt, stageCount, stageSpeed, stageIntroCard, isStageComplete } from './stages.js';
import { drawHUD } from './hud.js';
import {
  drawSkyAndGround, drawTurkey, drawFarmer, drawFeatherBurst, drawDustCloud,
} from './art.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotParam = params.get('shot');
const seedParam = Number(params.get('seed') || '1');

const sound = new SoundEngine();
const rng = makeRng((Date.now() % 2147483647) || 1);

const game = {
  state: 'title',
  stageIndex: 0,
  stage: stageAt(0),
  turkey: createTurkey(),
  farmer: createFarmer(),
  field: createHazardField(),
  score: 0,
  lives: TUNING.maxLives,
  distanceMeters: 0,
  scrollX: 0,
  time: 0,
  speed: 0,
  gobbleCooldown: 0,
  gobbleStun: 0,
  gravyTime: 0,
  shake: 0,
  particles: [],
  introTime: 0,
  endReason: '',
  bestScore: 0,
  shotMode: false,
  shotName: null,
  titleTurkeyX: 640,
  muted: false,
  stepAcc: 0,
  caught: false,
};

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function resetRun() {
  game.stageIndex = 0;
  game.stage = stageAt(0);
  game.turkey = createTurkey();
  game.farmer = createFarmer();
  game.field = createHazardField();
  game.score = 0;
  game.lives = TUNING.maxLives;
  game.distanceMeters = 0;
  game.scrollX = 0;
  game.gobbleCooldown = 0;
  game.gobbleStun = 0;
  game.gravyTime = 0;
  game.shake = 0;
  game.particles = [];
  game.caught = false;
  game.endReason = '';
}

function startGame() {
  resetRun();
  input.jumpQueued = false;
  input.gobbleQueued = false;
  game.state = 'intro';
  game.introTime = 0;
  sound.resumeAudio();
  sound.startMusic();
  announce('Stage 1: The Farmyard. Run!');
}

function startStage(index) {
  game.stageIndex = index;
  game.stage = stageAt(index);
  game.distanceMeters = 0;
  game.field = createHazardField();
  game.farmer = createFarmer();
  game.farmer.speedMul = game.stage.farmerSpeed;
  game.farmer.lungeMul = game.stage.lungeSpeed;
  game.farmer.cone = game.stage.coneWidth;
  game.state = 'intro';
  game.introTime = 0;
  sound.playStageClear();
}

function endCaught(reason) {
  if (game.state === 'caught' || game.state === 'escaped') return;
  game.state = 'caught';
  game.endReason = reason;
  game.bestScore = Math.max(game.bestScore, Math.floor(game.score));
  sound.playCaughtWomp();
  sound.stopMusic();
  announce('Caught! ' + reason + ' Score ' + Math.floor(game.score));
}

function endEscaped() {
  game.state = 'escaped';
  game.bestScore = Math.max(game.bestScore, Math.floor(game.score));
  sound.playEscapeFanfare();
  sound.stopMusic();
  announce('Escaped! You made it out of the kitchen. Score ' + Math.floor(game.score));
}

function spawnFeathers(x, y, n) {
  for (let i = 0; i < n; i++) {
    game.particles.push({
      x, y,
      vx: (rng() - 0.5) * 420,
      vy: -rng() * 320 - 60,
      rot: rng() * Math.PI * 2,
      vr: (rng() - 0.5) * 10,
      life: 0.9,
      maxLife: 0.9,
      color: rng() < 0.5 ? '#f6e7c1' : '#8b5a2b',
    });
  }
}

function takeHit(source) {
  if (game.turkey.invulnerable > 0) return;
  if (!hurtTurkey(game.turkey)) return;
  game.lives -= 1;
  game.shake = 0.35;
  spawnFeathers(game.turkey.x, game.turkey.y - 40, 16);
  sound.playHurtThud();
  if (game.lives <= 0) {
    endCaught(source === 'farmer' ? 'The farmer grabbed you by the drumstick!' : 'Too many bumps on the road to freedom.');
  } else {
    announce('Ouch! ' + game.lives + ' lives left.');
  }
}

function doGobble() {
  if (game.gobbleCooldown > 0 || game.state !== 'play') return;
  const gap = game.turkey.x - game.farmer.x;
  game.gobbleCooldown = TUNING.gobbleCooldown;
  sound.playGobble();
  game.turkey.flap = 1;
  if (gap < TUNING.gobbleRange && game.farmer.state !== FARMER_STATES.STUNNED) {
    game.gobbleStun = TUNING.gobbleStun;
    game.farmer.x -= 60;
    spawnFeathers(game.farmer.x + 20, game.farmer.y - 120, 8);
  }
}

function collectPickup(kind) {
  if (kind === 'corn') {
    game.score += TUNING.cornScore * (game.gravyTime > 0 ? 2 : 1);
    sound.playPickupChime(false);
  } else if (kind === 'feather') {
    game.turkey.stamina = Math.min(TUNING.maxStamina, game.turkey.stamina + TUNING.featherStamina);
    game.score += 25;
    sound.playPickupChime(false);
  } else if (kind === 'egg') {
    game.lives = Math.min(TUNING.maxLives, game.lives + 1);
    game.score += TUNING.goldenEggScore;
    sound.playPickupChime(true);
  } else if (kind === 'gravy') {
    game.gravyTime = TUNING.gravyDuration;
    game.score += 100;
    sound.playPickupChime(true);
  }
}

const input = createInput(canvas, {
  onKey(code) {
    if (code === 'KeyM') {
      game.muted = sound.setMuted(!game.muted);
      return;
    }
    if (code === 'KeyP' && (game.state === 'play' || game.state === 'paused')) {
      game.state = game.state === 'play' ? 'paused' : 'play';
      announce(game.state === 'paused' ? 'Paused' : 'Running');
      return;
    }
    if (code === 'KeyR' && (game.state === 'caught' || game.state === 'escaped' || game.state === 'paused')) {
      startGame();
      return;
    }
    if (code === 'Enter' || code === 'Space') {
      if (game.state === 'title') startGame();
      else if (game.state === 'caught' || game.state === 'escaped') startGame();
    }
  },
  onClick() {
    if (game.state === 'title' || game.state === 'caught' || game.state === 'escaped') startGame();
  },
});

function update(dt) {
  game.time += dt;
  game.shake = Math.max(0, game.shake - dt);
  game.gobbleCooldown = Math.max(0, game.gobbleCooldown - dt);
  game.gobbleStun = Math.max(0, game.gobbleStun - dt);
  game.gravyTime = Math.max(0, game.gravyTime - dt);

  for (const p of game.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 500 * dt;
    p.rot += p.vr * dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);

  if (game.state === 'title') {
    game.titleTurkeyX = 1060 + Math.sin(game.time * 0.8) * 24;
    return;
  }
  if (game.state === 'intro') {
    game.introTime += dt;
    if (game.introTime > 1.8) game.state = 'play';
    return;
  }
  if (game.state !== 'play') return;

  const t = game.turkey;
  const speed = stageSpeed(game.stage, t.sprinting);
  game.speed = speed;
  game.scrollX += speed * dt;
  game.distanceMeters += (speed * dt) / PIXELS_PER_METER;
  game.score += dt * 10 * (game.gravyTime > 0 ? 2 : 1);

  // Footsteps.
  const prevPhase = t.runPhase;
  const jumpResult = updateTurkey(t, input, dt, speed);
  if (jumpResult === 'jump') sound.playJump();
  if (jumpResult === 'flap') sound.playFlap();
  if (t.onGround && Math.floor(t.runPhase * 2) !== Math.floor(prevPhase * 2)) sound.playStep();

  if (input.consumeGobble()) doGobble();

  // Hide spots: hidden while overlapping one.
  const wasHidden = t.hidden;
  t.hidden = false;

  updateFarmer(game.farmer, dt, {
    turkey: t,
    stage: game.stage,
    speed,
    gobbleStun: game.gobbleStun,
    onSpotted(kind) {
      sound.playSpottedSting();
      if (kind === 'chase') game.shake = Math.max(game.shake, 0.15);
    },
    onCaught() {
      endCaught('The farmer grabbed you by the drumstick!');
    },
  });
  if (game.state !== 'play') return;

  updateHazards(game.field, dt, speed, game.stage, rng, t.x, {
    distanceMeters: game.distanceMeters,
    onKnifeDrop() {
      sound.playKnifeWhoosh();
    },
  });

  const rect = turkeyRect(t);
  const hits = checkHazardHits(game.field, rect, t);
  for (const hit of hits) {
    if (hit.kind === 'mud') {
      game.scrollX -= speed * dt * 0.4;
      game.distanceMeters = Math.max(0, game.distanceMeters - (speed * dt * 0.4) / PIXELS_PER_METER);
    } else if (hit.kind === 'oil') {
      t.slipping = 1.0;
      game.shake = Math.max(game.shake, 0.12);
      sound.playHurtThud();
    } else if (hit.kind === 'chicken') {
      farmerAlert(game.farmer, 0.9);
      sound.playSpottedSting();
    } else {
      takeHit(hit.kind);
    }
    if (game.state !== 'play') return;
  }
  if (!wasHidden && t.hidden) announce('Hidden! The farmer lost you.');

  const got = checkPickupHits(game.field, rect);
  for (const kind of got) collectPickup(kind);

  // Farmer catches the turkey if he closes the gap while not stunned.
  if (game.farmer.x >= t.x - TUNING.farmerCatchDistance && game.farmer.state !== FARMER_STATES.STUNNED) {
    endCaught('The farmer grabbed you by the drumstick!');
    return;
  }

  if (isStageComplete(game.distanceMeters)) {
    if (game.stageIndex >= stageCount() - 1) {
      endEscaped();
    } else {
      startStage(game.stageIndex + 1);
    }
  }
}

function drawTitle() {
  drawSkyAndGround(ctx, stageAt(0), game.scrollX, game.time);
  // Big title card.
  ctx.save();
  ctx.fillStyle = 'rgba(43,26,18,0.78)';
  ctx.beginPath();
  ctx.roundRect(240, 90, 800, 300, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.wheat;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.sun;
  ctx.font = 'bold 84px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('GRAVY TRAIN', 640, 180);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 34px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText("A Turkey's Great Escape", 640, 228);
  ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = '#ffd166';
  ctx.fillText('Thanksgiving morning. The farmer is coming. RUN!', 640, 268);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
  const blink = Math.sin(game.time * 4) > -0.2;
  if (blink) ctx.fillText('PRESS ENTER OR CLICK TO START', 640, 330);
  ctx.font = '17px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Escape all 3 stages — Farmyard, Barn, Kitchen — before the oven wins.', 640, 366);
  ctx.restore();
  // Hero turkey + farmer on the lawn (turkey clear of the controls panel).
  drawTurkey(ctx, game.titleTurkeyX, GROUND_Y, { runPhase: game.time, moving: true });
  drawFarmer(ctx, 180, GROUND_Y, { runPhase: game.time, bubble: '!', cone: 0 });
  // Controls strip.
  ctx.save();
  ctx.fillStyle = 'rgba(43,26,18,0.72)';
  ctx.beginPath();
  ctx.roundRect(330, 430, 620, 150, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 18px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOW TO PLAY', 640, 458);
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  CONTROLS_TEXT.forEach((line, i) => ctx.fillText(line, 640, 486 + i * 22));
  ctx.restore();
}

function drawIntroCard() {
  drawSkyAndGround(ctx, game.stage, game.scrollX, game.time);
  drawTurkey(ctx, game.turkey.x, game.turkey.y, { runPhase: 0 });
  const card = stageIntroCard(game.stage);
  ctx.save();
  ctx.globalAlpha = Math.min(1, game.introTime * 3);
  ctx.fillStyle = 'rgba(43,26,18,0.82)';
  ctx.beginPath();
  ctx.roundRect(340, 230, 600, 200, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.wheat;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.sun;
  ctx.font = 'bold 44px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(card.title, 640, 300);
  ctx.fillStyle = PALETTE.danger;
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(card.threat, 640, 342);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '19px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(card.tip, 640, 378);
  ctx.restore();
}

function drawEndScreen(escaped) {
  drawSkyAndGround(ctx, game.stage, game.scrollX, game.time);
  drawTurkey(ctx, game.turkey.x, game.turkey.y, { runPhase: 0, hurt: !escaped });
  if (!escaped) drawFarmer(ctx, game.farmer.x, game.farmer.y, { runPhase: 0, bubble: '!' });
  ctx.save();
  ctx.fillStyle = escaped ? 'rgba(40,80,40,0.85)' : 'rgba(60,16,16,0.85)';
  ctx.beginPath();
  ctx.roundRect(330, 150, 620, 340, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.wheat;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#b7e4a8' : '#ff8fa3';
  ctx.font = 'bold 64px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', 640, 240);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(
    escaped
      ? 'You outran the farmer, the knives and the oven.'
      : 'Jadi hidangan Thanksgiving... the farmer got his dinner.',
    640, 288,
  );
  if (!escaped && game.endReason) {
    ctx.font = '18px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(game.endReason, 640, 318);
  }
  ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('SCORE  ' + Math.floor(game.score), 640, 368);
  ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Distance: ' + Math.floor(game.distanceMeters) + ' m  •  Stage ' + game.stage.id + '/3', 640, 402);
  ctx.fillStyle = PALETTE.sun;
  ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
  const blink = Math.sin(game.time * 4) > -0.2;
  if (blink) ctx.fillText('PRESS ENTER OR CLICK TO RESTART  [R]', 640, 452);
  ctx.restore();
}

function render() {
  ctx.save();
  if (game.shake > 0) {
    ctx.translate((rng() - 0.5) * game.shake * 24, (rng() - 0.5) * game.shake * 24);
  }
  if (game.state === 'title') {
    drawTitle();
    ctx.restore();
    return;
  }
  if (game.state === 'intro') {
    drawIntroCard();
    ctx.restore();
    return;
  }
  if (game.state === 'caught') {
    drawEndScreen(false);
    ctx.restore();
    return;
  }
  if (game.state === 'escaped') {
    drawEndScreen(true);
    ctx.restore();
    return;
  }

  const stage = game.stage;
  drawSkyAndGround(ctx, stage, game.scrollX, game.time);
  drawHazards(ctx, game.field, game.time);
  drawDustCloud(ctx, game.turkey.x - 34, GROUND_Y, game.time);
  const farmer = game.farmer;
  const chasing = farmer.state === FARMER_STATES.CHASE || farmer.state === FARMER_STATES.LUNGE;
  drawFarmer(ctx, farmer.x, farmer.y, {
    runPhase: farmer.runPhase,
    cone: chasing ? farmer.cone : farmer.state === FARMER_STATES.SUSPICIOUS ? farmer.cone * 0.7 : 0,
    bubble: farmer.bubble,
    lunging: farmer.state === FARMER_STATES.LUNGE,
    windup: farmer.windup || 0,
  });
  drawTurkey(ctx, game.turkey.x, game.turkey.y, {
    runPhase: game.turkey.runPhase,
    moving: true,
    sliding: game.turkey.sliding,
    gobbling: game.gobbleCooldown > 5.4,
    flap: game.turkey.flap,
    hurt: game.turkey.hurtFlash > 0,
    sweating: chasing,
  });
  drawFeatherBurst(ctx, game.particles);

  // Gobble shockwave ring.
  if (game.gobbleCooldown > 5.4) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,209,102,0.9)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(game.turkey.x, game.turkey.y - 40, (6 - game.gobbleCooldown) * 120, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawHUD(ctx, game);

  if (game.state === 'paused') {
    ctx.save();
    ctx.fillStyle = 'rgba(43,26,18,0.6)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 64px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 640, 330);
    ctx.font = '22px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Press P to keep running  •  R to restart  •  M to mute', 640, 380);
    ctx.restore();
  }
  ctx.restore();
}

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (!game.shotMode) update(dt);
  render();
  requestAnimationFrame(frame);
}

// Debug / play-test hook (used by the maker's own tests, not by the game).
window.__game = {
  game,
  start: startGame,
  reset: resetRun,
  state() {
    return game.state;
  },
  score() {
    return Math.floor(game.score);
  },
  lives() {
    return game.lives;
  },
  hurt() {
    takeHit('test');
  },
  catch() {
    endCaught('Test catch.');
  },
  escape() {
    endEscaped();
  },
  jump() {
    game.turkey.jumpBuffer = TUNING.jumpBuffer;
  },
  setStage(i) {
    startStage(i);
  },
};

if (shotParam) {
  applyShot(game, shotParam, seedParam);
  render();
  requestAnimationFrame(frame);
} else {
  requestAnimationFrame(frame);
}
