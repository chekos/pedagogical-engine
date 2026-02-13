"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BACKEND_URL, WS_URL } from "@/lib/constants";

interface LessonSection {
  id: string;
  title: string;
  phase: string;
  startMin: number;
  endMin: number;
  durationMin: number;
}

interface LessonMeta {
  title: string;
  group: string;
  date: string;
  domain: string;
  duration: number;
  topic: string;
  oneThing: string;
}

interface DebriefReadyData {
  lessonId: string;
  lessonExists: boolean;
  hasDebrief: boolean;
  readyForDebrief: boolean;
  lesson: {
    meta: LessonMeta;
    sections: LessonSection[];
    objectives: string[];
  } | null;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  text: string;
}

export default function DebriefPage() {
  const params = useParams();
  const lessonId = params["lesson-id"] as string;

  const [readyData, setReadyData] = useState<DebriefReadyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [debriefStarted, setDebriefStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Existing debrief state
  const [existingDebrief, setExistingDebrief] = useState<string | null>(null);

  // Fetch lesson readiness data
  useEffect(() => {
    if (!lessonId) return;
    fetch(`${BACKEND_URL}/api/debrief-ready/${lessonId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to check debrief readiness");
        return res.json();
      })
      .then((data: DebriefReadyData) => {
        setReadyData(data);
        setLoading(false);

        // If debrief already exists, fetch it
        if (data.hasDebrief) {
          fetch(`${BACKEND_URL}/api/debriefs/${lessonId}`)
            .then((r) => r.json())
            .then((d) => setExistingDebrief(d.debrief))
            .catch(() => {});
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [lessonId]);

  // Timer for processing state
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Connect WebSocket for conversational debrief
  const connectWs = useCallback(() => {
    const socket = new WebSocket(`${WS_URL}/ws/chat`);

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "session":
          break;
        case "assistant":
          if (data.text && data.text.trim()) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", text: data.text },
            ]);
          }
          break;
        case "result":
          setProcessing(false);
          setTimerActive(false);
          setElapsed(0);
          break;
        case "error":
          setMessages((prev) => [
            ...prev,
            { role: "system", text: `Error: ${data.error}` },
          ]);
          setProcessing(false);
          setTimerActive(false);
          break;
        case "tool_progress":
          // Show tool progress as system message
          break;
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    socket.onerror = () => {
      setConnected(false);
    };

    setWs(socket);
    return socket;
  }, []);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      ws?.close();
    };
  }, [ws]);

  // Start the debrief conversation
  const startDebrief = useCallback(() => {
    const socket = connectWs();
    setDebriefStarted(true);

    // Wait for connection, then send the debrief prompt
    socket.addEventListener("open", () => {
      const lesson = readyData?.lesson;
      const sectionList = lesson?.sections
        .map(
          (s) =>
            `- ${s.title} (${s.startMin}-${s.endMin} min, ${s.durationMin} min planned)`
        )
        .join("\n");

      const prompt = `I just finished teaching the lesson "${lesson?.meta.title || lessonId}". I'd like to do a post-session debrief.

Here's the lesson context:
- Topic: ${lesson?.meta.topic || "unknown"}
- Group: ${lesson?.meta.group || "unknown"}
- Domain: ${lesson?.meta.domain || "unknown"}
- Duration: ${lesson?.meta.duration || "unknown"} minutes
- Lesson ID: ${lessonId}

Sections in the plan:
${sectionList || "No sections parsed"}

Please guide me through the debrief conversationally. Start with an overall check — how did the session go? Then we'll walk through the sections, discuss individual students, and reflect on what happened.

Use the debrief-session skill to guide this conversation. When we're done, use the process_debrief tool to save the debrief and update learner profiles.`;

      socket.send(JSON.stringify({ type: "message", message: prompt }));
      setProcessing(true);
      setTimerActive(true);
    });
  }, [connectWs, readyData, lessonId]);

  // Send follow-up messages
  const sendMessage = useCallback(() => {
    if (!ws || !input.trim() || processing) return;

    const msg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setProcessing(true);
    setTimerActive(true);
    setElapsed(0);

    ws.send(JSON.stringify({ type: "message", message: msg }));
  }, [ws, input, processing]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-surface-0">
        <Nav />
        <main className="max-w-3xl mx-auto px-6 py-10">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
            {error}. Make sure the backend server is running on port 3000.
          </div>
        </main>
      </div>
    );
  }

  // Lesson not found
  if (!readyData?.lessonExists) {
    return (
      <div className="min-h-screen bg-surface-0">
        <Nav />
        <main className="max-w-3xl mx-auto px-6 py-10">
          <div className="text-center py-20">
            <h1 className="text-xl font-bold text-text-primary mb-2">
              Lesson Not Found
            </h1>
            <p className="text-sm text-text-tertiary">
              No lesson plan found with ID &ldquo;{lessonId}&rdquo;.
            </p>
            <Link
              href="/lessons"
              className="inline-block mt-4 text-sm text-accent hover:underline"
            >
              Browse all lessons
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const lesson = readyData.lesson!;

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <Nav />

      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-xs font-medium border border-amber-500/20">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Post-Session Debrief
            </span>
            {readyData.hasDebrief && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                Debrief recorded
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            {lesson.meta.title}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {lesson.meta.topic} &middot; {lesson.meta.group} &middot;{" "}
            {lesson.meta.duration} min &middot; {lesson.meta.domain}
          </p>
        </div>

        {/* Show existing debrief if available */}
        {existingDebrief && !debriefStarted && (
          <div className="mb-6 rounded-xl border border-border bg-surface-1 overflow-hidden">
            <div className="px-5 py-3 border-b border-border-subtle flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                Previous Debrief
              </h2>
              <button
                onClick={() => setExistingDebrief(null)}
                className="text-xs text-text-tertiary hover:text-text-secondary"
              >
                Hide
              </button>
            </div>
            <div className="px-5 py-4 prose-chat text-sm max-h-96 overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {existingDebrief}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Section overview cards */}
        {!debriefStarted && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-text-secondary mb-3">
              Lesson Sections ({lesson.sections.length})
            </h2>
            <div className="grid gap-2">
              {lesson.sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-14 text-center shrink-0">
                    <span className="text-xs font-mono text-text-tertiary">
                      {section.startMin}–{section.endMin}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {section.title}
                    </p>
                    {section.phase && (
                      <p className="text-xs text-text-tertiary">
                        {section.phase}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-text-tertiary shrink-0">
                    {section.durationMin} min
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start debrief button */}
        {!debriefStarted && (
          <div className="text-center py-4">
            <button
              onClick={startDebrief}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-muted transition-colors shadow-lg shadow-accent/20"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {readyData.hasDebrief
                ? "Start Another Debrief"
                : "Start Debrief"}
            </button>
            <p className="text-xs text-text-tertiary mt-2">
              A conversational reflection on how the session went.
              <br />
              Takes 5-10 minutes. Updates learner profiles automatically.
            </p>
          </div>
        )}

        {/* Chat interface */}
        {debriefStarted && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`animate-slide-up ${
                    msg.role === "user"
                      ? "flex justify-end"
                      : msg.role === "system"
                        ? "flex justify-center"
                        : "flex justify-start"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-accent text-white px-4 py-2.5 text-sm">
                      {msg.text}
                    </div>
                  ) : msg.role === "system" ? (
                    <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-1.5">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-surface-1 border border-border-subtle px-4 py-3 text-sm prose-chat">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}

              {/* Processing indicator */}
              {processing && (
                <div className="flex items-center gap-2 text-xs text-text-tertiary animate-fade-in">
                  <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  <span>
                    Thinking
                    {elapsed > 0 && (
                      <span className="text-text-tertiary/60">
                        {" "}
                        ({elapsed}s)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border-subtle pt-4 mt-auto">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    processing
                      ? "Waiting for response..."
                      : "Tell me about the session..."
                  }
                  disabled={processing || !connected}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={processing || !input.trim() || !connected}
                  className="shrink-0 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-muted transition-colors disabled:opacity-30"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19V5m0 0l-7 7m7-7l7 7"
                    />
                  </svg>
                </button>
              </div>
              {!connected && debriefStarted && (
                <p className="text-xs text-red-400 mt-1">
                  Disconnected from server. Please refresh to reconnect.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-text-primary">
            Pedagogical Engine
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/teach"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Teach
        </Link>
        <Link
          href="/lessons"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Lessons
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
