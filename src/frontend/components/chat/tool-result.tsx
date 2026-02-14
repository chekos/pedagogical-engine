"use client";

import { useState, memo } from "react";
import dynamic from "next/dynamic";
import type { ToolUse } from "@/lib/api";
import LessonPlanView from "@/components/lesson-plan/lesson-plan-view";
import GroupDashboard from "@/components/visualizations/group-dashboard";
import AskUserQuestionCard from "./ask-user-question-card";
import { getGroupDashboardData, getLiveGraphData, getLiveGraphDataWithGroupOverlay } from "@/lib/demo-data";

// Dynamic import for ReactFlow component (client-side only)
const LiveDependencyGraph = dynamic(
  () => import("@/components/visualizations/live-dependency-graph"),
  { ssr: false }
);

// Map tool names to human-friendly labels and Bloom-level top border colors
// Colors correspond to Bloom's taxonomy levels by tool category:
//   remember (data loading) → understand (querying) → apply (assessment) → analyze (group) → evaluate (audit) → create (compose)
const TOOL_META: Record<string, { label: string; bloomColor: string }> = {
  "mcp__pedagogy__load_roster": { label: "Loading Roster", bloomColor: "var(--bloom-remember)" },
  "mcp__pedagogy__query_skill_graph": { label: "Querying Skill Graph", bloomColor: "var(--bloom-understand)" },
  "mcp__pedagogy__assess_learner": { label: "Assessing Learner", bloomColor: "var(--bloom-apply)" },
  "mcp__pedagogy__generate_assessment_link": { label: "Creating Assessment Link", bloomColor: "var(--bloom-apply)" },
  "mcp__pedagogy__check_assessment_status": { label: "Checking Assessment Status", bloomColor: "var(--bloom-understand)" },
  "mcp__pedagogy__query_group": { label: "Analyzing Group", bloomColor: "var(--bloom-analyze)" },
  "mcp__pedagogy__audit_prerequisites": { label: "Auditing Prerequisites", bloomColor: "var(--bloom-evaluate)" },
  "mcp__pedagogy__compose_lesson_plan": { label: "Composing Lesson Plan", bloomColor: "var(--bloom-create)" },
  "Read": { label: "Reading File", bloomColor: "var(--bloom-remember)" },
  "Write": { label: "Writing File", bloomColor: "var(--bloom-remember)" },
  "Glob": { label: "Searching Files", bloomColor: "var(--bloom-remember)" },
  "Skill": { label: "Loading Skill", bloomColor: "var(--bloom-understand)" },
  "Task": { label: "Running Subagent", bloomColor: "var(--bloom-create)" },
  "AskUserQuestion": { label: "Question for You", bloomColor: "var(--accent)" },
};

