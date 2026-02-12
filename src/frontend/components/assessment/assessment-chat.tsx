"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendAssessmentMessage } from "@/lib/api";

interface AssessmentMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface AssessmentChatProps {
  code: string;
  learnerName: string;
}

export default function AssessmentChat({ code, learnerName }: AssessmentChatProps) {
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

        const assistantMessages: AssessmentMessage[] = res.messages.map((m, i) => ({
          id: `init-${i}`,
          role: "assistant" as const,
          text: m.text,
        }));

        setMessages(assistantMessages);

        if (res.result?.subtype === "success") {
          setIsComplete(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start assessment");
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

      const assistantMessages: AssessmentMessage[] = res.messages.map((m, i) => ({
        id: `resp-${Date.now()}-${i}`,
        role: "assistant" as const,
        text: m.text,
      }));

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

  const progress = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex flex-col h-screen bg-surface-0">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary">Skill Assessment</h1>
            <p className="text-xs text-text-tertiary">{learnerName} &middot; {code}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Complete
            </span>
          ) : (
            <span className="text-xs text-text-tertiary">
              {progress} response{progress !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
          <div className="flex items-center gap-2 px-4 py-2 animate-fade-in">
            <div className="flex space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-text-tertiary">Evaluating...</span>
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

        {isComplete && (
          <div className="text-center py-8 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-1">Assessment Complete</h2>
            <p className="text-sm text-text-secondary">
              Thanks, {learnerName}! Your results have been recorded.
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
              placeholder="Type your answer..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent disabled:opacity-50 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
