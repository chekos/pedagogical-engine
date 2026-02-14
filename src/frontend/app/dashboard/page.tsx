"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import ExportButton from "@/components/export-button";
import { LoadingSpinner } from "@/components/ui/loading";
import { NavBar } from "@/components/ui/nav-bar";
import type { SkillGraphData } from "@/components/visualizations/skill-dependency-graph";
import type { GroupDashboardData } from "@/components/visualizations/group-dashboard";
import {
  fetchDomains,
  fetchDomainDetail,
  fetchGroups,
  fetchGroupStatus,
  type DomainSummary,
  type DomainDetail,
  type GroupSummary,
  type GroupStatus,
} from "@/lib/api";

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
    <div className="w-full h-[650px] rounded-xl border border-border-subtle bg-surface-0 flex items-center justify-center">
      <LoadingSpinner message="Loading skill dependency graph..." />
    </div>
  );
}

type ViewMode = "graph" | "dashboard";

/** Mini skill summary for learner tab hover tooltip */
function LearnerTooltip({
  learner,
  totalSkills,
}: {
  learner: { id: string; name: string; assessed: number; inferred: number; avgConf: number };
  totalSkills: number;
}) {
  const unknown = totalSkills - learner.assessed - learner.inferred;
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2.5 rounded-lg bg-surface-3 border border-border shadow-xl z-50 min-w-[180px] pointer-events-none">
      <div className="text-xs font-semibold text-text-primary mb-1.5">{learner.name}</div>
      <div className="flex items-center gap-2 text-[10px] mb-1.5">
        <span className="text-green-400 font-medium">{learner.assessed} assessed</span>
        <span className="text-yellow-400 font-medium">{learner.inferred} inferred</span>
        <span className="text-text-secondary">{unknown} unknown</span>
      </div>
      {/* Mini progress bar */}
      <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
        <div className="flex h-full">
          <div
            className="bg-green-500/70"
            style={{ width: `${totalSkills > 0 ? (learner.assessed / totalSkills) * 100 : 0}%` }}
          />
          <div
            className="bg-yellow-500/50"
            style={{ width: `${totalSkills > 0 ? (learner.inferred / totalSkills) * 100 : 0}%` }}
          />
        </div>
      </div>
      <div className="text-[10px] text-text-secondary mt-1">
        avg confidence: <span className="text-text-primary font-medium">{Math.round(learner.avgConf * 100)}%</span>
      </div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-3 border-r border-b border-border rotate-45 -mt-1" />
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const domainFromUrl = searchParams.get("domain");

  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [hoveredLearner, setHoveredLearner] = useState<string | null>(null);

  // ─── Data state ──────────────────────────────────────────────
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>(domainFromUrl ?? "");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [domainDetail, setDomainDetail] = useState<DomainDetail | null>(null);
  const [groupStatus, setGroupStatus] = useState<GroupStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── 1. On mount: fetch domains + groups ─────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, g] = await Promise.all([fetchDomains(), fetchGroups()]);
        if (cancelled) return;
        setDomains(d);
        setGroups(g);
        // Use domain from URL if valid, otherwise default to first
        if (domainFromUrl && d.some((dom) => dom.slug === domainFromUrl)) {
          setSelectedDomain(domainFromUrl);
        } else if (d.length > 0 && !selectedDomain) {
          setSelectedDomain(d[0].slug);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── Groups matching selected domain ─────────────────────────
  const matchingGroups = useMemo(
    () => groups.filter((g) => g.domain === selectedDomain),
    [groups, selectedDomain]
  );

  // ─── 2. On domain change: fetch domain detail, auto-select group
  useEffect(() => {
    if (!selectedDomain) return;
    let cancelled = false;

    // Auto-select first matching group (or clear)
    const firstMatch = matchingGroups[0];
    setSelectedGroup(firstMatch?.slug ?? "");
    setSelectedLearner(null);
    setIsAutoPlaying(false);

    (async () => {
      try {
        const detail = await fetchDomainDetail(selectedDomain);
        if (!cancelled) setDomainDetail(detail);
      } catch {
        if (!cancelled) setDomainDetail(null);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain, groups]);

  // ─── 3. On group change: fetch group status ──────────────────
  useEffect(() => {
    if (!selectedGroup || !selectedDomain) {
      setGroupStatus(null);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const status = await fetchGroupStatus(selectedGroup, selectedDomain);
        if (!cancelled) {
          setGroupStatus(status);
          // Auto-select first assessed learner
          const firstAssessed = status.learners.find((l) => l.skillCount > 0);
          setSelectedLearner(firstAssessed?.id ?? null);
        }
      } catch {
        if (!cancelled) setGroupStatus(null);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedGroup, selectedDomain]);

  // ─── Learner list from group status (with mini stats) ─────────
  const learnerIds = useMemo(() => {
    if (!groupStatus || !domainDetail) return [];
    return groupStatus.learners
      .filter((l) => l.skillCount > 0)
      .map((l) => {
        const skills = domainDetail.skills;
        const assessed = Object.values(l.skills).filter((s) => s.type === "assessed").length;
        const inferred = Object.values(l.skills).filter((s) => s.type === "inferred").length;
        const assessedSkills = Object.values(l.skills).filter((s) => s.type === "assessed");
        const avgConf = assessedSkills.length > 0
          ? assessedSkills.reduce((sum, s) => sum + s.confidence, 0) / assessedSkills.length
          : 0;
        return { id: l.id, name: l.name, assessed, inferred, avgConf, totalSkills: skills.length };
      });
  }, [groupStatus, domainDetail]);

  // ─── Build SkillGraphData ────────────────────────────────────
  const graphData: SkillGraphData = useMemo(() => {
    if (!domainDetail) return { skills: [], edges: [] };

    const learner = selectedLearner && groupStatus
      ? groupStatus.learners.find((l) => l.id === selectedLearner)
      : null;

    const learnerStatuses: Record<string, { confidence: number; type: "assessed" | "inferred" | "unknown"; bloom_demonstrated?: string }> | undefined =
      learner
        ? Object.fromEntries(
            domainDetail.skills.map((skill) => {
              const s = learner.skills[skill.id];
              if (s) {
                return [skill.id, { confidence: s.confidence, type: s.type as "assessed" | "inferred", bloom_demonstrated: undefined }];
              }
              return [skill.id, { confidence: 0, type: "unknown" as const }];
            })
          )
        : undefined;

    return {
      skills: domainDetail.skills,
      edges: domainDetail.edges,
      learnerStatuses,
      learnerName: learner?.name,
    };
  }, [domainDetail, selectedLearner, groupStatus]);

  // ─── Build GroupDashboardData ────────────────────────────────
  const dashboardData: GroupDashboardData | null = useMemo(() => {
    if (!domainDetail || !groupStatus) return null;

    return {
      groupName: groupStatus.group,
      domain: groupStatus.domain,
      skills: domainDetail.skills,
      learners: groupStatus.learners.map((l) => ({
        name: l.name,
        id: l.id,
        skills: Object.fromEntries(
          Object.entries(l.skills).map(([skillId, s]) => [
            skillId,
            { confidence: s.confidence, type: s.type as "assessed" | "inferred" },
          ])
        ),
      })),
    };
  }, [domainDetail, groupStatus]);

  // ─── Auto-play through learners for demo ─────────────────────
  useEffect(() => {
    if (!isAutoPlaying || learnerIds.length === 0) return;
    const allOptions = [null, ...learnerIds.map((l) => l.id)];
    const currentIndex = allOptions.indexOf(selectedLearner);
    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % allOptions.length;
      setSelectedLearner(allOptions[nextIndex]);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, selectedLearner, learnerIds]);

  // ─── Learner stats for info bar ──────────────────────────────
  const learnerInfo = useMemo(() => {
    if (!selectedLearner || !graphData.learnerStatuses) return null;
    const statuses = Object.values(graphData.learnerStatuses);
    const assessed = statuses.filter((s) => s.type === "assessed");
    const inferred = statuses.filter((s) => s.type === "inferred");
    const unknown = statuses.filter((s) => s.type === "unknown");
    const avgConf =
      assessed.length > 0
        ? assessed.reduce((sum, a) => sum + a.confidence, 0) / assessed.length
        : 0;
    return { assessed: assessed.length, inferred: inferred.length, unknown: unknown.length, avgConf };
  }, [selectedLearner, graphData.learnerStatuses]);

  const totalSkills = domainDetail?.skills.length ?? 0;

  // Domain display name
  const domainName = useMemo(() => {
    const d = domains.find((d) => d.slug === selectedDomain);
    return d?.name ?? selectedDomain;
  }, [domains, selectedDomain]);

  // ─── Domain change handler ──────────────────────────────────
  const handleDomainChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDomain(e.target.value);
    setDomainDetail(null);
    setGroupStatus(null);
    setSelectedLearner(null);
    setIsAutoPlaying(false);
  }, []);

  const handleGroupChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGroup(e.target.value);
    setGroupStatus(null);
    setSelectedLearner(null);
    setIsAutoPlaying(false);
  }, []);

  // ─── Loading / error states ──────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0">
        <NavBar />
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner message="Loading domains and groups..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-0">
        <NavBar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-red-400 text-sm mb-2">Failed to load dashboard</p>
            <p className="text-text-tertiary text-xs">{error}</p>
            <p className="text-text-tertiary text-xs mt-4">
              Make sure the backend is running: <code className="text-text-secondary">npm run dev:server</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <NavBar />

      {/* Page controls */}
      <div className="border-b border-border-subtle bg-surface-0/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-heading text-text-primary tracking-tight">Skill Analytics</h1>
              <div className="w-px h-5 bg-border-subtle" />
              {/* Domain selector */}
              <select
                value={selectedDomain}
                onChange={handleDomainChange}
                className="bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-indigo-500/50 [&>option]:bg-surface-2 [&>option]:text-text-primary"
              >
                {domains.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name} ({d.stats.skills} skills)
                  </option>
                ))}
              </select>
              {/* Group selector */}
              <select
                value={selectedGroup}
                onChange={handleGroupChange}
                className="bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-indigo-500/50 [&>option]:bg-surface-2 [&>option]:text-text-primary"
              >
                <option value="">No group</option>
                {matchingGroups.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.name} ({g.memberCount} members)
                  </option>
                ))}
              </select>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              {selectedGroup && (
                <ExportButton
                  href={`/api/export/group/${selectedGroup}`}
                  label="Group PDF"
                  filename={`group-${selectedGroup}.pdf`}
                  variant="secondary"
                  size="sm"
                />
              )}
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
            <div className="flex items-center gap-1 bg-surface-1 border border-border-subtle rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("graph")}
                className={`px-3.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  viewMode === "graph"
                    ? "bg-indigo-500/15 text-indigo-400 shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
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
                    : "text-text-secondary hover:text-text-primary"
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
      </div>

      <main className="max-w-7xl mx-auto px-6 py-5">
        {!domainDetail ? (
          <div className="flex items-center justify-center h-[400px]">
            <LoadingSpinner message={`Loading ${domainName}...`} />
          </div>
        ) : viewMode === "graph" ? (
          <div className="space-y-4">
            {/* Learner selector bar */}
            {learnerIds.length > 0 && (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] text-text-tertiary uppercase tracking-[0.15em] font-semibold font-heading">
                    Learner View
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => { setSelectedLearner(null); setIsAutoPlaying(false); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedLearner === null
                          ? "bg-surface-2 text-text-primary border border-border"
                          : "text-text-tertiary border border-transparent hover:text-text-secondary hover:border-border-subtle"
                      }`}
                    >
                      Overview
                    </button>
                    {learnerIds.map((l) => (
                      <div key={l.id} className="relative">
                        <button
                          onClick={() => { setSelectedLearner(l.id); setIsAutoPlaying(false); }}
                          onMouseEnter={() => setHoveredLearner(l.id)}
                          onMouseLeave={() => setHoveredLearner(null)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedLearner === l.id
                              ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                              : "text-text-tertiary border border-transparent hover:text-text-secondary hover:border-border-subtle"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {l.name.split(" ")[0]}
                            {/* Mini assessed count badge */}
                            <span className={`text-[9px] px-1 py-0.5 rounded ${
                              selectedLearner === l.id
                                ? "bg-indigo-500/20 text-indigo-300"
                                : "bg-surface-2 text-text-tertiary"
                            }`}>
                              {l.assessed}/{totalSkills}
                            </span>
                          </span>
                        </button>
                        {/* Hover tooltip with skill summary */}
                        {hoveredLearner === l.id && (
                          <LearnerTooltip learner={l} totalSkills={totalSkills} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Watch all students button (renamed from Auto-cycle learners) */}
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isAutoPlaying
                      ? "bg-green-500/15 text-green-400 border border-green-500/20"
                      : "text-text-tertiary border border-border-subtle hover:text-text-secondary"
                  }`}
                >
                  {isAutoPlaying ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Watching
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Watch all students
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Learner stats bar (when a learner is selected) */}
            {learnerInfo && graphData.learnerName && (
              <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-surface-1 border border-border-subtle">
                <p className="text-xs font-semibold text-text-primary">{graphData.learnerName}</p>
                <div className="w-px h-4 bg-border-subtle" />
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="text-text-secondary">
                    <span className="font-semibold text-green-400">{learnerInfo.assessed}</span> assessed
                  </span>
                  <span className="text-text-secondary">
                    <span className="font-semibold text-yellow-400">{learnerInfo.inferred}</span> inferred
                  </span>
                  <span className="text-text-secondary">
                    <span className="font-semibold text-text-secondary">{learnerInfo.unknown}</span> unknown
                  </span>
                  <span className="text-text-secondary">
                    avg <span className="font-semibold text-text-primary">{Math.round(learnerInfo.avgConf * 100)}%</span>
                  </span>
                </div>
                <div className="flex-1" />
                {totalSkills > 0 && (
                  <div className="h-1.5 w-32 bg-surface-2 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div
                        className="bg-green-500/70 transition-all duration-500"
                        style={{ width: `${(learnerInfo.assessed / totalSkills) * 100}%` }}
                      />
                      <div
                        className="bg-yellow-500/50 transition-all duration-500"
                        style={{ width: `${(learnerInfo.inferred / totalSkills) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Graph */}
            <SkillDependencyGraph
              data={graphData}
              height={650}
              selectedLearner={selectedLearner}
            />
          </div>
        ) : (
          /* Group Dashboard view */
          dashboardData ? (
            <GroupDashboard data={dashboardData} />
          ) : (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <p className="text-text-secondary text-sm">No group selected for this domain</p>
                <p className="text-text-tertiary text-xs mt-1">
                  Select a group from the dropdown above, or switch to the Dependency Graph view
                </p>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-0">
        <NavBar />
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