/** Strip MCP prefix and convert snake_case to Title Case */
function humanizeToolName(rawName: string): string {
  const stripped = rawName.replace(/^mcp__pedagogy__/, "");
  return stripped
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Assign Bloom color by verb prefix */
function categorizeTool(name: string): string {
  const stripped = name.replace(/^mcp__pedagogy__/, "");
  if (stripped.startsWith("load_") || stripped.startsWith("query_") || stripped.startsWith("check_"))
    return "var(--bloom-understand)";
  if (stripped.startsWith("analyze_"))
    return "var(--bloom-analyze)";
  if (stripped.startsWith("compose_") || stripped.startsWith("create_") || stripped.startsWith("store_") ||
      stripped.startsWith("update_") || stripped.startsWith("add_"))
    return "var(--bloom-create)";
  if (stripped.startsWith("simulate_") || stripped.startsWith("audit_") || stripped.startsWith("explain_"))
    return "var(--bloom-evaluate)";
  if (stripped.startsWith("process_") || stripped.startsWith("advance_") || stripped.startsWith("report_") ||
      stripped.startsWith("assess_") || stripped.startsWith("generate_"))
    return "var(--bloom-apply)";
  return "var(--bloom-remember)";
}

function getToolMeta(name: string): { label: string; bloomColor: string } {
  if (TOOL_META[name]) return TOOL_META[name];
  if (name.startsWith("mcp__pedagogy__")) {
    return { label: humanizeToolName(name), bloomColor: categorizeTool(name) };
  }
  return { label: name, bloomColor: "var(--bloom-remember)" };
}

// Detect if tool input looks like a lesson plan
function isLessonPlanInput(tool: ToolUse): boolean {
  return tool.name === "mcp__pedagogy__compose_lesson_plan" ||
    (tool.name === "Write" && typeof tool.input.file_path === "string" && tool.input.file_path.includes("/lessons/"));
}

// Render a group summary
function GroupSummaryCard({ input }: { input: Record<string, unknown> }) {
  return (
    <div className="space-y-2">
      {"groupName" in input && input.groupName ? (
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">Group</span>
          <span className="text-sm font-medium text-text-primary">{String(input.groupName)}</span>
        </div>
      ) : null}
      {"domain" in input && input.domain ? (
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">Domain</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
            {String(input.domain).replace(/-/g, " ")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

// Render skill graph query — with live dependency visualization
function SkillGraphCard({ input }: { input: Record<string, unknown> }) {
  const showGraph = input.operation === "full_graph" || input.operation === "prerequisites" || input.operation === "infer_from";
  const learnerId = typeof input.learnerId === "string" ? input.learnerId : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {input.operation ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-purple-500/10 text-purple-400">
            {String(input.operation)}
          </span>
        ) : null}
        {input.skillId ? (
          <span className="text-sm text-text-secondary">
            Skill: <span className="font-medium text-text-primary">{String(input.skillId)}</span>
          </span>
        ) : null}
        {input.bloomLevel ? (
          <span className="text-sm text-text-secondary">
            Level: <span className="font-medium text-text-primary">{String(input.bloomLevel)}</span>
          </span>
        ) : null}
      </div>
      {input.domain ? (
        <p className="text-xs text-text-tertiary">
          Domain: {String(input.domain).replace(/-/g, " ")}
        </p>
      ) : null}
      {showGraph && (
        <LiveDependencyGraph
          data={getLiveGraphDataWithGroupOverlay(learnerId)}
          height={450}
        />
      )}
    </div>
  );
}

// Render group analysis with the full dashboard
function GroupAnalysisCard({ input }: { input: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      {"groupName" in input && input.groupName ? (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">Group</span>
          <span className="text-sm font-medium text-text-primary">{String(input.groupName)}</span>
        </div>
      ) : null}
      <GroupDashboard data={getGroupDashboardData()} />
    </div>
  );
}

// Render assessment status with live dependency graph
function AssessmentStatusCard({ input }: { input: Record<string, unknown> }) {
  const targetSkills = Array.isArray(input.targetSkills) ? input.targetSkills : [];
  const learnerId = typeof input.learnerId === "string" ? input.learnerId : undefined;
  const showGraph = !!learnerId;

  return (
    <div className="space-y-3">
      {input.learnerId ? (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm text-text-primary">{String(input.learnerId)}</span>
        </div>
      ) : null}
      {targetSkills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {targetSkills.map((skill: unknown, i: number) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-surface-3 text-text-secondary"
            >
              {String(skill)}
            </span>
          ))}
        </div>
      ) : null}
      {showGraph && (
        <LiveDependencyGraph
          data={getLiveGraphData(learnerId)}
          height={400}
        />
      )}
    </div>
  );
}

// Detect if tool input looks like an AskUserQuestion
function isAskUserQuestion(tool: ToolUse): boolean {
  return tool.name === "AskUserQuestion" && Array.isArray(tool.input.questions);
}

interface ToolResultProps {
  tool: ToolUse;
  isActive?: boolean;
  onSendMessage?: (message: string) => void;
  creativeLabels?: Record<string, string>;
}

export default memo(function ToolResult({ tool, isActive = false, onSendMessage, creativeLabels }: ToolResultProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = getToolMeta(tool.name);
  // Use creative AI label if available, otherwise deterministic
  const displayLabel = creativeLabels?.[tool.name] || meta.label;

  // Special rendering for AskUserQuestion — always shown inline, not collapsible
  if (isAskUserQuestion(tool) && onSendMessage) {
    return (
      <AskUserQuestionCard
        questions={tool.input.questions as Array<{
          question: string;
          header?: string;
          options: Array<{ label: string; description?: string }>;
          multiSelect?: boolean;
        }>}
        onSubmit={onSendMessage}
      />
    );
  }

  // Special rendering for lesson plan composition
  if (isLessonPlanInput(tool) && (tool.input.planContent || tool.input.content)) {
    // Derive lessonId from file_path if available (e.g. data/lessons/2026-02-12-foo.md → 2026-02-12-foo)
    let lessonId: string | undefined;
    if (typeof tool.input.file_path === "string") {
      const match = tool.input.file_path.match(/lessons\/(.+?)\.md$/);
      if (match) lessonId = match[1];
    } else if (typeof tool.input.filename === "string") {
      lessonId = tool.input.filename.replace(/\.md$/, "");
    }
    return (
      <LessonPlanView
        content={String(tool.input.planContent || tool.input.content)}
        lessonId={lessonId}
      />
    );
  }

  return (
    <div
      className="animate-slide-up rounded-xl bg-surface-1 overflow-hidden border border-border-subtle"
      style={{ borderTopWidth: "3px", borderTopColor: meta.bloomColor }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-surface-2/50 transition-colors"
      >
        <span className="text-sm font-medium text-text-primary flex-1 text-left">
          {displayLabel}
          {isActive && (
            <span className="ml-2 inline-flex">
              <span className="animate-pulse-subtle text-xs text-text-tertiary">working...</span>
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-text-tertiary transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-border-subtle">
          <div className="pt-3">
            {/* Rich rendering based on tool type */}
            {tool.name === "mcp__pedagogy__query_group" ? (
              <GroupAnalysisCard input={tool.input} />
            ) : tool.name === "mcp__pedagogy__load_roster" ? (
              <GroupSummaryCard input={tool.input} />
            ) : tool.name === "mcp__pedagogy__query_skill_graph" ? (
              <SkillGraphCard input={tool.input} />
            ) : tool.name === "mcp__pedagogy__generate_assessment_link" || tool.name === "mcp__pedagogy__assess_learner" ? (
              <AssessmentStatusCard input={tool.input} />
            ) : (
              <pre className="text-xs font-mono overflow-x-auto text-text-secondary leading-relaxed">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
})

// Compact tool activity indicator shown while tools are running
export function ToolActivityIndicator({ tools, creativeLabels }: { tools: ToolUse[]; creativeLabels?: Record<string, string> }) {
  if (tools.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-fade-in">
      <div className="flex space-x-1">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-text-tertiary">
        {tools.map((t) => creativeLabels?.[t.name] || getToolMeta(t.name).label).join(", ")}
      </span>
    </div>
  );
}
