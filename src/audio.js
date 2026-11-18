// Procedural WebAudio Synthesizer for Fund Empire: 26F
(function () {
  class SoundEngine {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    setEnabled(flag) {
      this.enabled = !!flag;
      if (this.enabled) this.play("click");
    }

    tone(freq, duration, type = "sine", vol = 0.12, delay = 0, slideTo = null) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo) {
          osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
        }
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.02);
      } catch (_) {}
    }

    play(name) {
      if (!this.enabled) return;
      switch (name) {
        case "click":
          this.tone(660, 0.055, "triangle", 0.09, 0, 880);
          break;
        case "tab":
          this.tone(520, 0.06, "sine", 0.08, 0, 680);
          break;
        case "bell": // Opening bell for new floor
          this.tone(880, 0.28, "triangle", 0.14, 0);
          this.tone(1320, 0.34, "sine", 0.1, 0.06);
          this.tone(1760, 0.42, "sine", 0.08, 0.12);
          break;
        case "coin": // Correct business decision / AUM up
          this.tone(587.33, 0.09, "triangle", 0.13, 0);
          this.tone(880, 0.12, "triangle", 0.13, 0.07);
          this.tone(1174.66, 0.22, "sine", 0.14, 0.14);
          break;
        case "wrong": // Compliance warning / wrong choice
          this.tone(240, 0.16, "sawtooth", 0.11, 0, 170);
          this.tone(185, 0.24, "sawtooth", 0.11, 0.13, 130);
          break;
        case "boss": // Regulatory inspection entrance
          this.tone(330, 0.14, "square", 0.08, 0);
          this.tone(440, 0.14, "square", 0.08, 0.12);
          this.tone(659.25, 0.28, "triangle", 0.12, 0.24);
          break;
        case "hint":
          this.tone(740, 0.08, "sine", 0.09, 0);
          this.tone(1110, 0.16, "sine", 0.09, 0.07);
          break;
        case "win": // Floor cleared fanfare
          this.tone(523.25, 0.12, "triangle", 0.14, 0);
          this.tone(659.25, 0.12, "triangle", 0.14, 0.1);
          this.tone(783.99, 0.12, "triangle", 0.14, 0.2);
          this.tone(1046.5, 0.38, "triangle", 0.16, 0.3);
          break;
        case "fail":
          this.tone(311.13, 0.18, "sawtooth", 0.1, 0);
          this.tone(277.18, 0.18, "sawtooth", 0.1, 0.16);
          this.tone(220.0, 0.35, "sawtooth", 0.11, 0.32);
          break;
      }
    }
  }

  window.GameAudio = new SoundEngine();
})();
