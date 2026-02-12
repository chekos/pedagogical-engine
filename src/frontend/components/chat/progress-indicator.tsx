"use client";

import { useEffect, useState } from "react";
import type { ToolUse } from "@/lib/api";

// Map tool names to stage-aware human-readable labels
const STAGE_LABELS: Record<string, string> = {
  "mcp__pedagogy__load_roster": "Loading roster...",
  "mcp__pedagogy__query_skill_graph": "Querying skill graph...",
  "mcp__pedagogy__assess_learner": "Assessing learner...",
  "mcp__pedagogy__generate_assessment_link": "Creating assessment link...",
  "mcp__pedagogy__check_assessment_status": "Checking assessment status...",
  "mcp__pedagogy__query_group": "Analyzing group...",
  "mcp__pedagogy__audit_prerequisites": "Auditing prerequisites...",
  "mcp__pedagogy__compose_lesson_plan": "Composing lesson plan...",
  Read: "Reading file...",
  Write: "Writing file...",
  Glob: "Searching files...",
  Skill: "Loading skill...",
  Task: "Running subagent...",
};

function getStageLabel(tools: ToolUse[]): string {
  if (tools.length === 0) return "Thinking...";

  // Use the most recent tool (last in the array) for the label
  const latest = tools[tools.length - 1];
  return STAGE_LABELS[latest.name] || `Running ${latest.name}...`;
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

interface ProgressIndicatorProps {
  activeTools: ToolUse[];
  startedAt: number | null;
}

export default function ProgressIndicator({ activeTools, startedAt }: ProgressIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }

    // Set initial elapsed immediately
    setElapsed(Date.now() - startedAt);

    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const label = getStageLabel(activeTools);
  const hasTools = activeTools.length > 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 animate-fade-in">
      {/* Spinner */}
      <div className="relative flex-shrink-0 w-5 h-5">
        <svg
          className="w-5 h-5 animate-spin"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="10"
            cy="10"
            r="8"
            stroke="currentColor"
            strokeWidth="2"
            className="text-surface-3"
          />
          <path
            d="M10 2a8 8 0 0 1 8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={hasTools ? "text-accent" : "text-text-tertiary"}
          />
        </svg>
      </div>

      {/* Label and elapsed time */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`text-sm font-medium truncate ${
            hasTools ? "text-text-secondary" : "text-text-tertiary"
          }`}
        >
          {label}
        </span>
        {elapsed >= 3000 && (
          <span className="text-xs text-text-tertiary tabular-nums flex-shrink-0 animate-fade-in">
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>
    </div>
  );
}
