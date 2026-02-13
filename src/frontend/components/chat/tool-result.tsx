"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { ToolUse } from "@/lib/api";
import LessonPlanView from "@/components/lesson-plan/lesson-plan-view";
import GroupDashboard from "@/components/visualizations/group-dashboard";
import AskUserQuestionCard from "./ask-user-question-card";
import { getSkillGraphData, getGroupDashboardData, getLiveGraphData, getLiveGraphDataWithGroupOverlay } from "@/lib/demo-data";

// Dynamic imports for ReactFlow components (client-side only)
const SkillDependencyGraph = dynamic(
  () => import("@/components/visualizations/skill-dependency-graph"),
  { ssr: false }
);

const LiveDependencyGraph = dynamic(
  () => import("@/components/visualizations/live-dependency-graph"),
  { ssr: false }
);

// Map tool names to human-friendly labels and icons
const TOOL_META: Record<string, { label: string; icon: string; color: string }> = {
  "mcp__pedagogy__load_roster": { label: "Loading Roster", icon: "👥", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "mcp__pedagogy__query_skill_graph": { label: "Querying Skill Graph", icon: "🔗", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  "mcp__pedagogy__assess_learner": { label: "Assessing Learner", icon: "📝", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  "mcp__pedagogy__generate_assessment_link": { label: "Creating Assessment Link", icon: "🔗", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  "mcp__pedagogy__check_assessment_status": { label: "Checking Assessment Status", icon: "📊", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  "mcp__pedagogy__query_group": { label: "Analyzing Group", icon: "📈", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  "mcp__pedagogy__audit_prerequisites": { label: "Auditing Prerequisites", icon: "✅", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  "mcp__pedagogy__compose_lesson_plan": { label: "Composing Lesson Plan", icon: "📋", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "Read": { label: "Reading File", icon: "📄", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  "Write": { label: "Writing File", icon: "💾", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  "Glob": { label: "Searching Files", icon: "🔍", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  "Skill": { label: "Loading Skill", icon: "🧠", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  "Task": { label: "Running Subagent", icon: "🤖", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  "AskUserQuestion": { label: "Question for You", icon: "❓", color: "bg-accent/10 text-accent border-accent/20" },
};

function getToolMeta(name: string) {
  return TOOL_META[name] || { label: name, icon: "⚙️", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
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
}

export default function ToolResult({ tool, isActive = false, onSendMessage }: ToolResultProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = getToolMeta(tool.name);

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
    return <LessonPlanView content={String(tool.input.planContent || tool.input.content)} />;
  }

  return (
    <div className={`animate-fade-in rounded-xl border ${meta.color} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
      >
        <span className="text-base">{meta.icon}</span>
        <span className="text-sm font-medium flex-1 text-left">
          {meta.label}
          {isActive && (
            <span className="ml-2 inline-flex">
              <span className="animate-pulse-subtle text-xs">working...</span>
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-current/10">
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
}

// Compact tool activity indicator shown while tools are running
export function ToolActivityIndicator({ tools }: { tools: ToolUse[] }) {
  if (tools.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-fade-in">
      <div className="flex space-x-1">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-text-tertiary">
        {tools.map((t) => getToolMeta(t.name).label).join(", ")}
      </span>
    </div>
  );
}
