// Stage definitions: the ramp, the intro cards and what each stage adds.
// The world is three 600 m escapes: Farmyard -> Barn -> Kitchen.
import { STAGE_DEFS, STAGE_METERS, TUNING } from './config.js';

export function stageAt(index) {
  return STAGE_DEFS[Math.min(index, STAGE_DEFS.length - 1)];
}

export function stageCount() {
  return STAGE_DEFS.length;
}

export function stageSpeed(stage, sprinting) {
  const base = TUNING.baseSpeed + stage.speedBonus;
  return sprinting ? TUNING.sprintSpeed + stage.speedBonus : base;
}

export function stageIntroCard(stage) {
  return {
    title: stage.subtitle,
    threat: 'NEW DANGER: ' + stage.threat,
    tip: stage.id === 1
      ? 'Jump the fences. Mud slows you down.'
      : stage.id === 2
        ? 'Chickens rat you out! Slide into dark corners to hide.'
        : 'Time your jumps between oven bursts. The oven mouth is the last leap!',
  };
}

export function stageProgress(distanceMeters) {
  return Math.min(1, distanceMeters / STAGE_METERS);
}

export function isStageComplete(distanceMeters) {
  return distanceMeters >= STAGE_METERS;
}

export function nextStageIndex(index) {
  return Math.min(index + 1, STAGE_DEFS.length - 1);
}
