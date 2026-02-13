"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/lib/constants";

interface EducatorStrength {
  area: string;
  confidence: number;
  notes: string;
}

interface GrowthArea {
  area: string;
  notes: string;
}

interface TimingPattern {
  adjustment_min: number;
  notes: string;
}

interface ContentConfidence {
  level: string;
  confidence: number;
  notes: string;
}

interface EducatorProfile {
  id: string;
  name: string;
  bio: string;
  session_count: number;
  debrief_count: number;
  teaching_style: Record<string, number>;
  strengths: EducatorStrength[];
  growth_areas: GrowthArea[];
  content_confidence: Record<string, ContentConfidence>;
  preferences: Record<string, string>;
  timing_patterns: Record<string, TimingPattern>;
  growth_nudges: string[];
}

interface EducatorSummary {
  id: string;
  name: string;
  bio: string;
  session_count: number;
  debrief_count: number;
  teaching_style: Record<string, number>;
  strengths: EducatorStrength[];
  growth_areas: GrowthArea[];
  content_confidence: Record<string, ContentConfidence>;
  domains: string[];
}

const STYLE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  lecture: { label: "Lecture", color: "bg-blue-500", icon: "📋" },
  discussion: { label: "Discussion", color: "bg-purple-500", icon: "💬" },
  hands_on: { label: "Hands-on", color: "bg-emerald-500", icon: "🔧" },
  socratic: { label: "Socratic", color: "bg-amber-500", icon: "❓" },
  project_based: { label: "Project-based", color: "bg-rose-500", icon: "🏗" },
  demonstration: { label: "Demo", color: "bg-cyan-500", icon: "🎬" },
};

const STRENGTH_ICONS: Record<string, string> = {
  content_expertise: "🎓",
  facilitation: "🗣",
  improvisation: "🎭",
  group_management: "👥",
  rapport_building: "🤝",
  time_management: "⏰",
  structured_explanation: "📐",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  expert: "text-emerald-400",
  proficient: "text-blue-400",
  intermediate: "text-amber-400",
  novice: "text-red-400",
};

