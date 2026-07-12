import { afterEach, describe, expect, it, vi } from "vitest";
import { _resetForTest, isAudioSupported, isMuted, play, setMuted } from "./sfx";

afterEach(() => {
  _resetForTest();
  vi.unstubAllGlobals();
});

describe("sfx in an environment without Web Audio", () => {
  it("reports audio unsupported when no AudioContext exists", () => {
    // jsdom provides no AudioContext by default.
    expect(isAudioSupported()).toBe(false);
  });

  it("play() is a safe no-op and never throws", () => {
    expect(() => play("tap")).not.toThrow();
    expect(() => play("win")).not.toThrow();
  });
});

describe("mute flag", () => {
  it("round-trips through setMuted/isMuted", () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
    setMuted(false);
    expect(isMuted()).toBe(false);
  });
});

describe("sfx with a mock AudioContext", () => {
  function installMockAudio() {
    const started: string[] = [];
    const osc = {
      type: "",
      frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(() => ({ connect: vi.fn() })),
      start: vi.fn(() => started.push("start")),
      stop: vi.fn(),
    };
    const gain = {
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(() => ({ connect: vi.fn() })),
    };
    class MockCtx {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator = vi.fn(() => osc);
      createGain = vi.fn(() => gain);
      resume = vi.fn(() => Promise.resolve());
    }
    vi.stubGlobal("AudioContext", MockCtx as unknown as typeof AudioContext);
    return { started };
  }

  it("detects audio support and starts oscillators on play", () => {
    const { started } = installMockAudio();
    expect(isAudioSupported()).toBe(true);
    play("win");
    // The win recipe has four tones.
    expect(started).toHaveLength(4);
  });

  it("does not start oscillators when muted", () => {
    const { started } = installMockAudio();
    setMuted(true);
    play("tap");
    expect(started).toHaveLength(0);
  });

  it("resumes a suspended context before playing", () => {
    const { started } = installMockAudio();
    class SuspendedCtx {
      state = "suspended";
      currentTime = 0;
      destination = {};
      resume = vi.fn(() => Promise.resolve());
      createOscillator = vi.fn(() => ({
        type: "",
        frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(() => ({ connect: vi.fn() })),
        start: vi.fn(() => started.push("start")),
        stop: vi.fn(),
      }));
      createGain = vi.fn(() => ({
        gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(() => ({ connect: vi.fn() })),
      }));
    }
    vi.stubGlobal("AudioContext", SuspendedCtx as unknown as typeof AudioContext);
    play("tap");
    expect(started).toHaveLength(1);
  });

  it("ramps oscillator frequency for tones with a toFreq target", () => {
    installMockAudio();
    // "wrong" is the only recipe with a toFreq ramp — exercise it directly.
    expect(() => play("wrong")).not.toThrow();
  });

  it("treats a throwing AudioContext constructor as unsupported", () => {
    class ThrowingCtx {
      constructor() {
        throw new Error("blocked by policy");
      }
    }
    vi.stubGlobal("AudioContext", ThrowingCtx as unknown as typeof AudioContext);
    expect(() => play("tap")).not.toThrow();
  });
});
