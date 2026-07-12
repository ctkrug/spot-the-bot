interface MuteToggleProps {
  muted: boolean;
  onToggle: () => void;
}

/** Icon button toggling SFX. Icon-only, so it carries an aria-label + pressed state. */
export function MuteToggle({ muted, onToggle }: MuteToggleProps) {
  return (
    <button
      type="button"
      className="mute-toggle"
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      title={muted ? "Sound off" : "Sound on"}
    >
      <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
    </button>
  );
}
