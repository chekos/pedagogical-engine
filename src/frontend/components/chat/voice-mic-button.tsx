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

  // Large variant keeps the original sizes for live companion
  if (large) {
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
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

  // Inline variant — small icon button for inside input field
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isListening ? "Stop recording" : "Start voice input"}
      title={isListening ? "Stop recording" : "Tap to speak"}
      className={`
        flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all
        ${
          isListening
            ? "bg-red-500 text-white animate-voice-pulse"
            : isError
              ? "text-red-400 hover:bg-red-500/10"
              : "text-text-tertiary hover:text-text-secondary"
        }
        disabled:opacity-30 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isListening ? (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z"
          />
        </svg>
      )}
    </button>
  );
}
