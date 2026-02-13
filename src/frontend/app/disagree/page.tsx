"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { BACKEND_URL } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────────

interface Tension {
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  evidence: Record<string, unknown>;
  suggestion: string;
}

interface TensionResult {
  domain: string;
  group: string;
  targetSkills: string[];
  durationMinutes: number | null;
  tensionCount: number;
  critical: number;
  warnings: number;
  tensions: Tension[];
  learnersAnalyzed: number;
  skillsInGraph: number;
  edgesInGraph: number;
}

// ─── Pre-built scenarios ─────────────────────────────────────────

const SCENARIOS: Array<{
  id: string;
  name: string;
  description: string;
  badge: string;
  badgeColor: string;
  params: {
    domain: string;
    groupName: string;
    targetSkills: string[];
    durationMinutes: number;
    constraints?: Record<string, unknown>;
  };
}> = [
  {
    id: "ordering",
    name: "Backwards Lesson",
    description:
      "Teach joins and groupby before students know how to filter data. The dependency graph says this breaks.",
    badge: "Ordering",
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
    params: {
      domain: "python-data-analysis",
      groupName: "tuesday-cohort",
      targetSkills: [
        "pandas-merge-join",
        "pandas-groupby",
        "select-filter-data",
        "inspect-dataframe",
      ],
      durationMinutes: 90,
    },
  },
  {
    id: "overload",
    name: "Everything in 45 Minutes",
    description:
      "Cover 8 topics including synthesis-level skills in a 45-minute session. The engine says: not possible.",
    badge: "Scope",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    params: {
      domain: "python-data-analysis",
      groupName: "tuesday-cohort",
      targetSkills: [
        "import-pandas",
        "inspect-dataframe",
        "select-filter-data",
        "handle-missing-data",
        "pandas-groupby",
        "basic-plotting",
        "interpret-distributions",
        "exploratory-data-analysis",
      ],
      durationMinutes: 45,
    },
  },
  {
    id: "prerequisites",
    name: "Skip the Foundation",
    description:
      "Jump straight to exploratory data analysis. But Alex can barely write a for loop, and 3 learners have gaps.",
    badge: "Gaps",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    params: {
      domain: "python-data-analysis",
      groupName: "tuesday-cohort",
      targetSkills: [
        "exploratory-data-analysis",
        "identify-data-quality-issues",
        "interpret-distributions",
      ],
      durationMinutes: 90,
    },
  },
  {
    id: "bloom-mismatch",
    name: "Synthesis Before Application",
    description:
      "Ask beginners to design a data pipeline and build analysis narratives. The Bloom's gap is massive.",
    badge: "Bloom's",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    params: {
      domain: "python-data-analysis",
      groupName: "tuesday-cohort",
      targetSkills: [
        "design-data-pipeline",
        "build-analysis-narrative",
        "write-reusable-analysis-functions",
      ],
      durationMinutes: 90,
    },
  },
  {
    id: "good-plan",
    name: "A Solid Plan",
    description:
      "Teach groupby to the Tuesday cohort in 90 minutes. Proper sequencing, realistic scope. The engine agrees.",
    badge: "Clean",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    params: {
      domain: "python-data-analysis",
      groupName: "tuesday-cohort",
      targetSkills: ["select-filter-data", "pandas-groupby"],
      durationMinutes: 90,
    },
  },
];

// ─── Components ──────────────────────────────────────────────────

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical") {
    return (
      <svg
        className="w-5 h-5 text-red-400 flex-shrink-0"
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
    );
  }
  if (severity === "warning") {
    return (
      <svg
        className="w-5 h-5 text-amber-400 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-5 h-5 text-blue-400 flex-shrink-0"
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
  );
}

