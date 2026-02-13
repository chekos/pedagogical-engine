"use client";

import { useState, useMemo, useEffect, useCallback, use } from "react";
import dynamic from "next/dynamic";
import {
  getLiveGraphData,
  getLiveGraphDataWithGroupOverlay,
  getLearnerIds,
  getCascadeDemoData,
} from "@/lib/demo-data";
import { NavBar } from "@/components/ui/nav-bar";

const LiveDependencyGraph = dynamic(
  () => import("@/components/visualizations/live-dependency-graph"),
  { ssr: false, loading: () => <GraphSkeleton /> }
);

function GraphSkeleton() {
  return (
    <div className="w-full h-full rounded-xl border border-white/[0.06] bg-[#06060a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-500">Loading dependency graph...</p>
      </div>
    </div>
  );
}

export default function GraphPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = use(params);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);
  const [showGroupOverlay, setShowGroupOverlay] = useState(false);
  const [cascadeMode, setCascadeMode] = useState(false);
  const [cascadeTriggered, setCascadeTriggered] = useState(false);
  const learnerIds = useMemo(() => getLearnerIds(), []);

  // Cascade demo data
  const cascadeDemo = useMemo(() => getCascadeDemoData(), []);

  // Build graph data based on current mode
  const graphData = useMemo(() => {
    if (cascadeMode) {
      return cascadeTriggered ? cascadeDemo.after : cascadeDemo.before;
    }
    if (showGroupOverlay) {
      return getLiveGraphDataWithGroupOverlay(selectedLearner || undefined);
    }
    return getLiveGraphData(selectedLearner || undefined);
  }, [selectedLearner, showGroupOverlay, cascadeMode, cascadeTriggered, cascadeDemo]);

  // Learner stats
  const learnerInfo = useMemo(() => {
    if (!graphData.learnerStatuses) return null;
    const statuses = Object.values(graphData.learnerStatuses);
    const confirmed = statuses.filter((s) => s.state === "assessed-confirmed");
    const gap = statuses.filter((s) => s.state === "assessed-gap");
    const inferred = statuses.filter((s) => s.state === "inferred");
    const unknown = statuses.filter((s) => s.state === "unknown");
    const knownCount = confirmed.length + inferred.length;
    const avgConf =
      knownCount > 0
        ? [...confirmed, ...inferred].reduce((sum, a) => sum + a.confidence, 0) / knownCount
        : 0;
    return {
      confirmed: confirmed.length,
      gap: gap.length,
      inferred: inferred.length,
      unknown: unknown.length,
      avgConf,
      total: statuses.length,
    };
  }, [graphData.learnerStatuses]);

  // Reset cascade state when leaving cascade mode
  useEffect(() => {
    if (!cascadeMode) {
      setCascadeTriggered(false);
    }
  }, [cascadeMode]);

  const handleTriggerCascade = useCallback(() => {
    setCascadeTriggered(true);
  }, []);

  const domainLabel = domain.replace(/-/g, " ");

  return (
    <div className="min-h-screen h-screen flex flex-col bg-[#06060a]">
      <NavBar />

      {/* Page controls */}
      <div className="border-b border-white/[0.04] bg-[#08080e]/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Left: Title */}
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight">
                Skill Dependency Graph
              </h1>
              <p className="text-[10px] text-gray-600 mt-0.5 capitalize">
                {domainLabel} &middot; {graphData.skills.length} skills &middot;{" "}
                {graphData.edges.length} dependencies
              </p>
            </div>

            {/* Center: Learner selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] text-gray-600 uppercase tracking-[0.15em] font-semibold">
                Learner
              </span>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    setSelectedLearner(null);
                    setCascadeMode(false);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    selectedLearner === null && !cascadeMode
                      ? "bg-white/8 text-white border border-white/15"
                      : "text-gray-600 border border-transparent hover:text-gray-400 hover:border-white/[0.06]"
                  }`}
                >
                  Overview
                </button>
                {learnerIds.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setSelectedLearner(l.id);
                      setCascadeMode(false);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      selectedLearner === l.id && !cascadeMode
                        ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                        : "text-gray-600 border border-transparent hover:text-gray-400 hover:border-white/[0.06]"
                    }`}
                  >
                    {l.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {/* Group overlay toggle */}
              <button
                onClick={() => setShowGroupOverlay(!showGroupOverlay)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  showGroupOverlay
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                    : "text-gray-600 border border-white/[0.06] hover:text-gray-400"
                }`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Group
              </button>

              {/* Cascade demo */}
              <button
                onClick={() => {
                  if (!cascadeMode) {
                    setCascadeMode(true);
                    setSelectedLearner("alex-chen");
                    setCascadeTriggered(false);
                  } else {
                    setCascadeMode(false);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  cascadeMode
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                    : "text-gray-600 border border-white/[0.06] hover:text-gray-400"
                }`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Cascade Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Learner stats bar */}
      {learnerInfo && graphData.learnerName && (
        <div className="border-b border-white/[0.04] bg-[#08080e]/60 px-6 py-2">
          <div className="max-w-[1600px] mx-auto flex items-center gap-4">
            <p className="text-xs font-semibold text-white">
              {graphData.learnerName}
            </p>
            <div className="w-px h-4 bg-white/[0.06]" />
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-gray-500">
                <span className="font-semibold text-green-400">
                  {learnerInfo.confirmed}
                </span>{" "}
                confirmed
              </span>
              {learnerInfo.gap > 0 && (
                <span className="text-gray-500">
                  <span className="font-semibold text-red-400">
                    {learnerInfo.gap}
                  </span>{" "}
                  gaps
                </span>
              )}
              <span className="text-gray-500">
                <span className="font-semibold text-blue-400">
                  {learnerInfo.inferred}
                </span>{" "}
                inferred
              </span>
              <span className="text-gray-500">
                <span className="font-semibold text-gray-400">
                  {learnerInfo.unknown}
                </span>{" "}
                unknown
              </span>
              <span className="text-gray-500">
                avg{" "}
                <span className="font-semibold text-white">
                  {Math.round(learnerInfo.avgConf * 100)}%
                </span>
              </span>
            </div>
            <div className="flex-1" />
            <div className="h-1.5 w-40 bg-white/5 rounded-full overflow-hidden">
              <div className="flex h-full">
                <div
                  className="bg-green-500/70 transition-all duration-500"
                  style={{
                    width: `${(learnerInfo.confirmed / learnerInfo.total) * 100}%`,
                  }}
                />
                <div
                  className="bg-blue-400/50 transition-all duration-500"
                  style={{
                    width: `${(learnerInfo.inferred / learnerInfo.total) * 100}%`,
                  }}
                />
                <div
                  className="bg-red-500/50 transition-all duration-500"
                  style={{
                    width: `${(learnerInfo.gap / learnerInfo.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cascade demo banner */}
      {cascadeMode && (
        <div className="border-b border-blue-500/10 bg-blue-500/[0.03] px-6 py-3">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Inference Cascade Demo
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {cascadeTriggered
                    ? `Alex assessed "pandas-groupby" — watch 11 prerequisites light up via inference!`
                    : `Alex Chen (beginner, 6 skills assessed). Click "Trigger" to simulate passing "pandas-groupby".`}
                </p>
              </div>
            </div>
            {!cascadeTriggered && (
              <button
                onClick={handleTriggerCascade}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/30 transition-colors border border-blue-500/20"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                </svg>
                Trigger Cascade
              </button>
            )}
            {cascadeTriggered && (
              <button
                onClick={() => setCascadeTriggered(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-xs font-medium hover:bg-white/10 transition-colors border border-white/[0.06]"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Graph — fills remaining space */}
      <main className="flex-1 min-h-0 p-4">
        <LiveDependencyGraph
          data={graphData}
          height="100%"
          showGroupOverlay={showGroupOverlay}
        />
      </main>
    </div>
  );
}
