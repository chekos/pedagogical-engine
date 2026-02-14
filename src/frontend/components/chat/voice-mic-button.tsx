"use client";

import type { SpeechStatus } from "@/hooks/use-speech-recognition";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// --- Inline SVG icons ---

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z"
      />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36a1 1 0 00-1.5.86z" />
    </svg>
  );
}

// --- Waveform bars (CSS animated) ---

function WaveformBars({ animated }: { animated: boolean }) {
  return (
    <div className="flex items-center gap-[3px] h-5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-red-400 ${
            animated ? "animate-waveform-bar" : "h-1.5"
          }`}
          style={animated ? { animationDelay: `${i * 0.12}s` } : undefined}
        />
      ))}
    </div>
  );
}

// --- Large variant (live companion page) ---

interface LargeVoiceMicButtonProps {
  status: SpeechStatus;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

function LargeVoiceMicButton({ status, onClick, disabled, className = "" }: LargeVoiceMicButtonProps) {
  const isListening = status === "listening";
  const isError = status === "error";

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {isListening && (
        <span
          className="absolute inset-0 rounded-2xl bg-red-500/30 animate-voice-ring"
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={isListening ? "Stop recording" : "Start voice input"}
        title={isListening ? "Stop recording" : "Tap to speak"}
        className={`
          relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all
          ${
            isListening
              ? "bg-red-500 text-white animate-voice-pulse"
              : isError
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary"
          }
          disabled:opacity-30 disabled:cursor-not-allowed
        `}
      >
        {isListening ? (
          <StopIcon className="w-7 h-7" />
        ) : (
          <MicIcon className="w-7 h-7" />
        )}
      </button>
    </div>
  );
}

// --- Inline recording bar (3-state) ---

interface VoiceMicButtonProps {
  status: SpeechStatus;
  onClick: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  disabled?: boolean;
  /** Larger variant for live companion (mobile-first) */
  large?: boolean;
  /** Elapsed recording time in seconds */
  elapsedSeconds?: number;
  /** Live interim transcript preview */
  interimTranscript?: string;
  className?: string;
}

export default function VoiceMicButton({
  status,
  onClick,
  onPause,
  onResume,
  onStop,
  disabled = false,
  large = false,
  elapsedSeconds = 0,
  interimTranscript = "",
  className = "",
}: VoiceMicButtonProps) {
  // Large variant keeps the original behavior for live companion
  if (large) {
    return <LargeVoiceMicButton status={status} onClick={onClick} disabled={disabled} className={className} />;
  }

  const isRecording = status === "listening";
  const isPaused = status === "paused";
  const isActive = isRecording || isPaused;

  // STATE 1: Ready — small mic icon
  if (!isActive) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label="Start voice input"
        title="Tap to speak"
        className={`
          flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all
          ${
            status === "error"
              ? "text-red-400 hover:bg-red-500/10"
              : "text-text-tertiary hover:text-text-secondary"
          }
          disabled:opacity-30 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <MicIcon className="w-4 h-4" />
      </button>
    );
  }

  // STATE 2 (Recording) & STATE 3 (Paused) — recording bar
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Recording bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
        {/* Recording dot */}
        <span
          className={`flex-shrink-0 w-2 h-2 rounded-full ${
            isRecording ? "bg-red-500 animate-pulse-subtle" : "bg-red-500/40"
          }`}
          aria-hidden="true"
        />

        {/* Waveform */}
        <WaveformBars animated={isRecording} />

        {/* Timer */}
        <span className="text-xs font-mono text-red-400 min-w-[2.5rem] tabular-nums">
          {formatTime(elapsedSeconds)}
        </span>

        {/* Paused label */}
        {isPaused && (
          <span className="text-[10px] uppercase tracking-wider text-red-400/60 font-medium">
            Paused
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pause / Resume button */}
        {isRecording && onPause && (
          <button
            type="button"
            onClick={onPause}
            aria-label="Pause recording"
            title="Pause"
            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <PauseIcon className="w-3.5 h-3.5" />
          </button>
        )}
        {isPaused && onResume && (
          <button
            type="button"
            onClick={onResume}
            aria-label="Resume recording"
            title="Resume"
            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <PlayIcon className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Stop / Done button */}
        <button
          type="button"
          onClick={onStop ?? onClick}
          aria-label="Stop recording"
          title="Stop and finalize"
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          <StopIcon className="w-3 h-3" />
        </button>
      </div>

      {/* Live transcript preview */}
      {interimTranscript && (
        <p className="text-xs text-text-tertiary italic px-1 truncate">
          {interimTranscript}
        </p>
      )}
    </div>
  );
}
