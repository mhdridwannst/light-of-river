const SCALE = [523, 587, 659, 784, 880, 988, 1047, 1175];

export class Sfx {
  #ac = null;
  muted = false;

  unlock() {
    this.#ac ??= new (window.AudioContext || window.webkitAudioContext)();
    if (this.#ac.state === "suspended") this.#ac.resume();
  }
  gate() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => this.tone(f, "sine", 0.8, 0.1), i * 90),
    );
  }

  tone(freq, type = "sine", dur = 0.5, vol = 0.12) {
    const ac = this.#ac;
    if (!ac || this.muted) return;
    const o = ac.createOscillator(),
      g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + dur);
  }
  pickup(combo) {
    this.tone(SCALE[Math.min(Math.max(combo - 2, 0), 7)], "sine", 0.6);
  }
  near() {
    this.tone(1200, "sine", 0.15, 0.06);
  }
  hit() {
    this.tone(90, "sawtooth", 0.35);
  }
  dash() {
    this.tone(300, "triangle", 0.25, 0.1);
    this.tone(450, "triangle", 0.25, 0.08);
  }
  /** Detak jantung "dug-dug" saat api hampir padam. */
  heart() {
    this.tone(60, "sine", 0.18, 0.22);
    setTimeout(() => this.tone(52, "sine", 0.18, 0.15), 140);
  }
}
