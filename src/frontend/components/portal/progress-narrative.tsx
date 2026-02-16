"use client";

import type { PortalData } from "@/lib/api";
import { getPortalStrings, t, bloomGerund } from "@/lib/portal-i18n";

interface ProgressNarrativeProps {
  data: PortalData;
}

/** Format a skill ID into a readable label */
function skillLabel(
  skillId: string,
  labels: Record<string, string>
): string {
  if (labels[skillId]) return labels[skillId];
  return skillId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProgressNarrative({ data }: ProgressNarrativeProps) {
  const { progressData, skillLabels } = data;
  const s = getPortalStrings(data.language);
  const {
    learnerName,
    domain,
    totalSkillsInDomain,
    assessedCount,
    inferredCount,
    knownCount,
    nextSteps,
    topSkills,
  } = progressData;

  const domainLabel = domain.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const progressPct =
    totalSkillsInDomain > 0
      ? Math.round((knownCount / totalSkillsInDomain) * 100)
      : 0;

  return (
    <section aria-labelledby="progress-heading">
      <h2
        id="progress-heading"
        className="font-heading text-xl font-semibold text-text-primary mb-3"
      >
        {s.progressSummary}
      </h2>
      <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-text-secondary">
              {domainLabel}
            </span>
            <span className="text-sm font-semibold text-accent">
              {t(s.skillsCount, { known: knownCount, total: totalSkillsInDomain })}
            </span>
          </div>
          <div
            className="h-2.5 rounded-full bg-surface-2 overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progressPct}%`}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-text-tertiary">
            <span>{assessedCount} {s.assessed}</span>
            <span>{inferredCount} {s.inferred}</span>
          </div>
        </div>

        {/* Narrative text */}
        <div className="text-text-primary leading-relaxed space-y-3">
          {topSkills.length > 0 && (
            <p>
              {t(s.hasDemonstrated, {
                name: learnerName,
                skills: topSkills
                  .slice(0, 3)
                  .map((sk) => skillLabel(sk.skillId, skillLabels))
                  .join(", "),
              })}
              {topSkills.length > 3 && ` ${t(s.andMoreSkills, { count: topSkills.length - 3 })}`}
              {topSkills[0]?.bloomLevel && (
                <> {t(s.skillsAtLevel, { level: bloomGerund(topSkills[0].bloomLevel, s) })}</>
              )}
            </p>
          )}
          {nextSteps.length > 0 && (
            <p>
              {t(s.nextStepsLabel, { skills: nextSteps.map((step) => step.label).join(", ") })}
              {" "}
              {nextSteps.length === 1 ? s.nextStepSingular : s.nextStepPlural}
            </p>
          )}
          {topSkills.length === 0 && (
            <p>{s.noSkillsYet}</p>
          )}
        </div>
      </div>
    </section>
  );
}
