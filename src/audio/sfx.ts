/**
 * WebAudio-synthesized sound effects — zero binary assets. Every sound is
 * generated from oscillators/noise on demand. The AudioContext is created
 * lazily on the first play (autoplay policy needs a user gesture) and all
 * calls no-op safely when Web Audio is unavailable (e.g. jsdom in tests).
 */

export type SfxName = "tap" | "correct" | "wrong" | "win" | "stamp";

type Ctor = typeof AudioContext;

function getCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

let ctx: AudioContext | null = null;
let muted = false;

/** Whether Web Audio is usable in this environment. */
export function isAudioSupported(): boolean {
  return getCtor() !== null;
}

/** Set the muted flag; when true, all subsequent play() calls no-op. */
export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

/** Lazily create (and resume) the shared AudioContext. Returns null if unsupported. */
function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = getCtor();
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneSpec {
  type: OscillatorType;
  freq: number;
  /** Optional linear ramp target frequency by the end of the tone. */
  toFreq?: number;
  duration: number;
  gain: number;
  /** Delay before the tone starts, in seconds. */
  delay?: number;
}

function playTones(specs: ToneSpec[]): void {
  const audio = ensureContext();
  if (!audio) return;
  if (audio.state === "suspended") {
    void audio.resume().catch(() => undefined);
  }
  const now = audio.currentTime;
  for (const s of specs) {
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    const start = now + (s.delay ?? 0);
    const end = start + s.duration;
    osc.type = s.type;
    osc.frequency.setValueAtTime(s.freq, start);
    if (s.toFreq !== undefined) {
      osc.frequency.linearRampToValueAtTime(s.toFreq, end);
    }
    // Quick attack, exponential-ish decay via linear ramp to ~0.
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(s.gain, start + 0.008);
    amp.gain.linearRampToValueAtTime(0.0001, end);
    osc.connect(amp).connect(audio.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

const RECIPES: Record<SfxName, ToneSpec[]> = {
  // Short percussive click for a verdict tap.
  tap: [{ type: "square", freq: 220, duration: 0.05, gain: 0.12 }],
  // Bright two-note rise for a correct guess.
  correct: [
    { type: "triangle", freq: 660, duration: 0.09, gain: 0.14 },
    { type: "triangle", freq: 880, duration: 0.1, gain: 0.14, delay: 0.07 },
  ],
  // Low descending buzz for a wrong guess.
  wrong: [{ type: "sawtooth", freq: 240, toFreq: 120, duration: 0.22, gain: 0.13 }],
  // Rising arpeggio fanfare for the win/reveal.
  win: [
    { type: "triangle", freq: 523, duration: 0.12, gain: 0.15 },
    { type: "triangle", freq: 659, duration: 0.12, gain: 0.15, delay: 0.1 },
    { type: "triangle", freq: 784, duration: 0.12, gain: 0.15, delay: 0.2 },
    { type: "triangle", freq: 1047, duration: 0.2, gain: 0.16, delay: 0.3 },
  ],
  // Thunk for the wordmark stamp.
  stamp: [{ type: "sine", freq: 140, toFreq: 60, duration: 0.16, gain: 0.2 }],
};

/** Play a named sound effect. No-ops when muted or when audio is unsupported. */
export function play(name: SfxName): void {
  if (muted) return;
  playTones(RECIPES[name]);
}

/** For tests: reset the shared context and mute flag. */
export function _resetForTest(): void {
  ctx = null;
  muted = false;
}
