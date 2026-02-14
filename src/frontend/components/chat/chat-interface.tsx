"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatClient, type ConnectionStatus, type ServerMessage, type ToolUse } from "@/lib/api";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import MessageBubble from "./message-bubble";
import ToolResult from "./tool-result";
import ProgressIndicator from "./progress-indicator";
import VoiceMicButton from "./voice-mic-button";
import Link from "next/link";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  toolUses?: ToolUse[];
}

const CONNECTION_LABELS: Record<ConnectionStatus, { text: string; color: string }> = {
  connecting: { text: "Connecting...", color: "bg-yellow-400" },
  connected: { text: "Connected", color: "bg-green-400" },
  disconnected: { text: "Disconnected", color: "bg-gray-400" },
  error: { text: "Connection error", color: "bg-red-400" },
};

interface ChatInterfaceProps {
  initialMessage?: string;
}

export default function ChatInterface({ initialMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [isThinking, setIsThinking] = useState(false);
  const [activeTools, setActiveTools] = useState<ToolUse[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [thinkingStartedAt, setThinkingStartedAt] = useState<number | null>(null);
  const clientRef = useRef<ChatClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentAssistantRef = useRef<string | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const ttsQueueRef = useRef<string | null>(null);
  const ttsEnabledRef = useRef(false);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);

  // Voice output (text-to-speech)
  const {
    isSupported: ttsSupported,
    isSpeaking,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis({ rate: 1.05 });

  const speakRef = useRef(speak);
  useEffect(() => { speakRef.current = speak; }, [speak]);
  const stopSpeakingRef = useRef(stopSpeaking);
  useEffect(() => { stopSpeakingRef.current = stopSpeaking; }, [stopSpeaking]);

  // Voice input (speech-to-text) — 3-state redesign
  const {
    isSupported: sttSupported,
    status: sttStatus,
    transcript: sttTranscript,
    interimTranscript: sttInterimTranscript,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    elapsedSeconds,
    errorMessage: sttError,
  } = useSpeechRecognition();

  const isRecording = sttStatus === "listening" || sttStatus === "paused";

  // Start recording: cancel any TTS first
  const handleStartRecording = useCallback(() => {
    stopSpeakingRef.current();
    startListening();
  }, [startListening]);

  // Stop recording: finalize transcript into input field
  const handleStopRecording = useCallback(() => {
    stopListening();
    // Use the accumulated transcript from the hook
    // We read sttTranscript via a ref to avoid stale closures
  }, [stopListening]);

  // When recording stops (sttStatus goes from listening/paused to idle),
  // populate input with the final accumulated transcript
  const prevSttStatusRef = useRef(sttStatus);
  useEffect(() => {
    const wasActive = prevSttStatusRef.current === "listening" || prevSttStatusRef.current === "paused";
    const isNowIdle = sttStatus === "idle";
    if (wasActive && isNowIdle && sttTranscript) {
      setInput((prev) => (prev ? prev + " " + sttTranscript : sttTranscript));
      // Focus the input so the user can review and send
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    prevSttStatusRef.current = sttStatus;
  }, [sttStatus, sttTranscript]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTools, isThinking, scrollToBottom]);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "session":
        setSessionId(msg.sessionId);
        break;

      case "stream_delta": {
        const streamId = streamingMessageIdRef.current;
        if (streamId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamId ? { ...m, text: m.text + msg.text } : m
            )
          );
        } else {
          const id = `stream-${Date.now()}-${Math.random()}`;
          streamingMessageIdRef.current = id;
          setMessages((prev) => [
            ...prev,
            { id, role: "assistant", text: msg.text, timestamp: new Date() },
          ]);
        }
        break;
      }

      case "assistant": {
        if (msg.toolUses && msg.toolUses.length > 0) {
          setActiveTools(msg.toolUses);
        }

        const streamId = streamingMessageIdRef.current;
        if (streamId && msg.text.trim()) {
          streamingMessageIdRef.current = null;
          const id = `assistant-${Date.now()}-${Math.random()}`;
          currentAssistantRef.current = id;
          if (ttsEnabledRef.current) {
            ttsQueueRef.current = msg.text;
          }
          setMessages((prev) =>
            prev
              .filter((m) => m.id !== streamId)
              .concat({
                id,
                role: "assistant",
                text: msg.text,
                timestamp: new Date(),
                toolUses: msg.toolUses,
              })
          );
        } else if (msg.text.trim()) {
          const id = `assistant-${Date.now()}-${Math.random()}`;
          currentAssistantRef.current = id;
          if (ttsEnabledRef.current) {
            ttsQueueRef.current = msg.text;
          }
          setMessages((prev) => [
            ...prev,
            {
              id,
              role: "assistant",
              text: msg.text,
              timestamp: new Date(),
              toolUses: msg.toolUses,
            },
          ]);
        } else if (msg.toolUses && msg.toolUses.length > 0) {
          if (streamId) streamingMessageIdRef.current = null;
          const id = `tool-${Date.now()}-${Math.random()}`;
          setMessages((prev) => {
            const filtered = streamId ? prev.filter((m) => m.id !== streamId) : prev;
            return [
              ...filtered,
              {
                id,
                role: "assistant",
                text: "",
                timestamp: new Date(),
                toolUses: msg.toolUses,
              },
            ];
          });
        }
        break;
      }

      case "result":
        setIsThinking(false);
        setActiveTools([]);
        setThinkingStartedAt(null);
        currentAssistantRef.current = null;
        streamingMessageIdRef.current = null;
        if (ttsQueueRef.current) {
          speakRef.current(ttsQueueRef.current);
          ttsQueueRef.current = null;
        }
        if (msg.subtype !== "success") {
          const errors = msg.errors ?? [];
          if (errors.length > 0) {
            setMessages((prev) => [
              ...prev,
              {
                id: `error-${Date.now()}`,
                role: "assistant",
                text: `Something went wrong: ${errors.join(", ")}`,
                timestamp: new Date(),
              },
            ]);
          }
        }
        break;

      case "error":
        setIsThinking(false);
        setActiveTools([]);
        setThinkingStartedAt(null);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            text: `Something went wrong: ${msg.error}`,
            timestamp: new Date(),
          },
        ]);
        break;

      case "system":
        break;

      case "tool_progress": {
        setActiveTools((prev) => {
          const existing = prev.find((t) => t.id === msg.toolUseId);
          if (existing) return prev;
          return [...prev, { id: msg.toolUseId, name: msg.toolName, input: {} }];
        });
        break;
      }
    }
  }, []);

  useEffect(() => {
    const client = new ChatClient({
      onMessage: handleMessage,
      onStatusChange: setStatus,
    });
    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
    };
  }, [handleMessage]);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !clientRef.current?.isConnected) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed,
        timestamp: new Date(),
      },
    ]);
    setInput("");
    setIsThinking(true);
    setThinkingStartedAt(Date.now());
    setActiveTools([]);
    clientRef.current.send(trimmed);

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  }, [input]);

  const sendProgrammaticMessage = useCallback((text: string) => {
    if (!text.trim() || !clientRef.current?.isConnected) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text,
        timestamp: new Date(),
      },
    ]);
    setIsThinking(true);
    setThinkingStartedAt(Date.now());
    setActiveTools([]);
    clientRef.current.send(text);
  }, []);

  const initialMessageSent = useRef(false);
  useEffect(() => {
    if (initialMessage && status === "connected" && !initialMessageSent.current) {
      initialMessageSent.current = true;
      sendProgrammaticMessage(initialMessage);
    }
  }, [initialMessage, status, sendProgrammaticMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const connLabel = CONNECTION_LABELS[status];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="w-px h-5 bg-border-subtle" />
          <div>
            <h1 className="text-lg font-heading text-text-primary">Teaching Workspace</h1>
          </div>
        </div>
        {status !== "connected" && (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connLabel.color}`} />
            <span className="text-xs text-text-tertiary">{connLabel.text}</span>
          </div>
        )}
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
        {messages.length === 0 && (status === "error" || status === "disconnected") && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Backend not connected</h2>
            <p className="text-sm text-text-secondary max-w-sm">
              Make sure the backend server is running on port 3000.
              Run <code className="px-1.5 py-0.5 bg-surface-2 rounded text-xs font-mono">cd src/server && npx tsx index.ts</code>
            </p>
          </div>
        )}

        {messages.length === 0 && status === "connected" && (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="max-w-lg w-full px-4">
              <h2 className="font-heading text-2xl md:text-3xl text-text-primary mb-3">
                Let&apos;s build something for your students.
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-8">
                Tell me what you&apos;re planning — who you&apos;re teaching, what you&apos;re covering,
                what constraints you&apos;re working with — and I&apos;ll help you build something
                grounded in what your students actually know.
              </p>
              <div className="space-y-3">
                {[
                  "I'm teaching a 90-minute Python workshop to a mixed group — some have coded before, most haven't.",
                  "I have 12 students learning data analysis. Can we figure out what they already know?",
                  "I need to plan a lesson on plotting with matplotlib, but I only have 45 minutes.",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="block w-full text-left border-l-2 border-accent/40 pl-4 py-2 text-sm italic text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
                  >
                    &ldquo;{suggestion}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.text && (
                <MessageBubble role={msg.role} text={msg.text} timestamp={msg.timestamp} />
              )}
              {msg.toolUses && msg.toolUses.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.toolUses.map((tool) => (
                    <ToolResult key={tool.id} tool={tool} onSendMessage={sendProgrammaticMessage} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <ProgressIndicator
              activeTools={activeTools}
              startedAt={thinkingStartedAt}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border-subtle p-4 md:px-6">
        {/* STT error banner */}
        {sttError && (
          <div className="max-w-3xl mx-auto mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {sttError}
          </div>
        )}
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            {/* When recording, show the recording bar above the textarea */}
            {isRecording && sttSupported && (
              <div className="mb-2">
                <VoiceMicButton
                  status={sttStatus}
                  onClick={handleStartRecording}
                  onPause={pauseListening}
                  onResume={resumeListening}
                  onStop={handleStopRecording}
                  elapsedSeconds={elapsedSeconds}
                  interimTranscript={sttInterimTranscript}
                />
              </div>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                status === "connected"
                  ? "What are you planning to teach?"
                  : "Waiting for connection..."
              }
              disabled={status !== "connected"}
              rows={1}
              className="w-full resize-none rounded-xl border border-border bg-surface-1 pl-4 pr-12 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent disabled:opacity-50 transition-all"
            />
            {/* Mic button inside input — only show when NOT recording */}
            {sttSupported && !isRecording && (
              <div className="absolute right-2 bottom-1.5">
                <VoiceMicButton
                  status={sttStatus}
                  onClick={handleStartRecording}
                  disabled={status !== "connected" || isThinking}
                />
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || status !== "connected" || isThinking}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <p className="text-xs text-text-tertiary">
            Press Enter to send
          </p>
          {ttsSupported && (
            <button
              type="button"
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                if (isSpeaking) stopSpeaking();
              }}
              className={`flex items-center gap-1 text-xs transition-colors ${
                ttsEnabled ? "text-accent" : "text-text-tertiary hover:text-text-secondary"
              }`}
              title={ttsEnabled ? "Disable voice responses" : "Enable voice responses"}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {ttsEnabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
