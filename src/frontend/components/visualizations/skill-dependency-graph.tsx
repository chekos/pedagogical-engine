"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  type Node,
  type Edge,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  type NodeProps,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

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

interface SkillStatus {
  confidence: number;
  type: "assessed" | "inferred" | "unknown";
  bloom_demonstrated?: string;
}

export interface SkillGraphData {
  skills: Skill[];
  edges: DependencyEdge[];
  learnerStatuses?: Record<string, SkillStatus>;
  learnerName?: string;
}

// ─── Constants ──────────────────────────────────────────────────

const BLOOM_LEVELS = ["knowledge", "comprehension", "application", "analysis", "synthesis", "evaluation"];

const BLOOM_COLORS: Record<string, string> = {
  knowledge: "#64748b",
  comprehension: "#06b6d4",
  application: "#22c55e",
  analysis: "#f59e0b",
  synthesis: "#a855f7",
  evaluation: "#ef4444",
};

const BLOOM_LABELS: Record<string, string> = {
  knowledge: "Remember",
  comprehension: "Understand",
  application: "Apply",
  analysis: "Analyze",
  synthesis: "Create",
  evaluation: "Evaluate",
};

// ─── Custom Node ────────────────────────────────────────────────

function getNodeStyle(status: SkillStatus | undefined, bloomLevel: string) {
  const bloomColor = BLOOM_COLORS[bloomLevel] || "#64748b";

  if (!status || status.type === "unknown") {
    return {
      background: "rgba(20, 20, 28, 0.9)",
      border: `2px solid ${bloomColor}40`,
      color: "#6b7280",
      glow: "none",
    };
  }

  if (status.type === "assessed") {
    const opacity = Math.max(0.4, status.confidence);
    return {
      background: `rgba(34, 197, 94, ${opacity * 0.12})`,
      border: `2px solid rgba(34, 197, 94, ${Math.max(0.5, opacity)})`,
      color: "#f3f4f6",
      glow: `0 0 ${10 + status.confidence * 14}px rgba(34, 197, 94, ${opacity * 0.35}), inset 0 0 ${6 + status.confidence * 6}px rgba(34, 197, 94, ${opacity * 0.08})`,
    };
  }

  // inferred
  const opacity = Math.max(0.3, status.confidence);
  return {
    background: `rgba(251, 191, 36, ${opacity * 0.08})`,
    border: `2px dashed rgba(251, 191, 36, ${Math.max(0.4, opacity * 0.7)})`,
    color: "#e5e7eb",
    glow: `0 0 ${6 + status.confidence * 8}px rgba(251, 191, 36, ${opacity * 0.25})`,
  };
}

function SkillNode({ data }: NodeProps) {
  const { label, bloomLevel, status, shortLabel } = data as {
    label: string;
    bloomLevel: string;
    status: SkillStatus | undefined;
    shortLabel: string;
  };
  const style = getNodeStyle(status, bloomLevel);
  const bloomColor = BLOOM_COLORS[bloomLevel] || "#64748b";
  const confidence = status?.confidence;
  const hasStatus = status && status.type !== "unknown";

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-2 !h-2" />
      <div
        className="relative px-3.5 py-2.5 rounded-xl min-w-[130px] max-w-[175px] transition-all duration-500 cursor-pointer group"
        style={{
          background: style.background,
          border: style.border,
          boxShadow: style.glow,
          backdropFilter: "blur(8px)",
        }}
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

        {/* Confidence bar at bottom */}
        {confidence !== undefined && confidence > 0 && (
          <div className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full overflow-hidden bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${confidence * 100}%`,
                background: status?.type === "assessed"
                  ? `linear-gradient(90deg, rgba(34, 197, 94, 0.6), rgba(34, 197, 94, 0.9))`
                  : `linear-gradient(90deg, rgba(251, 191, 36, 0.4), rgba(251, 191, 36, 0.7))`,
              }}
            />
          </div>
        )}

        {/* Label */}
        <p
          className="text-[11px] font-medium leading-snug pl-2"
          style={{ color: style.color }}
          title={label}
        >
          {shortLabel}
        </p>

        {/* Confidence percentage */}
        {hasStatus && (
          <p className="text-[9px] font-mono pl-2 mt-0.5" style={{ color: style.color, opacity: 0.5 }}>
            {Math.round((confidence || 0) * 100)}%
          </p>
        )}

        {/* Hover tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:block z-50 pointer-events-none">
          <div className="bg-[#12121e] border border-white/10 rounded-xl px-3.5 py-2.5 shadow-2xl min-w-[220px] max-w-[300px]">
            <p className="text-[11px] font-semibold text-white mb-1.5 leading-snug">{label}</p>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: bloomColor, boxShadow: `0 0 4px ${bloomColor}60` }}
              />
              <span className="text-[10px] text-gray-400">{BLOOM_LABELS[bloomLevel] || bloomLevel}</span>
            </div>
            {hasStatus && (
              <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-white/5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                  status.type === "assessed"
                    ? "bg-green-500/15 text-green-400 border border-green-500/20"
                    : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                }`}>
                  {status.type}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {Math.round((confidence || 0) * 100)}%
                </span>
              </div>
            )}
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-[#12121e] border-b border-r border-white/10 rotate-45" />
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-2 !h-2" />
    </>
  );
}

