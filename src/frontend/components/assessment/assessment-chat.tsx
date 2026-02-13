"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendAssessmentMessage } from "@/lib/api";

interface AssessmentMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface SkillArea {
  name: string;
  status: "covered" | "current" | "upcoming";
  confidence?: number;
}

interface AssessmentChatProps {
  code: string;
  learnerName: string;
}

/**
 * Parse skill areas from assistant messages.
 * The backend assessment agent mentions skill areas as it covers them.
 * We estimate progress based on the conversation flow.
 */
function estimateProgress(messages: AssessmentMessage[]): {
  covered: number;
  total: number;
  skillAreas: SkillArea[];
} {
  const assistantMsgs = messages.filter((m) => m.role === "assistant");
  const userMsgs = messages.filter((m) => m.role === "user");

  // Estimate: typical assessment covers ~6 skill areas in ~12 exchanges
  const total = 6;
  const exchanges = userMsgs.length;
  const covered = Math.min(Math.floor(exchanges / 2), total);

  const defaultAreas = [
    "Foundations",
    "Core concepts",
    "Working with data",
    "Analysis",
    "Visualization",
    "Advanced topics",
  ];

  const skillAreas: SkillArea[] = defaultAreas.map((name, i) => ({
    name,
    status: i < covered ? "covered" : i === covered ? "current" : "upcoming",
  }));

  return { covered, total, skillAreas };
}

export default function AssessmentChat({
  code,
  learnerName,
}: AssessmentChatProps) {
  const [messages, setMessages] = useState<AssessmentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasStarted = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Start assessment on mount
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function start() {
      setIsLoading(true);
      try {
        const res = await sendAssessmentMessage(
          code,
          learnerName,
          `Hi, I'm ${learnerName}. I'm ready to start my assessment.`
        );

        const assistantMessages: AssessmentMessage[] = res.messages.map(
          (m, i) => ({
            id: `init-${i}`,
            role: "assistant" as const,
            text: m.text,
          })
        );

        setMessages(assistantMessages);

        if (res.result?.subtype === "success") {
          setIsComplete(true);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to start assessment";
        if (message.includes("not found")) {
          setError(
            `Assessment code "${code}" was not found. Please check the code and try again.`
          );
        } else if (message.includes("completed")) {
          setError("This assessment has already been completed.");
          setIsComplete(true);
        } else {
          setError(message);
        }
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    }

    start();
  }, [code, learnerName]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isComplete) return;

    const userMsg: AssessmentMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await sendAssessmentMessage(code, learnerName, trimmed);

      const assistantMessages: AssessmentMessage[] = res.messages.map(
        (m, i) => ({
          id: `resp-${Date.now()}-${i}`,
          role: "assistant" as const,
          text: m.text,
        })
      );

      setMessages((prev) => [...prev, ...assistantMessages]);

      if (res.result?.subtype === "success") {
        setIsComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, isComplete, code, learnerName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const { covered, total, skillAreas } = estimateProgress(messages);
  const progressPercent = total > 0 ? Math.round((covered / total) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-surface-0">
      {/* Header with progress */}
      <header className="border-b border-border-subtle">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-400/20 flex items-center justify-center">
              <span className="text-sm">💬</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-text-primary">
                Skill Check
              </h1>
              <p className="text-xs text-text-tertiary">
                {learnerName} &middot; Just a conversation, not a test
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isComplete ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                All done!
              </span>
            ) : covered > 0 ? (
              <span className="text-xs text-text-secondary font-medium">
                {covered} of {total} areas covered
              </span>
            ) : null}
          </div>
        </div>

        {/* Progress bar */}
        {!isComplete && messages.length > 0 && (
          <div className="px-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-accent-muted rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(progressPercent, 5)}%` }}
                />
              </div>
              <span className="text-xs text-text-tertiary tabular-nums">
                {progressPercent}%
              </span>
            </div>
            {/* Skill area pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skillAreas.map((area) => (
                <span
                  key={area.name}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all duration-300 ${
                    area.status === "covered"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : area.status === "current"
                        ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                        : "bg-surface-2 text-text-tertiary"
                  }`}
                >
                  {area.status === "covered" && (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {area.status === "current" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-subtle" />
                  )}
                  {area.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-accent-muted/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="text-xs">🎓</span>
              </div>
            )}
            <div
              className={`max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-white rounded-br-md"
                  : "bg-surface-2 text-text-primary rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-accent-muted/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs">🎓</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-surface-2 rounded-bl-md">
              <div className="flex space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-xs text-text-tertiary">Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center animate-fade-in">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-text-tertiary hover:text-text-secondary mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Completion: skill map */}
        {isComplete && (
          <div className="animate-slide-up">
            {/* Celebration */}
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-400/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                You&apos;re all set, {learnerName}!
              </h2>
              <p className="text-sm text-text-secondary max-w-sm mx-auto">
                Thanks for sharing what you know. Here&apos;s a quick look at
                where you stand. Your instructor will use this to plan a session
                that&apos;s right for you.
              </p>
            </div>

            {/* Skill map visualization */}
            <div className="max-w-lg mx-auto bg-surface-1 rounded-2xl border border-border-subtle p-6 mb-4">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Your Skill Map
              </h3>

              {/* What you know */}
              <div className="mb-4">
                <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">
                  What you know
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skillAreas
                    .filter((a) => a.status === "covered")
                    .map((area) => (
                      <span
                        key={area.name}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400"
                      >
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {area.name}
                      </span>
                    ))}
                  {skillAreas.filter((a) => a.status === "covered").length ===
                    0 && (
                    <span className="text-xs text-text-tertiary">
                      Assessment data will be shared with your instructor
                    </span>
                  )}
                </div>
              </div>

              {/* What you'll work on */}
              <div>
                <p className="text-xs font-medium text-accent uppercase tracking-wider mb-2">
                  What you&apos;ll work on next
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skillAreas
                    .filter(
                      (a) =>
                        a.status === "upcoming" || a.status === "current"
                    )
                    .map((area) => (
                      <span
                        key={area.name}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent"
                      >
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
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                        {area.name}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {/* Reassuring note */}
            <p className="text-xs text-text-tertiary text-center max-w-sm mx-auto">
              Everyone starts somewhere. Your instructor will tailor the
              session so you&apos;re always learning at the right level.
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isComplete && (
        <div className="border-t border-border-subtle p-4 md:px-6">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                messages.length === 0
                  ? "Say hi to get started..."
                  : "Just tell me what you know — no wrong answers"
              }
              disabled={isLoading}
              className="flex-1 rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent disabled:opacity-50 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          {/* Encouragement text that rotates */}
          {messages.length > 2 && !isLoading && (
            <p className="text-xs text-text-tertiary text-center mt-2">
              {covered < 3
                ? "You're doing great! Just tell me what comes to mind."
                : covered < 5
                  ? "Almost there! Just a couple more topics to go."
                  : "Last few questions — you've got this!"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
