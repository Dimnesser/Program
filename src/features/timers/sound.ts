/** A short two-tone chime synthesised with the Web Audio API — no asset needed. */
export function playChime(times = 2) {
  try {
    const AudioContextClass =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const now = context.currentTime;

    for (let index = 0; index < times; index += 1) {
      const start = now + index * 0.42;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(index % 2 === 0 ? 880 : 660, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.36);

      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.4);
    }

    setTimeout(() => void context.close(), times * 500 + 400);
  } catch {
    /* Audio is a nicety — silence is an acceptable fallback. */
  }
}