const nodeTypes = { skill: SkillNode };

// ─── DAG Layout ─────────────────────────────────────────────────
// Uses topological depth + bloom level to create a layered DAG layout

function calculateLayout(skills: Skill[], graphEdges: DependencyEdge[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  // Build adjacency list for topological depth calculation
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

  for (const s of skills) {
    if (inDegree[s.id] === 0) {
      depth[s.id] = 0;
      queue.push(s.id);
    }
  }

  while (queue.length > 0) {
    const node = queue.shift()!;
    for (const child of (children[node] || [])) {
      depth[child] = Math.max(depth[child] || 0, depth[node] + 1);
      inDegree[child]--;
      if (inDegree[child] === 0) {
        queue.push(child);
      }
    }
  }

  // Group by depth level
  const maxDepth = Math.max(...Object.values(depth), 0);
  const byDepth: Record<number, Skill[]> = {};
  for (const s of skills) {
    const d = depth[s.id] ?? 0;
    if (!byDepth[d]) byDepth[d] = [];
    byDepth[d].push(s);
  }

  // Sort within each level to minimize edge crossings (simple heuristic: sort by parent position)
  const nodeX: Record<string, number> = {};
  const COL_WIDTH = 195;
  const ROW_HEIGHT = 105;

  for (let d = 0; d <= maxDepth; d++) {
    const group = byDepth[d] || [];

    // Sort by average parent x position for crossing reduction
    if (d > 0) {
      group.sort((a, b) => {
        const avgA = (parents[a.id] || []).reduce((sum, p) => sum + (nodeX[p] || 0), 0) / Math.max(1, (parents[a.id] || []).length);
        const avgB = (parents[b.id] || []).reduce((sum, p) => sum + (nodeX[p] || 0), 0) / Math.max(1, (parents[b.id] || []).length);
        return avgA - avgB;
      });
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

// ─── Inner Graph ────────────────────────────────────────────────

function GraphInner({ data }: {
  data: SkillGraphData;
}) {
  const { fitView } = useReactFlow();

  const positions = useMemo(() => calculateLayout(data.skills, data.edges), [data.skills, data.edges]);

  const initialNodes: Node[] = useMemo(() => {
    return data.skills.map((skill) => {
      const pos = positions[skill.id] || { x: 0, y: 0 };
      const status = data.learnerStatuses?.[skill.id];

      const shortLabel = skill.label
        .replace(/^Can /, "")
        .replace(/^can /, "")
        .split(" ")
        .slice(0, 5)
        .join(" ");

      return {
        id: skill.id,
        type: "skill",
        position: pos,
        data: {
          label: skill.label,
          bloomLevel: skill.bloom_level,
          status,
          shortLabel,
        },
      };
    });
  }, [data.skills, data.learnerStatuses, positions]);

  const initialEdges: Edge[] = useMemo(() => {
    return data.edges.map((edge, i) => {
      const sourceStatus = data.learnerStatuses?.[edge.source];
      const targetStatus = data.learnerStatuses?.[edge.target];
      const bothKnown = sourceStatus && sourceStatus.type !== "unknown" && targetStatus && targetStatus.type !== "unknown";
      const sourceKnown = sourceStatus && sourceStatus.type !== "unknown";

      return {
        id: `e-${i}`,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: bothKnown,
        style: {
          stroke: bothKnown
            ? "rgba(34, 197, 94, 0.35)"
            : sourceKnown
            ? "rgba(100, 120, 140, 0.15)"
            : "rgba(60, 60, 80, 0.12)",
          strokeWidth: bothKnown ? 2 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: bothKnown ? "rgba(34, 197, 94, 0.4)" : "rgba(80, 80, 100, 0.2)",
          width: 10,
          height: 10,
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

  // Count stats for the bottom panel
  const stats = useMemo(() => {
    if (!data.learnerStatuses) return null;
    const values = Object.values(data.learnerStatuses);
    return {
      assessed: values.filter((s) => s.type === "assessed").length,
      inferred: values.filter((s) => s.type === "inferred").length,
      unknown: values.filter((s) => s.type === "unknown").length,
      total: values.length,
    };
  }, [data.learnerStatuses]);

  return (
    <div className="w-full h-full relative" style={{ background: "linear-gradient(180deg, #06060a 0%, #0a0a12 50%, #08080e 100%)" }}>
      {/* Subtle grid pattern */}
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
        minZoom={0.25}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="skill-graph"
      >
        {/* Bloom's Taxonomy legend */}
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
                    style={{ background: BLOOM_COLORS[level], boxShadow: `0 0 4px ${BLOOM_COLORS[level]}50` }}
                  />
                  <span className="text-[10px] text-gray-500">{BLOOM_LABELS[level]}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Status legend + learner name */}
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
              Status
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-[3px] bg-green-500 flex-shrink-0" style={{ boxShadow: "0 0 6px rgba(34, 197, 94, 0.4)" }} />
                <span className="text-[10px] text-gray-500">Assessed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-[3px] bg-yellow-500 flex-shrink-0" style={{ boxShadow: "0 0 6px rgba(251, 191, 36, 0.3)" }} />
                <span className="text-[10px] text-gray-500">Inferred</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-[3px] bg-gray-700 flex-shrink-0" />
                <span className="text-[10px] text-gray-500">Unknown</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Stats bar at bottom */}
        {stats && (
          <Panel position="bottom-center">
            <div className="bg-[#0c0c16]/95 backdrop-blur-md border border-white/[0.06] rounded-xl px-5 py-2.5 shadow-2xl flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: "0 0 4px rgba(34, 197, 94, 0.4)" }} />
                <span className="text-[11px] text-gray-400">
                  <span className="font-semibold text-green-400">{stats.assessed}</span> assessed
                </span>
              </div>
              <div className="w-px h-4 bg-white/5" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" style={{ boxShadow: "0 0 4px rgba(251, 191, 36, 0.3)" }} />
                <span className="text-[11px] text-gray-400">
                  <span className="font-semibold text-yellow-400">{stats.inferred}</span> inferred
                </span>
              </div>
              <div className="w-px h-4 bg-white/5" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-700" />
                <span className="text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-400">{stats.unknown}</span> unknown
                </span>
              </div>
              <div className="w-px h-4 bg-white/5" />
              <span className="text-[11px] font-semibold text-white">
                {Math.round(((stats.assessed + stats.inferred) / stats.total) * 100)}% mapped
              </span>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export default function SkillDependencyGraph({
  data,
  height = 600,
}: {
  data: SkillGraphData;
  height?: number;
  selectedLearner?: string | null;
  onLearnerChange?: (name: string | null) => void;
}) {
  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-white/[0.06] shadow-2xl"
      style={{ height }}
    >
      <ReactFlowProvider>
        <GraphInner data={data} />
      </ReactFlowProvider>
    </div>
  );
}