function TensionCard({ tension }: { tension: Tension }) {
  const [expanded, setExpanded] = useState(false);

  const borderColor =
    tension.severity === "critical"
      ? "border-red-500/30"
      : tension.severity === "warning"
        ? "border-amber-500/30"
        : "border-blue-500/30";

  const bgColor =
    tension.severity === "critical"
      ? "bg-red-500/5"
      : tension.severity === "warning"
        ? "bg-amber-500/5"
        : "bg-blue-500/5";

  return (
    <div
      className={`rounded-xl border ${borderColor} ${bgColor} p-4 animate-slide-up`}
    >
      <div className="flex items-start gap-3">
        <SeverityIcon severity={tension.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                tension.severity === "critical"
                  ? "bg-red-500/20 text-red-400"
                  : tension.severity === "warning"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {tension.severity}
            </span>
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
              {tension.type.replace(/_/g, " ")}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-text-primary leading-snug">
            {tension.title}
          </h3>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">
            {tension.detail}
          </p>
          <div className="mt-3 p-3 rounded-lg bg-surface-2 border border-border-subtle">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
              Suggestion
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {tension.suggestion}
            </p>
          </div>
          {expanded && (
            <div className="mt-3 p-3 rounded-lg bg-surface-3 border border-border-subtle">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
                Evidence
              </p>
              <pre className="text-xs text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(tension.evidence, null, 2)}
              </pre>
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs text-accent hover:text-accent-muted transition-colors"
          >
            {expanded ? "Hide evidence" : "Show evidence"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function DisagreePage() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [result, setResult] = useState<TensionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScenario = useCallback(async (scenarioId: string) => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    setSelectedScenario(scenarioId);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/tensions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario.params),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
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
            href="/disagree"
            className="text-sm text-accent font-medium"
          >
            Disagree
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
            The colleague who pushes back
          </h1>
          <p className="mt-3 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Most AI tools are sycophantic. This one has opinions. It analyzes
            your lesson plan against the skill graph, learner profiles, and
            constraints &mdash; and tells you when something won&apos;t work.
          </p>
          <p className="mt-2 text-sm text-text-tertiary max-w-xl mx-auto">
            Not to override you, but to show you what the data says. Then you
            decide.
          </p>
        </div>

        {/* Scenario cards */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
            Choose a scenario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => runScenario(scenario.id)}
                disabled={loading}
                className={`text-left p-4 rounded-xl border transition-all ${
                  selectedScenario === scenario.id
                    ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                    : "border-border-subtle bg-surface-1 hover:border-border hover:bg-surface-2"
                } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">
                  {scenario.name}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {scenario.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {scenario.params.targetSkills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-text-tertiary"
                    >
                      {skill}
                    </span>
                  ))}
                  {scenario.params.targetSkills.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-text-tertiary">
                      +{scenario.params.targetSkills.length - 4} more
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-surface-2 border border-border-subtle animate-pulse-subtle">
              <svg
                className="w-4 h-4 text-accent animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm text-text-secondary">
                Analyzing pedagogical tensions...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <p className="text-xs text-text-tertiary mt-1">
              Make sure the backend server is running on port 3000
            </p>
          </div>
        )}

        {result && (
          <div className="animate-fade-in">
            {/* Summary bar */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-1 border border-border-subtle mb-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-primary">
                    {result.tensionCount}
                  </p>
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
                    Tensions
                  </p>
                </div>
                <div className="w-px h-8 bg-border-subtle" />
                <div className="flex items-center gap-3">
                  {result.critical > 0 && (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      {result.critical} critical
                    </span>
                  )}
                  {result.warnings > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      {result.warnings} warning{result.warnings !== 1 ? "s" : ""}
                    </span>
                  )}
                  {result.tensionCount === 0 && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      No tensions found
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                <span>{result.learnersAnalyzed} learners</span>
                <span>{result.skillsInGraph} skills</span>
                <span>{result.edgesInGraph} edges</span>
              </div>
            </div>

            {/* Engine's verdict */}
            <div
              className={`p-5 rounded-xl border mb-6 ${
                result.critical > 0
                  ? "border-red-500/20 bg-red-500/5"
                  : result.warnings > 0
                    ? "border-amber-500/20 bg-amber-500/5"
                    : "border-emerald-500/20 bg-emerald-500/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">
                    {result.critical > 0
                      ? "I'd push back on this plan."
                      : result.warnings > 0
                        ? "The plan is workable, but I have concerns."
                        : "This plan looks solid."}
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {result.critical > 0
                      ? `I can build what you're asking for, but the data shows ${result.critical} critical issue${result.critical !== 1 ? "s" : ""} that will significantly impact the session. Let me show you what I'm seeing, and then you decide.`
                      : result.warnings > 0
                        ? `I want to flag ${result.warnings} thing${result.warnings !== 1 ? "s" : ""} I'm seeing in the learner profiles and skill graph. None are dealbreakers, but they're worth considering before we finalize.`
                        : "The skill sequence respects the dependency graph, the scope fits the available time, and the group's profiles show they have the prerequisites. Ready to compose."}
                  </p>
                  {result.tensionCount > 0 && (
                    <p className="text-xs text-text-tertiary mt-2 italic">
                      I&apos;ve shared my reasoning. You know your students
                      better than I do. What would you like to do?
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tension list */}
            {result.tensions.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
                  Tensions found
                </h2>
                {result.tensions.map((tension, i) => (
                  <TensionCard key={i} tension={tension} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        {!result && !loading && !error && (
          <section className="mt-12 pt-12 border-t border-border-subtle">
            <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider text-center mb-8">
              How pedagogical pushback works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
              {[
                {
                  icon: "1",
                  label: "Educator states intent",
                  desc: '"I want to teach joins before filtering"',
                },
                {
                  icon: "2",
                  label: "Engine queries the graph",
                  desc: "Checks dependency chains, Bloom's levels, learner profiles",
                },
                {
                  icon: "3",
                  label: "Tensions surface",
                  desc: "Ordering violations, scope overload, prerequisite gaps",
                },
                {
                  icon: "4",
                  label: "Evidence presented",
                  desc: '"3 of 5 learners lack filtering — joins will break"',
                },
                {
                  icon: "5",
                  label: "Educator decides",
                  desc: "Accept the suggestion, override with context, or adjust",
                },
              ].map((step) => (
                <div key={step.icon} className="text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent text-xs font-bold mb-2">
                    {step.icon}
                  </span>
                  <h3 className="text-xs font-semibold text-text-primary mb-1">
                    {step.label}
                  </h3>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xs text-text-tertiary">
            Built with Opus 4.6 &mdash; Cerebral Valley x Anthropic Hackathon
          </span>
          <span className="text-xs text-text-tertiary">
            Moonshot 2: Pedagogical Disagreement
          </span>
        </div>
      </footer>
    </div>
  );
}
