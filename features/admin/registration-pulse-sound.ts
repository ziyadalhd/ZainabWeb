/**
 * A short two-tone chime for a new registration.
 *
 * Synthesised with WebAudio rather than shipped as an asset: two oscillator notes are a few lines,
 * need no network request, and cannot fail to load. Everything here is best-effort — a browser that
 * blocks audio before a user gesture, or has no AudioContext at all, simply gets no sound, and the
 * badge and toast still carry the notification on their own.
 */
let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (context) return context;
  const Constructor = typeof window === "undefined" ? undefined : window.AudioContext;
  if (!Constructor) return null;
  context = new Constructor();
  return context;
}

export function playRegistrationChime(): void {
  const audio = getContext();
  if (!audio) return;
  void audio.resume().catch(() => undefined);

  const start = audio.currentTime;
  for (const [index, frequency] of [880, 1174.66].entries()) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const at = start + index * 0.12;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.06, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.2);
  }
}
