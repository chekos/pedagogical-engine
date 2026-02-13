"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  fetchSimulation,
  type SimulationResult,
  type SectionAnalysis,
  type FrictionPoint,
  type CascadeRisk,
  type PivotSuggestion,
  type CollisionMoment,
} from "@/lib/api";

// ─── Color helpers ──────────────────────────────────────────────

function readinessColor(readiness: "ready" | "partial" | "gap"): string {
  switch (readiness) {
    case "ready":
      return "bg-emerald-500";
    case "partial":
      return "bg-amber-400";
    case "gap":
      return "bg-red-500";
  }
}

function readinessBg(readiness: "ready" | "partial" | "gap"): string {
  switch (readiness) {
    case "ready":
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    case "partial":
      return "bg-amber-400/10 border-amber-400/20 text-amber-400";
    case "gap":
      return "bg-red-500/10 border-red-500/20 text-red-400";
  }
}

function confidenceColor(score: number): string {
  if (score >= 0.8) return "text-emerald-400";
  if (score >= 0.6) return "text-amber-400";
  if (score >= 0.4) return "text-orange-400";
  return "text-red-400";
}

function confidenceBg(score: number): string {
  if (score >= 0.8) return "bg-emerald-500/10 border-emerald-500/30";
  if (score >= 0.6) return "bg-amber-400/10 border-amber-400/30";
  if (score >= 0.4) return "bg-orange-400/10 border-orange-400/30";
  return "bg-red-500/10 border-red-500/30";
}

function severityLabel(severity: number): string {
  if (severity >= 0.7) return "Critical";
  if (severity >= 0.4) return "High";
  if (severity >= 0.2) return "Medium";
  return "Low";
}

function severityColor(severity: number): string {
  if (severity >= 0.7) return "text-red-400 bg-red-500/10 border-red-500/20";
  if (severity >= 0.4) return "text-orange-400 bg-orange-400/10 border-orange-400/20";
  return "text-amber-400 bg-amber-400/10 border-amber-400/20";
}

// ─── Confidence Score Ring ──────────────────────────────────────

function ConfidenceRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score);
  const color =
    score >= 0.8
      ? "#10b981"
      : score >= 0.6
        ? "#f59e0b"
        : score >= 0.4
          ? "#f97316"
          : "#ef4444";

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-surface-3"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-text-primary">
          {Math.round(score * 100)}
        </span>
        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
          confidence
        </span>
      </div>
    </div>
  );
}

// ─── Simulation Timeline ────────────────────────────────────────

