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
  expert: "text-emerald-500 dark:text-emerald-400",
  proficient: "text-blue-500 dark:text-blue-400",
  intermediate: "text-amber-500 dark:text-amber-400",
  novice: "text-red-500 dark:text-red-400",
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

/** Visual timing pattern bar showing adjustment direction */
function TimingBar({ activityType, pattern }: { activityType: string; pattern: TimingPattern }) {
  const adj = pattern.adjustment_min;
  // Scale: max bar is ~40% width for +/- 5 min
  const barPct = Math.min(Math.abs(adj) / 5 * 40, 40);
  const isOver = adj > 0;
  const isUnder = adj < 0;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs w-28 text-text-secondary capitalize shrink-0">
        {activityType.replace(/_/g, " ")}
      </span>
      <div className="flex-1 flex items-center gap-0 h-4 relative">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
        {/* Bar */}
        {isUnder && (
          <div className="absolute right-1/2 h-2.5 rounded-l-full bg-blue-500/60"
            style={{ width: `${barPct}%` }}
          />
        )}
        {isOver && (
          <div className="absolute left-1/2 h-2.5 rounded-r-full bg-amber-500/60"
            style={{ width: `${barPct}%` }}
          />
        )}
        {adj === 0 && (
          <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500/60" />
        )}
      </div>
      <span className={`text-xs font-mono font-bold w-14 text-right shrink-0 ${
        isOver ? "text-amber-500 dark:text-amber-400" : isUnder ? "text-blue-500 dark:text-blue-400" : "text-emerald-500 dark:text-emerald-400"
      }`}>
        {adj > 0 ? `+${adj} min` : adj < 0 ? `${adj} min` : "on time"}
      </span>
    </div>
  );
}

type ProfileSection = "teach" | "strengths" | "learned";

