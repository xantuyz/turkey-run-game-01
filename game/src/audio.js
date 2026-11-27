// All sound is synthesized with WebAudio — no audio files, no network.
// A tiny bassline loops under play; every effect is a short oscillator burst.
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.stepCount = 0;
  }

  ensureAudio() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      return false;
    }
    return true;
  }

  resumeAudio() {
    if (this.ensureAudio() && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
    return this.muted;
  }

  tone(freq, dur, type, vol, slideTo, delay) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol || 0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noiseBurst(dur, vol, lowpass) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    const gain = this.ctx.createGain();
    gain.gain.value = vol || 0.25;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  playJump() {
    this.tone(280, 0.18, 'sine', 0.25, 620);
  }

  playFlap() {
    this.noiseBurst(0.12, 0.18, 2400);
    this.tone(420, 0.12, 'triangle', 0.15, 700);
  }

  playStep() {
    this.stepCount++;
    if (this.stepCount % 2 === 0) this.noiseBurst(0.05, 0.07, 700);
  }

  playGobble() {
    const base = 190;
    for (let i = 0; i < 5; i++) {
      this.tone(base - i * 12, 0.09, 'sawtooth', 0.22, base - i * 12 - 60, i * 0.085);
    }
    this.tone(95, 0.25, 'square', 0.12, 70, 0.4);
  }

  playSpottedSting() {
    this.tone(880, 0.12, 'square', 0.16, 880);
    this.tone(1174, 0.22, 'square', 0.16, 1174, 0.1);
    this.tone(1568, 0.3, 'square', 0.12, 1568, 0.2);
  }

  playKnifeWhoosh() {
    this.noiseBurst(0.22, 0.22, 3200);
  }

  playHurtThud() {
    this.tone(140, 0.25, 'sine', 0.35, 55);
    this.noiseBurst(0.18, 0.25, 900);
  }

  playPickupChime(high) {
    this.tone(high ? 1320 : 880, 0.1, 'sine', 0.2, high ? 1320 : 880);
    this.tone(high ? 1760 : 1174, 0.16, 'sine', 0.2, high ? 1760 : 1174, 0.08);
  }

  playCaughtWomp() {
    this.tone(220, 0.5, 'sawtooth', 0.25, 55);
    this.tone(110, 0.7, 'square', 0.18, 40, 0.15);
    this.noiseBurst(0.4, 0.2, 600);
  }

  playEscapeFanfare() {
    const notes = [523, 659, 784, 1046, 784, 1046, 1318];
    notes.forEach((n, i) => this.tone(n, 0.22, 'triangle', 0.22, n, i * 0.13));
  }

  playStageClear() {
    [660, 880, 990].forEach((n, i) => this.tone(n, 0.18, 'triangle', 0.2, n, i * 0.1));
  }

  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const bass = [110, 0, 130.8, 0, 98, 0, 146.8, 0, 110, 0, 130.8, 164.8, 98, 0, 123.5, 0];
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const note = bass[this.musicStep % bass.length];
      this.musicStep++;
      if (note) this.tone(note, 0.22, 'triangle', 0.1, note);
      if (this.musicStep % 4 === 0) this.tone(660, 0.08, 'sine', 0.04, 660);
    }, 190);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
