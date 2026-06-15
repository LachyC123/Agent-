// Audio.js — procedural WebAudio sound engine for NEON RIFT.
// No audio files: every SFX and the music loop are synthesised at runtime with
// oscillators + filtered noise, matching the all-procedural art pipeline.
// Browsers block audio until a user gesture, so call Sfx.resume() on first tap.

const Sfx = {
  ctx: null,
  master: null, sfxBus: null, musicBus: null,
  enabled: true,
  musicPlaying: false,
  stepDur: 60 / 96 / 4, // 16th notes at 96 BPM
  step: 0,
  nextNoteTime: 0,
  musicTimer: null,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.7;
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.0;
    this.musicBus.connect(this.master);
  },

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.55 : 0;
  },

  // ---- low-level voices ----
  tone(o) {
    if (!this.enabled || !this.ctx) return;
    const t0 = o.t || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.slideTo), t0 + o.dur);
    const vol = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g); g.connect(o.bus || this.sfxBus);
    osc.start(t0); osc.stop(t0 + o.dur + 0.03);
  },

  noise(o) {
    if (!this.enabled || !this.ctx) return;
    const t0 = o.t || this.ctx.currentTime;
    const dur = o.dur || 0.2;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = o.filter || 'bandpass';
    filt.frequency.value = o.freq || 1000; filt.Q.value = o.Q || 1;
    const g = this.ctx.createGain();
    const vol = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt); filt.connect(g); g.connect(o.bus || this.sfxBus);
    src.start(t0); src.stop(t0 + dur + 0.03);
  },

  // ---- game SFX ----
  shot(pitch = 1) {
    this.tone({ type: 'square', freq: 620 * pitch, slideTo: 170 * pitch, dur: 0.11, vol: 0.14 });
    this.noise({ filter: 'highpass', freq: 2200, dur: 0.04, vol: 0.10 });
  },
  hit() {
    this.noise({ filter: 'lowpass', freq: 900, dur: 0.10, vol: 0.20 });
    this.tone({ type: 'sine', freq: 180, slideTo: 60, dur: 0.09, vol: 0.16 });
  },
  heal() {
    this.tone({ type: 'sine', freq: 520, slideTo: 920, dur: 0.22, vol: 0.11 });
  },
  ability() {
    this.tone({ type: 'sawtooth', freq: 220, slideTo: 1100, dur: 0.22, vol: 0.10 });
    this.noise({ filter: 'bandpass', freq: 1400, Q: 2, dur: 0.18, vol: 0.10 });
  },
  ult() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    this.tone({ type: 'sine', freq: 90, slideTo: 38, dur: 0.85, vol: 0.32, t });
    this.tone({ type: 'sawtooth', freq: 180, slideTo: 760, dur: 0.5, vol: 0.13, t });
    this.noise({ filter: 'lowpass', freq: 1600, dur: 0.55, vol: 0.22, t });
  },
  kill() {
    this.noise({ filter: 'lowpass', freq: 600, dur: 0.32, vol: 0.26 });
    this.tone({ type: 'square', freq: 130, slideTo: 30, dur: 0.26, vol: 0.18 });
  },
  click() {
    this.resume();
    this.tone({ type: 'square', freq: 880, dur: 0.045, vol: 0.10 });
    this.tone({ type: 'square', freq: 1320, dur: 0.05, vol: 0.07 });
  },
  respawn() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [440, 660, 880].forEach((f, i) =>
      this.tone({ type: 'triangle', freq: f, dur: 0.12, vol: 0.12, t: t + i * 0.07 }));
  },
  victory() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) =>
      this.tone({ type: 'square', freq: f, dur: 0.2, vol: 0.16, t: t + i * 0.12 }));
  },
  defeat() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [392, 330, 262, 196].forEach((f, i) =>
      this.tone({ type: 'sawtooth', freq: f, dur: 0.28, vol: 0.16, t: t + i * 0.14 }));
  },

  // ---- music: looping synthwave bed ----
  // i - VI - III - VII (Am - F - C - G), one chord per 4 steps.
  _chords: [
    [0, 3, 7],    // Am
    [-4, 0, 3],   // F
    [3, 7, 10],   // C
    [-2, 2, 5],   // G
  ],
  _semi(base, s) { return base * Math.pow(2, s / 12); },

  startMusic() {
    this.resume();
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    // fade music in
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.musicBus.gain.exponentialRampToValueAtTime(0.28, this.ctx.currentTime + 2);
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this._scheduler(), 25);
  },

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
    this.musicPlaying = false;
    if (this.musicBus && this.ctx) {
      this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicBus.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
    }
  },

  _scheduler() {
    if (!this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      this._playStep(this.step, this.nextNoteTime);
      this.nextNoteTime += this.stepDur;
      this.step = (this.step + 1) % 16;
    }
  },

  _playStep(step, t) {
    const bus = this.musicBus;
    const chord = this._chords[Math.floor(step / 4)];
    const sd = this.stepDur;

    // bass + pad on each chord change
    if (step % 4 === 0) {
      this.tone({ type: 'triangle', freq: this._semi(55, chord[0]), dur: sd * 3.6, vol: 0.16, attack: 0.01, bus, t });
      chord.forEach(s =>
        this.tone({ type: 'sawtooth', freq: this._semi(220, s), dur: sd * 3.6, vol: 0.03, attack: 0.06, bus, t }));
    }
    // bass pulse on the off-beat for groove
    if (step % 4 === 2) {
      this.tone({ type: 'triangle', freq: this._semi(55, chord[0]), dur: sd * 1.4, vol: 0.10, attack: 0.01, bus, t });
    }
    // arpeggio (octave up), light
    const arp = chord[step % chord.length];
    this.tone({ type: 'square', freq: this._semi(440, arp), dur: sd * 0.85, vol: 0.035, bus, t });
    // kick + hat
    if (step % 4 === 0) this.noise({ filter: 'lowpass', freq: 130, dur: 0.12, vol: 0.12, bus, t });
    if (step % 2 === 1) this.noise({ filter: 'highpass', freq: 7000, dur: 0.03, vol: 0.03, bus, t });
  },
};
