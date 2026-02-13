import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

/**
 * Analyze assessment integrity — compute confidence modifiers from
 * response pattern data collected during an assessment conversation.
 *
 * This tool takes the assessment agent's observations about response
 * depth, consistency, and engagement quality, and computes an integrity
 * modifier that adjusts the confidence levels of assessed skills.
 *
 * The tool never accuses students. It produces educator-facing notes
 * that help calibrate how much to rely on the assessment results.
 */

const responseObservationSchema = z.object({
  skillId: z.string().describe("The skill this observation is about"),
  bloomLevel: z
    .string()
    .describe("Bloom's level demonstrated in this response"),
  depthScore: z
    .number()
    .min(1)
    .max(3)
    .describe(
      "Response depth: 1=minimal (bare correct answer), 2=adequate (some reasoning), 3=deep (full reasoning, edge cases, alternatives)"
    ),
  usedPersonalContext: z
    .boolean()
    .describe("Did the student reference their own context/data/situation?"),
  chainedFromPrevious: z
    .boolean()
    .describe(
      "Was this answer consistent with and built on their previous answers?"
    ),
  selfCorrected: z
    .boolean()
    .optional()
    .describe("Did the student catch and fix their own mistake?"),
  expressedUncertainty: z
    .boolean()
    .optional()
    .describe(
      "Did the student appropriately say 'I'm not sure' on a genuinely difficult topic?"
    ),
  notes: z
    .string()
    .optional()
    .describe("Free-form observation notes from the assessment agent"),
});

