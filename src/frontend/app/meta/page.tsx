"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface ReasoningTrace {
  id: string;
  sectionId?: string;
  decisionType: string;
  decision: string;
  reasoning: string;
  evidence: {
    skillGraph?: string[];
    learnerProfiles?: string[];
    bloomsLevels?: string[];
    constraints?: string[];
    teachingWisdom?: string[];
    educatorProfile?: string[];
  };
  alternativesConsidered?: Array<{
    option: string;
    whyRejected: string;
  }>;
  wouldChangeIf?: string;
}

interface LessonTraces {
  lessonId: string;
  domain: string;
  groupName: string;
  createdAt: string;
  traceCount: number;
  traces: ReasoningTrace[];
}

interface LessonSummary {
  lessonId: string;
  domain: string;
  groupName: string;
  traceCount: number;
  createdAt: string;
  decisionTypes: Record<string, number>;
}

const DECISION_TYPE_META: Record<
  string,
  { label: string; color: string; icon: string; description: string }
> = {
  ordering: {
    label: "Ordering",
    color: "text-blue-400",
    icon: "↕",
    description: "Why activities appear in this sequence",
  },
  timing: {
    label: "Timing",
    color: "text-amber-400",
    icon: "⏱",
    description: "Why N minutes for this section",
  },
  pairing: {
    label: "Pairing",
    color: "text-purple-400",
    icon: "👥",
    description: "Why these learners are paired (or solo)",
  },
  activity_choice: {
    label: "Activity Choice",
    color: "text-emerald-400",
    icon: "🎯",
    description: "Why this type of activity was chosen",
  },
  content_depth: {
    label: "Content Depth",
    color: "text-cyan-400",
    icon: "📝",
    description: "Why this level of detail in the plan",
  },
  contingency: {
    label: "Contingency",
    color: "text-red-400",
    icon: "🔄",
    description: "Why these backup plans were chosen",
  },
};

