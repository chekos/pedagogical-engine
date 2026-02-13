import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR, loadGroupLearners, toolResponse } from "./shared.js";

interface AffectiveEntry {
  confidence: string;
  motivation: string;
  socialDynamics: string;
  pastExperiences: string;
  comfortPreferences: string;
}

function parseAffectiveProfile(content: string): AffectiveEntry | null {
  if (!content.includes("## Affective Profile")) return null;

  const section =
    content.split("## Affective Profile")[1]?.split(/\n## /)[0] ?? "";

  const extract = (label: string): string => {
    const match = section.match(
      new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+?)(?=\\n-|$)`, "s")
    );
    return match ? match[1].trim() : "";
  };

  return {
    confidence: extract("Confidence"),
    motivation: extract("Motivation"),
    socialDynamics: extract("Social dynamics"),
    pastExperiences: extract("Past experiences"),
    comfortPreferences: extract("Comfort preferences"),
  };
}

function parseGroupAffectiveContext(
  content: string
): Record<string, string> | null {
  if (!content.includes("## Affective Context")) return null;

  const section =
    content.split("## Affective Context")[1]?.split(/\n## /)[0] ?? "";

  const result: Record<string, string> = {};

  const extract = (label: string): string => {
    const match = section.match(
      new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+?)(?=\\n-\\s*\\*\\*|$)`, "s")
    );
    return match ? match[1].trim() : "";
  };

  result.groupConfidence = extract("Group confidence");
  result.groupMotivation = extract("Group motivation");
  result.overallRead = extract("Overall affective read");

  // Extract social dynamics (multi-line)
  const socialMatch = section.match(
    /\*\*Social dynamics:\*\*\s*\n((?:\s+-\s+.+\n?)+)/
  );
  if (socialMatch) {
    result.socialDynamics = socialMatch[1].trim();
  }

  // Extract past experiences (multi-line)
  const pastMatch = section.match(
    /\*\*Past experiences:\*\*\s*\n((?:\s+-\s+.+\n?)+)/
  );
  if (pastMatch) {
    result.pastExperiences = pastMatch[1].trim();
  }

  return result;
}

export const analyzeAffectiveContextTool = tool(
  "analyze_affective_context",
  "Analyze the affective (emotional/social) context for a group or individual learner. Returns confidence levels, motivation types, social dynamics, past experiences, and comfort preferences that should inform pairing, activity design, and lesson tone.",
  {
    groupName: z.string().describe("Group slug"),
    learnerId: z
      .string()
      .optional()
      .describe(
        "Specific learner ID to analyze (if omitted, analyzes entire group)"
      ),
  },
  async ({ groupName, learnerId }) => {
    const groupPath = path.join(DATA_DIR, "groups", `${groupName}.md`);

    // Load group-level affective context
    let groupAffective: Record<string, string> | null = null;
    try {
      const groupContent = await fs.readFile(groupPath, "utf-8");
      groupAffective = parseGroupAffectiveContext(groupContent);
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== "ENOENT") throw err;
    }

    // Load individual learner profiles
    const learnerProfiles: Array<{
      id: string;
      name: string;
      affective: AffectiveEntry | null;
      hasAffectiveData: boolean;
    }> = [];

    const groupLearners = await loadGroupLearners(groupName);
    for (const gl of groupLearners) {
      // If specific learner requested, skip others
      if (learnerId && gl.id !== learnerId) continue;

      const affective = parseAffectiveProfile(gl.content);

      learnerProfiles.push({
        id: gl.id,
        name: gl.name,
        affective,
        hasAffectiveData: affective !== null,
      });
    }

    // Compute group-level affective summary
    const withData = learnerProfiles.filter((l) => l.hasAffectiveData);
    const confidenceLevels: string[] = [];
    const motivationTypes: string[] = [];
    const pairingFlags: Array<{
      type: "good_pair" | "avoid_pair" | "solo_preference";
      learners: string[];
      reason: string;
    }> = [];
    const pastExperienceFlags: Array<{
      learner: string;
      note: string;
    }> = [];
    const activityRecommendations: string[] = [];

    for (const l of withData) {
      if (!l.affective) continue;

      confidenceLevels.push(`${l.name}: ${l.affective.confidence}`);
      motivationTypes.push(`${l.name}: ${l.affective.motivation}`);

      // Flag negative past experiences
      const pastLower = l.affective.pastExperiences.toLowerCase();
      if (
        pastLower.includes("bad") ||
        pastLower.includes("frustrat") ||
        pastLower.includes("negative") ||
        pastLower.includes("quit") ||
        pastLower.includes("almost")
      ) {
        pastExperienceFlags.push({
          learner: l.name,
          note: l.affective.pastExperiences,
        });
      }

      // Parse social dynamics for pairing hints
      const social = l.affective.socialDynamics.toLowerCase();
      if (social.includes("avoid") || social.includes("would not pair")) {
        pairingFlags.push({
          type: "avoid_pair",
          learners: [l.name],
          reason: l.affective.socialDynamics,
        });
      }
      if (social.includes("solo") || social.includes("independent")) {
        pairingFlags.push({
          type: "solo_preference",
          learners: [l.name],
          reason: l.affective.socialDynamics,
        });
      }

      // Confidence-based activity recommendations
      const confLower = l.affective.confidence.toLowerCase();
      if (confLower.includes("low")) {
        activityRecommendations.push(
          `${l.name}: low confidence — use low-stakes warm-ups, avoid public coding, provide templates`
        );
      }
    }

    // Overall group affective summary
    const lowConfidenceCount = withData.filter((l) =>
      l.affective?.confidence.toLowerCase().includes("low")
    ).length;
    const negativePastCount = pastExperienceFlags.length;

    let groupTone = "neutral";
    if (lowConfidenceCount >= withData.length * 0.4) {
      groupTone = "confidence-building";
      activityRecommendations.unshift(
        "GROUP: Start with a guaranteed-win exercise. Build confidence before challenge."
      );
    }
    if (negativePastCount > 0) {
      activityRecommendations.unshift(
        `GROUP: ${negativePastCount} learner(s) have negative past experiences. Design an explicitly de-stressing opener.`
      );
    }

    return toolResponse({
      group: groupName,
      dataCompleteness: {
        learnersWithAffectiveData: withData.length,
        totalLearners: learnerProfiles.length,
        hasGroupLevelContext: groupAffective !== null,
      },
      groupAffective,
      recommendedGroupTone: groupTone,
      learners: learnerProfiles.map((l) => ({
        id: l.id,
        name: l.name,
        hasAffectiveData: l.hasAffectiveData,
        affective: l.affective,
      })),
      pairingFlags,
      pastExperienceFlags,
      activityRecommendations,
      confidenceSummary: confidenceLevels,
      motivationSummary: motivationTypes,
    });
  }
);
