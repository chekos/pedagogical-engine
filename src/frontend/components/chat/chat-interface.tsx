"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatClient, type ConnectionStatus, type ServerMessage, type ToolUse, type CreatedFile } from "@/lib/api";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { saveSessionState, loadSessionState, clearSessionState, pruneOldSessions } from "@/lib/session-storage";
import MessageBubble from "./message-bubble";
import ToolResult from "./tool-result";
import ProgressIndicator from "./progress-indicator";
import VoiceMicButton from "./voice-mic-button";
import SessionContextSidebar, { EMPTY_SESSION_CONTEXT, type SessionContext } from "./session-context-sidebar";
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
  resumeSessionId?: string;
}

export default function ChatInterface({ initialMessage, resumeSessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [isThinking, setIsThinking] = useState(false);
  const [activeTools, setActiveTools] = useState<ToolUse[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(resumeSessionId ?? null);
  const requestedSessionIdRef = useRef<string | undefined>(resumeSessionId);
  const restoredRef = useRef(false);
  const [thinkingStartedAt, setThinkingStartedAt] = useState<number | null>(null);
  const clientRef = useRef<ChatClient | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentAssistantRef = useRef<string | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const ttsQueueRef = useRef<string | null>(null);
  const ttsEnabledRef = useRef(false);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);

  // User identity — check if user.md exists
  const [userState, setUserState] = useState<{
    loaded: boolean;
    exists: boolean;
    name: string | null;
    greeting: string | null;
    subtext: string | null;
  }>({ loaded: false, exists: false, name: null, greeting: null, subtext: null });

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    fetch(`${API}/api/user`).then(r => r.json()).then(async (data) => {
      if (data.exists) {
        // Fetch personalized greeting
        try {
          const gr = await fetch(`${API}/api/user/greeting`).then(r => r.json());
          setUserState({ loaded: true, exists: true, name: data.name, greeting: gr.greeting, subtext: gr.subtext });
        } catch {
          setUserState({ loaded: true, exists: true, name: data.name, greeting: null, subtext: null });
        }
      } else {
        setUserState({ loaded: true, exists: false, name: null, greeting: null, subtext: null });
      }
    }).catch(() => {
      setUserState({ loaded: true, exists: false, name: null, greeting: null, subtext: null });
    });
  }, []);

  // Restore session state from localStorage on mount
  useEffect(() => {
    if (resumeSessionId) {
      const saved = loadSessionState(resumeSessionId);
      if (saved) {
        setMessages(saved.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
        setCreativeLabels(saved.creativeLabels);
        setCreatedFiles(saved.createdFiles);
      }
      restoredRef.current = true;
    } else {
      restoredRef.current = true;
      pruneOldSessions(10);
    }
  }, []); // Intentionally run once on mount

  // AI-generated creative tool labels (received from server on session init)
  const [creativeLabels, setCreativeLabels] = useState<Record<string, string>>({});

  // Session context sidebar
  const [sessionContext, setSessionContext] = useState<SessionContext>(EMPTY_SESSION_CONTEXT);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  // Created files tracking (keyed by filePath)
  const [createdFiles, setCreatedFiles] = useState<Record<string, CreatedFile>>({});
  const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);
  const serverProvidesContext = useRef(false);

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

  // Extract session context from tool uses (generic pattern-based extraction)
  const extractContext = useCallback((tools: ToolUse[]) => {
    setSessionContext((prev) => {
      const next = { ...prev };
      for (const tool of tools) {
        // Extract lessonId from file-based tools (Read/Write on lesson files)
        if ((tool.name === "Read" || tool.name === "Write") && typeof tool.input.file_path === "string") {
          const lessonMatch = tool.input.file_path.match(/lessons\/(.+?)\.md$/);
          if (lessonMatch) next.lessonId = lessonMatch[1];
        }

        if (!tool.name.startsWith("mcp__pedagogy__")) continue;
        const input = tool.input;

        // Common parameters — consistent across tools
        if (typeof input.domain === "string") next.domain = input.domain;
        if (typeof input.groupName === "string") next.groupName = input.groupName;
        if (typeof input.lessonId === "string") next.lessonId = input.lessonId;

        // Skill references
        if (typeof input.skillId === "string") {
          next.skillsDiscussed = [...new Set([...next.skillsDiscussed, input.skillId])];
        }
        if (Array.isArray(input.skillIds)) {
          const ids = input.skillIds.filter((s: unknown): s is string => typeof s === "string");
          next.skillsDiscussed = [...new Set([...next.skillsDiscussed, ...ids])];
        }

        // Learner references
        if (typeof input.learnerId === "string") {
          next.learnerNames = [...new Set([...next.learnerNames, input.learnerId])];
        }

        // Constraints: duration and explicit constraint strings
        if (typeof input.duration === "number") {
          const c = `${input.duration} minutes`;
          if (!next.constraints.includes(c)) next.constraints = [...next.constraints, c];
        }
        if (typeof input.constraints === "string" && input.constraints.trim()) {
          const parts = input.constraints.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
          const newConstraints = parts.filter((p: string) => !next.constraints.includes(p));
          if (newConstraints.length > 0) next.constraints = [...next.constraints, ...newConstraints];
        }

        // Members from load_roster (array of strings or {name: string} objects)
        if (Array.isArray(input.members)) {
          const names = input.members
            .map((m: unknown) => {
              if (typeof m === "string") return m;
              if (typeof m === "object" && m !== null && "name" in m && typeof (m as Record<string, unknown>).name === "string") {
                return (m as Record<string, unknown>).name as string;
              }
              return undefined;
            })
            .filter((n): n is string => typeof n === "string");
          if (names.length > 0) {
            next.learnerNames = [...new Set([...next.learnerNames, ...names])];
          }
        }
      }
      return next;
    });
  }, []);

  // Persist messages + creativeLabels + createdFiles to localStorage on change
  useEffect(() => {
    if (!sessionId || !restoredRef.current) return;
    saveSessionState(sessionId, {
      messages: messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() })),
      creativeLabels,
      createdFiles,
    });
  }, [sessionId, messages, creativeLabels, createdFiles]);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTools, isThinking, scrollToBottom]);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "session": {
        const requested = requestedSessionIdRef.current;
        // If server gave us a different session than we asked for, our old session is stale
        if (requested && msg.sessionId !== requested) {
          clearSessionState(requested);
          setMessages([]);
          setCreativeLabels({});
          setCreatedFiles({});
        }
        setSessionId(msg.sessionId);
        if ("creativeLabels" in msg && msg.creativeLabels) {
          setCreativeLabels(msg.creativeLabels as Record<string, string>);
        }
        // Update URL to reflect current session (and strip ?message= if present)
        const url = new URL(window.location.href);
        url.searchParams.set("session", msg.sessionId);
        url.searchParams.delete("message");
        window.history.replaceState({}, "", url.toString());
        break;
      }

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
          if (!serverProvidesContext.current) {
            extractContext(msg.toolUses);
          }
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

      case "session_context": {
        serverProvidesContext.current = true;
        if ("context" in msg && msg.context) {
          setSessionContext(msg.context as SessionContext);
        }
        break;
      }

      case "file_created": {
        const file = msg.file;
        const key = file.filePath || `upload-${Date.now()}`;
        setCreatedFiles((prev) => {
          if (file.status === "uploaded" && file.filePath) {
            // Upgrade existing local entry
            const existing = prev[file.filePath];
            if (existing) {
              return { ...prev, [file.filePath]: { ...existing, ...file, toolUseId: msg.toolUseId } };
            }
          }
          return { ...prev, [key]: { ...file, toolUseId: msg.toolUseId } };
        });
        break;
      }

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
  }, [extractContext]);

  useEffect(() => {
    const client = new ChatClient({
      onMessage: handleMessage,
      onStatusChange: setStatus,
    });
    clientRef.current = client;
    client.connect(resumeSessionId);

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
    if (initialMessage && !resumeSessionId && status === "connected" && !initialMessageSent.current) {
      initialMessageSent.current = true;
      sendProgrammaticMessage(initialMessage);
    }
  }, [initialMessage, resumeSessionId, status, sendProgrammaticMessage]);

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
    <div className="flex flex-col h-full" id="main-content">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Back to home"
            className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="w-px h-5 bg-border-subtle" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-heading text-text-primary">Teach</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status !== "connected" && (
            <div className="flex items-center gap-2" role="status" aria-live="polite">
              <span className={`w-2 h-2 rounded-full ${connLabel.color}`} aria-hidden="true" />
              <span className="text-xs text-text-tertiary">{connLabel.text}</span>
            </div>
          )}
          {/* Mobile sidebar toggle */}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle session context panel"
            className="md:hidden p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex-1 flex relative overflow-hidden min-h-0">
        {/* Chat column */}
        <div className={`flex-1 flex flex-col min-w-0 min-h-0 transition-all duration-300 ${sidebarCollapsed ? "" : "md:mr-[280px]"}`}>
        {/* Messages area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto min-h-0 px-4 md:px-6 py-6 space-y-4" role="log" aria-label="Conversation" aria-live="polite" aria-atomic="false">
        {messages.length === 0 && (status === "error" || status === "disconnected") && (
          <div className="flex flex-col items-center justify-center h-full text-center" role="alert">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4" aria-hidden="true">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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

        {messages.length === 0 && status === "connected" && userState.loaded && (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="max-w-lg w-full px-4">
              {!userState.exists ? (
                /* First-time user — onboarding welcome */
                <>
                  <h2 className="font-heading text-2xl md:text-3xl text-text-primary mb-4 leading-snug">
                    Nice to meet you.
                  </h2>
                  <p className="text-base text-text-secondary leading-relaxed mb-6">
                    I&apos;m your teaching partner&nbsp;&mdash; I help with lesson planning,
                    skill assessment, curriculum design, and post-session debriefs.
                    The more I know about how you teach, the better I get at this.
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed mb-10">
                    Tell me a bit about yourself to get started&nbsp;&mdash; what do you
                    teach, who are your students, whatever feels right.
                  </p>
                  <div className="space-y-3">
                    {([
                      { text: "I\u2019m new here \u2014 let me tell you about what I teach.", color: "border-bloom-understand" },
                      { text: "I have a lesson coming up and need help planning it.", color: "border-bloom-apply" },
                    ] as const).map(({ text, color }) => (
                      <button
                        key={text}
                        onClick={() => {
                          setInput(text);
                          inputRef.current?.focus();
                        }}
                        className={`block w-full text-left border-l-2 ${color} pl-4 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors`}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                /* Returning user — personalized greeting */
                <>
                  <p className="text-sm text-text-tertiary mb-1 tracking-wide">
                    {userState.greeting
                      ? "" /* Haiku greeting is self-contained */
                      : (() => {
                          const h = new Date().getHours();
                          return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
                        })()
                    }
                  </p>
                  <h2 className="font-heading text-2xl md:text-3xl text-text-primary mb-4 leading-snug">
                    {userState.greeting || `What are we working on${userState.name ? `, ${userState.name}` : ""}?`}
                  </h2>
                  <p className="text-base text-text-secondary leading-relaxed mb-10">
                    {userState.subtext || (
                      <>
                        I&apos;m here whenever you&apos;re ready. Tell me about your students,
                        your subject, whatever constraints you&apos;re juggling&nbsp;&mdash;
                        and we&apos;ll figure it out together.
                      </>
                    )}
                  </p>
                  <p className="text-xs text-text-tertiary uppercase tracking-widest mb-4">Or start from here</p>
                  <div className="space-y-3">
                    {([
                      { text: "I\u2019m planning a lesson and I\u2019m not sure where to start.", color: "border-bloom-understand" },
                      { text: "I have a group of students \u2014 can we figure out what they already know?", color: "border-bloom-apply" },
                      { text: "I taught a session recently and want to debrief.", color: "border-bloom-evaluate" },
                    ] as const).map(({ text, color }) => (
                      <button
                        key={text}
                        onClick={() => {
                          setInput(text);
                          inputRef.current?.focus();
                        }}
                        className={`block w-full text-left border-l-2 ${color} pl-4 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors`}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <ol className="max-w-3xl mx-auto space-y-4 list-none p-0 m-0" aria-label="Messages">
          {messages.map((msg) => (
            <li key={msg.id}>
              {msg.text && (
                <MessageBubble role={msg.role} text={msg.text} timestamp={msg.timestamp} />
              )}
              {msg.toolUses && msg.toolUses.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.toolUses.map((tool) => (
                    <ToolResult key={tool.id} tool={tool} onSendMessage={sendProgrammaticMessage} creativeLabels={creativeLabels} createdFiles={createdFiles} />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>

          {isThinking && (
            <div className="max-w-3xl mx-auto" role="status" aria-label="Assistant is thinking">
              <ProgressIndicator
                activeTools={activeTools}
                startedAt={thinkingStartedAt}
                creativeLabels={creativeLabels}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-border-subtle p-4 md:px-6">
        {/* STT error banner */}
        {sttError && (
          <div className="max-w-3xl mx-auto mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400" role="alert">
            {sttError}
          </div>
        )}
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <label htmlFor="chat-input" className="sr-only">Message to teaching assistant</label>
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
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                status === "connected"
                  ? "Tell me what you\u2019re thinking\u2026"
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
            aria-label="Send message"
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
              className={`flex items-center gap-1 text-xs transition-colors min-w-[24px] min-h-[24px] ${
                ttsEnabled ? "text-accent" : "text-text-tertiary hover:text-text-secondary"
              }`}
              aria-label={ttsEnabled ? "Disable voice responses" : "Enable voice responses"}
              aria-pressed={ttsEnabled}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {ttsEnabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>{/* end input area */}
      </div>{/* end chat column */}

        {/* Session context sidebar */}
        <SessionContextSidebar
          context={sessionContext}
          connectionStatus={status}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          createdFiles={createdFiles}
        />
      </div>{/* end main content area */}
    </div>
  );
}
