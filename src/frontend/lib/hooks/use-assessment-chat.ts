"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendAssessmentMessage } from "@/lib/api";

export interface AssessmentMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface UseAssessmentChatOptions {
  code: string;
  learnerName: string;
  autoStartMessage?: string;
}

export interface UseAssessmentChatReturn {
  messages: AssessmentMessage[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isComplete: boolean;
  progress: { covered: number; total: number; percent: number };
  error: string | null;
  setError: (error: string | null) => void;
  sendMessage: () => Promise<void>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function estimateProgress(messages: AssessmentMessage[]): {
  covered: number;
  total: number;
  percent: number;
} {
  const userMsgs = messages.filter((m) => m.role === "user");
  const total = 6;
  const exchanges = userMsgs.length;
  const covered = Math.min(Math.floor(exchanges / 2), total);
  const percent = total > 0 ? Math.round((covered / total) * 100) : 0;
  return { covered, total, percent };
}

export function useAssessmentChat({
  code,
  learnerName,
  autoStartMessage,
}: UseAssessmentChatOptions): UseAssessmentChatReturn {
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

  // Auto-start assessment on mount
  useEffect(() => {
    if (hasStarted.current || !autoStartMessage) return;
    hasStarted.current = true;

    async function start() {
      setIsLoading(true);
      try {
        const res = await sendAssessmentMessage(
          code,
          learnerName,
          autoStartMessage!
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
  }, [code, learnerName, autoStartMessage]);

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

  const progress = estimateProgress(messages);

  return {
    messages,
    input,
    setInput,
    isLoading,
    isComplete,
    progress,
    error,
    setError,
    sendMessage,
    messagesEndRef,
    inputRef,
  };
}
