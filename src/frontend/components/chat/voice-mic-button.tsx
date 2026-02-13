"use client";

import type { SpeechStatus } from "@/hooks/use-speech-recognition";

interface VoiceMicButtonProps {
  status: SpeechStatus;
  onClick: () => void;
  disabled?: boolean;
  /** Larger variant for live companion (mobile-first) */
  large?: boolean;
  className?: string;
}

export default function VoiceMicButton({
  status,
  onClick,
  disabled = false,
  large = false,
  className = "",
}: VoiceMicButtonProps) {
  const isListening = status === "listening";
  const isError = status === "error";

  const sizeClasses = large
    ? "w-16 h-16 rounded-2xl"
    : "w-10 h-10 rounded-xl";

  const iconSize = large ? "w-7 h-7" : "w-4 h-4";

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {/* Expanding ring animation when listening */}
      {isListening && (
        <span
          className={`absolute inset-0 ${large ? "rounded-2xl" : "rounded-xl"} bg-red-500/30 animate-voice-ring`}
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
          relative ${sizeClasses} flex items-center justify-center transition-all
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
          /* Stop icon (square) when recording */
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          /* Microphone icon */
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
