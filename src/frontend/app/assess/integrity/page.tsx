"use client";

import { useState, useCallback } from "react";
import { fetchIntegrityReport, type IntegrityReport, type IntegrityLearnerReport } from "@/lib/api";
import { ErrorBanner } from "@/components/ui/loading";

function IntegrityBadge({ level }: { level: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    high: {
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400",
      label: "High confidence",
    },
    moderate: {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      label: "Moderate",
    },
    low: {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      label: "Low — verify",
    },
    not_analyzed: {
      bg: "bg-surface-2",
      text: "text-text-tertiary",
      label: "Not analyzed",
    },
    not_assessed: {
      bg: "bg-surface-2",
      text: "text-text-tertiary",
      label: "Not assessed",
    },
  };

  const c = config[level] ?? config.not_assessed;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

function LearnerIntegrityCard({ learner }: { learner: IntegrityLearnerReport }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border-subtle rounded-xl p-4 bg-surface-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-accent-muted/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-accent">
              {learner.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {learner.name}
            </p>
            <p className="text-xs text-text-tertiary">
              {learner.assessedSkillCount} skills assessed
              {learner.lastAssessed && (
                <> &middot; {new Date(learner.lastAssessed).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IntegrityBadge level={learner.integrityLevel} />
          {learner.integrityModifier !== null && (
            <span className="text-xs text-text-tertiary tabular-nums">
              {Math.round(learner.integrityModifier * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Flagged skills */}
      {learner.flaggedSkills.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-text-secondary mb-1.5">
            Skills to verify:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {learner.flaggedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expandable notes */}
      {learner.integrityNotes && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-accent hover:text-accent-muted font-medium flex items-center gap-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            {expanded ? "Hide details" : "Show details"}
          </button>
          {expanded && (
            <div className="mt-2 px-3 py-2 bg-surface-2 rounded-lg text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
              {learner.integrityNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IntegritySummaryBar({ summary }: { summary: IntegrityReport["summary"] }) {
  const total = summary.assessed;
  if (total === 0) return null;

  const segments = [
    { count: summary.highIntegrity, color: "bg-green-500", label: "High" },
    { count: summary.moderateIntegrity, color: "bg-amber-500", label: "Moderate" },
    { count: summary.lowIntegrity, color: "bg-red-500", label: "Low" },
    { count: summary.notAnalyzed, color: "bg-gray-400", label: "Not analyzed" },
  ].filter((s) => s.count > 0);

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-500`}
            style={{ width: `${(seg.count / total) * 100}%` }}
            title={`${seg.label}: ${seg.count}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className={`w-2 h-2 rounded-full ${seg.color}`} />
            {seg.label}: {seg.count}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IntegrityReportPage() {
  const [groupName, setGroupName] = useState("tuesday-cohort");
  const [domain, setDomain] = useState("python-data-analysis");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<IntegrityReport | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIntegrityReport(groupName, domain);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [groupName, domain]);

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header */}
      <header className="border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400/20 to-purple-400/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-violet-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                Assessment Integrity Report
              </h1>
              <p className="text-sm text-text-secondary">
                How confident should you be in your students&apos; assessment results?
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Info callout */}
        <div className="mb-8 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
          <p className="text-sm text-text-secondary leading-relaxed">
            The integrity layer analyzes response patterns — depth, consistency,
            and engagement — to calibrate how much to rely on each student&apos;s
            assessment. This is <strong>not</strong> a cheating detector.
            It helps you know which results to trust and which to verify with a
            quick follow-up conversation.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1">
            <label
              htmlFor="groupName"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Group
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="domain"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Domain
            </label>
            <input
              id="domain"
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadReport}
              disabled={loading || !groupName || !domain}
              className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {loading ? "Loading..." : "View Report"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6" role="alert">
            <ErrorBanner message={error} onRetry={loadReport} />
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="space-y-8 animate-fade-in">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle text-center">
                <p className="text-2xl font-bold text-text-primary tabular-nums">
                  {report.summary.total}
                </p>
                <p className="text-xs text-text-tertiary mt-1">Total students</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                  {report.summary.highIntegrity}
                </p>
                <p className="text-xs text-text-tertiary mt-1">High confidence</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {report.summary.moderateIntegrity}
                </p>
                <p className="text-xs text-text-tertiary mt-1">Moderate</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                  {report.summary.lowIntegrity}
                </p>
                <p className="text-xs text-text-tertiary mt-1">Needs verification</p>
              </div>
            </div>

            {/* Distribution bar */}
            {report.summary.assessed > 0 && (
              <IntegritySummaryBar summary={report.summary} />
            )}

            {/* Learner cards */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-4">
                Individual Reports
              </h2>
              <div className="space-y-3">
                {[...report.learners]
                  .sort((a, b) => {
                    // Sort: low first (needs attention), then moderate, then high, then unassessed
                    const order: Record<string, number> = {
                      low: 0,
                      moderate: 1,
                      high: 2,
                      not_analyzed: 3,
                      not_assessed: 4,
                    };
                    return (order[a.integrityLevel] ?? 5) - (order[b.integrityLevel] ?? 5);
                  })
                  .map((learner) => (
                    <LearnerIntegrityCard key={learner.id} learner={learner} />
                  ))}
              </div>
            </div>

            {/* Educator guidance */}
            <div className="p-5 rounded-xl bg-surface-1 border border-border-subtle">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                What to do with this information
              </h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <span>
                    <strong className="text-text-primary">High confidence:</strong>{" "}
                    Trust these results for lesson planning. No follow-up needed.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span>
                    <strong className="text-text-primary">Moderate:</strong>{" "}
                    Generally reliable, but a quick 2-minute check-in on flagged
                    skills would increase your confidence.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <span>
                    <strong className="text-text-primary">Needs verification:</strong>{" "}
                    Before building lesson activities on these skills, have a brief
                    in-person conversation to verify. This is not an accusation —
                    the student may have been distracted, rushing, or just having an off day.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!report && !loading && !error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400/20 to-purple-400/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <p className="text-text-secondary text-sm">
              Enter a group and domain to view the integrity report.
            </p>
            <p className="text-text-tertiary text-xs mt-1">
              The report shows how confident you can be in each student&apos;s assessment results.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