function ProfileDetail({ profile }: { profile: EducatorProfile }) {
  const [openSection, setOpenSection] = useState<ProfileSection>("teach");

  const sections: { key: ProfileSection; label: string; sublabel: string }[] = [
    { key: "teach", label: "How I Teach", sublabel: "Style + preferences" },
    { key: "strengths", label: "My Strengths", sublabel: "Skills + confidence" },
    { key: "learned", label: "What the Engine Learned", sublabel: "Timing + growth" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">
          🧑‍🏫
        </div>
        <div>
          <h2 className="text-xl font-heading text-text-primary">
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

      {/* Section tabs */}
      <div className="flex gap-2">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setOpenSection(s.key)}
            className={`flex-1 rounded-lg px-4 py-3 text-left transition-all ${
              openSection === s.key
                ? "bg-accent/10 border border-accent/20"
                : "bg-surface-1 border border-border-subtle hover:border-border"
            }`}
          >
            <div className={`text-xs font-semibold ${openSection === s.key ? "text-accent" : "text-text-primary"}`}>
              {s.label}
            </div>
            <div className="text-[10px] text-text-tertiary mt-0.5">{s.sublabel}</div>
          </button>
        ))}
      </div>

      {/* Section content */}
      {openSection === "teach" && (
        <div className="space-y-6 animate-fade-in">
          {/* Teaching style distribution */}
          <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
            <h3 className="text-sm font-heading text-text-primary mb-4">
              Teaching Style Distribution
            </h3>
            <StyleDistributionBar style={profile.teaching_style} />
            <p className="text-xs text-text-tertiary mt-3">
              This distribution influences how lesson plans are composed. Activities
              are weighted toward your preferred styles.
            </p>
          </div>

          {/* Preferences */}
          {Object.keys(profile.preferences).length > 0 && (
            <div>
              <h3 className="text-sm font-heading text-text-primary mb-3">
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
      )}

      {openSection === "strengths" && (
        <div className="space-y-6 animate-fade-in">
          {/* Strengths */}
          <div>
            <h3 className="text-sm font-heading text-text-primary mb-3">
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

          {/* Content confidence by domain */}
          {Object.keys(profile.content_confidence).length > 0 && (
            <div>
              <h3 className="text-sm font-heading text-text-primary mb-3">
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

          {/* Growth areas */}
          {profile.growth_areas.length > 0 && (
            <div>
              <h3 className="text-sm font-heading text-text-primary mb-3">
                Growth Areas
              </h3>
              <div className="space-y-2">
                {profile.growth_areas.map((g) => (
                  <div
                    key={g.area}
                    className="rounded-lg border border-border-subtle bg-surface-1 p-3"
                  >
                    <span className="text-xs font-semibold text-amber-500 dark:text-amber-400 capitalize">
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
        </div>
      )}

      {openSection === "learned" && (
        <div className="space-y-6 animate-fade-in">
          {/* Timing patterns — visual */}
          {Object.keys(profile.timing_patterns).length > 0 && (
            <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
              <h3 className="text-sm font-heading text-text-primary mb-1">
                Timing Patterns
              </h3>
              <p className="text-xs text-text-tertiary mb-4">
                Learned from debriefs. The engine uses these to pre-calibrate lesson
                timing.
              </p>
              {/* Legend */}
              <div className="flex items-center gap-4 mb-3 text-[10px] text-text-tertiary">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-1.5 rounded-full bg-blue-500/60" /> Runs short
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500/60" /> On time
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-1.5 rounded-full bg-amber-500/60" /> Runs long
                </span>
              </div>
              <div className="divide-y divide-border-subtle">
                {Object.entries(profile.timing_patterns).map(([key, pattern]) => (
                  <TimingBar key={key} activityType={key} pattern={pattern} />
                ))}
              </div>
            </div>
          )}

          {/* Growth nudges */}
          {profile.growth_nudges.length > 0 && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
              <h3 className="text-sm font-heading text-text-primary mb-3">
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
        </div>
      )}
    </div>
  );
}

function ComparisonHero({
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

  const topStyleA = Object.entries(a.teaching_style).sort(([, x], [, y]) => y - x)[0][0].replace(/_/g, " ");
  const topStyleB = Object.entries(b.teaching_style).sort(([, x], [, y]) => y - x)[0][0].replace(/_/g, " ");

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-6 animate-fade-in">
      <h2 className="text-lg font-heading text-text-primary mb-1">
        The Same Plan, Two Different Teachers
      </h2>
      <p className="text-sm text-text-secondary mb-6 max-w-2xl">
        Same group, same topic, same constraints — but the engine composes
        different plans for each educator. {a.name} gets {topStyleA}-heavy activities.
        {" "}{b.name} gets {topStyleB}-heavy activities. Both achieve the same learning objectives.
      </p>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-8">
        {[a, b].map((edu) => (
          <div key={edu.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-lg">
                🧑‍🏫
              </div>
              <div>
                <div className="text-sm font-heading text-text-primary">
                  {edu.name}
                </div>
                <div className="text-[10px] text-text-tertiary">
                  {edu.session_count} sessions · {edu.debrief_count} debriefs
                </div>
              </div>
            </div>
            {/* Style bars */}
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
                    <span className="text-xs w-24 text-text-tertiary">
                      {info.label}
                    </span>
                    <div className="flex-1 h-2.5 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${info.color} transition-all duration-500`}
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
            {/* Domain expertise */}
            {Object.entries(edu.content_confidence).map(([domain, conf]) => (
              <div
                key={domain}
                className="mt-3 text-xs text-text-tertiary"
              >
                Domain expertise:{" "}
                <span
                  className={`font-medium capitalize ${CONFIDENCE_COLORS[conf.level] || ""}`}
                >
                  {conf.level}
                </span>
              </div>
            ))}
            {/* Top strengths */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {edu.strengths
                .sort((x, y) => y.confidence - x.confidence)
                .slice(0, 3)
                .map((s) => (
                  <span key={s.area} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary">
                    {STRENGTH_ICONS[s.area] || "✦"} {s.area.replace(/_/g, " ")}
                  </span>
                ))}
            </div>
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
    <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-heading text-text-primary">
            Educator Profiles
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Teaching style, strengths, and patterns — used to customize lesson
            plans for each educator.
          </p>
        </div>

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
            <h2 className="text-lg font-heading text-text-primary mb-2">
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

        {/* ═══ Hero comparison (when 2+ educators) ═══ */}
        {educators.length >= 2 && !loading && (
          <div className="mb-8">
            <ComparisonHero educators={educators} />
          </div>
        )}

        {/* Educator selector */}
        {educators.length > 0 && !loading && (
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

        {/* Profile detail — collapsed into three sections */}
        {profile && !loading && <ProfileDetail profile={profile} />}
    </div>
  );
}
