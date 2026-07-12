import { useCallback, useEffect, useState } from "react";
import { setMuted } from "../audio/sfx";
import { readString, writeString } from "../lib/storage";

const KEY = "stb.muted";

/**
 * Mute preference bound to the SFX engine and persisted in localStorage.
 * Reads the stored value on mount, keeps the audio engine's flag in sync, and
 * returns a toggle. Persisted state survives reloads; clearing storage
 * defaults back to un-muted.
 */
export function useMute(): { muted: boolean; toggleMute: () => void } {
  const [muted, setMutedState] = useState<boolean>(() => readString(KEY, "false") === "true");

  useEffect(() => {
    setMuted(muted);
    writeString(KEY, String(muted));
  }, [muted]);

  const toggleMute = useCallback(() => setMutedState((m) => !m), []);

  return { muted, toggleMute };
}
