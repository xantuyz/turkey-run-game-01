// All art is drawn in code with canvas vector shapes — no image files.
// Big readable shapes, thick outlines, one coherent autumn palette.
import { PALETTE, GROUND_Y } from './config.js';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function outline(ctx) {
  ctx.lineWidth = 4;
  ctx.strokeStyle = PALETTE.ink;
  ctx.stroke();
}

export function drawSkyAndGround(ctx, stage, scrollX, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, stage.sky[0]);
  sky.addColorStop(0.55, stage.sky[1]);
  sky.addColorStop(1, stage.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, GROUND_Y);
  // Sun with rays.
  ctx.fillStyle = PALETTE.sun;
  ellipse(ctx, 1080, 110, 58, 58);
  ctx.strokeStyle = 'rgba(255,209,102,0.7)';
  ctx.lineWidth = 6;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + time * 0.05;
    ctx.beginPath();
    ctx.moveTo(1080 + Math.cos(a) * 72, 110 + Math.sin(a) * 72);
    ctx.lineTo(1080 + Math.cos(a) * 92, 110 + Math.sin(a) * 92);
    ctx.stroke();
  }
  // Drifting clouds.
  ctx.fillStyle = 'rgba(255,243,214,0.9)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 340 - scrollX * 0.15 + time * 12) % 1400 + 1400) % 1400 - 60;
    const cy = 70 + i * 42;
    ellipse(ctx, cx, cy, 62, 22);
    ellipse(ctx, cx + 44, cy + 6, 46, 18);
    ellipse(ctx, cx - 44, cy + 8, 40, 16);
  }
  // Dark hill silhouette for stage 3 (kitchen) reads better a touch lighter.
  ctx.fillStyle = stage.id === 3 ? '#3a2430' : '#8a5a2b';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= 1280; x += 80) {
    const h = 60 + 40 * Math.sin((x + scrollX * 0.3) * 0.008);
    ctx.lineTo(x, GROUND_Y - h);
  }
  ctx.lineTo(1280, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, 1280, 100);
  ctx.fillStyle = stage.groundDark || PALETTE.groundDark;
  ctx.fillRect(0, GROUND_Y, 1280, 10);
  ctx.fillStyle = stage.accent;
  for (let i = 0; i < 26; i++) {
    const gx = ((i * 97 - scrollX) % 1400 + 1400) % 1400 - 60;
    ctx.fillRect(gx, GROUND_Y + 26 + (i % 4) * 16, 26, 5);
  }
  // Stage flavour on the horizon.
  if (stage.id === 1) drawFarmFenceLine(ctx, scrollX);
  if (stage.id === 2) drawBarnWall(ctx, scrollX);
  if (stage.id === 3) drawKitchenTiles(ctx, scrollX);
}

function drawFarmFenceLine(ctx, scrollX) {
  ctx.strokeStyle = '#6b4423';
  ctx.lineWidth = 8;
  for (let i = 0; i < 8; i++) {
    const fx = ((i * 220 - scrollX * 0.6) % 1500 + 1500) % 1500 - 80;
    ctx.beginPath();
    ctx.moveTo(fx, GROUND_Y - 46);
    ctx.lineTo(fx, GROUND_Y);
    ctx.moveTo(fx + 90, GROUND_Y - 46);
    ctx.lineTo(fx + 90, GROUND_Y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fx - 20, GROUND_Y - 38);
    ctx.lineTo(fx + 110, GROUND_Y - 38);
    ctx.moveTo(fx - 20, GROUND_Y - 18);
    ctx.lineTo(fx + 110, GROUND_Y - 18);
    ctx.stroke();
  }
  // Pumpkins.
  for (let i = 0; i < 5; i++) {
    const px = ((i * 300 - scrollX * 0.7 + 140) % 1400 + 1400) % 1400 - 40;
    ctx.fillStyle = PALETTE.pumpkin;
    ellipse(ctx, px, GROUND_Y - 16, 26, 20);
    ctx.fillStyle = '#3f7a2a';
    ctx.fillRect(px - 3, GROUND_Y - 40, 6, 10);
  }
}

function drawBarnWall(ctx, scrollX) {
  ctx.fillStyle = PALETTE.barnRed;
  ctx.fillRect(0, 120, 1280, 40);
  ctx.fillStyle = '#7e2a20';
  for (let x = 0; x < 1280; x += 64) ctx.fillRect(x, 120, 4, 40);
  // Hanging lanterns.
  for (let i = 0; i < 4; i++) {
    const lx = ((i * 330 - scrollX * 0.2 + 90) % 1400 + 1400) % 1400 - 40;
    ctx.strokeStyle = '#2b1a12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 120);
    ctx.lineTo(lx, 168);
    ctx.stroke();
    ctx.fillStyle = PALETTE.sun;
    ellipse(ctx, lx, 182, 16, 20);
    ctx.fillStyle = 'rgba(255,209,102,0.25)';
    ellipse(ctx, lx, 182, 34, 34);
  }
}

