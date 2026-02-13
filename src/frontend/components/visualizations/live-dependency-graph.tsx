"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  type NodeProps,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  Controls,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BLOOM_COLORS } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────────────

interface Skill {
  id: string;
  label: string;
  bloom_level: string;
  assessable: boolean;
  dependencies: string[];
}

interface DependencyEdge {
  source: string;
  target: string;
  confidence: number;
  type: string;
}

export type NodeState = "unknown" | "assessed-confirmed" | "assessed-gap" | "inferred";

export interface SkillNodeStatus {
  state: NodeState;
  confidence: number;
  bloom_demonstrated?: string;
  cascadeOrder?: number; // for cascade animation timing
}

export interface LearnerOverlay {
  id: string;
  name: string;
  statuses: Record<string, SkillNodeStatus>;
}

export interface LiveGraphData {
  skills: Skill[];
  edges: DependencyEdge[];
  learnerStatuses?: Record<string, SkillNodeStatus>;
  learnerName?: string;
  groupOverlays?: LearnerOverlay[];
  showGroupOverlay?: boolean;
}

type LiveSkillNodeData = {
  skillId: string;
  label: string;
  bloomLevel: string;
  status: SkillNodeStatus | undefined;
  shortLabel: string;
  scale: number;
  onNodeClick: (skillId: string) => void;
  groupCounts?: { confirmed: number; gap: number; inferred: number; unknown: number; total: number };
  showGroupOverlay: boolean;
};

type EdgeData = {
  sourceId: string;
  targetId: string;
  confidence: number;
  edgeType: string;
};

type LiveSkillNode = Node<LiveSkillNodeData, "liveSkill">;
type LiveEdge = Edge<EdgeData>;

// ─── Constants ──────────────────────────────────────────────────

const BLOOM_LEVELS = [
  "knowledge",
  "comprehension",
  "application",
  "analysis",
  "synthesis",
  "evaluation",
];

const BLOOM_LABELS: Record<string, string> = {
  knowledge: "Remember",
  comprehension: "Understand",
  application: "Apply",
  analysis: "Analyze",
  synthesis: "Create",
  evaluation: "Evaluate",
};

// Node size multiplier by Bloom's level (higher = larger)
const BLOOM_SIZE_SCALE: Record<string, number> = {
  knowledge: 0.85,
  comprehension: 0.9,
  application: 1.0,
  analysis: 1.1,
  synthesis: 1.2,
  evaluation: 1.25,
};

// ─── Node Styling by State ──────────────────────────────────────

function getNodeStyle(status: SkillNodeStatus | undefined, bloomLevel: string) {
  const bloomColor = BLOOM_COLORS[bloomLevel] || "#64748b";

  if (!status || status.state === "unknown") {
    return {
      background: "rgba(20, 20, 28, 0.9)",
      border: "2px solid rgba(75, 85, 99, 0.3)",
      color: "#6b7280",
      glow: "none",
      className: "",
    };
  }

  if (status.state === "assessed-confirmed") {
    const opacity = Math.max(0.4, status.confidence);
    return {
      background: `rgba(34, 197, 94, ${opacity * 0.12})`,
      border: `2px solid rgba(34, 197, 94, ${Math.max(0.5, opacity)})`,
      color: "#f3f4f6",
      glow: `0 0 ${10 + status.confidence * 14}px rgba(34, 197, 94, ${opacity * 0.35}), inset 0 0 ${6 + status.confidence * 6}px rgba(34, 197, 94, ${opacity * 0.08})`,
      className: "",
    };
  }

  if (status.state === "assessed-gap") {
    const opacity = Math.max(0.4, 1 - status.confidence);
    return {
      background: `rgba(239, 68, 68, ${opacity * 0.12})`,
      border: `2px solid rgba(239, 68, 68, ${Math.max(0.5, opacity)})`,
      color: "#f3f4f6",
      glow: `0 0 ${8 + opacity * 10}px rgba(239, 68, 68, ${opacity * 0.3})`,
      className: "",
    };
  }

  // inferred — blue pulsing
  const opacity = Math.max(0.3, status.confidence);
  const isCascading = status.cascadeOrder !== undefined && status.cascadeOrder >= 0;
  return {
    background: `rgba(96, 165, 250, ${opacity * 0.1})`,
    border: `2px solid rgba(96, 165, 250, ${Math.max(0.4, opacity * 0.7)})`,
    color: "#e5e7eb",
    glow: `0 0 ${8 + status.confidence * 12}px rgba(96, 165, 250, ${opacity * 0.3})`,
    className: isCascading ? "node-cascade-enter" : "node-inferred",
  };
}

