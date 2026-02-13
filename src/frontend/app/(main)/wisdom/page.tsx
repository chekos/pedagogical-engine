"use client";

import { useState, useEffect, useMemo } from "react";
import { BACKEND_URL } from "@/lib/constants";

interface TeachingNote {
  id: string;
  skillId: string;
  type: string;
  observation: string;
  confidence: number;
  sessionCount: number;
  confirmedIn: string[];
  context: Record<string, unknown>;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface TeachingPattern {
  id: string;
  type: string;
  title: string;
  description: string;
  affectedSkills: string[];
  confidence: number;
  sessionCount: number;
  recommendation: string;
  createdAt: string;
}

interface WisdomData {
  domain: string;
  sessionCount: number;
  lastUpdated: string;
  notes: TeachingNote[];
  patterns: TeachingPattern[];
}

interface DomainInfo {
  slug: string;
  name: string;
}

const NOTE_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  timing: { label: "Timing", color: "text-amber-400", icon: "⏱" },
  success_pattern: { label: "Success Pattern", color: "text-emerald-400", icon: "✓" },
  confusion_point: { label: "Confusion Point", color: "text-red-400", icon: "⚠" },
  failure_pattern: { label: "Failure Pattern", color: "text-red-500", icon: "✗" },
  activity_recommendation: { label: "Activity Idea", color: "text-blue-400", icon: "💡" },
  group_composition: { label: "Group Insight", color: "text-purple-400", icon: "👥" },
  accessibility: { label: "Accessibility", color: "text-cyan-400", icon: "♿" },
};

const PATTERN_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  timing: { label: "Timing Pattern", color: "bg-amber-500/20 text-amber-300" },
  engagement: { label: "Engagement Pattern", color: "bg-blue-500/20 text-blue-300" },
  success: { label: "Success Pattern", color: "bg-emerald-500/20 text-emerald-300" },
  confusion: { label: "Confusion Pattern", color: "bg-red-500/20 text-red-300" },
  group_composition: { label: "Group Pattern", color: "bg-purple-500/20 text-purple-300" },
};

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 85
      ? "bg-emerald-500"
      : pct >= 70
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-tertiary">{pct}%</span>
    </div>
  );
}

