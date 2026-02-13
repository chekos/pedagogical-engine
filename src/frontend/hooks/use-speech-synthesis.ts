"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechSynthesisOptions {
  /** Speech rate (0.1 - 10, default: 1) */
  rate?: number;
  /** Pitch (0 - 2, default: 1) */
  pitch?: number;
  /** Language (default: "en-US") */
  lang?: string;
}

interface UseSpeechSynthesisReturn {
  /** Whether the browser supports SpeechSynthesis */
  isSupported: boolean;
  /** Whether currently speaking */
  isSpeaking: boolean;
  /** Speak the given text */
  speak: (text: string) => void;
  /** Stop speaking */
  stop: () => void;
}

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const { rate = 1, pitch = 1, lang = "en-US" } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Strip markdown formatting for cleaner TTS
      const cleaned = text
        .replace(/#{1,6}\s+/g, "") // headers
        .replace(/\*\*(.+?)\*\*/g, "$1") // bold
        .replace(/\*(.+?)\*/g, "$1") // italic
        .replace(/`(.+?)`/g, "$1") // inline code
        .replace(/```[\s\S]*?```/g, "") // code blocks
        .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
        .replace(/[-*+]\s+/g, ". ") // list items → sentence breaks
        .replace(/\n{2,}/g, ". ") // paragraph breaks
        .replace(/\n/g, " ") // line breaks
        .trim();

      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [lang, rate, pitch]
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { isSupported, isSpeaking, speak, stop };
}
