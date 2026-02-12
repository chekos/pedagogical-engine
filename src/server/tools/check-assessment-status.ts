import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod/v4";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "./data";

export const checkAssessmentStatusTool = tool(
  "check_assessment_status",
  "Check assessment completion status for a group. Scans learner profiles and reports who has been assessed and who hasn't.",
  {
    groupName: z.string().describe("Group slug"),
    domain: z.string().describe("Skill domain"),
  },
  async ({ groupName, domain }) => {
    const groupPath = path.join(DATA_DIR, "groups", `${groupName}.md`);
    const learnersDir = path.join(DATA_DIR, "learners");

    // Read group file to get member list
    let groupContent: string;
    try {
      groupContent = await fs.readFile(groupPath, "utf-8");
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Group '${groupName}' not found` }),
          },
        ],
        isError: true,
      };
    }

    // Find learner profiles belonging to this group
    const assessed: Array<{
      id: string;
      name: string;
      skillCount: number;
      lastAssessed: string;
    }> = [];
    const notAssessed: Array<{ id: string; name: string }> = [];

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
        const name = nameMatch ? nameMatch[1] : file.replace(".md", "");
        const id = file.replace(".md", "");

        // Check if they have assessed skills
        const hasAssessedSkills =
          content.includes("## Assessed Skills") &&
          !content.includes("_No skills assessed yet._");

        if (hasAssessedSkills) {
          // Count skill lines (lines starting with "- " under Assessed Skills)
          const assessedSection = content.split("## Assessed Skills")[1]?.split("##")[0] ?? "";
          const skillLines = assessedSection
            .split("\n")
            .filter((l) => l.startsWith("- ") && l.includes(":"));

          const lastMatch = content.match(/\| \*\*Last assessed\*\* \| (.+) \|/);
          assessed.push({
            id,
            name,
            skillCount: skillLines.length,
            lastAssessed: lastMatch ? lastMatch[1] : "unknown",
          });
        } else {
          notAssessed.push({ id, name });
        }
      }
    } catch {
      // No learner files
    }

    // Check for active assessment sessions
    const assessmentsDir = path.join(DATA_DIR, "assessments");
    const activeSessions: Array<{ code: string; created: string }> = [];
    try {
      const files = await fs.readdir(assessmentsDir);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const content = await fs.readFile(
          path.join(assessmentsDir, file),
          "utf-8"
        );
        if (
          content.includes(`| **Group** | ${groupName} |`) &&
          content.includes("| **Status** | active |")
        ) {
          const codeMatch = content.match(/\| \*\*Code\*\* \| (.+) \|/);
          const createdMatch = content.match(/\| \*\*Created\*\* \| (.+) \|/);
          if (codeMatch) {
            activeSessions.push({
              code: codeMatch[1],
              created: createdMatch ? createdMatch[1] : "unknown",
            });
          }
        }
      }
    } catch {
      // No assessment files
    }

    const total = assessed.length + notAssessed.length;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              group: groupName,
              domain,
              summary: {
                total,
                assessed: assessed.length,
                notAssessed: notAssessed.length,
                completionRate:
                  total > 0
                    ? `${Math.round((assessed.length / total) * 100)}%`
                    : "N/A",
              },
              assessedLearners: assessed,
              notAssessedLearners: notAssessed,
              activeAssessmentSessions: activeSessions,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