function SimulationTimeline({
  sections,
  totalMinutes,
}: {
  sections: SectionAnalysis[];
  totalMinutes: number;
}) {
  // Get unique learner names across all sections
  const learnerNames: string[] = [];
  if (sections.length > 0 && sections[0].learnerStatuses.length > 0) {
    for (const status of sections[0].learnerStatuses) {
      learnerNames.push(status.learnerName);
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Time header */}
        <div className="flex items-end mb-1 pl-28">
          {sections.map((s) => {
            const widthPct = ((s.endMin - s.startMin) / totalMinutes) * 100;
            return (
              <div
                key={s.sectionIndex}
                className="text-[10px] text-text-tertiary px-0.5 overflow-hidden"
                style={{ width: `${widthPct}%` }}
              >
                <span className="block truncate">{s.startMin}m</span>
              </div>
            );
          })}
          <div className="text-[10px] text-text-tertiary">
            {totalMinutes}m
          </div>
        </div>

        {/* Section title header */}
        <div className="flex mb-2 pl-28">
          {sections.map((s) => {
            const widthPct = ((s.endMin - s.startMin) / totalMinutes) * 100;
            return (
              <div
                key={s.sectionIndex}
                className="text-[10px] text-text-secondary font-medium px-0.5 overflow-hidden"
                style={{ width: `${widthPct}%` }}
                title={s.sectionTitle}
              >
                <span className="block truncate">{s.sectionTitle}</span>
              </div>
            );
          })}
        </div>

        {/* Learner lanes */}
        {learnerNames.map((name) => (
          <div key={name} className="flex items-center mb-1">
            <div className="w-28 pr-2 text-xs text-text-secondary font-medium truncate flex-shrink-0">
              {name}
            </div>
            <div className="flex flex-1">
              {sections.map((s) => {
                const widthPct =
                  ((s.endMin - s.startMin) / totalMinutes) * 100;
                const learnerStatus = s.learnerStatuses.find(
                  (ls) => ls.learnerName === name
                );
                const readiness = learnerStatus?.readiness ?? "ready";

                return (
                  <div
                    key={s.sectionIndex}
                    className="px-0.5"
                    style={{ width: `${widthPct}%` }}
                    title={`${name}: ${readiness} (${Math.round((learnerStatus?.confidence ?? 1) * 100)}% confidence)${
                      learnerStatus?.missingSkills.length
                        ? `\nMissing: ${learnerStatus.missingSkills.join(", ")}`
                        : ""
                    }`}
                  >
                    <div
                      className={`h-6 rounded-sm ${readinessColor(readiness)} transition-all`}
                      style={{
                        opacity:
                          readiness === "ready"
                            ? 0.7
                            : readiness === "partial"
                              ? 0.8
                              : 0.9,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 pl-28 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-70" />
            <span className="text-[10px] text-text-tertiary">Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-400 opacity-80" />
            <span className="text-[10px] text-text-tertiary">Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500 opacity-90" />
            <span className="text-[10px] text-text-tertiary">Gap</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Drill-Down ─────────────────────────────────────────

function SectionCard({
  section,
  frictionPoints,
  collisions,
  cascades,
  pivots,
}: {
  section: SectionAnalysis;
  frictionPoints: FrictionPoint[];
  collisions: CollisionMoment[];
  cascades: CascadeRisk[];
  pivots: PivotSuggestion[];
}) {
  const [expanded, setExpanded] = useState(false);
  const friction = frictionPoints.find(
    (f) => f.sectionIndex === section.sectionIndex
  );
  const collision = collisions.find(
    (c) => c.sectionIndex === section.sectionIndex
  );
  const sectionCascades = cascades.filter(
    (c) => c.downstreamSection === section.sectionIndex
  );
  const sectionPivots = pivots.filter(
    (p) => p.sectionIndex === section.sectionIndex
  );
  const hasIssues = friction || collision || sectionCascades.length > 0;

  return (
    <div
      className={`rounded-xl border ${
        hasIssues ? "border-amber-400/30" : "border-border"
      } bg-surface-1 overflow-hidden`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left"
      >
        {/* Time badge */}
        <span className="text-xs font-mono text-text-tertiary w-20 flex-shrink-0">
          {section.startMin}:{String(0).padStart(2, "0")} -{" "}
          {section.endMin}:{String(0).padStart(2, "0")}
        </span>

        {/* Title */}
        <span className="text-sm font-medium text-text-primary flex-1 truncate">
          {section.sectionTitle}
        </span>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {section.readyCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {section.readyCount} ready
            </span>
          )}
          {section.partialCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20">
              {section.partialCount} partial
            </span>
          )}
          {section.gapCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
              {section.gapCount} gap
            </span>
          )}
        </div>

        {/* Expand icon */}
        <svg
          className={`w-4 h-4 text-text-tertiary transition-transform ${expanded ? "rotate-180" : ""}`}
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
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border-subtle">
          {/* Learner grid */}
          <div className="pt-3">
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Learner Readiness
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {section.learnerStatuses.map((ls) => (
                <div
                  key={ls.learnerId}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${readinessBg(ls.readiness)}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${readinessColor(ls.readiness)}`}
                  />
                  <span className="text-xs font-medium flex-1">
                    {ls.learnerName}
                  </span>
                  <span className="text-[10px] opacity-70">
                    {Math.round(ls.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills info */}
          {(section.requiredSkills.length > 0 ||
            section.taughtSkills.length > 0) && (
            <div>
              <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {section.requiredSkills.map((s) => (
                  <span
                    key={s}
                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono ${
                      section.taughtSkills.includes(s)
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-surface-2 text-text-secondary border border-border-subtle"
                    }`}
                  >
                    {section.taughtSkills.includes(s) && "teaching: "}
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Friction point */}
          {friction && (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-4 h-4 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="text-xs font-semibold text-amber-400">
                  Friction Point
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${severityColor(friction.severity)}`}
                >
                  {severityLabel(friction.severity)}
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                {friction.description}
              </p>
            </div>
          )}

          {/* Collision moment */}
          {collision && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-4 h-4 text-red-400"
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
                <span className="text-xs font-semibold text-red-400">
                  Collision Moment
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                {collision.description}
              </p>
            </div>
          )}

          {/* Cascade risks */}
          {sectionCascades.map((cascade, i) => (
            <div
              key={i}
              className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-4 h-4 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                <span className="text-xs font-semibold text-purple-400">
                  Cascade Risk
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                {cascade.description}
              </p>
            </div>
          ))}

          {/* Pivot suggestions */}
          {sectionPivots.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Pivot Suggestions
              </h4>
              <div className="space-y-2">
                {sectionPivots.map((pivot, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg bg-surface-2 border border-border-subtle p-3"
                  >
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        pivot.type === "reteach"
                          ? "bg-blue-500/10 text-blue-400"
                          : pivot.type === "pair"
                            ? "bg-green-500/10 text-green-400"
                            : pivot.type === "substitute"
                              ? "bg-purple-500/10 text-purple-400"
                              : "bg-amber-400/10 text-amber-400"
                      }`}
                    >
                      {pivot.type}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-text-secondary">
                        {pivot.description}
                      </p>
                      {pivot.timeCostMin > 0 && (
                        <p className="text-[10px] text-text-tertiary mt-0.5">
                          Time cost: ~{pivot.timeCostMin} min
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function SimulateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const lessonId = resolvedParams.id;
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSimulation(lessonId)
      .then((result) => {
        setSimulation(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [lessonId]);

  const totalMinutes =
    simulation?.sectionAnalysis.length
      ? Math.max(...simulation.sectionAnalysis.map((s) => s.endMin))
      : 0;

  return (
    <div>
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <p className="text-sm text-text-secondary">
              Running simulation...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <p className="text-sm text-red-400 font-medium">
              Simulation failed
            </p>
            <p className="text-xs text-red-400/70 mt-1">{error}</p>
            <p className="text-xs text-text-tertiary mt-2">
              Make sure the backend server is running and the lesson plan,
              group, and learner profiles exist.
            </p>
          </div>
        )}

        {simulation && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href="/simulate"
                    className="text-xs text-text-tertiary hover:text-accent transition-colors"
                  >
                    Simulations
                  </Link>
                  <span className="text-xs text-text-tertiary">/</span>
                </div>
                <h1 className="text-xl font-bold text-text-primary">
                  {simulation.lessonTitle}
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                  {simulation.groupName} &middot; {simulation.domain} &middot;{" "}
                  {totalMinutes} min
                </p>

                {/* Quick stats */}
                <div className="flex items-center gap-3 mt-4">
                  {simulation.frictionPoints.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01"
                        />
                      </svg>
                      {simulation.frictionPoints.length} friction point
                      {simulation.frictionPoints.length !== 1 && "s"}
                    </span>
                  )}
                  {simulation.collisionMoments.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      <svg
                        className="w-3.5 h-3.5"
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
                      {simulation.collisionMoments.length} collision
                      {simulation.collisionMoments.length !== 1 && "s"}
                    </span>
                  )}
                  {simulation.cascadeRisks.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                      {simulation.cascadeRisks.length} cascade risk
                      {simulation.cascadeRisks.length !== 1 && "s"}
                    </span>
                  )}
                  {simulation.frictionPoints.length === 0 &&
                    simulation.collisionMoments.length === 0 &&
                    simulation.cascadeRisks.length === 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        No major issues detected
                      </span>
                    )}
                </div>
              </div>

              {/* Confidence ring */}
              <ConfidenceRing score={simulation.overallConfidence} />
            </div>

            {/* Timeline visualization */}
            <div
              className={`rounded-xl border p-5 ${confidenceBg(simulation.overallConfidence)} bg-surface-1`}
            >
              <h2 className="text-sm font-semibold text-text-primary mb-4">
                Simulation Timeline
              </h2>
              <SimulationTimeline
                sections={simulation.sectionAnalysis}
                totalMinutes={totalMinutes}
              />
            </div>

            {/* Section-by-section analysis */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">
                Section Analysis
              </h2>
              <div className="space-y-2">
                {simulation.sectionAnalysis.map((section) => (
                  <SectionCard
                    key={section.sectionIndex}
                    section={section}
                    frictionPoints={simulation.frictionPoints}
                    collisions={simulation.collisionMoments}
                    cascades={simulation.cascadeRisks}
                    pivots={simulation.pivotSuggestions}
                  />
                ))}
              </div>
            </div>

            {/* Summary cards */}
            {(simulation.frictionPoints.length > 0 ||
              simulation.cascadeRisks.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Friction summary */}
                {simulation.frictionPoints.length > 0 && (
                  <div className="rounded-xl border border-amber-400/20 bg-surface-1 p-5">
                    <h3 className="text-sm font-semibold text-amber-400 mb-3">
                      Friction Points Summary
                    </h3>
                    <div className="space-y-2">
                      {simulation.frictionPoints.map((fp, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              fp.severity >= 0.5
                                ? "bg-red-500"
                                : "bg-amber-400"
                            }`}
                          />
                          <span className="text-text-secondary">
                            Min {fp.startMin}: {fp.affectedCount}/
                            {fp.totalCount} learners
                          </span>
                          <span className="text-text-tertiary truncate">
                            — {fp.sectionTitle}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cascade summary */}
                {simulation.cascadeRisks.length > 0 && (
                  <div className="rounded-xl border border-purple-500/20 bg-surface-1 p-5">
                    <h3 className="text-sm font-semibold text-purple-400 mb-3">
                      Cascade Risks Summary
                    </h3>
                    <div className="space-y-2">
                      {simulation.cascadeRisks.map((cr, i) => (
                        <div key={i} className="text-xs text-text-secondary">
                          <span className="font-medium">
                            {cr.upstreamTitle}
                          </span>
                          <span className="text-text-tertiary mx-1">
                            {"->"}
                          </span>
                          <span className="font-medium">
                            {cr.downstreamTitle}
                          </span>
                          <span className="text-text-tertiary ml-1">
                            ({cr.affectedLearners.length} learner
                            {cr.affectedLearners.length !== 1 && "s"})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href={`/teach/live/${lessonId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Go Live with this Lesson
              </Link>
              <Link
                href="/teach"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface-1 text-text-secondary text-sm font-medium hover:bg-surface-2 transition-colors"
              >
                Modify Plan in Chat
              </Link>
            </div>
          </div>
        )}
    </div>
  );
}
