"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/lib/constants";

interface DomainPlugin {
  slug: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  audience: { level: string; ages: string; setting: string } | null;
  icon: string;
  color: string;
  featured: boolean;
  stats: {
    skills: number;
    dependencies: number;
    bloomLevels: number;
    bloomDistribution: Record<string, number>;
  };
  pluginCompleteness: {
    manifest: boolean;
    skills: boolean;
    dependencies: boolean;
    teachingMethodology: boolean;
    sampleLearners: boolean;
  };
}

const BLOOM_ORDER = [
  "knowledge",
  "comprehension",
  "application",
  "analysis",
  "synthesis",
  "evaluation",
];

const BLOOM_COLORS: Record<string, string> = {
  knowledge: "#94a3b8",
  comprehension: "#60a5fa",
  application: "#34d399",
  analysis: "#fbbf24",
  synthesis: "#f97316",
  evaluation: "#ef4444",
};

// Unique accent tints per domain — keyed by slug, with fallback
const DOMAIN_ACCENTS: Record<string, { bg: string; text: string; border: string; tint: string }> = {
  "python-data-analysis": { bg: "bg-blue-500/8", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", tint: "#3b82f6" },
  "farm-science": { bg: "bg-emerald-500/8", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", tint: "#10b981" },
  "outdoor-ecology": { bg: "bg-amber-500/8", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", tint: "#f59e0b" },
  "culinary-fundamentals": { bg: "bg-rose-500/8", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20", tint: "#f43f5e" },
};
const DEFAULT_ACCENT = { bg: "bg-accent/8", text: "text-accent", border: "border-accent/20", tint: "#2d3047" };

const ICON_MAP: Record<string, React.ReactNode> = {
  "chart-bar": (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13h2v8H3zm6-4h2v12H9zm6-3h2v15h-2zm6-3h2v18h-2z" />
    </svg>
  ),
  leaf: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75" />
    </svg>
  ),
  fire: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  seedling: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 22V12m0 0c0-4.418-3-8-8-8 0 5 3.582 8 8 8zm0 0c0-4.418 3-8 8-8 0 5-3.582 8-8 8z" />
    </svg>
  ),
  book: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
};

function BloomBar({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="flex h-5 rounded-lg overflow-hidden bg-surface-3">
      {BLOOM_ORDER.map((level) => {
        const count = distribution[level] || 0;
        if (count === 0) return null;
        const pct = (count / total) * 100;
        return (
          <div
            key={level}
            className="h-full transition-all duration-500 flex items-center justify-center"
            style={{
              width: `${pct}%`,
              backgroundColor: BLOOM_COLORS[level],
            }}
            title={`${level}: ${count} skills`}
          >
            {pct > 12 && (
              <span className="text-[9px] font-bold text-white/90 drop-shadow-sm">
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompletenessIndicator({
  completeness,
}: {
  completeness: DomainPlugin["pluginCompleteness"];
}) {
  const items = [
    { key: "manifest", label: "Manifest", done: completeness.manifest },
    { key: "skills", label: "Skills", done: completeness.skills },
    { key: "dependencies", label: "Dependencies", done: completeness.dependencies },
    { key: "teachingMethodology", label: "Methodology", done: completeness.teachingMethodology },
    { key: "sampleLearners", label: "Samples", done: completeness.sampleLearners },
  ];
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
          Plugin completeness
        </span>
        <span className="text-[10px] font-semibold text-text-secondary">
          {doneCount}/{items.length}
        </span>
      </div>
      <div className="flex gap-1">
        {items.map((item) => (
          <div
            key={item.key}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              item.done ? "bg-accent" : "bg-surface-3"
            }`}
            title={`${item.label}: ${item.done ? "Complete" : "Missing"}`}
          />
        ))}
      </div>
    </div>
  );
}

function DomainCard({
  domain,
  expanded,
  onToggle,
}: {
  domain: DomainPlugin;
  expanded: boolean;
  onToggle: () => void;
}) {
  const accent = DOMAIN_ACCENTS[domain.slug] || DEFAULT_ACCENT;

  return (
    <div
      className={`group rounded-2xl border transition-all duration-300 ${
        domain.featured
          ? `${accent.border} bg-surface-1 shadow-lg shadow-accent/5`
          : "border-border bg-surface-1 hover:border-border-subtle"
      }`}
    >
      {/* Color accent top stripe */}
      <div className="h-1 rounded-t-2xl" style={{ backgroundColor: accent.tint }} />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${accent.tint}15`,
                color: accent.tint,
              }}
            >
              {ICON_MAP[domain.icon] || ICON_MAP.book}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-heading text-text-primary">
                  {domain.name}
                </h3>
                {domain.featured && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent/10 text-accent">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">
                {domain.description}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-text-tertiary flex-shrink-0">
            v{domain.version}
          </span>
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {domain.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-2 text-text-tertiary border border-border-subtle"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-surface-2/50 border border-border-subtle">
            <div className="text-lg font-bold text-text-primary">
              {domain.stats.skills}
            </div>
            <div className="text-[10px] text-text-tertiary font-medium">
              Skills
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-surface-2/50 border border-border-subtle">
            <div className="text-lg font-bold text-text-primary">
              {domain.stats.dependencies}
            </div>
            <div className="text-[10px] text-text-tertiary font-medium">
              Dependencies
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-surface-2/50 border border-border-subtle">
            <div className="text-lg font-bold text-text-primary">
              {domain.stats.bloomLevels}
            </div>
            <div className="text-[10px] text-text-tertiary font-medium">
              Bloom&apos;s Levels
            </div>
          </div>
        </div>

        {/* Bloom's distribution bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
              Bloom&apos;s Distribution
            </span>
          </div>
          <BloomBar distribution={domain.stats.bloomDistribution} />
          <div className="flex justify-between mt-1">
            {BLOOM_ORDER.map((level) => {
              const count = domain.stats.bloomDistribution[level] || 0;
              if (count === 0) return null;
              return (
                <div key={level} className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: BLOOM_COLORS[level] }}
                  />
                  <span className="text-[9px] text-text-tertiary capitalize">
                    {level.slice(0, 4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completeness */}
        <CompletenessIndicator completeness={domain.pluginCompleteness} />

        {/* Expand/collapse button */}
        <button
          onClick={onToggle}
          className="mt-4 w-full text-center text-xs text-text-tertiary hover:text-text-secondary transition-colors py-1"
        >
          {expanded ? "Show less" : "Show details"}
          <svg
            className={`inline-block w-3 h-3 ml-1 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
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

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border-subtle animate-fade-in space-y-3">
            {domain.audience && (
              <div>
                <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Audience
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-text-tertiary">Level:</span>{" "}
                    <span className="text-text-secondary">{domain.audience.level}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Ages:</span>{" "}
                    <span className="text-text-secondary">{domain.audience.ages}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-text-tertiary">Setting:</span>{" "}
                    <span className="text-text-secondary">{domain.audience.setting}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Plugin Files
              </h4>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { file: "manifest.json", done: domain.pluginCompleteness.manifest },
                  { file: "skills.json", done: domain.pluginCompleteness.skills },
                  { file: "dependencies.json", done: domain.pluginCompleteness.dependencies },
                  { file: "SKILL.md", done: domain.pluginCompleteness.teachingMethodology },
                  { file: "sample-learners/", done: domain.pluginCompleteness.sampleLearners },
                ].map((item) => (
                  <div key={item.file} className="flex items-center gap-1.5">
                    {item.done ? (
                      <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <code className="text-text-secondary font-mono">{item.file}</code>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard?domain=${domain.slug}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border text-text-primary hover:bg-surface-2 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                View skill graph
              </Link>
              <Link
                href={`/teach?domain=${domain.slug}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent-muted transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Start teaching
              </Link>
            </div>

            <div className="text-[10px] text-text-tertiary">
              By {domain.author} &middot; Add new domains by dropping a directory into{" "}
              <code className="font-mono bg-surface-2 px-1 py-0.5 rounded">data/domains/</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<DomainPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/domains`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load domains");
        return res.json();
      })
      .then((data) => {
        setDomains(data.domains || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredDomains = domains.filter((d) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const totalSkills = domains.reduce((sum, d) => sum + d.stats.skills, 0);
  const totalDeps = domains.reduce((sum, d) => sum + d.stats.dependencies, 0);

  return (
    <div>
        {/* Hero section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Domain Marketplace
          </div>

          <h1 className="text-3xl md:text-4xl font-heading text-text-primary tracking-tight">
            Any teacher. Any subject.
          </h1>
          <p className="mt-3 text-base text-text-secondary max-w-xl mx-auto">
            Domain plugins encode the skill graph, teaching methodology, and
            assessment strategies for any subject area. Same engine, different
            knowledge.
          </p>

          {/* Global stats */}
          {!loading && !error && (
            <div className="mt-6 flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{domains.length}</div>
                <div className="text-xs text-text-tertiary">Domains</div>
              </div>
              <div className="w-px h-8 bg-border-subtle" />
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{totalSkills}</div>
                <div className="text-xs text-text-tertiary">Skills</div>
              </div>
              <div className="w-px h-8 bg-border-subtle" />
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{totalDeps}</div>
                <div className="text-xs text-text-tertiary">Dependencies</div>
              </div>
            </div>
          )}
        </div>

        {/* Search/filter */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search domains by name, topic, or tag..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-1 border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400 max-w-md mx-auto">
            {error}. Make sure the backend server is running on port 3000.
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredDomains.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-tertiary">
              {filter ? "No domains match your search." : "No domains found."}
            </p>
            <p className="text-sm text-text-tertiary mt-1">
              Add a domain by dropping a directory into{" "}
              <code className="font-mono bg-surface-2 px-1.5 py-0.5 rounded text-text-secondary">
                data/domains/
              </code>
            </p>
          </div>
        )}

        {/* Domain grid */}
        {!loading && !error && filteredDomains.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDomains.map((domain) => (
              <DomainCard
                key={domain.slug}
                domain={domain}
                expanded={expandedDomain === domain.slug}
                onToggle={() =>
                  setExpandedDomain(
                    expandedDomain === domain.slug ? null : domain.slug
                  )
                }
              />
            ))}
          </div>
        )}

        {/* How to create a domain plugin */}
        {!loading && !error && (
          <div className="mt-16 rounded-2xl border border-border-subtle bg-surface-1 p-8">
            <h2 className="text-xl font-heading text-text-primary mb-4">
              Create your own domain plugin
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              A domain plugin is a directory containing the skill graph, teaching
              methodology, and test data for any subject area. Drop it into{" "}
              <code className="font-mono bg-surface-2 px-1.5 py-0.5 rounded text-text-secondary">
                data/domains/
              </code>{" "}
              and it appears here automatically.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                {
                  file: "manifest.json",
                  desc: "Name, author, version, tags, audience metadata",
                  required: true,
                },
                {
                  file: "skills.json",
                  desc: "Skill definitions with Bloom's levels and dependencies",
                  required: true,
                },
                {
                  file: "dependencies.json",
                  desc: "Directed edges between skills with confidence weights",
                  required: true,
                },
                {
                  file: "SKILL.md",
                  desc: "Teaching principles, assessment strategies, constraints",
                  required: false,
                },
                {
                  file: "sample-learners/",
                  desc: "Example learner profiles for testing",
                  required: false,
                },
              ].map((item) => (
                <div
                  key={item.file}
                  className="p-3 rounded-lg bg-surface-0 border border-border-subtle"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <code className="text-xs font-mono font-medium text-text-primary">
                      {item.file}
                    </code>
                    {item.required && (
                      <span className="text-[9px] font-semibold text-accent">
                        REQ
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-tertiary leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/teach"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-muted transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Build a domain via conversation
              </Link>
              <span className="text-xs text-text-tertiary">
                or create the files manually
              </span>
            </div>
          </div>
        )}

        {/* Bloom's legend */}
        {!loading && !error && (
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
              Bloom&apos;s Taxonomy:
            </span>
            {BLOOM_ORDER.map((level) => (
              <div key={level} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: BLOOM_COLORS[level] }}
                />
                <span className="text-[11px] text-text-secondary capitalize">
                  {level}
                </span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
