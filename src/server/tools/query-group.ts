import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR, parseLearnerProfile, loadGroupLearners, toolResponse, type SkillEntry } from "./shared.js";

export const queryGroupTool = tool(
  "query_group",
  "Aggregate skill distributions across group members, identify common gaps, and suggest pairings.",
  {
    groupName: z.string().describe("Group slug"),
    domain: z.string().describe("Skill domain"),
  },
  async ({ groupName, domain }) => {
    const domainDir = path.join(DATA_DIR, "domains", domain);

    // Load skill graph
    let allSkillIds: string[];
    try {
      const skillsRaw = await fs.readFile(
        path.join(domainDir, "skills.json"),
        "utf-8"
      );
      const skillsData = JSON.parse(skillsRaw);
      allSkillIds = skillsData.skills.map((s: { id: string }) => s.id);
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== "ENOENT") throw err;
      return toolResponse({ error: `Domain '${domain}' not found` }, true);
    }

    // Load all learner profiles for this group
    const groupLearners = await loadGroupLearners(groupName);
    const learners = groupLearners.map((gl) => ({
      id: gl.id,
      name: gl.name,
      skills: gl.profile.skills,
      affective: gl.profile.affective,
    }));

    if (learners.length === 0) {
      return toolResponse({
        group: groupName,
        domain,
        memberCount: 0,
        message: "No learner profiles found for this group.",
      });
    }

    // Aggregate skill distributions
    const skillDistribution: Record<
      string,
      {
        assessed: number;
        avgConfidence: number;
        confidences: number[];
        learnersWithSkill: string[];
        learnersMissing: string[];
      }
    > = {};

    for (const skillId of allSkillIds) {
      const entry = {
        assessed: 0,
        avgConfidence: 0,
        confidences: [] as number[],
        learnersWithSkill: [] as string[],
        learnersMissing: [] as string[],
      };

      for (const learner of learners) {
        const skill = learner.skills.find((s) => s.skillId === skillId);
        if (skill && skill.confidence >= 0.5) {
          entry.assessed++;
          entry.confidences.push(skill.confidence);
          entry.learnersWithSkill.push(learner.name);
        } else {
          entry.learnersMissing.push(learner.name);
        }
      }

      entry.avgConfidence =
        entry.confidences.length > 0
          ? Math.round(
              (entry.confidences.reduce((a, b) => a + b, 0) /
                entry.confidences.length) *
                100
            ) / 100
          : 0;

      skillDistribution[skillId] = entry;
    }

    // Identify common gaps (skills where >50% of group is missing)
    const commonGaps = Object.entries(skillDistribution)
      .filter(
        ([, v]) => v.learnersMissing.length > learners.length / 2
      )
      .map(([skillId, v]) => ({
        skillId,
        missingCount: v.learnersMissing.length,
        missingPercentage: `${Math.round((v.learnersMissing.length / learners.length) * 100)}%`,
        missingLearners: v.learnersMissing,
      }))
      .sort((a, b) => b.missingCount - a.missingCount);

    // Identify strong skills (>80% coverage with high confidence)
    const groupStrengths = Object.entries(skillDistribution)
      .filter(
        ([, v]) =>
          v.learnersWithSkill.length >= learners.length * 0.8 &&
          v.avgConfidence >= 0.7
      )
      .map(([skillId, v]) => ({
        skillId,
        coverage: `${Math.round((v.learnersWithSkill.length / learners.length) * 100)}%`,
        avgConfidence: v.avgConfidence,
      }));

    // Suggest pairings: pair learners with complementary skills + affective compatibility
    const pairingSuggestions: Array<{
      learner1: string;
      learner2: string;
      rationale: string;
      affectiveNotes?: string;
    }> = [];

    // Check for affective pairing flags (avoid pairs, solo preferences)
    const avoidPairs = new Set<string>();
    const soloPreference = new Set<string>();

    for (const l of learners) {
      if (!l.affective) continue;
      const social = l.affective.socialDynamics.toLowerCase();

      // Detect solo preference
      if (
        social.includes("solo") ||
        social.includes("independent") ||
        social.includes("prefers individual")
      ) {
        soloPreference.add(l.name);
      }

      // Detect avoid-pair mentions (e.g., "would NOT pair well with Nkechi")
      const avoidMatch = l.affective.socialDynamics.match(
        /(?:NOT|not|avoid|would not) pair.*?with (\w+)/i
      );
      if (avoidMatch) {
        // Normalize: use sorted pair key
        const pair = [l.name, avoidMatch[1]].sort().join("||");
        avoidPairs.add(pair);
      }
    }

    for (let i = 0; i < learners.length; i++) {
      for (let j = i + 1; j < learners.length; j++) {
        const l1 = learners[i];
        const l2 = learners[j];

        // Check affective compatibility
        const pairKey = [l1.name, l2.name].sort().join("||");
        const isAvoided = avoidPairs.has(pairKey);
        const l1Solo = soloPreference.has(l1.name);
        const l2Solo = soloPreference.has(l2.name);

        // Find skills one has but the other doesn't
        const l1Skills = new Set(
          l1.skills.filter((s) => s.confidence >= 0.7).map((s) => s.skillId)
        );
        const l2Skills = new Set(
          l2.skills.filter((s) => s.confidence >= 0.7).map((s) => s.skillId)
        );

        const l1CanTeach = [...l1Skills].filter((s) => !l2Skills.has(s));
        const l2CanTeach = [...l2Skills].filter((s) => !l1Skills.has(s));

        if (l1CanTeach.length > 0 || l2CanTeach.length > 0) {
          const parts: string[] = [];
          if (l1CanTeach.length > 0) {
            parts.push(
              `${l1.name} can help with: ${l1CanTeach.slice(0, 3).join(", ")}`
            );
          }
          if (l2CanTeach.length > 0) {
            parts.push(
              `${l2.name} can help with: ${l2CanTeach.slice(0, 3).join(", ")}`
            );
          }

          // Build affective notes
          const affNotes: string[] = [];
          if (isAvoided) {
            affNotes.push("AVOID: social dynamics flag — educator reported these learners should not be paired");
          }
          if (l1Solo) {
            affNotes.push(`${l1.name} prefers working solo`);
          }
          if (l2Solo) {
            affNotes.push(`${l2.name} prefers working solo`);
          }

          // Check confidence mismatch (high-dominance + low-confidence)
          if (l1.affective && l2.affective) {
            const l1Conf = l1.affective.confidence.toLowerCase();
            const l2Conf = l2.affective.confidence.toLowerCase();
            if (
              (l1Conf.includes("high") && l2Conf.includes("low")) ||
              (l2Conf.includes("high") && l1Conf.includes("low"))
            ) {
              const highConf = l1Conf.includes("high") ? l1.name : l2.name;
              const lowConf = l1Conf.includes("low") ? l1.name : l2.name;
              affNotes.push(
                `Confidence gap: ${highConf} is high-confidence, ${lowConf} is low-confidence — monitor that ${lowConf} stays engaged`
              );
            }
          }

          pairingSuggestions.push({
            learner1: l1.name,
            learner2: l2.name,
            rationale: parts.join("; "),
            ...(affNotes.length > 0
              ? { affectiveNotes: affNotes.join(". ") }
              : {}),
          });
        }
      }
    }

    // Sort pairings: non-avoided first, then by skill complementarity count
    pairingSuggestions.sort((a, b) => {
      const aAvoided = a.affectiveNotes?.includes("AVOID") ? 1 : 0;
      const bAvoided = b.affectiveNotes?.includes("AVOID") ? 1 : 0;
      return aAvoided - bAvoided;
    });

    return toolResponse({
      group: groupName,
      domain,
      memberCount: learners.length,
      members: learners.map((l) => ({
        name: l.name,
        assessedSkillCount: l.skills.filter(
          (s) => s.source === "assessed"
        ).length,
        totalSkillCount: l.skills.length,
        affective: l.affective,
      })),
      commonGaps: commonGaps.slice(0, 10),
      groupStrengths: groupStrengths.slice(0, 10),
      pairingSuggestions: pairingSuggestions.slice(0, 8),
      skillDistribution,
    });
  }
);
