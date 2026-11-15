// Synthesised sound effects: no audio files, just a WebAudio oscillator and a
// little envelope. The context is created on the first user gesture (browsers
// forbid it before one), and every call is guarded so a headless run or a
// muted tab never throws.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context !== null) return context;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  /** A short tone: frequency slides from `from` to `to` over `seconds`. */
  function tone(from, to, seconds, type, gainValue) {
    if (muted) return;
    const audio = ensure();
    if (audio === null) return;
    try {
      if (audio.state === 'suspended') void audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const now = audio.currentTime;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(from, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + seconds);
      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + seconds + 0.02);
    } catch {
      // Sound is garnish: a failure here must never stop the game.
    }
  }

  return {
    launch() {
      tone(220, 660, 0.25, 'sine', 0.12);
    },
    shard() {
      tone(880, 1320, 0.18, 'triangle', 0.1);
    },
    crash() {
      tone(180, 40, 0.4, 'sawtooth', 0.14);
    },
    win() {
      tone(523, 523, 0.12, 'triangle', 0.1);
      window.setTimeout(() => tone(659, 659, 0.12, 'triangle', 0.1), 110);
      window.setTimeout(() => tone(784, 1046, 0.3, 'triangle', 0.12), 220);
    },
    lose() {
      tone(330, 110, 0.5, 'sine', 0.12);
    },
    click() {
      tone(600, 600, 0.06, 'square', 0.05);
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
  };
}
