"use client";

import { useMemo, useState } from "react";
import { BLOOM_COLORS } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────────────

interface Skill {
  id: string;
  label: string;
  bloom_level: string;
}

interface LearnerSkillData {
  name: string;
  id: string;
  skills: Record<string, { confidence: number; type: "assessed" | "inferred" }>;
}

export interface GroupDashboardData {
  groupName: string;
  domain: string;
  skills: Skill[];
  learners: LearnerSkillData[];
}

// ─── Constants ──────────────────────────────────────────────────

const BLOOM_LEVELS = ["knowledge", "comprehension", "application", "analysis", "synthesis", "evaluation"];

const BLOOM_LABELS: Record<string, string> = {
  knowledge: "Know",
  comprehension: "Understand",
  application: "Apply",
  analysis: "Analyze",
  synthesis: "Create",
  evaluation: "Evaluate",
};

// ─── Heatmap Cell ───────────────────────────────────────────────

function HeatmapCell({ confidence, type, skillLabel, learnerName }: {
  confidence: number | undefined;
  type: "assessed" | "inferred" | undefined;
  skillLabel: string;
  learnerName: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (confidence === undefined) {
    return (
      <div
        className="relative w-full h-8 rounded-sm bg-white/[0.02] border border-white/[0.04]"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="absolute inset-0 flex items-center justify-center text-[9px] text-gray-700">
          --
        </span>
        {showTooltip && (
          <Tooltip skillLabel={skillLabel} learnerName={learnerName} confidence={undefined} type={undefined} />
        )}
      </div>
    );
  }

  const isInferred = type === "inferred";
  const hue = isInferred ? 45 : 142; // yellow for inferred, green for assessed
  const saturation = isInferred ? 80 : 72;
  const lightness = 50;
  const alpha = Math.max(0.08, confidence * 0.7);

  return (
    <div
      className="relative w-full h-8 rounded-sm transition-all duration-300 cursor-pointer hover:scale-105 hover:z-10"
      style={{
        background: `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`,
        border: `1px solid hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha + 0.1})`,
        boxShadow: confidence > 0.7 ? `0 0 8px hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.5})` : "none",
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white/60">
        {Math.round(confidence * 100)}
      </span>
      {isInferred && (
        <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-yellow-400/60 m-0.5" />
      )}
      {showTooltip && (
        <Tooltip skillLabel={skillLabel} learnerName={learnerName} confidence={confidence} type={type} />
      )}
    </div>
  );
}

function Tooltip({ skillLabel, learnerName, confidence, type }: {
  skillLabel: string;
  learnerName: string;
  confidence: number | undefined;
  type: "assessed" | "inferred" | undefined;
}) {
  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 shadow-xl min-w-[180px]">
        <p className="text-[10px] text-gray-400">{learnerName}</p>
        <p className="text-xs font-medium text-white mt-0.5">{skillLabel}</p>
        {confidence !== undefined ? (
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              type === "assessed"
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}>
              {type}
            </span>
            <span className="text-[10px] text-gray-500">{Math.round(confidence * 100)}%</span>
          </div>
        ) : (
          <p className="text-[10px] text-gray-600 mt-1">Not assessed</p>
        )}
      </div>
    </div>
  );
}

// ─── Radar Chart SVG ────────────────────────────────────────────

function RadarChart({ data }: { data: GroupDashboardData }) {
  const size = 260;
  const center = size / 2;
  const maxRadius = size / 2 - 40;
  const levels = BLOOM_LEVELS;

  const stats = useMemo(() => {
    return levels.map((level) => {
      const skillsAtLevel = data.skills.filter((s) => s.bloom_level === level);
      if (skillsAtLevel.length === 0) return { level, avgConfidence: 0, coverage: 0 };

      let totalConfidence = 0;
      let count = 0;
      const totalPossible = skillsAtLevel.length * data.learners.length;

      for (const skill of skillsAtLevel) {
        for (const learner of data.learners) {
          const skillData = learner.skills[skill.id];
          if (skillData) {
            totalConfidence += skillData.confidence;
            count++;
          }
        }
      }

      return {
        level,
        avgConfidence: count > 0 ? totalConfidence / count : 0,
        coverage: totalPossible > 0 ? count / totalPossible : 0,
      };
    });
  }, [data, levels]);

  // Convert polar to cartesian
  const polar = (angle: number, radius: number) => ({
    x: center + radius * Math.cos(angle - Math.PI / 2),
    y: center + radius * Math.sin(angle - Math.PI / 2),
  });

  const angleStep = (2 * Math.PI) / levels.length;

  // Generate polygon points for coverage
  const coveragePoints = stats
    .map((s, i) => {
      const p = polar(i * angleStep, s.coverage * maxRadius);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  // Generate polygon points for avg confidence
  const confidencePoints = stats
    .map((s, i) => {
      const p = polar(i * angleStep, s.avgConfidence * maxRadius);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="radarGlow">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.08)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
          </radialGradient>
        </defs>

        {/* Background glow */}
        <circle cx={center} cy={center} r={maxRadius + 10} fill="url(#radarGlow)" />

        {/* Grid rings */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={levels.map((_, i) => {
              const p = polar(i * angleStep, r * maxRadius);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {levels.map((_, i) => {
          const p = polar(i * angleStep, maxRadius);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={1}
            />
          );
        })}

        {/* Coverage polygon */}
        <polygon
          points={coveragePoints}
          fill="rgba(99, 102, 241, 0.12)"
          stroke="rgba(99, 102, 241, 0.5)"
          strokeWidth={2}
          className="transition-all duration-700"
        />

        {/* Confidence polygon */}
        <polygon
          points={confidencePoints}
          fill="rgba(34, 197, 94, 0.08)"
          stroke="rgba(34, 197, 94, 0.4)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          className="transition-all duration-700"
        />

        {/* Data points */}
        {stats.map((s, i) => {
          const pCov = polar(i * angleStep, s.coverage * maxRadius);
          const color = BLOOM_COLORS[s.level];
          return (
            <g key={s.level}>
              <circle
                cx={pCov.x}
                cy={pCov.y}
                r={4}
                fill={color}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={1}
                style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
              />
            </g>
          );
        })}

        {/* Labels */}
        {levels.map((level, i) => {
          const p = polar(i * angleStep, maxRadius + 22);
          return (
            <text
              key={level}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] fill-gray-500"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {BLOOM_LABELS[level]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Bloom's Level Bar Chart + Radar ────────────────────────────

function BloomDistribution({ data }: { data: GroupDashboardData }) {
  const bloomStats = useMemo(() => {
    return BLOOM_LEVELS.map((level) => {
      const skillsAtLevel = data.skills.filter((s) => s.bloom_level === level);
      if (skillsAtLevel.length === 0) return { level, avgConfidence: 0, coverage: 0, count: 0 };

      let totalConfidence = 0;
      let assessedCount = 0;
      const totalPossible = skillsAtLevel.length * data.learners.length;

      for (const skill of skillsAtLevel) {
        for (const learner of data.learners) {
          const skillData = learner.skills[skill.id];
          if (skillData) {
            totalConfidence += skillData.confidence;
            assessedCount++;
          }
        }
      }

      return {
        level,
        avgConfidence: assessedCount > 0 ? totalConfidence / assessedCount : 0,
        coverage: totalPossible > 0 ? assessedCount / totalPossible : 0,
        count: skillsAtLevel.length,
      };
    });
  }, [data]);

  const maxCoverage = Math.max(...bloomStats.map((b) => b.coverage), 0.01);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Radar chart */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
            Coverage radar
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-500 rounded-full" />
              <span className="text-[9px] text-gray-500">Coverage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-500 rounded-full" style={{ borderTop: "1px dashed" }} />
              <span className="text-[9px] text-gray-500">Avg confidence</span>
            </div>
          </div>
        </div>
        <RadarChart data={data} />
      </div>

      {/* Bar chart */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-4">
          Level breakdown
        </p>
        <div className="space-y-2.5">
          {bloomStats.map((stat) => (
            <div key={stat.level} className="flex items-center gap-3">
              <div className="w-20 text-right">
                <span className="text-[11px] text-gray-400 capitalize">
                  {BLOOM_LABELS[stat.level]}
                </span>
              </div>
              <div className="flex-1 h-7 bg-white/[0.03] rounded-md overflow-hidden relative">
                {/* Coverage bar */}
                <div
                  className="h-full rounded-md transition-all duration-700 relative"
                  style={{
                    width: `${Math.max(2, (stat.coverage / maxCoverage) * 100)}%`,
                    background: `linear-gradient(90deg, ${BLOOM_COLORS[stat.level]}40, ${BLOOM_COLORS[stat.level]}80)`,
                    boxShadow: `0 0 12px ${BLOOM_COLORS[stat.level]}30`,
                  }}
                >
                  {/* Average confidence overlay */}
                  <div
                    className="absolute top-0 left-0 h-full rounded-md opacity-60"
                    style={{
                      width: `${stat.avgConfidence * 100}%`,
                      background: BLOOM_COLORS[stat.level],
                    }}
                  />
                </div>
                {/* Label */}
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-[10px] font-mono text-white/70">
                    {Math.round(stat.coverage * 100)}% coverage
                    {stat.avgConfidence > 0 && ` | ${Math.round(stat.avgConfidence * 100)}% avg`}
                  </span>
                </div>
              </div>
              <div className="w-8 text-right">
                <span className="text-[10px] text-gray-600">{stat.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Common Gaps Panel ──────────────────────────────────────────

function CommonGaps({ data }: { data: GroupDashboardData }) {
  const gaps = useMemo(() => {
    return data.skills
      .map((skill) => {
        const learnerData = data.learners.map((l) => ({
          name: l.name,
          data: l.skills[skill.id],
        }));
        const unassessed = learnerData.filter((l) => !l.data);
        const weak = learnerData.filter((l) => l.data && l.data.confidence < 0.5);
        const gapScore = unassessed.length * 2 + weak.length;

        return {
          skill,
          unassessedCount: unassessed.length,
          weakCount: weak.length,
          gapScore,
          unassessed: unassessed.map((l) => l.name),
          weak: weak.map((l) => l.name),
        };
      })
      .filter((g) => g.gapScore > 0)
      .sort((a, b) => b.gapScore - a.gapScore)
      .slice(0, 8);
  }, [data]);

  if (gaps.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">No significant gaps identified</p>
      </div>
    );
  }

  // Compute pairing suggestions — match strongest with weakest on complementary skills
  const pairings = useMemo(() => {
    const results: { strong: string; weak: string; reason: string; complementScore: number }[] = [];

    for (let i = 0; i < data.learners.length; i++) {
      for (let j = i + 1; j < data.learners.length; j++) {
        const a = data.learners[i];
        const b = data.learners[j];
        let complementScore = 0;
        const reasons: string[] = [];

        for (const skill of data.skills) {
          const aSkill = a.skills[skill.id];
          const bSkill = b.skills[skill.id];
          const aConf = aSkill?.confidence || 0;
          const bConf = bSkill?.confidence || 0;
          const diff = Math.abs(aConf - bConf);

          if (diff > 0.3) {
            complementScore += diff;
            if (reasons.length < 2) {
              const stronger = aConf > bConf ? a.name.split(" ")[0] : b.name.split(" ")[0];
              const shortSkill = skill.label.replace(/^Can /, "").replace(/^can /, "").split(" ").slice(0, 3).join(" ");
              reasons.push(`${stronger} strong in ${shortSkill}`);
            }
          }
        }

        if (complementScore > 1.5) {
          const strong = Object.values(a.skills).length > Object.values(b.skills).length ? a.name : b.name;
          const weak = strong === a.name ? b.name : a.name;
          results.push({ strong, weak, reason: reasons.join("; "), complementScore });
        }
      }
    }

    return results.sort((a, b) => b.complementScore - a.complementScore).slice(0, 4);
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Gaps list */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-3">
          Skills needing attention
        </p>
        <div className="space-y-2">
          {gaps.map((gap) => {
            const shortLabel = gap.skill.label
              .replace(/^Can /, "")
              .replace(/^can /, "");

            return (
              <div
                key={gap.skill.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500/[0.04] border border-red-500/10 hover:bg-red-500/[0.08] transition-colors"
              >
                <div className="flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `rgba(239, 68, 68, ${Math.min(0.3, gap.gapScore * 0.04)})`,
                      color: `rgba(239, 68, 68, ${Math.min(1, 0.4 + gap.gapScore * 0.08)})`,
                    }}
                  >
                    {gap.unassessedCount + gap.weakCount}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate" title={gap.skill.label}>
                    {shortLabel}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: BLOOM_COLORS[gap.skill.bloom_level] }}
                    />
                    <span className="text-[10px] text-gray-500 capitalize">{gap.skill.bloom_level}</span>
                    {gap.unassessedCount > 0 && (
                      <span className="text-[10px] text-gray-600">
                        {gap.unassessedCount} not assessed
                      </span>
                    )}
                    {gap.weakCount > 0 && (
                      <span className="text-[10px] text-orange-400/60">
                        {gap.weakCount} weak
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pairing suggestions */}
      {pairings.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-3">
            Suggested pairings
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pairings.map((pair, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-500/[0.04] border border-indigo-500/10"
              >
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    {pair.strong.split(" ")[0]}
                  </span>
                  <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    {pair.weak.split(" ")[0]}
                  </span>
                </div>
                <p className="text-[9px] text-gray-500 truncate flex-1" title={pair.reason}>
                  {pair.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Learner Summary Cards ──────────────────────────────────────

function LearnerSummaryCards({ data }: { data: GroupDashboardData }) {
  const learnerStats = useMemo(() => {
    return data.learners.map((learner) => {
      const assessed = Object.values(learner.skills).filter((s) => s.type === "assessed").length;
      const inferred = Object.values(learner.skills).filter((s) => s.type === "inferred").length;
      const totalSkills = data.skills.length;
      const avgConfidence = Object.values(learner.skills).length > 0
        ? Object.values(learner.skills).reduce((sum, s) => sum + s.confidence, 0) / Object.values(learner.skills).length
        : 0;

      // Find highest bloom level reached
      const assessedSkillIds = Object.keys(learner.skills);
      const assessedSkills = data.skills.filter((s) => assessedSkillIds.includes(s.id));
      let highestBloom = 0;
      for (const skill of assessedSkills) {
        const bloomIndex = BLOOM_LEVELS.indexOf(skill.bloom_level);
        if (bloomIndex > highestBloom) highestBloom = bloomIndex;
      }

      return {
        ...learner,
        assessed,
        inferred,
        unknown: totalSkills - assessed - inferred,
        avgConfidence,
        highestBloom: BLOOM_LEVELS[highestBloom] || "knowledge",
        coverage: (assessed + inferred) / totalSkills,
      };
    }).sort((a, b) => b.coverage - a.coverage);
  }, [data]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {learnerStats.map((learner) => (
        <div
          key={learner.id}
          className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">{learner.name}</h4>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full capitalize"
              style={{
                background: `${BLOOM_COLORS[learner.highestBloom]}20`,
                color: BLOOM_COLORS[learner.highestBloom],
              }}
            >
              {BLOOM_LABELS[learner.highestBloom]}
            </span>
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="rgba(34, 197, 94, 0.7)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${learner.assessed / data.skills.length * 97.4} 97.4`}
                  className="transition-all duration-700"
                />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.5)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${learner.inferred / data.skills.length * 97.4} 97.4`}
                  strokeDashoffset={`${-learner.assessed / data.skills.length * 97.4}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {Math.round(learner.coverage * 100)}%
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-gray-400">{learner.assessed} assessed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-[10px] text-gray-400">{learner.inferred} inferred</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-700" />
                <span className="text-[10px] text-gray-400">{learner.unknown} unknown</span>
              </div>
            </div>
          </div>

          {/* Average confidence */}
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Avg confidence</span>
              <span className="text-xs font-mono text-white/70">
                {Math.round(learner.avgConfidence * 100)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${learner.avgConfidence * 100}%`,
                  background: learner.avgConfidence > 0.7
                    ? "rgba(34, 197, 94, 0.7)"
                    : learner.avgConfidence > 0.4
                    ? "rgba(251, 191, 36, 0.7)"
                    : "rgba(239, 68, 68, 0.5)",
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

type TabId = "heatmap" | "bloom" | "gaps" | "learners";

export default function GroupDashboard({ data }: { data: GroupDashboardData }) {
  const [activeTab, setActiveTab] = useState<TabId>("heatmap");

  // Sort skills by bloom level for heatmap
  const sortedSkills = useMemo(() => {
    return [...data.skills].sort((a, b) => {
      const aIdx = BLOOM_LEVELS.indexOf(a.bloom_level);
      const bIdx = BLOOM_LEVELS.indexOf(b.bloom_level);
      return aIdx - bIdx;
    });
  }, [data.skills]);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "heatmap", label: "Skill Heatmap", icon: "grid" },
    { id: "bloom", label: "Bloom's Distribution", icon: "bar" },
    { id: "gaps", label: "Common Gaps", icon: "alert" },
    { id: "learners", label: "Learner Overview", icon: "users" },
  ];

  // Compute summary stats
  const summary = useMemo(() => {
    const totalPossible = data.skills.length * data.learners.length;
    let assessed = 0;
    let inferred = 0;
    let totalConfidence = 0;
    let count = 0;

    for (const learner of data.learners) {
      for (const skillData of Object.values(learner.skills)) {
        if (skillData.type === "assessed") assessed++;
        else inferred++;
        totalConfidence += skillData.confidence;
        count++;
      }
    }

    return {
      totalSkills: data.skills.length,
      totalLearners: data.learners.length,
      coverage: count / totalPossible,
      avgConfidence: count > 0 ? totalConfidence / count : 0,
      assessed,
      inferred,
      unknown: totalPossible - count,
    };
  }, [data]);

  return (
    <div className="w-full rounded-xl border border-white/10 overflow-hidden" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">
              {data.groupName.replace(/-/g, " ")}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {data.domain.replace(/-/g, " ")} &middot; {summary.totalLearners} learners &middot; {summary.totalSkills} skills
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{Math.round(summary.coverage * 100)}%</p>
              <p className="text-[9px] uppercase tracking-wider text-gray-600">Coverage</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-white">{Math.round(summary.avgConfidence * 100)}%</p>
              <p className="text-[9px] uppercase tracking-wider text-gray-600">Avg Confidence</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">{summary.unknown}</p>
              <p className="text-[9px] uppercase tracking-wider text-gray-600">Gaps</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-5 border-b border-white/[0.06]">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-xs font-medium transition-all relative ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {activeTab === "heatmap" && (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header row with learner names */}
              <div className="flex gap-1 mb-2 pl-[140px]">
                {data.learners.map((learner) => (
                  <div key={learner.id} className="flex-1 min-w-[50px]">
                    <p className="text-[9px] text-gray-500 text-center truncate px-1" title={learner.name}>
                      {learner.name.split(" ")[0]}
                    </p>
                  </div>
                ))}
              </div>

              {/* Heatmap rows */}
              <div className="space-y-0.5">
                {sortedSkills.map((skill, i) => {
                  // Show bloom level separator
                  const prevBloom = i > 0 ? sortedSkills[i - 1].bloom_level : null;
                  const showSeparator = prevBloom !== null && prevBloom !== skill.bloom_level;

                  return (
                    <div key={skill.id}>
                      {showSeparator && (
                        <div className="flex items-center gap-2 py-1.5 pl-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: BLOOM_COLORS[skill.bloom_level] }}
                          />
                          <span className="text-[9px] uppercase tracking-widest text-gray-600 font-medium">
                            {skill.bloom_level}
                          </span>
                          <div className="flex-1 h-px bg-white/5" />
                        </div>
                      )}
                      {i === 0 && (
                        <div className="flex items-center gap-2 py-1.5 pl-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: BLOOM_COLORS[skill.bloom_level] }}
                          />
                          <span className="text-[9px] uppercase tracking-widest text-gray-600 font-medium">
                            {skill.bloom_level}
                          </span>
                          <div className="flex-1 h-px bg-white/5" />
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {/* Skill label */}
                        <div className="w-[136px] flex-shrink-0 pr-2">
                          <p
                            className="text-[10px] text-gray-400 text-right truncate"
                            title={skill.label}
                          >
                            {skill.label.replace(/^Can /, "").replace(/^can /, "")}
                          </p>
                        </div>
                        {/* Cells */}
                        {data.learners.map((learner) => {
                          const skillData = learner.skills[skill.id];
                          return (
                            <div key={learner.id} className="flex-1 min-w-[50px]">
                              <HeatmapCell
                                confidence={skillData?.confidence}
                                type={skillData?.type}
                                skillLabel={skill.label}
                                learnerName={learner.name}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "bloom" && (
          <BloomDistribution data={data} />
        )}

        {activeTab === "gaps" && (
          <CommonGaps data={data} />
        )}

        {activeTab === "learners" && (
          <LearnerSummaryCards data={data} />
        )}
      </div>
    </div>
  );
}
