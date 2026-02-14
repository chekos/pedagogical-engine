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
  loadingDurationSec: number;
  isComplete: boolean;
  progress: { covered: number; total: number; percent: number };
  error: string | null;
  setError: (error: string | null) => void;
  sendMessage: () => Promise<void>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  coveredSkillIds: Set<string>;
  coveredSkillLabels: Map<string, string>;
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
  const [loadingDurationSec, setLoadingDurationSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [coveredSkillIds, setCoveredSkillIds] = useState<Set<string>>(new Set());
  const [coveredSkillLabels, setCoveredSkillLabels] = useState<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasStarted = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Tick loading duration counter
  useEffect(() => {
    if (!isLoading) {
      setLoadingDurationSec(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Merge covered skills from a response into accumulated state
  const mergeCoveredSkills = useCallback(
    (skills?: Array<{ skillId: string; skillLabel: string }>) => {
      if (!skills || skills.length === 0) return;
      setCoveredSkillIds((prev) => {
        const next = new Set(prev);
        for (const s of skills) next.add(s.skillId);
        return next;
      });
      setCoveredSkillLabels((prev) => {
        const next = new Map(prev);
        for (const s of skills) next.set(s.skillId, s.skillLabel);
        return next;
      });
    },
    []
  );

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
        mergeCoveredSkills(res.coveredSkills);

        if (res.assessmentComplete === true) {
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
  }, [code, learnerName, autoStartMessage, mergeCoveredSkills]);

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
      mergeCoveredSkills(res.coveredSkills);

      if (res.assessmentComplete === true) {
        setIsComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, isComplete, code, learnerName, mergeCoveredSkills]);

  // Use real tracked skills when available, fall back to message-count estimate
  const progress =
    coveredSkillIds.size > 0
      ? {
          covered: coveredSkillIds.size,
          total: Math.max(coveredSkillIds.size, 6),
          percent: Math.round(
            (coveredSkillIds.size / Math.max(coveredSkillIds.size, 6)) * 100
          ),
        }
      : estimateProgress(messages);

  return {
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
    coveredSkillIds,
    coveredSkillLabels,
  };
}