export default function WisdomPage() {
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [wisdom, setWisdom] = useState<WisdomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSkill, setFilterSkill] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"notes" | "patterns">("notes");

  // Load domains
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/domains`)
      .then((res) => res.json())
      .then((data) => {
        const domainList = (data.domains || []).map(
          (d: { slug: string; name: string }) => ({
            slug: d.slug,
            name: d.name,
          })
        );
        setDomains(domainList);
        if (domainList.length > 0) {
          // Default to python-data-analysis if available
          const defaultDomain =
            domainList.find(
              (d: DomainInfo) => d.slug === "python-data-analysis"
            ) || domainList[0];
          setSelectedDomain(defaultDomain.slug);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Load wisdom when domain changes
  useEffect(() => {
    if (!selectedDomain) return;
    setLoading(true);
    fetch(`${BACKEND_URL}/api/wisdom/${selectedDomain}`)
      .then((res) => res.json())
      .then((data) => {
        setWisdom(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedDomain]);

  // Get unique skill IDs for filter
  const skillIds = useMemo(
    () =>
      wisdom
        ? [...new Set(wisdom.notes.map((n) => n.skillId))].sort()
        : [],
    [wisdom]
  );

  // Filter notes
  const filteredNotes = useMemo(
    () =>
      wisdom
        ? wisdom.notes
            .filter((n) => filterType === "all" || n.type === filterType)
            .filter((n) => filterSkill === "all" || n.skillId === filterSkill)
            .sort((a, b) => b.confidence - a.confidence)
        : [],
    [wisdom, filterType, filterSkill]
  );

  // Stats
  const stats = useMemo(
    () =>
      wisdom
        ? {
            totalNotes: wisdom.notes.length,
            totalPatterns: wisdom.patterns.length,
            avgConfidence:
              wisdom.notes.length > 0
                ? Math.round(
                    (wisdom.notes.reduce((s, n) => s + n.confidence, 0) /
                      wisdom.notes.length) *
                      100
                  )
                : 0,
            typeCounts: wisdom.notes.reduce(
              (acc, n) => {
                acc[n.type] = (acc[n.type] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            ),
            highConfidenceCount: wisdom.notes.filter((n) => n.confidence >= 0.85)
              .length,
          }
        : null,
    [wisdom]
  );

  return (
    <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            Teaching Wisdom
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Accumulated teaching insights from post-session debriefs. Every
            session taught through the engine makes future plans better.
          </p>
        </div>

        {/* Domain selector */}
        <div className="flex items-center gap-4 mb-8">
          <label className="text-sm text-text-secondary">Domain:</label>
          <select
            value={selectedDomain}
            onChange={(e) => {
              setSelectedDomain(e.target.value);
              setFilterType("all");
              setFilterSkill("all");
            }}
            className="px-3 py-1.5 bg-surface-1 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {domains.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="animate-pulse-subtle text-text-tertiary">
              Loading teaching wisdom...
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {wisdom && stats && !loading && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
                <div className="text-2xl font-bold text-text-primary">
                  {wisdom.sessionCount}
                </div>
                <div className="text-xs text-text-tertiary mt-1">
                  Sessions Analyzed
                </div>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
                <div className="text-2xl font-bold text-text-primary">
                  {stats.totalNotes}
                </div>
                <div className="text-xs text-text-tertiary mt-1">
                  Teaching Notes
                </div>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
                <div className="text-2xl font-bold text-text-primary">
                  {stats.totalPatterns}
                </div>
                <div className="text-xs text-text-tertiary mt-1">
                  Patterns Detected
                </div>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
                <div className="text-2xl font-bold text-text-primary">
                  {stats.avgConfidence}%
                </div>
                <div className="text-xs text-text-tertiary mt-1">
                  Avg Confidence
                </div>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
                <div className="text-2xl font-bold text-emerald-400">
                  {stats.highConfidenceCount}
                </div>
                <div className="text-xs text-text-tertiary mt-1">
                  High Confidence (&gt;85%)
                </div>
              </div>
            </div>

            {/* Flywheel callout */}
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 mb-8">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔄</div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    The Flywheel Effect
                  </div>
                  <div className="text-sm text-text-secondary mt-1">
                    This domain has been taught across{" "}
                    <strong>{wisdom.sessionCount} sessions</strong>. Every
                    debrief adds to the wisdom layer — timing calibrations,
                    confusion patterns, activity recommendations. The next
                    educator to teach this domain gets a plan informed by all{" "}
                    {wisdom.sessionCount} sessions of accumulated experience.
                  </div>
                  <div className="text-xs text-text-tertiary mt-2">
                    Last updated:{" "}
                    {new Date(wisdom.lastUpdated).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-border-subtle">
              <button
                onClick={() => setActiveTab("notes")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "notes"
                    ? "border-accent text-accent"
                    : "border-transparent text-text-tertiary hover:text-text-secondary"
                }`}
              >
                Teaching Notes ({stats.totalNotes})
              </button>
              <button
                onClick={() => setActiveTab("patterns")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "patterns"
                    ? "border-accent text-accent"
                    : "border-transparent text-text-tertiary hover:text-text-secondary"
                }`}
              >
                Cross-Skill Patterns ({stats.totalPatterns})
              </button>
            </div>

            {activeTab === "notes" && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-tertiary">Type:</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-2 py-1 bg-surface-1 border border-border rounded text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50"
                    >
                      <option value="all">All types</option>
                      {Object.entries(NOTE_TYPE_LABELS).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}{" "}
                          {stats.typeCounts[key]
                            ? `(${stats.typeCounts[key]})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-tertiary">Skill:</label>
                    <select
                      value={filterSkill}
                      onChange={(e) => setFilterSkill(e.target.value)}
                      className="px-2 py-1 bg-surface-1 border border-border rounded text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50"
                    >
                      <option value="all">All skills</option>
                      {skillIds.map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-text-tertiary ml-auto">
                    Showing {filteredNotes.length} of {stats.totalNotes} notes
                  </div>
                </div>

                {/* Notes list */}
                <div className="space-y-3">
                  {filteredNotes.map((note) => {
                    const typeInfo = NOTE_TYPE_LABELS[note.type] || {
                      label: note.type,
                      color: "text-text-secondary",
                      icon: "•",
                    };
                    return (
                      <div
                        key={note.id}
                        className="rounded-xl border border-border-subtle bg-surface-1 p-4 animate-fade-in"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-sm ${typeInfo.color}`}>
                                {typeInfo.icon}
                              </span>
                              <span
                                className={`text-xs font-medium ${typeInfo.color}`}
                              >
                                {typeInfo.label}
                              </span>
                              <span className="text-xs text-text-tertiary">
                                •
                              </span>
                              <code className="text-xs px-1.5 py-0.5 bg-surface-2 rounded text-text-secondary font-mono">
                                {note.skillId}
                              </code>
                              {note.source === "educator_direct" && (
                                <span className="text-xs px-1.5 py-0.5 bg-accent/10 text-accent rounded">
                                  educator note
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-text-primary leading-relaxed">
                              {note.observation}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <ConfidenceBar confidence={note.confidence} />
                              <span className="text-xs text-text-tertiary">
                                Confirmed in {note.sessionCount} session
                                {note.sessionCount !== 1 ? "s" : ""}
                              </span>
                              {typeof note.context.groupLevel === "string" &&
                                note.context.groupLevel !== "any" && (
                                  <span className="text-xs px-1.5 py-0.5 bg-surface-2 rounded text-text-tertiary">
                                    {String(note.context.groupLevel)}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredNotes.length === 0 && (
                  <div className="text-center py-12 text-text-tertiary text-sm">
                    No notes match the current filters.
                  </div>
                )}
              </>
            )}

            {activeTab === "patterns" && (
              <div className="space-y-4">
                {wisdom.patterns.map((pattern) => {
                  const typeInfo = PATTERN_TYPE_LABELS[pattern.type] || {
                    label: pattern.type,
                    color: "bg-surface-2 text-text-secondary",
                  };
                  return (
                    <div
                      key={pattern.id}
                      className="rounded-xl border border-border-subtle bg-surface-1 p-5 animate-fade-in"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded ${typeInfo.color}`}
                            >
                              {typeInfo.label}
                            </span>
                            <ConfidenceBar confidence={pattern.confidence} />
                            <span className="text-xs text-text-tertiary">
                              {pattern.sessionCount} sessions
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-text-primary mb-1">
                            {pattern.title}
                          </h3>
                          <p className="text-sm text-text-secondary leading-relaxed mb-3">
                            {pattern.description}
                          </p>
                          <div className="rounded-lg bg-surface-2 p-3">
                            <div className="text-xs font-medium text-text-secondary mb-1">
                              Recommendation
                            </div>
                            <p className="text-sm text-text-primary">
                              {pattern.recommendation}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {pattern.affectedSkills.map((skill) => (
                              <code
                                key={skill}
                                className="text-xs px-1.5 py-0.5 bg-surface-2 rounded text-text-tertiary font-mono"
                              >
                                {skill}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {wisdom.patterns.length === 0 && (
                  <div className="text-center py-12 text-text-tertiary text-sm">
                    No cross-skill patterns detected yet. Patterns emerge after
                    3+ sessions.
                  </div>
                )}
              </div>
            )}

            {/* Type distribution mini-chart */}
            <div className="mt-10 rounded-xl border border-border-subtle bg-surface-1 p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                Note Type Distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(NOTE_TYPE_LABELS).map(
                  ([key, { label, color, icon }]) => {
                    const count = stats.typeCounts[key] || 0;
                    const maxCount = Math.max(
                      ...Object.values(stats.typeCounts),
                      1
                    );
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-5 text-center">{icon}</span>
                        <span
                          className={`text-xs w-36 ${color} font-medium`}
                        >
                          {label}
                        </span>
                        <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent/60 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-tertiary w-6 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </>
        )}
    </div>
  );
}