function EvidenceTag({
  type,
  items,
}: {
  type: string;
  items: string[];
}) {
  if (!items || items.length === 0) return null;
  const colors: Record<string, string> = {
    skillGraph: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    learnerProfiles:
      "bg-purple-500/10 text-purple-300 border-purple-500/20",
    bloomsLevels:
      "bg-amber-500/10 text-amber-300 border-amber-500/20",
    constraints: "bg-red-500/10 text-red-300 border-red-500/20",
    teachingWisdom:
      "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    educatorProfile:
      "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  };
  const labels: Record<string, string> = {
    skillGraph: "Skill Graph",
    learnerProfiles: "Learner Profiles",
    bloomsLevels: "Bloom's Taxonomy",
    constraints: "Constraints",
    teachingWisdom: "Teaching Wisdom",
    educatorProfile: "Educator Profile",
  };

  return (
    <div className="mb-3">
      <div
        className={`text-xs font-medium mb-1.5 ${colors[type]?.split(" ")[1] || "text-text-tertiary"}`}
      >
        {labels[type] || type}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className={`text-xs px-2 py-0.5 rounded border ${colors[type] || "bg-surface-2 text-text-tertiary border-border-subtle"}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function TraceCard({
  trace,
  expanded,
  onToggle,
}: {
  trace: ReasoningTrace;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = DECISION_TYPE_META[trace.decisionType] || {
    label: trace.decisionType,
    color: "text-text-secondary",
    icon: "•",
    description: "",
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden animate-fade-in">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 hover:bg-surface-2/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}
              >
                {meta.label}
              </span>
              {trace.sectionId && (
                <code className="text-xs px-1.5 py-0.5 bg-surface-2 rounded text-text-tertiary font-mono">
                  {trace.sectionId}
                </code>
              )}
            </div>
            <h3 className="text-sm font-medium text-text-primary leading-snug">
              {trace.decision}
            </h3>
            {!expanded && (
              <p className="text-xs text-text-tertiary mt-1 line-clamp-2">
                {trace.reasoning}
              </p>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-text-tertiary transition-transform flex-shrink-0 mt-1 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border-subtle">
          {/* Reasoning */}
          <div className="mt-4 mb-5">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Reasoning
            </div>
            <p className="text-sm text-text-primary leading-relaxed">
              {trace.reasoning}
            </p>
          </div>

          {/* Evidence */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Evidence
            </div>
            <div className="rounded-lg bg-surface-0 p-4 space-y-1">
              {trace.evidence.skillGraph && (
                <EvidenceTag
                  type="skillGraph"
                  items={trace.evidence.skillGraph}
                />
              )}
              {trace.evidence.learnerProfiles && (
                <EvidenceTag
                  type="learnerProfiles"
                  items={trace.evidence.learnerProfiles}
                />
              )}
              {trace.evidence.bloomsLevels && (
                <EvidenceTag
                  type="bloomsLevels"
                  items={trace.evidence.bloomsLevels}
                />
              )}
              {trace.evidence.constraints && (
                <EvidenceTag
                  type="constraints"
                  items={trace.evidence.constraints}
                />
              )}
              {trace.evidence.teachingWisdom && (
                <EvidenceTag
                  type="teachingWisdom"
                  items={trace.evidence.teachingWisdom}
                />
              )}
              {trace.evidence.educatorProfile && (
                <EvidenceTag
                  type="educatorProfile"
                  items={trace.evidence.educatorProfile}
                />
              )}
            </div>
          </div>

          {/* Alternatives considered */}
          {trace.alternativesConsidered &&
            trace.alternativesConsidered.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Alternatives Considered
                </div>
                <div className="space-y-2">
                  {trace.alternativesConsidered.map((alt, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border-subtle bg-surface-0 p-3"
                    >
                      <div className="text-sm font-medium text-text-primary mb-1">
                        {alt.option}
                      </div>
                      <div className="text-xs text-text-secondary leading-relaxed">
                        <span className="text-red-400 font-medium">
                          Rejected:
                        </span>{" "}
                        {alt.whyRejected}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* What would change */}
          {trace.wouldChangeIf && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
              <div className="text-xs font-semibold text-accent mb-1">
                What would change this decision?
              </div>
              <p className="text-sm text-text-primary leading-relaxed">
                {trace.wouldChangeIf}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MetaPage() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [traces, setTraces] = useState<LessonTraces | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(
    new Set()
  );
  const [filterType, setFilterType] = useState<string>("all");

  // Load lesson list
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/reasoning`)
      .then((res) => res.json())
      .then((data) => {
        const list = data.lessons || [];
        setLessons(list);
        if (list.length > 0) {
          setSelectedLesson(list[0].lessonId);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Load traces when lesson changes
  useEffect(() => {
    if (!selectedLesson) return;
    setLoading(true);
    setExpandedTraces(new Set());
    fetch(`${BACKEND_URL}/api/reasoning/${selectedLesson}`)
      .then((res) => res.json())
      .then((data) => {
        setTraces(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedLesson]);

  const toggleTrace = (id: string) => {
    setExpandedTraces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (traces) {
      setExpandedTraces(new Set(traces.traces.map((t) => t.id)));
    }
  };

  const collapseAll = () => {
    setExpandedTraces(new Set());
  };

  // Filter traces
  const filteredTraces = traces
    ? traces.traces.filter(
        (t) => filterType === "all" || t.decisionType === filterType
      )
    : [];

  // Decision type counts
  const typeCounts = traces
    ? traces.traces.reduce(
        (acc, t) => {
          acc[t.decisionType] = (acc[t.decisionType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    : {};

  // Evidence type counts
  const evidenceCounts = traces
    ? traces.traces.reduce(
        (acc, t) => {
          for (const [key, val] of Object.entries(t.evidence)) {
            if (Array.isArray(val) && val.length > 0) {
              acc[key] = (acc[key] || 0) + 1;
            }
          }
          return acc;
        },
        {} as Record<string, number>
      )
    : {};

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-text-primary">
              Pedagogical Engine
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/teach"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Teach
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/lessons"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Lessons
          </Link>
          <Link
            href="/wisdom"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Wisdom
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            The Why Behind the What
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl">
            Every decision in a lesson plan is traceable to specific evidence
            — the skill graph, learner profiles, constraints, and Bloom&apos;s
            taxonomy levels. Explore the reasoning behind any decision.
          </p>
        </div>

        {/* Lesson selector */}
        <div className="flex items-center gap-4 mb-8">
          <label className="text-sm text-text-secondary">
            Lesson plan:
          </label>
          <select
            value={selectedLesson}
            onChange={(e) => {
              setSelectedLesson(e.target.value);
              setFilterType("all");
            }}
            className="px-3 py-1.5 bg-surface-1 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 max-w-md"
          >
            {lessons.map((l) => (
              <option key={l.lessonId} value={l.lessonId}>
                {l.lessonId.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/-/g, " ")} ({l.traceCount} traces)
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="animate-pulse-subtle text-text-tertiary">
              Loading reasoning traces...
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {traces && !loading && (
          <>
            {/* Overview callout */}
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 mb-8">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔍</div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    Transparent Reasoning
                  </div>
                  <div className="text-sm text-text-secondary mt-1">
                    This lesson plan has{" "}
                    <strong>{traces.traceCount} traced decisions</strong>{" "}
                    across{" "}
                    {Object.keys(typeCounts).length} decision types.
                    Every major choice — from activity ordering to student
                    pairings to timing allocations — is grounded in specific
                    evidence from the skill graph, learner profiles, and
                    accumulated teaching wisdom.
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3">
                    {Object.entries(evidenceCounts).map(([type, count]) => {
                      const labels: Record<string, string> = {
                        skillGraph: "Skill Graph",
                        learnerProfiles: "Learner Profiles",
                        bloomsLevels: "Bloom's Taxonomy",
                        constraints: "Constraints",
                        teachingWisdom: "Teaching Wisdom",
                        educatorProfile: "Educator Profile",
                      };
                      return (
                        <div
                          key={type}
                          className="text-xs text-text-tertiary"
                        >
                          <span className="font-medium text-text-secondary">
                            {labels[type] || type}
                          </span>{" "}
                          cited in {count}{" "}
                          {count === 1 ? "decision" : "decisions"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
              {Object.entries(DECISION_TYPE_META).map(([key, meta]) => {
                const count = typeCounts[key] || 0;
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setFilterType(filterType === key ? "all" : key)
                    }
                    className={`rounded-xl border p-3 text-left transition-all ${
                      filterType === key
                        ? "border-accent bg-accent/5"
                        : "border-border-subtle bg-surface-1 hover:border-border"
                    }`}
                  >
                    <div className="text-lg mb-1">{meta.icon}</div>
                    <div className="text-lg font-bold text-text-primary">
                      {count}
                    </div>
                    <div
                      className={`text-xs font-medium ${meta.color}`}
                    >
                      {meta.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-xs text-text-tertiary">
                Showing {filteredTraces.length} of {traces.traceCount}{" "}
                traces
                {filterType !== "all" && (
                  <button
                    onClick={() => setFilterType("all")}
                    className="ml-2 text-accent hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="text-xs text-text-tertiary hover:text-text-secondary"
                >
                  Expand all
                </button>
                <span className="text-text-tertiary">|</span>
                <button
                  onClick={collapseAll}
                  className="text-xs text-text-tertiary hover:text-text-secondary"
                >
                  Collapse all
                </button>
              </div>
            </div>

            {/* Trace cards */}
            <div className="space-y-3">
              {filteredTraces.map((trace) => (
                <TraceCard
                  key={trace.id}
                  trace={trace}
                  expanded={expandedTraces.has(trace.id)}
                  onToggle={() => toggleTrace(trace.id)}
                />
              ))}
            </div>

            {filteredTraces.length === 0 && (
              <div className="text-center py-12 text-text-tertiary text-sm">
                No traces match the current filter.
              </div>
            )}

            {/* Teaching principles reference */}
            <div className="mt-12 rounded-xl border border-border-subtle bg-surface-1 p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-1">
                Pedagogical Principles at Work
              </h3>
              <p className="text-xs text-text-secondary mb-4">
                The engine draws on these frameworks when making decisions.
                Ask &quot;why?&quot; in the chat to hear the reasoning behind any
                specific decision.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  {
                    name: "Bloom's Taxonomy & Activity Ordering",
                    desc: "Group Bloom's level determines theory-first vs. practice-first sequencing",
                  },
                  {
                    name: "Evidence-Based Timing",
                    desc: "Bloom's complexity + group readiness + teaching wisdom = calibrated timing",
                  },
                  {
                    name: "Skill-Complementary Pairing",
                    desc: "1 Bloom's level gap is ideal; 2+ means the advanced partner does all the work",
                  },
                  {
                    name: "Session Energy Management",
                    desc: "Peak activity in the middle third; never end with a lecture",
                  },
                  {
                    name: "Content Depth by Educator Expertise",
                    desc: "Expert gets bullets; novice gets the full script with anticipated questions",
                  },
                  {
                    name: "Contingency as Pedagogical Design",
                    desc: "Scaffold down, extend up, analog fallback — matched to educator style",
                  },
                ].map((principle) => (
                  <div
                    key={principle.name}
                    className="rounded-lg bg-surface-0 p-3"
                  >
                    <div className="text-xs font-medium text-text-primary">
                      {principle.name}
                    </div>
                    <div className="text-xs text-text-tertiary mt-0.5">
                      {principle.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!loading && lessons.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              No reasoning traces yet
            </h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              Compose a lesson plan through the{" "}
              <Link href="/teach" className="text-accent hover:underline">
                educator chat
              </Link>{" "}
              and the engine will automatically generate reasoning traces
              for every major decision.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
