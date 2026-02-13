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

export default function ChatInterface() {
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
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const ttsQueueRef = useRef<string | null>(null);
  const ttsEnabledRef = useRef(false);
  // Keep ref in sync with state so the callback can read it
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);

  // Voice input (speech-to-text)
  const {
    isSupported: sttSupported,
    status: sttStatus,
    transcript,
    toggleListening,
    errorMessage: sttError,
  } = useSpeechRecognition({
    onFinalTranscript: (text) => {
      // Populate textarea with recognized speech — user can review before sending
      setInput((prev) => (prev ? prev + " " + text : text));
    },
  });

  // Voice output (text-to-speech)
  const {
    isSupported: ttsSupported,
    isSpeaking,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis({ rate: 1.05 });

  // Keep speak in a ref so handleMessage has a stable identity
  const speakRef = useRef(speak);
  useEffect(() => { speakRef.current = speak; }, [speak]);

  // Update input when transcript changes (interim results)
  const lastTranscriptRef = useRef("");
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current && sttStatus === "listening") {
      // Show interim transcript in the input as a preview
      lastTranscriptRef.current = transcript;
    }
  }, [transcript, sttStatus]);

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

      case "assistant": {
        // NOTE: Do NOT setIsThinking(false) here. The agent sends multiple
        // "assistant" messages during a turn (one per tool use). Only "result"
        // means the agent is truly done. Clearing here caused the progress
        // indicator to vanish prematurely during long subagent operations.

        // Track active tool uses
        if (msg.toolUses && msg.toolUses.length > 0) {
          setActiveTools(msg.toolUses);
        }

        if (msg.text.trim()) {
          const id = `assistant-${Date.now()}-${Math.random()}`;
          currentAssistantRef.current = id;
          // Queue for TTS — only the last assistant message gets read aloud
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
          // Tool use without text — add as a tool-only message
          const id = `tool-${Date.now()}-${Math.random()}`;
          setMessages((prev) => [
            ...prev,
            {
              id,
              role: "assistant",
              text: "",
              timestamp: new Date(),
              toolUses: msg.toolUses,
            },
          ]);
        }
        break;
      }

      case "result":
        setIsThinking(false);
        setActiveTools([]);
        setThinkingStartedAt(null);
        currentAssistantRef.current = null;
        // TTS: read back final assistant response if enabled
        // (handled via ttsQueueRef and speakRef so the callback doesn't need speak in deps)
        if (ttsQueueRef.current) {
          speakRef.current(ttsQueueRef.current);
          ttsQueueRef.current = null;
        }
        // Surface error results to the user
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
        // System init — could show available tools/skills
        break;

      case "tool_progress": {
        // Update active tools with the currently running tool for better progress display
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

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  }, [input]);

  // Programmatic send (used by interactive tool cards like AskUserQuestion)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
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
            <h1 className="text-lg font-semibold text-text-primary">Teaching Workspace</h1>
            <p className="text-xs text-text-tertiary mt-0.5">
              Describe your teaching context and I&apos;ll help you plan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connLabel.color}`} />
          <span className="text-xs text-text-tertiary">{connLabel.text}</span>
          {sessionId && (
            <span className="text-xs text-text-tertiary font-mono ml-2 hidden md:inline">
              {sessionId.slice(0, 8)}
            </span>
          )}
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {/* Connection error state */}
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
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Ready to plan</h2>
            <p className="text-sm text-text-secondary max-w-sm">
              Tell me about your teaching context — what you&apos;re teaching, who your students are,
              and any constraints. I&apos;ll help you build an effective lesson plan.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "I'm teaching a 90-minute Python workshop",
                "I have a group of 12 beginners learning data analysis",
                "Help me assess my students' skill levels",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {/* Text content */}
            {msg.text && (
              <MessageBubble role={msg.role} text={msg.text} timestamp={msg.timestamp} />
            )}
            {/* Tool uses */}
            {msg.toolUses && msg.toolUses.length > 0 && (
              <div className="mt-2 space-y-2 ml-0 md:ml-0">
                {msg.toolUses.map((tool) => (
                  <ToolResult key={tool.id} tool={tool} onSendMessage={sendProgrammaticMessage} />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Progress indicator — persists throughout the entire agent turn */}
        {isThinking && (
          <ProgressIndicator
            activeTools={activeTools}
            startedAt={thinkingStartedAt}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border-subtle p-4 md:px-6">
        {/* STT error banner */}
        {sttError && (
          <div className="max-w-4xl mx-auto mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {sttError}
          </div>
        )}
        {/* Listening indicator */}
        {sttStatus === "listening" && (
          <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-subtle" />
            <span className="text-xs text-red-400 font-medium">Listening...</span>
            {transcript && (
              <span className="text-xs text-text-secondary italic truncate">{transcript}</span>
            )}
          </div>
        )}
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          {/* Mic button */}
          {sttSupported && (
            <VoiceMicButton
              status={sttStatus}
              onClick={toggleListening}
              disabled={status !== "connected" || isThinking}
            />
          )}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                status === "connected"
                  ? sttStatus === "listening"
                    ? "Listening... speak now"
                    : "Type or tap the mic to speak..."
                  : "Waiting for connection..."
              }
              disabled={status !== "connected"}
              rows={1}
              className="w-full resize-none rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent disabled:opacity-50 transition-all"
            />
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
            {sttSupported ? "Enter to send, mic to speak" : "Press Enter to send, Shift+Enter for new line"}
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
              {ttsEnabled ? "Voice on" : "Voice off"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