// ─── Custom Skill Node ──────────────────────────────────────────

function LiveSkillNodeComponent({ data }: NodeProps<LiveSkillNode>) {
  const {
    label,
    bloomLevel,
    status,
    shortLabel,
    scale,
    onNodeClick,
    groupCounts,
    showGroupOverlay,
  } = data;

  const style = getNodeStyle(status, bloomLevel);
  const bloomColor = BLOOM_COLORS[bloomLevel] || "#64748b";
  const confidence = status?.confidence;
  const hasStatus = status && status.state !== "unknown";
  const cascadeDelay = status?.cascadeOrder !== undefined ? `${status.cascadeOrder * 150}ms` : "0ms";

  const baseWidth = 140;
  const width = baseWidth * scale;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-2 !h-2"
      />
      <div
        className={`relative rounded-xl cursor-pointer group transition-all duration-500 ${style.className}`}
        style={{
          background: style.background,
          border: style.border,
          boxShadow: style.glow,
          backdropFilter: "blur(8px)",
          width: `${width}px`,
          padding: `${8 * scale}px ${12 * scale}px`,
          animationDelay: cascadeDelay,
        }}
        onClick={() => onNodeClick(data.skillId)}
      >
        {/* Bloom level color strip on left */}
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
          style={{
            background: bloomColor,
            opacity: hasStatus ? 0.8 : 0.3,
            boxShadow: hasStatus ? `0 0 4px ${bloomColor}80` : "none",
          }}
        />

        {/* Group overlay pie indicator */}
        {showGroupOverlay && groupCounts && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full overflow-hidden border border-white/10"
            style={{ background: "#0c0c16" }}>
            <svg viewBox="0 0 20 20" className="w-full h-full">
              {(() => {
                const total = groupCounts.total || 1;
                const slices = [
                  { count: groupCounts.confirmed, color: "rgba(34, 197, 94, 0.8)" },
                  { count: groupCounts.inferred, color: "rgba(96, 165, 250, 0.8)" },
                  { count: groupCounts.gap, color: "rgba(239, 68, 68, 0.8)" },
                  { count: groupCounts.unknown, color: "rgba(75, 85, 99, 0.5)" },
                ];
                let cumAngle = 0;
                return slices.map((slice, i) => {
                  if (slice.count === 0) return null;
                  const angle = (slice.count / total) * 360;
                  const startAngle = cumAngle;
                  cumAngle += angle;
                  const start = polarToCartesian(10, 10, 10, startAngle);
                  const end = polarToCartesian(10, 10, 10, startAngle + angle);
                  const largeArc = angle > 180 ? 1 : 0;
                  const d = `M 10 10 L ${start.x} ${start.y} A 10 10 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
                  return <path key={i} d={d} fill={slice.color} />;
                });
              })()}
            </svg>
          </div>
        )}

        {/* Confidence bar at bottom */}
        {confidence !== undefined && confidence > 0 && (
          <div className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full overflow-hidden bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${confidence * 100}%`,
                background:
                  status?.state === "assessed-confirmed"
                    ? "linear-gradient(90deg, rgba(34, 197, 94, 0.6), rgba(34, 197, 94, 0.9))"
                    : status?.state === "assessed-gap"
                    ? "linear-gradient(90deg, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.7))"
                    : "linear-gradient(90deg, rgba(96, 165, 250, 0.4), rgba(96, 165, 250, 0.7))",
              }}
            />
          </div>
        )}

        {/* Label */}
        <p
          className="font-medium leading-snug pl-2"
          style={{
            color: style.color,
            fontSize: `${Math.max(9, 11 * scale)}px`,
          }}
          title={label}
        >
          {shortLabel}
        </p>

        {/* Confidence + state badge */}
        {hasStatus && (
          <div className="flex items-center gap-1.5 pl-2 mt-0.5">
            <span
              className="font-mono"
              style={{ color: style.color, opacity: 0.6, fontSize: `${Math.max(7, 9 * scale)}px` }}
            >
              {Math.round((confidence || 0) * 100)}%
            </span>
            {status.state === "inferred" && (
              <span className="text-blue-400/60" style={{ fontSize: `${Math.max(6, 8 * scale)}px` }}>
                inferred
              </span>
            )}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-2 !h-2"
      />
    </>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const nodeTypes = { liveSkill: LiveSkillNodeComponent } satisfies NodeTypes;

// ─── DAG Layout ─────────────────────────────────────────────────

function calculateLayout(
  skills: Skill[],
  graphEdges: DependencyEdge[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const inDegree: Record<string, number> = {};
  const children: Record<string, string[]> = {};
  const parents: Record<string, string[]> = {};

  for (const s of skills) {
    inDegree[s.id] = 0;
    children[s.id] = [];
    parents[s.id] = [];
  }
  for (const e of graphEdges) {
    inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    children[e.source] = children[e.source] || [];
    children[e.source].push(e.target);
    parents[e.target] = parents[e.target] || [];
    parents[e.target].push(e.source);
  }

  // Compute topological depth (longest path from any root)
  const depth: Record<string, number> = {};
  const queue: string[] = [];
  const inDeg = { ...inDegree };

  for (const s of skills) {
    if (inDeg[s.id] === 0) {
      depth[s.id] = 0;
      queue.push(s.id);
    }
  }

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) break;
    for (const child of children[node] || []) {
      depth[child] = Math.max(depth[child] || 0, depth[node] + 1);
      inDeg[child]--;
      if (inDeg[child] === 0) {
        queue.push(child);
      }
    }
  }

  const maxDepth = Math.max(...Object.values(depth), 0);
  const byDepth: Record<number, Skill[]> = {};
  for (const s of skills) {
    const d = depth[s.id] ?? 0;
    if (!byDepth[d]) byDepth[d] = [];
    byDepth[d].push(s);
  }

  const nodeX: Record<string, number> = {};
  const COL_WIDTH = 200;
  const ROW_HEIGHT = 115;

  for (let d = 0; d <= maxDepth; d++) {
    const group = byDepth[d] || [];
    if (d > 0) {
      // Precompute average parent X to avoid O(n^2) in sort comparator
      const avgParentX = new Map<string, number>();
      for (const skill of group) {
        const parentList = parents[skill.id] || [];
        const avg = parentList.length > 0
          ? parentList.reduce((sum, p) => sum + (nodeX[p] || 0), 0) / parentList.length
          : 0;
        avgParentX.set(skill.id, avg);
      }
      group.sort((a, b) => (avgParentX.get(a.id) || 0) - (avgParentX.get(b.id) || 0));
    }

    const totalWidth = group.length * COL_WIDTH;
    const startX = -totalWidth / 2 + COL_WIDTH / 2;

    group.forEach((skill, i) => {
      const x = startX + i * COL_WIDTH;
      nodeX[skill.id] = x;
      positions[skill.id] = { x, y: d * ROW_HEIGHT };
    });
  }

  return positions;
}

// ─── Inference Cascade Logic ────────────────────────────────────

function computeInferenceCascade(
  skillId: string,
  skills: Skill[],
  edges: DependencyEdge[],
  currentStatuses: Record<string, SkillNodeStatus>
): Record<string, SkillNodeStatus> {
  // Build reverse adjacency: for a given target, find its prerequisite sources
  const prereqs: Record<string, { source: string; confidence: number }[]> = {};
  for (const e of edges) {
    if (!prereqs[e.target]) prereqs[e.target] = [];
    prereqs[e.target].push({ source: e.source, confidence: e.confidence });
  }

  // BFS downward from the assessed skill to find all prerequisites
  const visited = new Set<string>();
  const cascadeQueue: { id: string; depth: number; parentConfidence: number }[] = [];
  const result: Record<string, SkillNodeStatus> = {};

  // Start from the prerequisites of the assessed skill
  for (const prereq of prereqs[skillId] || []) {
    if (
      currentStatuses[prereq.source]?.state !== "assessed-confirmed" &&
      currentStatuses[prereq.source]?.state !== "assessed-gap"
    ) {
      cascadeQueue.push({
        id: prereq.source,
        depth: 1,
        parentConfidence: prereq.confidence,
      });
    }
  }

  while (cascadeQueue.length > 0) {
    const item = cascadeQueue.shift();
    if (!item) break;
    const { id, depth, parentConfidence } = item;
    if (visited.has(id)) continue;
    visited.add(id);

    // Skip already-assessed skills
    const existing = currentStatuses[id];
    if (
      existing?.state === "assessed-confirmed" ||
      existing?.state === "assessed-gap"
    ) {
      continue;
    }

    // Inferred confidence degrades with depth
    const inferredConfidence = Math.max(0.3, parentConfidence * 0.85);

    result[id] = {
      state: "inferred",
      confidence: inferredConfidence,
      cascadeOrder: depth,
    };

    // Continue cascading to prerequisites of this skill
    for (const prereq of prereqs[id] || []) {
      if (!visited.has(prereq.source)) {
        cascadeQueue.push({
          id: prereq.source,
          depth: depth + 1,
          parentConfidence: inferredConfidence * prereq.confidence,
        });
      }
    }
  }

  return result;
}

// ─── Skill Detail Panel ─────────────────────────────────────────

interface SkillDetailPanelProps {
  skill: Skill;
  status: SkillNodeStatus | undefined;
  learnerName?: string;
  groupOverlays?: LearnerOverlay[];
  onClose: () => void;
}

function SkillDetailPanel({ skill, status, learnerName, groupOverlays, onClose }: SkillDetailPanelProps) {
  const bloomColor = BLOOM_COLORS[skill.bloom_level] || "#64748b";

  return (
    <div className="absolute right-4 top-4 w-80 max-h-[calc(100%-32px)] overflow-y-auto z-50 bg-[#0c0c16]/98 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl animate-slide-up">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
      >
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="p-5">
        {/* Skill name + Bloom's badge */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
            style={{ background: bloomColor, boxShadow: `0 0 8px ${bloomColor}60` }}
          />
          <div>
            <h3 className="text-sm font-semibold text-white leading-snug">{skill.label}</h3>
            <span
              className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium"
              style={{
                background: `${bloomColor}15`,
                color: bloomColor,
                border: `1px solid ${bloomColor}30`,
              }}
            >
              {BLOOM_LABELS[skill.bloom_level] || skill.bloom_level}
            </span>
          </div>
        </div>

        {/* Status for selected learner */}
        {learnerName && status && (
          <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600 font-semibold mb-2">
              {learnerName}
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                  status.state === "assessed-confirmed"
                    ? "bg-green-500/15 text-green-400 border border-green-500/20"
                    : status.state === "assessed-gap"
                    ? "bg-red-500/15 text-red-400 border border-red-500/20"
                    : status.state === "inferred"
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                    : "bg-gray-500/15 text-gray-400 border border-gray-500/20"
                }`}
              >
                {status.state === "assessed-confirmed"
                  ? "Confirmed"
                  : status.state === "assessed-gap"
                  ? "Gap"
                  : status.state === "inferred"
                  ? "Inferred"
                  : "Unknown"}
              </span>
              {status.state !== "unknown" && (
                <span className="text-xs font-mono text-gray-400">
                  {Math.round(status.confidence * 100)}% confidence
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {skill.dependencies.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600 font-semibold mb-2">
              Prerequisites ({skill.dependencies.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {skill.dependencies.map((dep) => (
                <span
                  key={dep}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-white/[0.03] text-gray-400 border border-white/[0.06]"
                >
                  {dep.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Group overlay: who has/doesn't have this skill */}
        {groupOverlays && groupOverlays.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600 font-semibold mb-2">
              Group Status
            </p>
            <div className="space-y-1.5">
              {groupOverlays.map((learner) => {
                const ls = learner.statuses[skill.id];
                return (
                  <div key={learner.id} className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">{learner.name}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          ls?.state === "assessed-confirmed"
                            ? "bg-green-400"
                            : ls?.state === "assessed-gap"
                            ? "bg-red-400"
                            : ls?.state === "inferred"
                            ? "bg-blue-400"
                            : "bg-gray-600"
                        }`}
                      />
                      <span className="text-[10px] font-mono text-gray-500">
                        {ls && ls.state !== "unknown"
                          ? `${Math.round(ls.confidence * 100)}%`
                          : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edge Tooltip ───────────────────────────────────────────────

interface EdgeTooltipProps {
  x: number;
  y: number;
  source: string;
  target: string;
  confidence: number;
  edgeType: string;
}

function EdgeTooltip({ x, y, source, target, confidence, edgeType }: EdgeTooltipProps) {
  return (
    <div
      className="fixed z-[100] pointer-events-none animate-fade-in"
      style={{ left: x + 12, top: y - 30 }}
    >
      <div className="bg-[#12121e] border border-white/10 rounded-xl px-3.5 py-2.5 shadow-2xl">
        <p className="text-[10px] text-gray-500 mb-1">
          <span className="text-gray-300">{source.replace(/-/g, " ")}</span>
          {" → "}
          <span className="text-gray-300">{target.replace(/-/g, " ")}</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white">
            {Math.round(confidence * 100)}% confidence
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
            {edgeType}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Inner Graph Component ──────────────────────────────────────

function GraphInner({
  data,
  onNodeClick,
  showGroupOverlay,
}: {
  data: LiveGraphData;
  onNodeClick: (skillId: string) => void;
  showGroupOverlay: boolean;
}) {
  const { fitView } = useReactFlow();
  const [edgeTooltip, setEdgeTooltip] = useState<EdgeTooltipProps | null>(null);

  const positions = useMemo(
    () => calculateLayout(data.skills, data.edges),
    [data.skills, data.edges]
  );

  // Precompute group counts per skill for overlay pie charts
  const groupCounts = useMemo(() => {
    if (!data.groupOverlays || !showGroupOverlay) return {};
    const counts: Record<
      string,
      { confirmed: number; gap: number; inferred: number; unknown: number; total: number }
    > = {};
    for (const skill of data.skills) {
      const c = { confirmed: 0, gap: 0, inferred: 0, unknown: 0, total: data.groupOverlays.length };
      for (const learner of data.groupOverlays) {
        const s = learner.statuses[skill.id];
        if (!s || s.state === "unknown") c.unknown++;
        else if (s.state === "assessed-confirmed") c.confirmed++;
        else if (s.state === "assessed-gap") c.gap++;
        else if (s.state === "inferred") c.inferred++;
      }
      counts[skill.id] = c;
    }
    return counts;
  }, [data.skills, data.groupOverlays, showGroupOverlay]);

  const initialNodes: LiveSkillNode[] = useMemo(() => {
    return data.skills.map((skill) => {
      const pos = positions[skill.id] || { x: 0, y: 0 };
      const status = data.learnerStatuses?.[skill.id];
      const scale = BLOOM_SIZE_SCALE[skill.bloom_level] || 1;

      const shortLabel = skill.label
        .replace(/^Can /, "")
        .replace(/^can /, "")
        .split(" ")
        .slice(0, 5)
        .join(" ");

      return {
        id: skill.id,
        type: "liveSkill" as const,
        position: pos,
        data: {
          skillId: skill.id,
          label: skill.label,
          bloomLevel: skill.bloom_level,
          status,
          shortLabel,
          scale,
          onNodeClick,
          groupCounts: groupCounts[skill.id],
          showGroupOverlay,
        },
      };
    });
  }, [data.skills, data.learnerStatuses, positions, onNodeClick, groupCounts, showGroupOverlay]);

  const initialEdges: LiveEdge[] = useMemo(() => {
    return data.edges.map((edge, i) => {
      const sourceStatus = data.learnerStatuses?.[edge.source];
      const targetStatus = data.learnerStatuses?.[edge.target];

      const sourceKnown = sourceStatus && sourceStatus.state !== "unknown";
      const targetKnown = targetStatus && targetStatus.state !== "unknown";
      const bothKnown = sourceKnown && targetKnown;

      // Color based on state: green for confirmed path, blue for inferred, red for gaps
      let strokeColor = "rgba(60, 60, 80, 0.12)";
      let strokeWidth = 1;
      let animated = false;

      if (bothKnown) {
        const hasGap =
          sourceStatus.state === "assessed-gap" || targetStatus.state === "assessed-gap";
        const hasInferred =
          sourceStatus.state === "inferred" || targetStatus.state === "inferred";

        if (hasGap) {
          strokeColor = "rgba(239, 68, 68, 0.3)";
          strokeWidth = 1.5;
        } else if (hasInferred) {
          strokeColor = "rgba(96, 165, 250, 0.35)";
          strokeWidth = 2;
          animated = true;
        } else {
          strokeColor = "rgba(34, 197, 94, 0.35)";
          strokeWidth = 2;
          animated = true;
        }
      } else if (sourceKnown) {
        strokeColor = "rgba(100, 120, 140, 0.15)";
      }

      return {
        id: `e-${i}`,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated,
        style: { stroke: strokeColor, strokeWidth },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: bothKnown ? strokeColor.replace(/[\d.]+\)$/, "0.5)") : "rgba(80, 80, 100, 0.2)",
          width: 10,
          height: 10,
        },
        data: {
          sourceId: edge.source,
          targetId: edge.target,
          confidence: edge.confidence,
          edgeType: edge.type,
        },
      };
    });
  }, [data.edges, data.learnerStatuses]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setTimeout(() => fitView({ padding: 0.12, duration: 600 }), 50);
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  // Stats
  const stats = useMemo(() => {
    if (!data.learnerStatuses) return null;
    const values = Object.values(data.learnerStatuses);
    return {
      confirmed: values.filter((s) => s.state === "assessed-confirmed").length,
      gap: values.filter((s) => s.state === "assessed-gap").length,
      inferred: values.filter((s) => s.state === "inferred").length,
      unknown: values.filter((s) => s.state === "unknown").length,
      total: values.length,
    };
  }, [data.learnerStatuses]);

  const handleEdgeMouseEnter = useCallback(
    (event: React.MouseEvent, edge: LiveEdge) => {
      if (!edge.data) return;
      setEdgeTooltip({
        x: event.clientX,
        y: event.clientY,
        source: edge.data.sourceId,
        target: edge.data.targetId,
        confidence: edge.data.confidence,
        edgeType: edge.data.edgeType,
      });
    },
    []
  );

  const handleEdgeMouseLeave = useCallback(() => {
    setEdgeTooltip(null);
  }, []);

  return (
    <div
      className="w-full h-full relative"
      style={{
        background:
          "linear-gradient(180deg, #06060a 0%, #0a0a12 50%, #08080e 100%)",
      }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        className="live-graph skill-graph"
        onEdgeMouseEnter={handleEdgeMouseEnter}
        onEdgeMouseLeave={handleEdgeMouseLeave}
      >
        <Controls
          showInteractive={false}
          className="!bg-[#0c0c16]/95 !border-white/[0.06] !rounded-xl"
        />

        {/* Bloom's legend */}
        <Panel position="top-left">
          <div className="bg-[#0c0c16]/95 backdrop-blur-md border border-white/[0.06] rounded-xl p-3 shadow-2xl">
            <p className="text-[9px] uppercase tracking-[0.15em] text-gray-600 font-semibold mb-2.5">
              Bloom&apos;s Taxonomy
            </p>
            <div className="space-y-1">
              {BLOOM_LEVELS.map((level) => (
                <div key={level} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-[3px] flex-shrink-0"
                    style={{
                      background: BLOOM_COLORS[level],
                      boxShadow: `0 0 4px ${BLOOM_COLORS[level]}50`,
                    }}
                  />
                  <span className="text-[10px] text-gray-500">
                    {BLOOM_LABELS[level]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Status legend */}
        <Panel position="top-right">
          <div className="bg-[#0c0c16]/95 backdrop-blur-md border border-white/[0.06] rounded-xl p-3 shadow-2xl">
            {data.learnerName && (
              <div className="mb-3 pb-2.5 border-b border-white/5">
                <p className="text-[9px] uppercase tracking-[0.15em] text-gray-600 font-semibold mb-1">
                  Learner
                </p>
                <p className="text-xs font-semibold text-white">
                  {data.learnerName}
                </p>
              </div>
            )}
            <p className="text-[9px] uppercase tracking-[0.15em] text-gray-600 font-semibold mb-2.5">
              Node Status
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-[3px] bg-green-500 flex-shrink-0"
                  style={{ boxShadow: "0 0 6px rgba(34, 197, 94, 0.4)" }}
                />
                <span className="text-[10px] text-gray-500">Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-[3px] bg-red-500 flex-shrink-0"
                  style={{ boxShadow: "0 0 6px rgba(239, 68, 68, 0.3)" }}
                />
                <span className="text-[10px] text-gray-500">Gap</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-[3px] bg-blue-400 flex-shrink-0"
                  style={{ boxShadow: "0 0 6px rgba(96, 165, 250, 0.3)" }}
                />
                <span className="text-[10px] text-gray-500">
                  Inferred
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-[3px] bg-gray-700 flex-shrink-0" />
                <span className="text-[10px] text-gray-500">Unknown</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Stats bar */}
        {stats && (
          <Panel position="bottom-center">
            <div className="bg-[#0c0c16]/95 backdrop-blur-md border border-white/[0.06] rounded-xl px-5 py-2.5 shadow-2xl flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-green-500"
                  style={{ boxShadow: "0 0 4px rgba(34, 197, 94, 0.4)" }}
                />
                <span className="text-[11px] text-gray-400">
                  <span className="font-semibold text-green-400">
                    {stats.confirmed}
                  </span>{" "}
                  confirmed
                </span>
              </div>
              <div className="w-px h-4 bg-white/5" />
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-red-500"
                  style={{ boxShadow: "0 0 4px rgba(239, 68, 68, 0.3)" }}
                />
                <span className="text-[11px] text-gray-400">
                  <span className="font-semibold text-red-400">
                    {stats.gap}
                  </span>{" "}
                  gaps
                </span>
              </div>
              <div className="w-px h-4 bg-white/5" />
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-blue-400"
                  style={{ boxShadow: "0 0 4px rgba(96, 165, 250, 0.3)" }}
                />
                <span className="text-[11px] text-gray-400">
                  <span className="font-semibold text-blue-400">
                    {stats.inferred}
                  </span>{" "}
                  inferred
                </span>
              </div>
              <div className="w-px h-4 bg-white/5" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-700" />
                <span className="text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-400">
                    {stats.unknown}
                  </span>{" "}
                  unknown
                </span>
              </div>
              <div className="w-px h-4 bg-white/5" />
              <span className="text-[11px] font-semibold text-white">
                {Math.round(
                  ((stats.confirmed + stats.inferred) / stats.total) * 100
                )}
                % mapped
              </span>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Edge tooltip */}
      {edgeTooltip && <EdgeTooltip {...edgeTooltip} />}
    </div>
  );
}

// ─── Main Exported Component ────────────────────────────────────

export interface LiveDependencyGraphProps {
  data: LiveGraphData;
  height?: number | string;
  showGroupOverlay?: boolean;
}

export default function LiveDependencyGraph({
  data,
  height = 600,
  showGroupOverlay = false,
}: LiveDependencyGraphProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const handleNodeClick = useCallback((skillId: string) => {
    setSelectedSkill((prev) => (prev === skillId ? null : skillId));
  }, []);

  const selectedSkillObj = useMemo(
    () => data.skills.find((s) => s.id === selectedSkill),
    [data.skills, selectedSkill]
  );

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-white/[0.06] shadow-2xl relative"
      style={{ height }}
    >
      <ReactFlowProvider>
        <GraphInner
          data={data}
          onNodeClick={handleNodeClick}
          showGroupOverlay={showGroupOverlay}
        />
      </ReactFlowProvider>

      {/* Skill detail panel */}
      {selectedSkillObj && (
        <SkillDetailPanel
          skill={selectedSkillObj}
          status={data.learnerStatuses?.[selectedSkillObj.id]}
          learnerName={data.learnerName}
          groupOverlays={data.groupOverlays}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
}

// Re-export the cascade computation for use elsewhere
export { computeInferenceCascade };
