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
});
