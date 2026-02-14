"use client";

import { useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { useAssessmentChat } from "@/lib/hooks/use-assessment-chat";

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
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
  ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-muted underline underline-offset-2 hover:text-accent">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
};

interface EmbedAssessmentChatProps {
  code: string;
  learnerName: string;
}

/**
 * Minimal assessment chat for iframe embedding.
 * No header, no footer, no navigation — just the conversation.
 * Sends results to parent window via postMessage on completion.
 */
export default function EmbedAssessmentChat({
  code,
  learnerName,
}: EmbedAssessmentChatProps) {
  const {
    messages,
    input,
    setInput,
    isLoading,
    loadingDurationSec,
    isComplete,
    progress,
    error,
    setError,
    sendMessage,
    messagesEndRef,
    inputRef,
  } = useAssessmentChat({
    code,
    learnerName,
    autoStartMessage: `Hi, I'm ${learnerName}. I'm ready to start my assessment.`,
  });

  const hasNotifiedStart = useRef(false);
  const prevProgressRef = useRef(0);

  // Notify parent window of events via postMessage
  const notifyParent = useCallback(
    (event: string, data?: Record<string, unknown>) => {
      if (typeof window === "undefined") return;
      window.parent.postMessage(
        { source: "pedagogical-engine", event, code, learnerName, ...data },
        "*"
      );
    },
    [code, learnerName]
  );

  // Notify parent on start
  useEffect(() => {
    if (hasNotifiedStart.current) return;
    hasNotifiedStart.current = true;
    notifyParent("assessment:started");
  }, [notifyParent]);

  // Notify parent on error
  useEffect(() => {
    if (error) {
      notifyParent("assessment:error", { error });
    }
  }, [error, notifyParent]);

  // Notify parent on completion
  useEffect(() => {
    if (isComplete) {
      notifyParent("assessment:completed", {
        messageCount: messages.length,
        covered: progress.covered,
        total: progress.total,
      });
    }
  }, [isComplete, messages.length, progress.covered, progress.total, notifyParent]);

  // Notify parent on progress changes
  useEffect(() => {
    if (!isComplete && progress.covered > prevProgressRef.current) {
      prevProgressRef.current = progress.covered;
      notifyParent("assessment:progress", {
        covered: progress.covered,
        total: progress.total,
      });
    }
  }, [isComplete, progress.covered, progress.total, notifyParent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const { covered, total, percent: progressPercent } = progress;

  return (
    <div className="flex flex-col h-screen bg-surface-0">
      {/* Minimal progress bar at top */}
      {!isComplete && messages.length > 0 && (
        <div className="px-3 pt-2">
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-1 bg-surface-2 rounded-full overflow-hidden"
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
            <span className="text-[10px] text-text-tertiary tabular-nums">
              {covered}/{total}
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
        role="log"
        aria-label="Assessment conversation"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            {msg.role === "assistant" && (
              <div
                className="w-6 h-6 rounded-full bg-gradient-to-br from-accent/20 to-accent-muted/20 flex items-center justify-center mr-1.5 mt-0.5 flex-shrink-0"
                aria-hidden="true"
              >
                <span className="text-[10px]">&#x1F393;</span>
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
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
            <div className="flex items-center gap-1.5 animate-fade-in">
              <div
                className="w-6 h-6 rounded-full bg-gradient-to-br from-accent/20 to-accent-muted/20 flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <span className="text-[10px]">&#x1F393;</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-surface-2 rounded-bl-md">
                <div className="flex space-x-1" aria-hidden="true">
                  <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-[10px] text-text-tertiary">
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
            <p className="text-xs text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-[10px] text-text-tertiary hover:text-text-secondary mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Completion */}
        {isComplete && (
          <div className="animate-slide-up text-center py-4">
            <div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-400/20 flex items-center justify-center mx-auto mb-3"
              aria-hidden="true"
            >
              <span className="text-2xl">&#x1F389;</span>
            </div>
            <h2 className="text-base font-semibold text-text-primary mb-1">
              All done, {learnerName}!
            </h2>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              Thanks for sharing what you know. Your instructor will use this to
              plan a session that&apos;s right for you.
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isComplete && (
        <div className="border-t border-border-subtle p-2.5">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                messages.length === 0
                  ? "Say hi to get started..."
                  : "Just tell me what you know..."
              }
              aria-label="Type your response"
              disabled={isLoading}
              className="flex-1 rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent disabled:opacity-50 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg
                className="w-3.5 h-3.5"
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
        </div>
      )}
    </div>
  );
}
