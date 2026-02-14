"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechStatus = "idle" | "listening" | "paused" | "error";

interface UseSpeechRecognitionOptions {
  /** Language for recognition (default: "en-US") */
  lang?: string;
  /** Whether to return interim (partial) results */
  interimResults?: boolean;
  /** Called when a final transcript segment is available */
  onFinalTranscript?: (transcript: string) => void;
  /** Called with interim (partial) transcript for live preview */
  onInterimTranscript?: (transcript: string) => void;
}

interface UseSpeechRecognitionReturn {
  /** Whether the browser supports the Web Speech API */
  isSupported: boolean;
  /** Current status: idle, listening, paused, or error */
  status: SpeechStatus;
  /** The accumulated final transcript */
  transcript: string;
  /** Start listening */
  startListening: () => void;
  /** Stop listening and finalize */
  stopListening: () => void;
  /** Toggle listening on/off */
  toggleListening: () => void;
  /** Pause recognition (keeps transcript, stops mic) */
  pauseListening: () => void;
  /** Resume recognition after pause */
  resumeListening: () => void;
  /** Elapsed seconds since recording started */
  elapsedSeconds: number;
  /** Current interim (partial) transcript */
  interimTranscript: string;
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

const MAX_RETRIES = 3;

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "en-US", interimResults = true, onFinalTranscript, onInterimTranscript } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  onFinalTranscriptRef.current = onFinalTranscript;
  const onInterimTranscriptRef = useRef(onInterimTranscript);
  onInterimTranscriptRef.current = onInterimTranscript;

  // Intentional stop flag — distinguishes user-stop from browser-stop
  const stoppingRef = useRef(false);
  // Retry counter for unexpected ends (silence timeout, network blip)
  const retryCountRef = useRef(0);
  // Accumulated transcript across pause/resume cycles
  const accumulatedRef = useRef("");
  // Timer for elapsed seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  // Track paused state for resume
  const pausedRef = useRef(false);

  // Check browser support on mount
  useEffect(() => {
    setIsSupported(getSpeechRecognition() !== null);
  }, []);

  // Elapsed time timer
  useEffect(() => {
    if (status === "listening") {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 200);
    } else if (status === "idle" || status === "error") {
      // Full stop — reset timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      startTimeRef.current = null;
      setElapsedSeconds(0);
    } else if (status === "paused") {
      // Paused — freeze the timer but keep startTimeRef
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const createRecognition = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return null;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.interimResults = interimResults;
    recognition.continuous = true;

    recognition.onstart = () => {
      setStatus("listening");
      setErrorMessage(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Successful result — reset retry counter
      retryCountRef.current = 0;

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
        // Guard against post-stop delivery
        if (stoppingRef.current) return;

        const newAccumulated = accumulatedRef.current
          ? accumulatedRef.current + " " + final
          : final;
        accumulatedRef.current = newAccumulated;
        setTranscript(newAccumulated);
        setInterimTranscript("");
        if (onFinalTranscriptRef.current) {
          onFinalTranscriptRef.current(final);
        }
      } else if (interim) {
        const preview = accumulatedRef.current
          ? accumulatedRef.current + " " + interim
          : interim;
        setInterimTranscript(preview);
        if (onInterimTranscriptRef.current) {
          onInterimTranscriptRef.current(preview);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "aborted" is expected when we call stop/abort
      if (event.error === "aborted") return;

      // no-speech is non-fatal — browser will fire onend, auto-restart handles it
      if (event.error === "no-speech") return;

      const messages: Record<string, string> = {
        "not-allowed": "Microphone access was denied. Please allow microphone permissions.",
        "network": "Network error. Check your connection.",
        "audio-capture": "No microphone found. Please connect a microphone.",
      };
      setErrorMessage(messages[event.error] || `Speech recognition error: ${event.error}`);
      setStatus("error");
      stoppingRef.current = true; // Prevent auto-restart on fatal errors
    };

    recognition.onend = () => {
      // If this was an intentional stop or pause, don't auto-restart
      if (stoppingRef.current || pausedRef.current) {
        if (pausedRef.current) {
          setStatus("paused");
        }
        return;
      }

      // Unexpected end (silence timeout, network blip) — auto-restart
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        try {
          recognition.start();
        } catch {
          // If restart fails, treat as done
          setStatus("idle");
        }
      } else {
        // Max retries reached — give up
        setStatus("idle");
      }
    };

    return recognition;
  }, [lang, interimResults]);

  const startListening = useCallback(() => {
    if (!getSpeechRecognition()) {
      setErrorMessage("Speech recognition is not supported in this browser.");
      setStatus("error");
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ok */ }
    }

    // Reset all state
    stoppingRef.current = false;
    pausedRef.current = false;
    retryCountRef.current = 0;
    accumulatedRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setErrorMessage(null);

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setErrorMessage("Failed to start speech recognition.");
      setStatus("error");
    }
  }, [createRecognition]);

  const stopListening = useCallback(() => {
    stoppingRef.current = true;
    pausedRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
    setInterimTranscript("");
    setStatus("idle");
  }, []);

  const pauseListening = useCallback(() => {
    if (status !== "listening") return;
    pausedRef.current = true;
    stoppingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch { /* ok */ }
      recognitionRef.current = null;
    }
    setInterimTranscript("");
    // Status set to "paused" in onend handler
  }, [status]);

  const resumeListening = useCallback(() => {
    if (status !== "paused") return;

    pausedRef.current = false;
    stoppingRef.current = false;
    retryCountRef.current = 0;

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setErrorMessage("Failed to resume speech recognition.");
      setStatus("error");
    }
  }, [status, createRecognition]);

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
      stoppingRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ok */ }
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    isSupported,
    status,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    pauseListening,
    resumeListening,
    elapsedSeconds,
    errorMessage,
  };
}
