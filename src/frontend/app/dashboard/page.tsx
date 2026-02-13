"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import ExportButton from "@/components/export-button";
import { getSkillGraphData, getGroupDashboardData, getLearnerIds } from "@/lib/demo-data";
import { LoadingSpinner } from "@/components/ui/loading";

// Dynamic import for ReactFlow (requires client-side only)
const SkillDependencyGraph = dynamic(
  () => import("@/components/visualizations/skill-dependency-graph"),
  { ssr: false, loading: () => <GraphSkeleton /> }
);

// Dynamic import for GroupDashboard (only shown when user clicks tab)
const GroupDashboard = dynamic(
  () => import("@/components/visualizations/group-dashboard"),
  { loading: () => <LoadingSpinner message="Loading group dashboard..." /> }
);

function GraphSkeleton() {
  return (
    <div className="w-full h-[650px] rounded-xl border border-white/[0.06] bg-[#06060a] flex items-center justify-center">
      <LoadingSpinner message="Loading skill dependency graph..." />
    </div>
  );
}

type ViewMode = "graph" | "dashboard";

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [selectedLearner, setSelectedLearner] = useState<string | null>("priya-sharma");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const learnerIds = useMemo(() => getLearnerIds(), []);

  const graphData = useMemo(() => getSkillGraphData(selectedLearner || undefined), [selectedLearner]);
  const dashboardData = useMemo(() => getGroupDashboardData(), []);

  // Auto-play through learners for demo effect
  useEffect(() => {
    if (!isAutoPlaying) return;
    const allOptions = [null, ...learnerIds.map(l => l.id)];
    const currentIndex = allOptions.indexOf(selectedLearner);
    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % allOptions.length;
      setSelectedLearner(allOptions[nextIndex]);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, selectedLearner, learnerIds]);

  // Get learner-specific stats for the info bar
  const learnerInfo = useMemo(() => {
    if (!selectedLearner || !graphData.learnerStatuses) return null;
    const statuses = Object.values(graphData.learnerStatuses);
    const assessed = statuses.filter(s => s.type === "assessed");
    const inferred = statuses.filter(s => s.type === "inferred");
    const unknown = statuses.filter(s => s.type === "unknown");
    const avgConf = assessed.length > 0
      ? assessed.reduce((sum, a) => sum + a.confidence, 0) / assessed.length
      : 0;
    return { assessed: assessed.length, inferred: inferred.length, unknown: unknown.length, avgConf };
  }, [selectedLearner, graphData.learnerStatuses]);

  return (
    <div className="min-h-screen bg-[#06060a]">
      {/* Header */}
      <header className="border-b border-white/[0.04] bg-[#08080e]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-xs hidden sm:inline group-hover:text-white transition-colors">Back</span>
              </a>
              <div className="w-px h-5 bg-white/[0.06]" />
              <div>
                <h1 className="text-sm font-semibold text-white tracking-tight">Skill Analytics</h1>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Tuesday Cohort &middot; Python Data Analysis &middot; 25 skills &middot; 5 learners
                </p>
              </div>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <ExportButton
                href="/api/export/group/tuesday-cohort"
                label="Group PDF"
                filename="group-tuesday-cohort.pdf"
                variant="secondary"
                size="sm"
              />
              {selectedLearner && (
                <ExportButton
                  href={`/api/export/learner/${selectedLearner}`}
                  label={`${selectedLearner.split("-")[0]} PDF`}
                  filename={`learner-${selectedLearner}.pdf`}
                  variant="secondary"
                  size="sm"
                />
              )}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("graph")}
                className={`px-3.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  viewMode === "graph"
                    ? "bg-indigo-500/15 text-indigo-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Dependency Graph
                </span>
              </button>
              <button
                onClick={() => setViewMode("dashboard")}
                className={`px-3.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  viewMode === "dashboard"
                    ? "bg-indigo-500/15 text-indigo-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Group Dashboard
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-5">
        {viewMode === "graph" && (
          <div className="space-y-4">
            {/* Learner selector bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] text-gray-600 uppercase tracking-[0.15em] font-semibold">
                  Learner view
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => { setSelectedLearner(null); setIsAutoPlaying(false); }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      selectedLearner === null
                        ? "bg-white/8 text-white border border-white/15"
                        : "text-gray-600 border border-transparent hover:text-gray-400 hover:border-white/[0.06]"
                    }`}
                  >
                    Overview
                  </button>
                  {learnerIds.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => { setSelectedLearner(l.id); setIsAutoPlaying(false); }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        selectedLearner === l.id
                          ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                          : "text-gray-600 border border-transparent hover:text-gray-400 hover:border-white/[0.06]"
                      }`}
                    >
                      {l.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-play button for demo */}
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  isAutoPlaying
                    ? "bg-green-500/15 text-green-400 border border-green-500/20"
                    : "text-gray-600 border border-white/[0.06] hover:text-gray-400"
                }`}
              >
                {isAutoPlaying ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Auto-cycling
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                    Auto-cycle learners
                  </>
                )}
              </button>
            </div>

            {/* Learner stats bar (when a learner is selected) */}
            {learnerInfo && graphData.learnerName && (
              <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-xs font-semibold text-white">{graphData.learnerName}</p>
                <div className="w-px h-4 bg-white/[0.06]" />
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="text-gray-500">
                    <span className="font-semibold text-green-400">{learnerInfo.assessed}</span> assessed
                  </span>
                  <span className="text-gray-500">
                    <span className="font-semibold text-yellow-400">{learnerInfo.inferred}</span> inferred
                  </span>
                  <span className="text-gray-500">
                    <span className="font-semibold text-gray-400">{learnerInfo.unknown}</span> unknown
                  </span>
                  <span className="text-gray-500">
                    avg <span className="font-semibold text-white">{Math.round(learnerInfo.avgConf * 100)}%</span>
                  </span>
                </div>
                <div className="flex-1" />
                <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                  <div className="flex h-full">
                    <div
                      className="bg-green-500/70 transition-all duration-500"
                      style={{ width: `${(learnerInfo.assessed / 25) * 100}%` }}
                    />
                    <div
                      className="bg-yellow-500/50 transition-all duration-500"
                      style={{ width: `${(learnerInfo.inferred / 25) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Graph */}
            <SkillDependencyGraph
              data={graphData}
              height={650}
              selectedLearner={selectedLearner}
            />
          </div>
        )}

        {viewMode === "dashboard" && (
          <GroupDashboard data={dashboardData} />
        )}
      </main>
    </div>
  );
}
