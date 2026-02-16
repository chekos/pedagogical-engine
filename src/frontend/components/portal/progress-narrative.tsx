"use client";

import type { PortalData } from "@/lib/api";

interface ProgressNarrativeProps {
  data: PortalData;
}

/** Human-readable label for a bloom level */
function bloomLabel(level: string): string {
  const map: Record<string, string> = {
    knowledge: "remembering",
    comprehension: "understanding",
    application: "applying",
    analysis: "analyzing",
    synthesis: "creating",
    evaluation: "evaluating",
  };
  return map[level] ?? level;
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
        Progress Summary
      </h2>
      <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-text-secondary">
              {domainLabel}
            </span>
            <span className="text-sm font-semibold text-accent">
              {knownCount} of {totalSkillsInDomain} skills
            </span>
          </div>
          <div
            className="h-2.5 rounded-full bg-surface-2 overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progressPct}% of skills demonstrated`}
          >
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-text-tertiary">
            <span>{assessedCount} assessed</span>
            <span>{inferredCount} inferred</span>
          </div>
        </div>

        {/* Narrative text */}
        <div className="text-text-primary leading-relaxed space-y-3">
          {topSkills.length > 0 && (
            <p>
              <span className="font-medium">{learnerName}</span> has demonstrated
              proficiency in{" "}
              {topSkills
                .slice(0, 3)
                .map((s) => skillLabel(s.skillId, skillLabels))
                .join(", ")}
              {topSkills.length > 3 && ` and ${topSkills.length - 3} more skills`}.
              {topSkills[0]?.bloomLevel && (
                <> Skills have been demonstrated at the{" "}
                <span className="font-medium">
                  {bloomLabel(topSkills[0].bloomLevel)}
                </span>{" "}
                level and above.</>
              )}
            </p>
          )}
          {nextSteps.length > 0 && (
            <p>
              Next steps:{" "}
              {nextSteps.map((s) => s.label).join(", ")}.
              {nextSteps.length === 1
                ? " This is the next skill in the learning path."
                : " These are the next skills available in the learning path."}
            </p>
          )}
          {topSkills.length === 0 && (
            <p>
              No skills have been assessed yet. Complete an assessment to see
              progress here.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
