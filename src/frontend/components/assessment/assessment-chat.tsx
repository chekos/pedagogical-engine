"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { useAssessmentChat } from "@/lib/hooks/use-assessment-chat";

interface SkillArea {
  name: string;
  status: "covered" | "current" | "upcoming";
  confidence?: number;
}

interface AssessmentChatProps {
  code: string;
  learnerName: string;
  skillAreas?: string[];
}

const markdownComponents: Components = {
  // Keep paragraphs inline-friendly
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

  // Code
  pre: ({ children }) => <pre className="not-prose">{children}</pre>,
  code: ({ className, children, ...props }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <code className={`block font-mono text-[0.85em] ${className ?? ""}`} {...props}>
          {children}
        </code>
      );
    }
    return <code {...props}>{children}</code>;
  },

  // Lists
  ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-muted underline underline-offset-2 hover:text-accent"
    >
      {children}
    </a>
  ),

  // Bold/italic (just let them pass through)
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
};

function buildSkillAreas(
  labels: string[],
  coveredLabels: Map<string, string>,
  isLoading: boolean,
): SkillArea[] {
  const coveredNames = new Set(coveredLabels.values());
  // Track the most recently reported skill (last entry in the Map)
  let lastReported: string | undefined;
  for (const v of coveredLabels.values()) lastReported = v;

  if (coveredNames.size === 0) {
    // Agent hasn't reported yet — show all as upcoming
    return labels.map((name) => ({ name, status: "upcoming" }));
  }

  return labels.map((name) => {
    if (coveredNames.has(name)) {
      // If this is the last-reported skill and we're still loading, show as current
      if (isLoading && name === lastReported) return { name, status: "current" };
      return { name, status: "covered" };
    }
    return { name, status: "upcoming" };
  });
}

export default function AssessmentChat({
  code,
  learnerName,
  skillAreas: skillAreaLabels,
}: AssessmentChatProps) {
  const {
    messages,
    input,
    setInput,
    isLoading,
    loadingDurationSec,
    isComplete,
    error,
    setError,
    sendMessage,
    messagesEndRef,
    inputRef,
    coveredSkillIds,
    coveredSkillLabels,
  } = useAssessmentChat({
    code,
    learnerName,
    autoStartMessage: `Hi, I'm ${learnerName}. I'm ready to start my assessment.`,
  });

  const completionRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isComplete && completionRef.current) {
      completionRef.current.focus();
    }
  }, [isComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const labels = skillAreaLabels && skillAreaLabels.length > 0
    ? skillAreaLabels
    : ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5", "Topic 6"];
  const total = labels.length;
  const covered = coveredSkillLabels.size;
  const progressPercent = total > 0 ? Math.round((covered / total) * 100) : 0;
  const skillAreas = buildSkillAreas(labels, coveredSkillLabels, isLoading);

  return (
    <div className="flex flex-col h-screen bg-surface-0">
      {/* Header with progress */}
      <header className="border-b border-border-subtle">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-400/20 flex items-center justify-center" aria-hidden="true">
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
              <div
                className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Assessment progress: ${covered} of ${total} areas covered`}
              >
                <div
                  className="h-full bg-gradient-to-r from-accent to-accent-muted rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(progressPercent, 5)}%` }}
                />
              </div>
              <span className="text-xs text-text-tertiary tabular-nums" aria-hidden="true">
                {progressPercent}%
              </span>
            </div>
            {/* Skill area pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skillAreas.map((area) => (
                <span
                  key={area.name}
                  aria-label={`${area.name}: ${area.status === "covered" ? "completed" : area.status === "current" ? "in progress" : "not yet covered"}`}
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
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4" role="log" aria-label="Assessment conversation">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-accent-muted/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0" aria-hidden="true">
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
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div className="prose-chat">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        <div aria-live="polite" aria-atomic="true">
          {isLoading && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-accent-muted/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <span className="text-xs">🎓</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-surface-2 rounded-bl-md">
                <div className="flex space-x-1" aria-hidden="true">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-text-tertiary">
                  {loadingDurationSec > 20
                    ? "Saving your results — almost done!"
                    : loadingDurationSec > 8
                      ? "Still working..."
                      : "Thinking..."}
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-center animate-fade-in" role="alert">
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-400/20 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 ref={completionRef} tabIndex={-1} className="text-xl font-semibold text-text-primary mb-2 outline-none">
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
              aria-label="Type your response"
              disabled={isLoading}
              className="flex-1 rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent disabled:opacity-50 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
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
                : covered < total - 1
                  ? "Almost there! Just a couple more topics to go."
                  : "Last few questions — you've got this!"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
