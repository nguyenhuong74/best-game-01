// A generative music loop: a slow pentatonic arpeggio over a soft bass
// drone, sequenced on a lookahead timer so it never stutters. It shares the
// sound-effects AudioContext, stays silent until the first user gesture
// starts it, and skips every note while muted. No audio files, no network.
const NOTES = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
const STEP_SECONDS = 0.42;

export function createMusic(audio) {
  let timer = null;
  let step = 0;
  let nextTime = 0;

  function note(frequency, when, seconds, type, gainValue) {
    const context = audio.ensure();
    if (context === null) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(gainValue, when + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + seconds);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(when);
    oscillator.stop(when + seconds + 0.02);
  }

  function schedule() {
    const context = audio.ensure();
    if (context === null) return;
    if (nextTime < context.currentTime) nextTime = context.currentTime + 0.1;
    while (nextTime < context.currentTime + 0.5) {
      if (!audio.isMuted()) {
        // A wandering arpeggio: mostly stepwise, sometimes a leap.
        const index = Math.abs(Math.sin(step * 1.7) * NOTES.length) | 0;
        const frequency = NOTES[index % NOTES.length] * (step % 16 === 0 ? 2 : 1);
        note(frequency, nextTime, 0.6, 'sine', 0.045);
        if (step % 8 === 0) note(110, nextTime, 2.6, 'triangle', 0.05);
        if (step % 8 === 4) note(164.81, nextTime, 2.2, 'triangle', 0.04);
      }
      nextTime += STEP_SECONDS;
      step += 1;
    }
  }

  return {
    start() {
      if (timer !== null) return;
      const context = audio.ensure();
      if (context === null) return;
      if (context.state === 'suspended') void context.resume();
      nextTime = context.currentTime + 0.1;
      timer = window.setInterval(() => {
        try {
          schedule();
        } catch {
          // Music must never break the game.
        }
      }, 120);
    },
    stop() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    },
  };
}