export const analyzeAssessmentIntegrityTool = tool(
  "analyze_assessment_integrity",
  "Analyze response patterns from an assessment conversation to compute integrity confidence modifiers. Called by the assessment agent after completing an assessment to calibrate confidence levels. Returns an integrity score, per-skill modifiers, and educator-facing notes.",
  {
    learnerId: z.string().describe("Learner's file ID (without .md)"),
    assessmentCode: z
      .string()
      .describe("Assessment session code for reference"),
    observations: z
      .array(responseObservationSchema)
      .describe(
        "One observation per assessed skill, recording response patterns"
      ),
    overallConsistency: z
      .enum(["high", "moderate", "low"])
      .describe(
        "Overall consistency across the full conversation — do answers tell a coherent story?"
      ),
    overallEngagement: z
      .enum(["strong", "neutral", "concerning"])
      .describe(
        "Overall engagement quality — did they elaborate, self-correct, show appropriate uncertainty?"
      ),
    contextGathered: z
      .string()
      .optional()
      .describe(
        "What personal context did the student share? (e.g., 'works with sales data at a retail company')"
      ),
    inconsistencies: z
      .array(
        z.object({
          description: z
            .string()
            .describe("What was inconsistent (e.g., 'demonstrated synthesis on joins but struggled with basic filtering')"),
          skillsInvolved: z
            .array(z.string())
            .describe("Skill IDs involved in the inconsistency"),
          severity: z
            .enum(["minor", "notable", "significant"])
            .describe("How concerning is this inconsistency?"),
        })
      )
      .optional()
      .describe("Specific inconsistencies observed during the conversation"),
  },
  async ({
    learnerId,
    assessmentCode,
    observations,
    overallConsistency,
    overallEngagement,
    contextGathered,
    inconsistencies,
  }) => {
    // 1. Compute average depth score
    const avgDepth =
      observations.length > 0
        ? observations.reduce((sum, o) => sum + o.depthScore, 0) /
          observations.length
        : 2.0;

    // 2. Compute consistency score
    const consistencyScores: Record<string, number> = {
      high: 1.0,
      moderate: 0.7,
      low: 0.4,
    };
    const consistencyScore = consistencyScores[overallConsistency];

    // 3. Compute engagement score
    const engagementScores: Record<string, number> = {
      strong: 1.0,
      neutral: 0.7,
      concerning: 0.4,
    };
    const engagementScore = engagementScores[overallEngagement];

    // 4. Compute overall integrity modifier
    const integrityModifier =
      Math.round(
        ((avgDepth / 3) * 0.4 +
          consistencyScore * 0.35 +
          engagementScore * 0.25) *
          100
      ) / 100;

    // 5. Compute per-skill modifiers
    const perSkillModifiers = observations.map((obs) => {
      let skillModifier = obs.depthScore / 3;

      // Bonus for using personal context (harder to fake)
      if (obs.usedPersonalContext) skillModifier += 0.05;

      // Bonus for chained reasoning
      if (obs.chainedFromPrevious) skillModifier += 0.05;

      // Bonus for self-correction (strong integrity signal)
      if (obs.selfCorrected) skillModifier += 0.1;

      // Bonus for appropriate uncertainty
      if (obs.expressedUncertainty) skillModifier += 0.05;

      // Cap at 1.0
      skillModifier = Math.min(1.0, Math.round(skillModifier * 100) / 100);

      // Check if this skill was involved in an inconsistency
      const involvedInconsistency = inconsistencies?.find((inc) =>
        inc.skillsInvolved.includes(obs.skillId)
      );
      if (involvedInconsistency) {
        const penaltyMap: Record<string, number> = {
          minor: 0.1,
          notable: 0.2,
          significant: 0.35,
        };
        skillModifier -= penaltyMap[involvedInconsistency.severity] ?? 0;
        skillModifier = Math.max(0.3, Math.round(skillModifier * 100) / 100);
      }

      return {
        skillId: obs.skillId,
        bloomLevel: obs.bloomLevel,
        rawDepth: obs.depthScore,
        modifier: skillModifier,
        flags: [
          ...(obs.usedPersonalContext ? ["used_personal_context"] : []),
          ...(obs.selfCorrected ? ["self_corrected"] : []),
          ...(obs.expressedUncertainty ? ["appropriate_uncertainty"] : []),
          ...(involvedInconsistency
            ? [`inconsistency_${involvedInconsistency.severity}`]
            : []),
        ],
      };
    });

    // 6. Determine integrity level
    let integrityLevel: "high" | "moderate" | "low";
    if (integrityModifier >= 0.8) {
      integrityLevel = "high";
    } else if (integrityModifier >= 0.6) {
      integrityLevel = "moderate";
    } else {
      integrityLevel = "low";
    }

    // 7. Generate educator-facing notes
    let educatorNotes = "";
    if (integrityLevel === "high") {
      educatorNotes = `Assessment confidence is high. ${learnerId}'s responses were consistent, appropriately detailed, and showed genuine engagement with the material. These results can be relied upon for lesson planning.`;
    } else if (integrityLevel === "moderate") {
      const reasons: string[] = [];
      if (avgDepth < 2.0) reasons.push("responses were somewhat brief");
      if (overallConsistency === "moderate")
        reasons.push("some minor inconsistencies were observed");
      if (overallEngagement === "neutral")
        reasons.push("engagement level was neutral");

      educatorNotes = `Assessment confidence is moderate (${reasons.join("; ")}). This may indicate the student knows more than demonstrated, was not fully engaged, or is still building confidence. Consider a brief follow-up conversation to verify skills where confidence is below 0.7.`;
    } else {
      const flaggedSkills = perSkillModifiers
        .filter((m) => m.modifier < 0.6)
        .map((m) => m.skillId);
      const inconsistencyDesc =
        inconsistencies && inconsistencies.length > 0
          ? inconsistencies.map((i) => i.description).join("; ")
          : "general pattern of inconsistency across responses";

      educatorNotes = `Assessment confidence is low. Inconsistencies observed: ${inconsistencyDesc}. Recommend verifying the following skills in person before building lesson activities on them: ${flaggedSkills.join(", ") || "multiple skills across the assessment"}. This is NOT a judgment of the student's character — it simply means the engine is less confident in these particular results.`;
    }

    // 8. Build markdown section for the learner profile
    const integrityMarkdown = generateIntegrityMarkdown(
      integrityLevel,
      integrityModifier,
      educatorNotes,
      perSkillModifiers,
      contextGathered
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              learnerId,
              assessmentCode,
              integrityLevel,
              integrityModifier,
              avgDepthScore: Math.round(avgDepth * 100) / 100,
              consistencyScore,
              engagementScore,
              perSkillModifiers,
              inconsistencies: inconsistencies ?? [],
              educatorNotes,
              integrityMarkdown,
              contextGathered: contextGathered ?? null,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

function generateIntegrityMarkdown(
  level: string,
  modifier: number,
  notes: string,
  perSkill: Array<{
    skillId: string;
    modifier: number;
    flags: string[];
  }>,
  context?: string
): string {
  const lines: string[] = [
    "## Assessment Integrity Notes",
    "",
    `**Integrity level:** ${level} (modifier: ${modifier})`,
    "",
    notes,
    "",
  ];

  if (context) {
    lines.push(`**Student context:** ${context}`, "");
  }

  // Only show per-skill details if there are notable flags
  const flagged = perSkill.filter(
    (s) => s.modifier < 0.7 || s.flags.length > 0
  );
  if (flagged.length > 0) {
    lines.push("**Per-skill notes:**", "");
    for (const s of flagged) {
      const flagStr =
        s.flags.length > 0 ? ` [${s.flags.join(", ")}]` : "";
      lines.push(
        `- ${s.skillId}: modifier ${s.modifier}${flagStr}`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
