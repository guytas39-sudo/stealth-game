// Small WebAudio sounds for Midnight Archive, all synthesized — no audio files.
// A guard's footsteps grow louder as he comes near, so you can hear a patrol
// before you see its cone. Everything is silent until the first user gesture.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') void ctx.resume();
      return true;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, gain, when = 0) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    /** Call from any user gesture so the browser lets sound start. */
    unlock() {
      ensure();
    },
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    /** A soft thud for a guard's step; nearer guards sound louder. */
    footstep(distance) {
      if (!ensure()) return;
      const gain = Math.max(0, 0.16 * (1 - distance / 520));
      if (gain < 0.01) return;
      tone(82, 0.09, 'triangle', gain);
    },
    /** The player's own quiet step. */
    playerStep() {
      if (!ensure()) return;
      tone(140, 0.05, 'sine', 0.03);
    },
    pickup() {
      tone(660, 0.12, 'sine', 0.12);
      tone(990, 0.18, 'sine', 0.1, 0.09);
    },
    alert() {
      tone(220, 0.16, 'square', 0.07);
      tone(233, 0.2, 'square', 0.07, 0.12);
    },
    caught() {
      tone(160, 0.35, 'sawtooth', 0.1);
      tone(110, 0.45, 'sawtooth', 0.1, 0.15);
    },
    win() {
      [523, 659, 784, 1047].forEach((freq, i) => tone(freq, 0.3, 'sine', 0.11, i * 0.13));
    },
    click() {
      tone(440, 0.06, 'sine', 0.06);
    },
  };
}