function StyleDistributionBar({ style }: { style: Record<string, number> }) {
  const sorted = Object.entries(style).sort(([, a], [, b]) => b - a);
  return (
    <div className="space-y-2">
      {sorted.map(([key, value]) => {
        const info = STYLE_LABELS[key] || {
          label: key,
          color: "bg-gray-500",
          icon: "•",
        };
        const pct = Math.round(value * 100);
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-5 text-center text-sm">{info.icon}</span>
            <span className="text-xs w-28 text-text-secondary font-medium">
              {info.label}
            </span>
            <div className="flex-1 h-3 bg-surface-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${info.color} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-text-tertiary w-10 text-right font-mono">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StrengthCard({ strength }: { strength: EducatorStrength }) {
  const icon = STRENGTH_ICONS[strength.area] || "✦";
  const pct = Math.round(strength.confidence * 100);
  const barColor =
    pct >= 85
      ? "bg-emerald-500"
      : pct >= 70
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-semibold text-text-primary capitalize">
          {strength.area.replace(/_/g, " ")}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-text-tertiary font-mono">{pct}%</span>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">
        {strength.notes}
      </p>
    </div>
  );
}

function ProfileDetail({ profile }: { profile: EducatorProfile }) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">
          🧑‍🏫
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            {profile.name}
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">{profile.bio}</p>
          <div className="flex gap-4 mt-2">
            <span className="text-xs text-text-tertiary">
              {profile.session_count} sessions
            </span>
            <span className="text-xs text-text-tertiary">
              {profile.debrief_count} debriefs
            </span>
            <span className="text-xs text-text-tertiary">
              {Object.keys(profile.content_confidence).length} domain
              {Object.keys(profile.content_confidence).length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Teaching style distribution */}
      <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          Teaching Style Distribution
        </h3>
        <StyleDistributionBar style={profile.teaching_style} />
        <p className="text-xs text-text-tertiary mt-3">
          This distribution influences how lesson plans are composed. Activities
          are weighted toward your preferred styles.
        </p>
      </div>

      {/* Strengths */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Strengths
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profile.strengths
            .sort((a, b) => b.confidence - a.confidence)
            .map((s) => (
              <StrengthCard key={s.area} strength={s} />
            ))}
        </div>
      </div>

      {/* Growth areas */}
      {profile.growth_areas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Growth Areas
          </h3>
          <div className="space-y-2">
            {profile.growth_areas.map((g) => (
              <div
                key={g.area}
                className="rounded-lg border border-border-subtle bg-surface-1 p-3"
              >
                <span className="text-xs font-semibold text-amber-400 capitalize">
                  {g.area.replace(/_/g, " ")}
                </span>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {g.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content confidence by domain */}
      {Object.keys(profile.content_confidence).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Content Confidence by Domain
          </h3>
          <div className="space-y-2">
            {Object.entries(profile.content_confidence).map(
              ([domain, conf]) => (
                <div
                  key={domain}
                  className="rounded-lg border border-border-subtle bg-surface-1 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs px-1.5 py-0.5 bg-surface-2 rounded text-text-secondary font-mono">
                      {domain}
                    </code>
                    <span
                      className={`text-xs font-semibold capitalize ${CONFIDENCE_COLORS[conf.level] || "text-text-secondary"}`}
                    >
                      {conf.level} ({Math.round(conf.confidence * 100)}%)
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {conf.notes}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Timing patterns */}
      {Object.keys(profile.timing_patterns).length > 0 && (
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Timing Patterns
          </h3>
          <p className="text-xs text-text-tertiary mb-3">
            Learned from debriefs. The engine uses these to pre-calibrate lesson
            timing.
          </p>
          <div className="space-y-2">
            {Object.entries(profile.timing_patterns).map(([key, pattern]) => {
              const adj = pattern.adjustment_min;
              const color =
                adj > 0
                  ? "text-amber-400"
                  : adj < 0
                    ? "text-blue-400"
                    : "text-emerald-400";
              const label =
                adj > 0 ? `+${adj} min` : adj < 0 ? `${adj} min` : "on time";
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs w-24 text-text-secondary capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className={`text-xs font-mono font-bold ${color}`}>
                    {label}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {pattern.notes}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Growth nudges */}
      {profile.growth_nudges.length > 0 && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Growth Nudges
          </h3>
          <p className="text-xs text-text-tertiary mb-3">
            The engine may occasionally suggest these in lesson plans to gently
            expand your range.
          </p>
          <div className="space-y-2">
            {profile.growth_nudges.map((nudge, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-accent text-sm shrink-0">💡</span>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {nudge}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferences */}
      {Object.keys(profile.preferences).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Preferences
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(profile.preferences).map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2"
              >
                <div className="text-xs text-text-tertiary capitalize">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="text-xs font-medium text-text-primary mt-0.5 capitalize">
                  {value.replace(/_/g, " ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonView({
  educators,
}: {
  educators: EducatorSummary[];
}) {
  if (educators.length < 2) return null;
  const [a, b] = [educators[0], educators[1]];

  const allStyleKeys = [
    ...new Set([
      ...Object.keys(a.teaching_style),
      ...Object.keys(b.teaching_style),
    ]),
  ].sort();

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 animate-fade-in">
      <div className="flex items-start gap-3 mb-5">
        <div className="text-2xl">⚡</div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            The Same Plan, Two Different Teachers
          </h3>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Same group, same topic, same constraints — but the engine composes
            different plans for each educator. {a.name} gets a plan built
            around{" "}
            {
              Object.entries(a.teaching_style).sort(([, x], [, y]) => y - x)[0][0].replace(
                /_/g,
                " "
              )
            }{" "}
            activities. {b.name} gets a plan built around{" "}
            {
              Object.entries(b.teaching_style).sort(([, x], [, y]) => y - x)[0][0].replace(
                /_/g,
                " "
              )
            }{" "}
            activities. Both achieve the same learning objectives.
          </p>
        </div>
      </div>

      {/* Side-by-side style comparison */}
      <div className="grid grid-cols-2 gap-6">
        {[a, b].map((edu) => (
          <div key={edu.id}>
            <div className="text-xs font-semibold text-text-primary mb-2">
              {edu.name}
            </div>
            <div className="space-y-1.5">
              {allStyleKeys.map((key) => {
                const pct = Math.round((edu.teaching_style[key] || 0) * 100);
                const info = STYLE_LABELS[key] || {
                  label: key,
                  color: "bg-gray-500",
                  icon: "•",
                };
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs w-20 text-text-tertiary">
                      {info.label}
                    </span>
                    <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${info.color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-tertiary w-8 text-right font-mono">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Content confidence */}
            {Object.entries(edu.content_confidence).map(([domain, conf]) => (
              <div
                key={domain}
                className="mt-2 text-xs text-text-tertiary"
              >
                Domain expertise:{" "}
                <span
                  className={`font-medium capitalize ${CONFIDENCE_COLORS[conf.level] || ""}`}
                >
                  {conf.level}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [educators, setEducators] = useState<EducatorSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [profile, setProfile] = useState<EducatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load educator list
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/educators`)
      .then((res) => res.json())
      .then((data) => {
        setEducators(data.educators || []);
        if (data.educators?.length > 0) {
          setSelectedId(data.educators[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Load selected profile
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`${BACKEND_URL}/api/educators/${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.profile);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedId]);

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
            Educator Profiles
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Teaching style, strengths, and patterns — used to customize lesson
            plans for each educator. The same group and topic produces different
            plans for different teachers.
          </p>
        </div>

        {/* Educator selector */}
        {educators.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {educators.map((edu) => (
              <button
                key={edu.id}
                onClick={() => setSelectedId(edu.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedId === edu.id
                    ? "bg-accent text-white"
                    : "bg-surface-1 text-text-secondary border border-border-subtle hover:text-text-primary"
                }`}
              >
                {edu.name}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="animate-pulse-subtle text-text-tertiary">
              Loading educator profiles...
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && educators.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🧑‍🏫</div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              No educator profiles yet
            </h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              Educator profiles are built naturally during conversations with
              the engine. Start a teaching session and the engine will capture
              your teaching style.
            </p>
            <Link
              href="/teach"
              className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-muted transition-colors"
            >
              Start teaching
            </Link>
          </div>
        )}

        {/* Comparison callout (when 2+ educators) */}
        {educators.length >= 2 && !loading && (
          <div className="mb-8">
            <ComparisonView educators={educators} />
          </div>
        )}

        {/* Profile detail */}
        {profile && !loading && <ProfileDetail profile={profile} />}
      </main>
    </div>
  );
}
