"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LiveClient,
  type ConnectionStatus,
  type ServerMessage,
  type LessonSection,
  type LessonMeta,
  fetchLesson,
  submitSectionFeedback,
} from "@/lib/api";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import VoiceMicButton from "@/components/chat/voice-mic-button";
import { ErrorBanner, LoadingSpinner } from "@/components/ui/loading";

type SectionFeedback = "went-well" | "struggled" | "skipped";

interface CompanionMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export default function LiveCompanionPage() {
  const params = useParams();
  const lessonId = params["lesson-id"] as string;

  // Lesson data
  const [meta, setMeta] = useState<LessonMeta | null>(null);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Session state
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds since session start
  const [sectionFeedback, setSectionFeedback] = useState<Record<string, SectionFeedback>>({});

  // WebSocket + chat
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [input, setInput] = useState("");
  const clientRef = useRef<LiveClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);

  // Voice
  const {
    isSupported: sttSupported,
    status: sttStatus,
    transcript,
    toggleListening,
    stopListening,
    errorMessage: sttError,
  } = useSpeechRecognition({
    onFinalTranscript: (text) => {
      // In live mode, auto-send voice input for speed
      if (text.trim() && clientRef.current?.isConnected && !isThinking) {
        sendMessageDirect(text.trim());
      }
    },
  });

  const { isSupported: ttsSupported, speak, stop: stopSpeaking } = useSpeechSynthesis({
    rate: 1.1,
  });

  // Keep speak and ttsSupported in refs so handleMessage has a stable identity
  const speakRef = useRef(speak);
  const ttsSupportedRef = useRef(ttsSupported);
  useEffect(() => { speakRef.current = speak; }, [speak]);
  useEffect(() => { ttsSupportedRef.current = ttsSupported; }, [ttsSupported]);

  // Load lesson data
  useEffect(() => {
    if (!lessonId) return;
    fetchLesson(lessonId)
      .then((lesson) => {
        setMeta(lesson.meta);
        setSections(lesson.sections);
      })
      .catch(() => setLoadError("Could not load lesson plan."));
  }, [lessonId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Elapsed timer
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted]);

  // Time-aware section tracking
  useEffect(() => {
    if (!sessionStarted || sections.length === 0) return;
    const elapsedMin = elapsed / 60;
    const idx = sections.findIndex(
      (s) => elapsedMin >= s.startMin && elapsedMin < s.endMin
    );
    if (idx >= 0 && idx !== currentSectionIdx) {
      setCurrentSectionIdx(idx);
    }
  }, [elapsed, sections, sessionStarted, currentSectionIdx]);

  // Handle messages from the live WebSocket
  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "session":
          break;
        case "assistant":
          if (msg.text?.trim()) {
            setMessages((prev) => [
              ...prev,
              {
                id: `asst-${Date.now()}`,
                role: "assistant",
                text: msg.text,
                timestamp: new Date(),
              },
            ]);
            // Auto-speak responses in live mode
            if (ttsSupportedRef.current) {
              speakRef.current(msg.text);
            }
          }
          break;
        case "result":
          setIsThinking(false);
          break;
        case "error":
          setIsThinking(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: "assistant",
              text: `Error: ${msg.error}`,
              timestamp: new Date(),
            },
          ]);
          break;
      }
    },
    []
  );

  // Connect WebSocket
  useEffect(() => {
    if (!lessonId) return;
    const client = new LiveClient({
      lessonId,
      onMessage: handleMessage,
      onStatusChange: setStatus,
    });
    clientRef.current = client;
    client.connect();
    return () => client.disconnect();
  }, [lessonId, handleMessage]);

  const sendMessageDirect = useCallback(
    (text: string) => {
      if (!text.trim() || !clientRef.current?.isConnected) return;
      // Stop listening after sending
      stopListening();

      const currentSection = sections[currentSectionIdx];
      const sectionContext = currentSection
        ? `Section: "${currentSection.title}" (${currentSection.startMin}-${currentSection.endMin} min). Elapsed: ${Math.floor(elapsed / 60)} min.`
        : undefined;

      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", text, timestamp: new Date() },
      ]);
      setIsThinking(true);
      clientRef.current.send(text, sectionContext);
      setInput("");
    },
    [sections, currentSectionIdx, elapsed, stopListening]
  );

  const handleStartSession = () => {
    setSessionStarted(true);
    startTimeRef.current = Date.now();
  };

  const handleSectionFeedback = (sectionId: string, feedback: SectionFeedback) => {
    setSectionFeedback((prev) => ({ ...prev, [sectionId]: feedback }));
    submitSectionFeedback(lessonId, sectionId, feedback, Math.floor(elapsed / 60));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const currentSection = sections[currentSectionIdx];
  const elapsedMin = elapsed / 60;
  const totalDuration = meta?.duration ?? 60;
  const progress = Math.min((elapsedMin / totalDuration) * 100, 100);

  // Time warning
  const timeRemaining = currentSection
    ? currentSection.endMin - elapsedMin
    : totalDuration - elapsedMin;
  const isTimeWarning = timeRemaining > 0 && timeRemaining <= 3;

  // Loading state
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0 px-6">
        <div className="max-w-md w-full space-y-4">
          <ErrorBanner message={loadError} />
          <div className="text-center">
            <Link href="/lessons" className="text-sm text-accent hover:text-accent-muted">
              Browse lessons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0">
        <LoadingSpinner message="Loading lesson..." />
      </div>
    );
  }

  // Pre-session start screen
  if (!sessionStarted) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-0">
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Live Teaching Companion</h1>
            <p className="text-sm text-text-secondary mb-1">{meta.title}</p>
            <p className="text-xs text-text-tertiary mb-6">
              {meta.duration} min &middot; {sections.length} sections
            </p>

            <div className="bg-surface-1 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                The one thing
              </p>
              <p className="text-sm text-text-primary leading-relaxed">
                {meta.oneThing || meta.topic}
              </p>
            </div>

            <button
              onClick={handleStartSession}
              className="w-full py-4 rounded-2xl bg-accent text-white text-lg font-semibold hover:bg-accent-muted transition-colors active:scale-[0.98]"
            >
              Start Session
            </button>

            <p className="text-xs text-text-tertiary mt-4">
              Voice input enabled. Tap the mic to ask questions hands-free.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Live session UI — mobile-first
  return (
    <div className="h-screen flex flex-col bg-surface-0">
      {/* Compact header with timer */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-1">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/lessons" className="text-text-tertiary hover:text-text-secondary flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-text-primary truncate">{meta.title}</h1>
            <p className="text-xs text-text-tertiary">
              {currentSection ? currentSection.title : "Session"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Connection indicator */}
          <span className={`w-2 h-2 rounded-full ${
            status === "connected" ? "bg-green-400" : status === "connecting" ? "bg-yellow-400" : "bg-red-400"
          }`} />
          {/* Timer */}
          <span className={`text-lg font-mono font-bold ${isTimeWarning ? "text-red-400" : "text-text-primary"}`}>
            {formatTime(elapsed)}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-surface-2 relative">
        <div
          className="h-full bg-accent transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Section cards — horizontal scroll */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border-subtle bg-surface-1/50 no-scrollbar">
        {sections.map((section, idx) => {
          const isCurrent = idx === currentSectionIdx;
          const isPast = section.endMin <= elapsedMin;
          const fb = sectionFeedback[section.id];

          return (
            <button
              key={section.id}
              onClick={() => setCurrentSectionIdx(idx)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isCurrent
                  ? "bg-accent text-white"
                  : isPast
                    ? fb === "went-well"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : fb === "struggled"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-surface-2 text-text-secondary"
                    : "bg-surface-2 text-text-tertiary"
              }`}
            >
              <span className="block truncate max-w-[120px]">{section.title}</span>
              <span className="block text-[10px] opacity-70 mt-0.5">
                {section.startMin}-{section.endMin} min
              </span>
            </button>
          );
        })}
      </div>

      {/* Time warning banner */}
      {isTimeWarning && currentSection && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-red-400 font-medium">
            {Math.ceil(timeRemaining)} min left in &ldquo;{currentSection.title}&rdquo;
          </span>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-sm text-text-secondary mb-4">
              Your teaching companion is ready.
              Tap the mic or type a question.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "How should I open this section?",
                "Students are stuck — help!",
                "Give me a 5-minute alternative activity",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessageDirect(q)}
                  disabled={!clientRef.current?.isConnected || isThinking}
                  className="text-xs px-3 py-2 rounded-xl border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border transition-colors disabled:opacity-30"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[90%] ${msg.role === "user" ? "ml-auto" : "mr-auto"}`}
          >
            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-white rounded-br-md"
                  : "bg-surface-2 text-text-primary rounded-bl-md"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 text-text-tertiary">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Section feedback bar (shown when a section ends) */}
      {currentSection && !sectionFeedback[currentSection.id] && currentSectionIdx > 0 && (
        <div className="px-4 py-3 border-t border-border-subtle bg-surface-1">
          <p className="text-xs text-text-tertiary mb-2 text-center">
            How did &ldquo;{sections[currentSectionIdx - 1]?.title}&rdquo; go?
          </p>
          <div className="flex gap-2 justify-center">
            {(
              [
                { label: "Went well", value: "went-well", color: "bg-green-500/10 text-green-500 border-green-500/20" },
                { label: "Struggled", value: "struggled", color: "bg-red-500/10 text-red-400 border-red-500/20" },
                { label: "Skipped", value: "skipped", color: "bg-surface-2 text-text-tertiary border-border-subtle" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSectionFeedback(sections[currentSectionIdx - 1].id, opt.value)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border ${opt.color} active:scale-95 transition-all`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice-first input area */}
      <div className="border-t border-border-subtle p-4 bg-surface-1">
        {/* STT error */}
        {sttError && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {sttError}
          </div>
        )}
        {/* Listening indicator */}
        {sttStatus === "listening" && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-medium">Listening...</span>
            {transcript && (
              <span className="text-xs text-text-secondary italic truncate">{transcript}</span>
            )}
          </div>
        )}
        <div className="flex items-end gap-3">
          {/* Text input (compact on mobile) */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                sendMessageDirect(input.trim());
              }
            }}
            placeholder="Quick-ask..."
            disabled={status !== "connected" || isThinking}
            className="flex-1 h-12 rounded-xl border border-border bg-surface-0 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
          />
          {/* Voice button — large, primary in live mode */}
          {sttSupported && (
            <VoiceMicButton
              status={sttStatus}
              onClick={toggleListening}
              disabled={status !== "connected" || isThinking}
              large
            />
          )}
          {/* Send button */}
          <button
            onClick={() => input.trim() && sendMessageDirect(input.trim())}
            disabled={!input.trim() || status !== "connected" || isThinking}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
