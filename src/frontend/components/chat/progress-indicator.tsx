"use client";

import { useEffect, useState } from "react";
import type { ToolUse } from "@/lib/api";

// Map tool names to stage-aware human-readable labels
const STAGE_LABELS: Record<string, string> = {
  "mcp__pedagogy__load_roster": "Loading roster",
  "mcp__pedagogy__query_skill_graph": "Querying skill graph",
  "mcp__pedagogy__assess_learner": "Assessing learner",
  "mcp__pedagogy__generate_assessment_link": "Creating assessment link",
  "mcp__pedagogy__check_assessment_status": "Checking assessment status",
  "mcp__pedagogy__query_group": "Analyzing group",
  "mcp__pedagogy__audit_prerequisites": "Auditing prerequisites",
  "mcp__pedagogy__compose_lesson_plan": "Composing lesson plan",
  Read: "Reading file",
  Write: "Writing file",
  Glob: "Searching files",
  Skill: "Loading skill",
  Task: "Running subagent",
};

function getStageLabel(tools: ToolUse[]): string {
  if (tools.length === 0) return "Thinking";

  const latest = tools[tools.length - 1];
  return STAGE_LABELS[latest.name] || `Running ${latest.name}`;
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

    setElapsed(Date.now() - startedAt);

    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const label = getStageLabel(activeTools);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 animate-fade-in">
      {/* Bloom-colored cycling dots */}
      <div className="flex items-center gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full animate-bloom-cycle"
          style={{ animationDelay: "0s", backgroundColor: "currentColor" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full animate-bloom-cycle"
          style={{ animationDelay: "0.5s", backgroundColor: "currentColor" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full animate-bloom-cycle"
          style={{ animationDelay: "1s", backgroundColor: "currentColor" }}
        />
      </div>

      {/* Label and elapsed time */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-text-secondary truncate">
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
