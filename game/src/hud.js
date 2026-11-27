// HUD: score, stage + distance bar, drumstick lives, stamina, gobble
// cooldown, the farmer-distance meter and the red "spotted" vignette.
import { PALETTE, STAGE_METERS } from './config.js';
import { stageProgress } from './stages.js';

function panel(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(43,26,18,0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,243,214,0.65)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawDrumstick(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = filled ? '#c96f2e' : 'rgba(255,243,214,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 10, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = filled ? '#fff3d6' : 'rgba(255,243,214,0.35)';
  ctx.beginPath();
  ctx.arc(12, -10, 4, 0, Math.PI * 2);
  ctx.arc(16, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawHUD(ctx, game) {
  const g = game;
  // Score, top-left.
  panel(ctx, 16, 14, 250, 64);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('SCORE', 30, 36);
  ctx.font = 'bold 30px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(String(Math.floor(g.score)), 30, 66);
  if (g.gravyTime > 0) {
    ctx.fillStyle = PALETTE.sun;
    ctx.font = 'bold 16px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('GRAVY x2  ' + Math.ceil(g.gravyTime) + 's', 150, 36);
  }

  // Stage + distance bar, top-centre.
  const barW = 420;
  const barX = 640 - barW / 2;
  panel(ctx, barX - 10, 14, barW + 20, 64);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 16px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.stage.name + '  —  ' + Math.floor(g.distanceMeters) + ' / ' + STAGE_METERS + ' m', 640, 38);
  ctx.fillStyle = 'rgba(255,243,214,0.25)';
  ctx.fillRect(barX, 48, barW, 12);
  ctx.fillStyle = PALETTE.wheat;
  ctx.fillRect(barX, 48, barW * stageProgress(g.distanceMeters), 12);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, 48, barW, 12);

  // Lives, top-right.
  panel(ctx, 1010, 14, 254, 64);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LIVES', 1024, 36);
  for (let i = 0; i < 3; i++) drawDrumstick(ctx, 1064 + i * 44, 56, i < g.lives);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('STAGE ' + g.stage.id + '/3', 1180, 36);

  // Stamina, bottom-left.
  panel(ctx, 16, 648, 220, 56);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('SPRINT', 30, 670);
  ctx.fillStyle = 'rgba(255,243,214,0.25)';
  ctx.fillRect(30, 678, 180, 12);
  ctx.fillStyle = g.turkey.stamina > 25 ? '#7fb069' : PALETTE.danger;
  ctx.fillRect(30, 678, 180 * (g.turkey.stamina / 100), 12);

  // Gobble cooldown, bottom-right.
  panel(ctx, 1010, 648, 254, 56);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(g.gobbleCooldown > 0 ? 'GOBBLE ... ' + g.gobbleCooldown.toFixed(1) + 's' : 'GOBBLE READY [G]', 1024, 670);
  ctx.fillStyle = 'rgba(255,243,214,0.25)';
  ctx.fillRect(1024, 678, 220, 12);
  const frac = 1 - g.gobbleCooldown / 6;
  ctx.fillStyle = PALETTE.sun;
  ctx.fillRect(1024, 678, 220 * Math.max(0, Math.min(1, frac)), 12);

  // Farmer distance meter, bottom-centre.
  const gap = Math.max(0, g.turkey.x - g.farmer.x);
  const gapFrac = Math.min(1, gap / 500);
  panel(ctx, 430, 648, 420, 56);
  ctx.fillStyle = gapFrac < 0.3 ? PALETTE.danger : PALETTE.cream;
  ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER', 444, 670);
  ctx.fillStyle = 'rgba(255,243,214,0.25)';
  ctx.fillRect(444, 678, 300, 12);
  ctx.fillStyle = gapFrac < 0.3 ? PALETTE.danger : '#e85d04';
  ctx.fillRect(444, 678, 300 * gapFrac, 12);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(gapFrac < 0.3 ? 'TOO CLOSE!' : Math.floor(gap / 10) + ' m behind', 752, 670);

  // Spotted vignette + "!" when the farmer is chasing.
  if (g.farmer.state === 'CHASE' || g.farmer.state === 'LUNGE') {
    const vg = ctx.createRadialGradient(640, 360, 260, 640, 360, 720);
    vg.addColorStop(0, 'rgba(230,57,70,0)');
    vg.addColorStop(1, 'rgba(230,57,70,0.30)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = PALETTE.danger;
    ctx.font = 'bold 64px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 640, 150);
    ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('SPOTTED! RUN!', 640, 182);
  }
}
