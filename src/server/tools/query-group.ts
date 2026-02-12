import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "./data";

interface SkillEntry {
  skillId: string;
  confidence: number;
  bloomLevel: string;
  source: "assessed" | "inferred";
}

function parseLearnerSkills(content: string): SkillEntry[] {
  const skills: SkillEntry[] = [];

  // Parse assessed skills section
  const assessedSection =
    content.split("## Assessed Skills")[1]?.split("##")[0] ?? "";
  for (const line of assessedSection.split("\n")) {
    const match = line.match(
      /^- (.+?):\s*([\d.]+)\s*confidence.*?(?:at\s+(\w+)\s+level)?/i
    );
    if (match) {
      skills.push({
        skillId: match[1].trim(),
        confidence: parseFloat(match[2]),
        bloomLevel: match[3] ?? "unknown",
        source: "assessed",
      });
    }
  }

  // Parse inferred skills section
  const inferredSection =
    content.split("## Inferred Skills")[1]?.split("##")[0] ?? "";
  for (const line of inferredSection.split("\n")) {
    const match = line.match(
      /^- (.+?):\s*([\d.]+)\s*confidence/i
    );
    if (match) {
      skills.push({
        skillId: match[1].trim(),
        confidence: parseFloat(match[2]),
        bloomLevel: "inferred",
        source: "inferred",
      });
    }
  }

  return skills;
}

export const queryGroupTool = tool(
  "query_group",
  "Aggregate skill distributions across group members, identify common gaps, and suggest pairings.",
  {
    groupName: z.string().describe("Group slug"),
    domain: z.string().describe("Skill domain"),
  },
  async ({ groupName, domain }) => {
    const learnersDir = path.join(DATA_DIR, "learners");
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
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Domain '${domain}' not found` }),
          },
        ],
        isError: true,
      };
    }

    // Load all learner profiles for this group
    const learners: Array<{
      id: string;
      name: string;
      skills: SkillEntry[];
    }> = [];

    try {
      const files = await fs.readdir(learnersDir);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const content = await fs.readFile(
          path.join(learnersDir, file),
          "utf-8"
        );
        if (!content.includes(`| **Group** | ${groupName} |`)) continue;

        const nameMatch = content.match(/# Learner Profile: (.+)/);
        learners.push({
          id: file.replace(".md", ""),
          name: nameMatch ? nameMatch[1] : file.replace(".md", ""),
          skills: parseLearnerSkills(content),
        });
      }
    } catch {
      // No learner files
    }

    if (learners.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              group: groupName,
              domain,
              memberCount: 0,
              message: "No learner profiles found for this group.",
            }),
          },
        ],
      };
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

    // Suggest pairings: pair learners with complementary skills
    const pairingSuggestions: Array<{
      learner1: string;
      learner2: string;
      rationale: string;
    }> = [];

    for (let i = 0; i < learners.length; i++) {
      for (let j = i + 1; j < learners.length; j++) {
        const l1 = learners[i];
        const l2 = learners[j];

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
          pairingSuggestions.push({
            learner1: l1.name,
            learner2: l2.name,
            rationale: parts.join("; "),
          });
        }
      }
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              group: groupName,
              domain,
              memberCount: learners.length,
              members: learners.map((l) => ({
                name: l.name,
                assessedSkillCount: l.skills.filter(
                  (s) => s.source === "assessed"
                ).length,
                totalSkillCount: l.skills.length,
              })),
              commonGaps: commonGaps.slice(0, 10),
              groupStrengths: groupStrengths.slice(0, 10),
              pairingSuggestions: pairingSuggestions.slice(0, 5),
              skillDistribution,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
