"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import GroupDashboard from "@/components/visualizations/group-dashboard";
import { getSkillGraphData, getGroupDashboardData, getLearnerIds } from "@/lib/demo-data";

// Dynamic import for ReactFlow (requires client-side only)
const SkillDependencyGraph = dynamic(
  () => import("@/components/visualizations/skill-dependency-graph"),
  { ssr: false, loading: () => <GraphSkeleton /> }
);

function GraphSkeleton() {
  return (
    <div className="w-full h-[600px] rounded-xl border border-white/10 bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500">Loading graph visualization...</p>
      </div>
    </div>
  );
}

type ViewMode = "graph" | "dashboard";

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [selectedLearner, setSelectedLearner] = useState<string | null>("priya-sharma");
  const learnerIds = useMemo(() => getLearnerIds(), []);

  const graphData = useMemo(() => getSkillGraphData(selectedLearner || undefined), [selectedLearner]);
  const dashboardData = useMemo(() => getGroupDashboardData(), []);

  return (
    <div className="min-h-screen bg-[#08080c]">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <a href="/" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div>
                <h1 className="text-lg font-semibold text-white">Skill Analytics</h1>
                <p className="text-xs text-gray-500">
                  Tuesday Cohort &middot; Python Data Analysis
                </p>
              </div>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg p-1">
              <button
                onClick={() => setViewMode("graph")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "graph"
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Dependency Graph
              </button>
              <button
                onClick={() => setViewMode("dashboard")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "dashboard"
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Group Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {viewMode === "graph" && (
          <div className="space-y-4">
            {/* Learner selector */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Viewing as:
              </span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedLearner(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedLearner === null
                      ? "bg-white/10 text-white border border-white/20"
                      : "bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-gray-300 hover:border-white/10"
                  }`}
                >
                  All Skills (no overlay)
                </button>
                {learnerIds.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLearner(l.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedLearner === l.id
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : "bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-gray-300 hover:border-white/10"
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Graph */}
            <SkillDependencyGraph
              data={graphData}
              height={650}
              selectedLearner={selectedLearner}
            />

            {/* Learner insight card (when a learner is selected) */}
            {selectedLearner && graphData.learnerStatuses && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(() => {
                  const statuses = Object.values(graphData.learnerStatuses || {});
                  const assessed = statuses.filter((s) => s.type === "assessed");
                  const inferred = statuses.filter((s) => s.type === "inferred");
                  const unknown = statuses.filter((s) => s.type === "unknown");
                  const avgConf = assessed.length > 0
                    ? assessed.reduce((s, a) => s + a.confidence, 0) / assessed.length
                    : 0;

                  return (
                    <>
                      <StatCard label="Assessed" value={assessed.length} color="green" />
                      <StatCard label="Inferred" value={inferred.length} color="yellow" />
                      <StatCard label="Unknown" value={unknown.length} color="red" />
                      <StatCard label="Avg Confidence" value={`${Math.round(avgConf * 100)}%`} color="blue" />
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {viewMode === "dashboard" && (
          <GroupDashboard data={dashboardData} />
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    green: "from-green-500/10 to-green-500/5 border-green-500/20 text-green-400",
    yellow: "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 text-yellow-400",
    red: "from-red-500/10 to-red-500/5 border-red-500/20 text-red-400",
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{label}</p>
    </div>
  );
}
