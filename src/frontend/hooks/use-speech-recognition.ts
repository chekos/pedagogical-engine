"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechStatus = "idle" | "listening" | "error";

interface UseSpeechRecognitionOptions {
  /** Language for recognition (default: "en-US") */
  lang?: string;
  /** Whether to return interim (partial) results */
  interimResults?: boolean;
  /** Auto-send after final result (pause detection) */
  onFinalTranscript?: (transcript: string) => void;
}

interface UseSpeechRecognitionReturn {
  /** Whether the browser supports the Web Speech API */
  isSupported: boolean;
  /** Current status: idle, listening, or error */
  status: SpeechStatus;
  /** The current transcript (interim + final combined) */
  transcript: string;
  /** Start listening */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Toggle listening on/off */
  toggleListening: () => void;
  /** Last error message */
  errorMessage: string | null;
}

// Web Speech API types (not in all TS libs)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

type SpeechRecognitionInstance = EventTarget & {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "en-US", interimResults = true, onFinalTranscript } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  onFinalTranscriptRef.current = onFinalTranscript;

  // Check browser support on mount
  useEffect(() => {
    setIsSupported(getSpeechRecognition() !== null);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setErrorMessage("Speech recognition is not supported in this browser.");
      setStatus("error");
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ok */ }
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.interimResults = interimResults;
    recognition.continuous = true;

    recognition.onstart = () => {
      setStatus("listening");
      setErrorMessage(null);
      setTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(final);
        // Auto-callback with final transcript
        if (onFinalTranscriptRef.current) {
          onFinalTranscriptRef.current(final);
        }
      } else if (interim) {
        setTranscript(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "aborted" is expected when we call stop()
      if (event.error === "aborted") return;

      const messages: Record<string, string> = {
        "not-allowed": "Microphone access was denied. Please allow microphone permissions.",
        "no-speech": "No speech detected. Try again.",
        "network": "Network error. Check your connection.",
        "audio-capture": "No microphone found. Please connect a microphone.",
      };
      setErrorMessage(messages[event.error] || `Speech recognition error: ${event.error}`);
      setStatus("error");
    };

    recognition.onend = () => {
      setStatus("idle");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setErrorMessage("Failed to start speech recognition.");
      setStatus("error");
    }
  }, [lang, interimResults]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
    setStatus("idle");
  }, []);

  const toggleListening = useCallback(() => {
    if (status === "listening") {
      stopListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ok */ }
      }
    };
  }, []);

  return {
    isSupported,
    status,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    errorMessage,
  };
}
