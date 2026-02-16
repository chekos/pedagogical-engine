"use client";

import type { PortalData } from "@/lib/api";

interface SkillMapProps {
  data: PortalData;
}

const BLOOM_ORDER = [
  "knowledge",
  "comprehension",
  "application",
  "analysis",
  "synthesis",
  "evaluation",
];

const BLOOM_DISPLAY: Record<string, string> = {
  knowledge: "Remember",
  comprehension: "Understand",
  application: "Apply",
  analysis: "Analyze",
  synthesis: "Create",
  evaluation: "Evaluate",
};

const BLOOM_COLORS: Record<string, string> = {
  knowledge: "bg-bloom-remember/20 border-bloom-remember text-bloom-remember",
  comprehension: "bg-bloom-understand/20 border-bloom-understand text-bloom-understand",
  application: "bg-bloom-apply/20 border-bloom-apply text-bloom-apply",
  analysis: "bg-bloom-analyze/20 border-bloom-analyze text-bloom-analyze",
  synthesis: "bg-bloom-create/20 border-bloom-create text-bloom-create",
  evaluation: "bg-bloom-evaluate/20 border-bloom-evaluate text-bloom-evaluate",
};

/** Format a skill label from ID or labels map */
function getLabel(
  skillId: string,
  labels: Record<string, string>
): string {
  if (labels[skillId]) return labels[skillId];
  return skillId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Confidence as a percentage string */
function confPct(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export default function SkillMap({ data }: SkillMapProps) {
  const { skillMap, skillLabels } = data;
  const assessedIds = new Set(skillMap.assessed.map((s) => s.skillId));
  const inferredIds = new Set(skillMap.inferred.map((s) => s.skillId));

  // Group assessed skills by bloom level
  const byBloom = new Map<string, typeof skillMap.assessed>();
  for (const skill of skillMap.assessed) {
    const level = skill.bloomLevel ?? "unknown";
    if (!byBloom.has(level)) byBloom.set(level, []);
    byBloom.get(level)!.push(skill);
  }

  const hasSkills =
    skillMap.assessed.length > 0 || skillMap.inferred.length > 0;

  return (
    <section aria-labelledby="skillmap-heading">
      <h2
        id="skillmap-heading"
        className="font-heading text-xl font-semibold text-text-primary mb-3"
      >
        Skill Map
      </h2>

      {!hasSkills ? (
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-5 text-text-secondary text-center">
          No skills assessed yet. Complete an assessment to build your skill map.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Assessed skills grouped by Bloom's level */}
          {BLOOM_ORDER.filter((level) => byBloom.has(level)).map((level) => (
            <div key={level} className="rounded-xl border border-border-subtle bg-surface-1 p-4">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full border ${BLOOM_COLORS[level] ?? "bg-surface-2 border-border"}`}
                  aria-hidden="true"
                />
                {BLOOM_DISPLAY[level] ?? level}
              </h3>
              <ul className="space-y-2" role="list">
                {byBloom.get(level)!.map((skill) => (
                  <li key={skill.skillId} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-text-primary">
                        {getLabel(skill.skillId, skillLabels)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className="h-1.5 w-16 rounded-full bg-surface-2 overflow-hidden"
                        role="meter"
                        aria-valuenow={Math.round(skill.confidence * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${getLabel(skill.skillId, skillLabels)}: ${confPct(skill.confidence)} confidence`}
                      >
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${skill.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-tertiary w-8 text-right tabular-nums">
                        {confPct(skill.confidence)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Inferred skills */}
          {skillMap.inferred.length > 0 && (
            <div className="rounded-xl border border-border-subtle border-dashed bg-surface-1 p-4">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full border border-dashed border-accent-muted bg-accent-muted/20" aria-hidden="true" />
                Inferred
              </h3>
              <p className="text-xs text-text-tertiary mb-2">
                These skills are inferred from demonstrated abilities in related areas.
              </p>
              <ul className="space-y-2" role="list">
                {skillMap.inferred.map((skill) => (
                  <li key={skill.skillId} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-text-secondary">
                        {getLabel(skill.skillId, skillLabels)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className="h-1.5 w-16 rounded-full bg-surface-2 overflow-hidden"
                        role="meter"
                        aria-valuenow={Math.round(skill.confidence * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${getLabel(skill.skillId, skillLabels)}: ${confPct(skill.confidence)} confidence (inferred)`}
                      >
                        <div
                          className="h-full rounded-full bg-accent-muted"
                          style={{ width: `${skill.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-tertiary w-8 text-right tabular-nums">
                        {confPct(skill.confidence)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next steps */}
          {skillMap.next.length > 0 && (
            <div className="rounded-xl border border-border-subtle bg-surface-0 p-4">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                Up Next
              </h3>
              <ul className="space-y-1.5" role="list">
                {skillMap.next.slice(0, 5).map((skill) => (
                  <li
                    key={skill.skillId}
                    className="flex items-center gap-2 text-sm text-text-tertiary"
                  >
                    <span className="text-text-tertiary" aria-hidden="true">
                      &#x2192;
                    </span>
                    <span>{skill.label}</span>
                    <span className="text-xs text-text-tertiary">
                      ({BLOOM_DISPLAY[skill.bloomLevel] ?? skill.bloomLevel})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