function drawKitchenTiles(ctx, scrollX) {
  ctx.fillStyle = '#a89878';
  ctx.fillRect(0, 60, 1280, 90);
  ctx.strokeStyle = '#7a6a4e';
  ctx.lineWidth = 3;
  for (let x = 0; x < 1280; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 60);
    ctx.lineTo(x, 150);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 105);
  ctx.lineTo(1280, 105);
  ctx.stroke();
  // Hanging pots.
  ctx.fillStyle = '#4a4a4a';
  for (let i = 0; i < 3; i++) {
    const px = 240 + i * 400;
    ellipse(ctx, px, 210, 34, 26);
    ctx.fillRect(px - 34, 196, 68, 8);
  }
}

export function drawTurkey(ctx, x, y, opts) {
  const o = opts || {};
  const run = o.runPhase || 0;
  const sliding = !!o.sliding;
  const gobbling = !!o.gobbling;
  const flap = o.flap || 0;
  const hurt = !!o.hurt;
  const legSwing = Math.sin(run * 14) * (o.moving ? 14 : 0);
  ctx.save();
  ctx.translate(x, y);
  if (hurt && Math.floor(run * 30) % 2 === 0) ctx.globalAlpha = 0.55;
  // Tail feathers (fanned).
  ctx.fillStyle = '#a0522d';
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.32 - 0.15);
    ctx.beginPath();
    ctx.ellipse(-26, -46, 12, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.wheat;
  for (let i = -1; i <= 1; i++) {
    ctx.save();
    ctx.rotate(i * 0.3);
    ctx.beginPath();
    ctx.ellipse(-24, -40, 6, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Legs.
  ctx.strokeStyle = '#e8a33d';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(8, -8);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  // Body.
  ctx.fillStyle = PALETTE.turkeyBrown;
  ellipse(ctx, 0, sliding ? -22 : -34, 34, sliding ? 20 : 30);
  outline(ctx);
  // Wing (flaps when jumping).
  ctx.fillStyle = '#6b4423';
  ctx.save();
  ctx.translate(-4, -36);
  ctx.rotate(-0.5 - flap * 0.9);
  ctx.beginPath();
  ctx.ellipse(-14, 0, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Head + beak + wattle + big eye.
  const hy = sliding ? -34 : -66;
  ctx.fillStyle = PALETTE.turkeyBrown;
  ellipse(ctx, 22, hy, 17, 16);
  outline(ctx);
  ctx.fillStyle = '#f4a259';
  ctx.beginPath();
  ctx.moveTo(36, hy - 2);
  ctx.lineTo(52, hy + 3);
  ctx.lineTo(36, hy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.wattle;
  ctx.beginPath();
  ctx.ellipse(30, hy + 12, 6, gobbling ? 12 : 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 26, hy - 6, 7, 8);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 28, hy - 6, 3.5, 4.5);
  // Sweat drop when the farmer is close.
  if (o.sweating) {
    ctx.fillStyle = '#7ec8e3';
    ctx.beginPath();
    ctx.ellipse(12, hy - 22, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawFarmer(ctx, x, y, opts) {
  const o = opts || {};
  const run = o.runPhase || 0;
  const lunging = !!o.lunging;
  const legSwing = Math.sin(run * 12) * 16;
  const windup = o.windup || 0;
  ctx.save();
  ctx.translate(x, y);
  if (lunging) ctx.rotate(-0.12);
  // Legs (overalls).
  ctx.strokeStyle = PALETTE.farmerBlue;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(-8, -52);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(8, -52);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  // Body: plaid shirt + overalls.
  ctx.fillStyle = '#b23a2e';
  ellipse(ctx, 0, -78, 30, 32);
  outline(ctx);
  ctx.fillStyle = PALETTE.farmerBlue;
  ctx.fillRect(-22, -66, 44, 34);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(-22, -66, 44, 34);
  // Arm + carving knife (raised when lunging / wind-up).
  const armAngle = lunging ? -2.2 : windup > 0 ? -2.0 + windup * 0.4 : -0.5 - Math.sin(run * 12) * 0.2;
  ctx.save();
  ctx.translate(18, -92);
  ctx.rotate(armAngle);
  ctx.strokeStyle = '#b23a2e';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(26, 6);
  ctx.stroke();
  // Knife in hand.
  ctx.fillStyle = '#d9d9d9';
  ctx.beginPath();
  ctx.moveTo(24, 2);
  ctx.lineTo(62, -6);
  ctx.lineTo(66, 2);
  ctx.lineTo(28, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#5d3617';
  ctx.fillRect(18, 0, 12, 8);
  ctx.restore();
  // Head: beard, nose, angry brows.
  ctx.fillStyle = '#f2c89b';
  ellipse(ctx, 0, -126, 20, 20);
  outline(ctx);
  ctx.fillStyle = '#e8e8e8';
  ellipse(ctx, 0, -112, 16, 10);
  ctx.fillStyle = '#f2c89b';
  ellipse(ctx, 20, -124, 6, 5);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 8, -130, 3, 3.5);
  ellipse(ctx, 16, -130, 3, 3.5);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4, -138);
  ctx.lineTo(12, -134);
  ctx.moveTo(20, -134);
  ctx.lineTo(12, -138);
  ctx.stroke();
  // Straw hat.
  ctx.fillStyle = PALETTE.farmerHat;
  ellipse(ctx, 0, -142, 34, 8);
  ctx.beginPath();
  ctx.ellipse(0, -148, 20, 12, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  // Vision cone + speech bubble.
  if (o.cone) {
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = '#ff5a3c';
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 120);
    ctx.lineTo(x + 10 + o.cone, y - 190);
    ctx.lineTo(x + 10 + o.cone, y - 50);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  if (o.bubble) {
    const bx = x + 6;
    const by = y - 196;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx - 8, by + 18);
    ctx.lineTo(bx - 2, by + 34);
    ctx.lineTo(bx + 8, by + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = o.bubble === '!' ? PALETTE.danger : PALETTE.ink;
    ctx.font = 'bold 30px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.bubble, bx, by + 1);
  }
}

export function drawChicken(ctx, x, y, alerted) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 0, -16, 20, 16);
  outline(ctx);
  ellipse(ctx, 16, -30, 10, 10);
  ctx.fillStyle = PALETTE.danger;
  ctx.beginPath();
  ctx.moveTo(14, -38);
  ctx.lineTo(14, -44);
  ctx.lineTo(20, -38);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4a259';
  ctx.beginPath();
  ctx.moveTo(24, -30);
  ctx.lineTo(34, -27);
  ctx.lineTo(24, -24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 18, -32, 2.5, 3);
  if (alerted) {
    ctx.fillStyle = PALETTE.danger;
    ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUK-BUK!', 0, -56);
  }
  ctx.restore();
}

export function drawHazardArt(ctx, h, time) {
  ctx.save();
  if (h.kind === 'fence') {
    ctx.strokeStyle = '#6b4423';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(h.x, GROUND_Y - 64);
    ctx.lineTo(h.x, GROUND_Y);
    ctx.moveTo(h.x + 70, GROUND_Y - 64);
    ctx.lineTo(h.x + 70, GROUND_Y);
    ctx.moveTo(h.x - 10, GROUND_Y - 52);
    ctx.lineTo(h.x + 80, GROUND_Y - 52);
    ctx.moveTo(h.x - 10, GROUND_Y - 26);
    ctx.lineTo(h.x + 80, GROUND_Y - 26);
    ctx.stroke();
  } else if (h.kind === 'haybale') {
    ctx.fillStyle = '#d9a441';
    ellipse(ctx, h.x + 40, GROUND_Y - 34, 44, 34);
    ctx.strokeStyle = '#8a6a1f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(h.x + 40, GROUND_Y - 34, 44, 34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(h.x + 40, GROUND_Y - 34, 26, 20, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (h.kind === 'mud') {
    ctx.fillStyle = '#4a2f1d';
    ellipse(ctx, h.x + 70, GROUND_Y - 4, 76, 12);
    ctx.fillStyle = '#6b4423';
    ellipse(ctx, h.x + 50, GROUND_Y - 6, 30, 6);
    ellipse(ctx, h.x + 95, GROUND_Y - 5, 22, 5);
  } else if (h.kind === 'door') {
    // Barn door frame + swinging panel.
    ctx.fillStyle = '#7e2a20';
    ctx.fillRect(h.x - 8, GROUND_Y - 150, 16, 150);
    ctx.fillRect(h.x + 84, GROUND_Y - 150, 16, 150);
    ctx.fillRect(h.x - 8, GROUND_Y - 158, 116, 14);
    const ang = (h.swing !== undefined ? h.swing : Math.abs(Math.sin(time * 2.2 + h.phase))) * 0.9;
    ctx.save();
    ctx.translate(h.x + 6, GROUND_Y - 140);
    ctx.rotate(ang * 0.5);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(0, 0, 76, 140);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 76, 140);
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.lineTo(76, 46);
    ctx.moveTo(0, 92);
    ctx.lineTo(76, 92);
    ctx.stroke();
    ctx.restore();
  } else if (h.kind === 'knifeFall') {
    const ky = h.y;
    ctx.save();
    ctx.translate(h.x + 20, ky);
    ctx.rotate(Math.PI * 0.92);
    ctx.fillStyle = '#d9d9d9';
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(10, 10);
    ctx.lineTo(0, 22);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#5d3617';
    ctx.fillRect(-6, 20, 12, 16);
    ctx.restore();
    if (h.telegraph) {
      ctx.fillStyle = 'rgba(230,57,70,0.8)';
      ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', h.x + 20, 90);
    }
  } else if (h.kind === 'ovenBurst') {
    // Oven box with a rhythmic flame burst.
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(h.x, GROUND_Y - 110, 110, 110);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 4;
    ctx.strokeRect(h.x, GROUND_Y - 110, 110, 110);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(h.x + 12, GROUND_Y - 88, 86, 66);
    ctx.fillStyle = h.bursting ? '#ff9f1c' : '#ff6b35';
    ctx.beginPath();
    ctx.ellipse(h.x + 55, GROUND_Y - 55, 26, h.bursting ? 34 : 16, 0, 0, Math.PI * 2);
    ctx.fill();
    if (h.bursting) {
      // Teardrop flame anchored on the oven top, licking upward.
      const top = GROUND_Y - 110;
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath();
      ctx.moveTo(h.x + 25, top);
      ctx.quadraticCurveTo(h.x + 10, top - h.flameH * 0.7, h.x + 55, top - h.flameH);
      ctx.quadraticCurveTo(h.x + 100, top - h.flameH * 0.7, h.x + 85, top);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(h.x + 38, top);
      ctx.quadraticCurveTo(h.x + 32, top - h.flameH * 0.45, h.x + 55, top - h.flameH * 0.6);
      ctx.quadraticCurveTo(h.x + 78, top - h.flameH * 0.45, h.x + 72, top);
      ctx.closePath();
      ctx.fill();
    } else if (h.warn) {
      ctx.fillStyle = 'rgba(255,159,28,0.85)';
      ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', h.x + 55, GROUND_Y - 130);
    }
    ctx.fillStyle = '#e8dcc3';
    ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OVEN', h.x + 55, GROUND_Y - 118);
  } else if (h.kind === 'rollingPin') {
    ctx.save();
    ctx.translate(h.x + 30, GROUND_Y - 14);
    ctx.rotate(h.spin || 0);
    ctx.fillStyle = '#c89b6d';
    ctx.fillRect(-34, -12, 68, 24);
    ctx.fillStyle = '#8a6a45';
    ctx.fillRect(-44, -7, 12, 14);
    ctx.fillRect(32, -7, 12, 14);
    ctx.restore();
  } else if (h.kind === 'oil') {
    ctx.fillStyle = '#2b2b3a';
    ellipse(ctx, h.x + 60, GROUND_Y - 4, 62, 10);
    ctx.fillStyle = 'rgba(126,200,227,0.7)';
    ellipse(ctx, h.x + 44, GROUND_Y - 6, 18, 4);
    ellipse(ctx, h.x + 80, GROUND_Y - 5, 12, 3);
  } else if (h.kind === 'ovenMouth') {
    // The final oven mouth: a huge open oven the turkey must leap over.
    ctx.fillStyle = '#222';
    ctx.fillRect(h.x, GROUND_Y - 190, 150, 190);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 5;
    ctx.strokeRect(h.x, GROUND_Y - 190, 150, 190);
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.ellipse(h.x + 75, GROUND_Y - 90, 52, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.ellipse(h.x + 75, GROUND_Y - 90, 30, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8dcc3';
    ctx.font = 'bold 16px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FINAL OVEN', h.x + 75, GROUND_Y - 200);
  }
  ctx.restore();
}

export function drawPickupArt(ctx, p, time) {
  const bob = Math.sin(time * 4 + p.phase) * 5;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  if (p.kind === 'corn') {
    ctx.fillStyle = PALETTE.wheat;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 20, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-8 + i * 8, -14);
      ctx.lineTo(-8 + i * 8, 14);
      ctx.stroke();
    }
    ctx.fillStyle = '#588157';
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(-12, 30);
    ctx.lineTo(10, 28);
    ctx.closePath();
    ctx.fill();
  } else if (p.kind === 'feather') {
    ctx.fillStyle = '#f6e7c1';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 20, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(6, 20);
    ctx.stroke();
  } else if (p.kind === 'egg') {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.ellipse(-4, -6, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'gravy') {
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.ellipse(0, 4, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x2', 0, -18);
  }
  ctx.restore();
}

export function drawFeatherBurst(ctx, particles) {
  for (const pt of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.rot);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawDustCloud(ctx, x, y, phase) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#d9c9a3';
  for (let i = 0; i < 3; i++) {
    ellipse(ctx, x - i * 12, y - 4 - i * 4 + Math.sin(phase + i) * 2, 10 - i * 2, 7 - i);
  }
  ctx.restore();
}
