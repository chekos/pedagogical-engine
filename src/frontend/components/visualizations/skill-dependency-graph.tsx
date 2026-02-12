"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

const BLOOM_Y_POSITIONS: Record<string, number> = {
  knowledge: 0,
  comprehension: 150,
  application: 300,
  analysis: 450,
  synthesis: 600,
  evaluation: 750,
};

// ─── Custom Node ────────────────────────────────────────────────

function getNodeStyle(status: SkillStatus | undefined, bloomLevel: string) {
  const bloomColor = BLOOM_COLORS[bloomLevel] || "#64748b";

  if (!status || status.type === "unknown") {
    return {
      background: "rgba(30, 30, 35, 0.8)",
      border: `2px solid ${bloomColor}33`,
      color: "#6b7280",
      glow: "none",
      ringColor: bloomColor + "33",
    };
  }

  if (status.type === "assessed") {
    const opacity = Math.max(0.4, status.confidence);
    return {
      background: `rgba(34, 197, 94, ${opacity * 0.15})`,
      border: `2px solid rgba(34, 197, 94, ${opacity})`,
      color: "#f3f4f6",
      glow: `0 0 ${12 + status.confidence * 12}px rgba(34, 197, 94, ${opacity * 0.4})`,
      ringColor: `rgba(34, 197, 94, ${opacity})`,
    };
  }

  // inferred
  const opacity = Math.max(0.3, status.confidence);
  return {
    background: `rgba(251, 191, 36, ${opacity * 0.12})`,
    border: `2px solid rgba(251, 191, 36, ${opacity * 0.7})`,
    color: "#e5e7eb",
    glow: `0 0 ${8 + status.confidence * 8}px rgba(251, 191, 36, ${opacity * 0.3})`,
    ringColor: `rgba(251, 191, 36, ${opacity * 0.7})`,
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

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-3 !h-3" />
      <div
        className="relative px-3 py-2 rounded-lg min-w-[120px] max-w-[180px] transition-all duration-500 cursor-pointer group"
        style={{
          background: style.background,
          border: style.border,
          boxShadow: style.glow,
        }}
      >
        {/* Bloom level indicator dot */}
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ background: bloomColor, boxShadow: `0 0 6px ${bloomColor}80` }}
        />

        {/* Confidence bar */}
        {confidence !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg overflow-hidden bg-white/5">
            <div
              className="h-full rounded-b-lg transition-all duration-700"
              style={{
                width: `${confidence * 100}%`,
                background: status?.type === "assessed"
                  ? "rgba(34, 197, 94, 0.8)"
                  : "rgba(251, 191, 36, 0.6)",
              }}
            />
          </div>
        )}

        <p
          className="text-[11px] font-medium leading-tight text-center truncate"
          style={{ color: style.color }}
          title={label}
        >
          {shortLabel}
        </p>

        {/* Hover tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 pointer-events-none">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 shadow-xl min-w-[200px] max-w-[280px]">
            <p className="text-xs font-medium text-white mb-1">{label}</p>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: bloomColor }}
              />
              <span className="text-[10px] text-gray-400 capitalize">{bloomLevel}</span>
            </div>
            {status && status.type !== "unknown" && (
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  status.type === "assessed"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {status.type}
                </span>
                <span className="text-[10px] text-gray-500">
                  {Math.round((status.confidence || 0) * 100)}% confidence
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-3" />
    </>
  );
}

const nodeTypes = { skill: SkillNode };

// ─── Layout Calculation ─────────────────────────────────────────

function calculateLayout(skills: Skill[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  // Group skills by bloom level
  const byLevel: Record<string, Skill[]> = {};
  for (const skill of skills) {
    const level = skill.bloom_level;
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(skill);
  }

  // Position each level as a row
  for (const level of BLOOM_LEVELS) {
    const group = byLevel[level] || [];
    const totalWidth = group.length * 200;
    const startX = -totalWidth / 2 + 100;

    group.forEach((skill, i) => {
      positions[skill.id] = {
        x: startX + i * 200,
        y: BLOOM_Y_POSITIONS[level],
      };
    });
  }

  return positions;
}

// ─── Inner Graph (needs ReactFlow context) ──────────────────────

function GraphInner({ data, selectedLearner, onLearnerChange }: {
  data: SkillGraphData;
  selectedLearner: string | null;
  onLearnerChange?: (name: string | null) => void;
}) {
  const { fitView } = useReactFlow();

  const positions = useMemo(() => calculateLayout(data.skills), [data.skills]);

  const initialNodes: Node[] = useMemo(() => {
    return data.skills.map((skill) => {
      const pos = positions[skill.id] || { x: 0, y: 0 };
      const status = data.learnerStatuses?.[skill.id];

      // Create a short label from the full label
      const shortLabel = skill.label
        .replace(/^Can /, "")
        .replace(/^can /, "")
        .split(" ")
        .slice(0, 4)
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
      const isLit = sourceStatus && sourceStatus.type !== "unknown" && targetStatus && targetStatus.type !== "unknown";

      return {
        id: `e-${i}`,
        source: edge.source,
        target: edge.target,
        type: "default",
        animated: isLit ? true : false,
        style: {
          stroke: isLit ? "rgba(34, 197, 94, 0.4)" : "rgba(100, 100, 120, 0.2)",
          strokeWidth: isLit ? 2 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isLit ? "rgba(34, 197, 94, 0.5)" : "rgba(100, 100, 120, 0.3)",
          width: 12,
          height: 12,
        },
      };
    });
  }, [data.edges, data.learnerStatuses]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setTimeout(() => fitView({ padding: 0.15, duration: 500 }), 100);
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  return (
    <div className="w-full h-full relative" style={{ background: "#0a0a0f" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="skill-graph"
      >
        {/* Bloom's level legend */}
        <Panel position="top-left">
          <div className="bg-[#0f0f18]/90 backdrop-blur-sm border border-white/10 rounded-xl p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
              Bloom&apos;s Taxonomy
            </p>
            {BLOOM_LEVELS.map((level) => (
              <div key={level} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: BLOOM_COLORS[level], boxShadow: `0 0 4px ${BLOOM_COLORS[level]}60` }}
                />
                <span className="text-[11px] text-gray-400 capitalize">{level}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Status legend */}
        <Panel position="top-right">
          <div className="bg-[#0f0f18]/90 backdrop-blur-sm border border-white/10 rounded-xl p-3 space-y-1.5">
            {data.learnerName && (
              <p className="text-xs font-medium text-white mb-2">
                {data.learnerName}
              </p>
            )}
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
              Skill Status
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" style={{ boxShadow: "0 0 6px rgba(34, 197, 94, 0.5)" }} />
              <span className="text-[11px] text-gray-400">Assessed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" style={{ boxShadow: "0 0 6px rgba(251, 191, 36, 0.4)" }} />
              <span className="text-[11px] text-gray-400">Inferred</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
              <span className="text-[11px] text-gray-400">Unknown</span>
            </div>
          </div>
        </Panel>

        {/* Learner selector */}
        {onLearnerChange && (
          <Panel position="bottom-left">
            <div className="bg-[#0f0f18]/90 backdrop-blur-sm border border-white/10 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
                View as learner
              </p>
              <select
                value={selectedLearner || ""}
                onChange={(e) => onLearnerChange(e.target.value || null)}
                className="text-xs bg-[#1a1a2e] border border-white/10 rounded-lg px-2 py-1.5 text-white w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All skills (no learner)</option>
                {/* Options populated by parent */}
              </select>
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
  selectedLearner = null,
  onLearnerChange,
}: {
  data: SkillGraphData;
  height?: number;
  selectedLearner?: string | null;
  onLearnerChange?: (name: string | null) => void;
}) {
  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-white/10"
      style={{ height }}
    >
      <ReactFlowProvider>
        <GraphInner
          data={data}
          selectedLearner={selectedLearner}
          onLearnerChange={onLearnerChange}
        />
      </ReactFlowProvider>
    </div>
  );
}
