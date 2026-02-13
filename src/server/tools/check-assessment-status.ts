import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR, loadGroupLearners, toolResponse } from "./shared.js";

export const checkAssessmentStatusTool = tool(
  "check_assessment_status",
  "Check assessment completion status for a group. Scans learner profiles and reports who has been assessed and who hasn't.",
  {
    groupName: z.string().describe("Group slug"),
    domain: z.string().describe("Skill domain"),
  },
  async ({ groupName, domain }) => {
    const groupPath = path.join(DATA_DIR, "groups", `${groupName}.md`);

    // Verify group exists
    try {
      await fs.readFile(groupPath, "utf-8");
    } catch {
      return toolResponse({ error: `Group '${groupName}' not found` }, true);
    }

    // Find learner profiles belonging to this group
    const assessed: Array<{
      id: string;
      name: string;
      skillCount: number;
      lastAssessed: string;
    }> = [];
    const notAssessed: Array<{ id: string; name: string }> = [];

    const groupLearners = await loadGroupLearners(groupName);
    for (const gl of groupLearners) {
      const content = gl.content;

      // Check if they have assessed skills
      const hasAssessedSkills =
        content.includes("## Assessed Skills") &&
        !content.includes("_No skills assessed yet._");

      if (hasAssessedSkills) {
        // Count assessed skills from parsed profile
        const skillCount = gl.profile.skills.filter((s) => s.source === "assessed").length;

        const lastMatch = content.match(/\| \*\*Last assessed\*\* \| (.+) \|/);
        assessed.push({
          id: gl.id,
          name: gl.name,
          skillCount,
          lastAssessed: lastMatch ? lastMatch[1] : "unknown",
        });
      } else {
        notAssessed.push({ id: gl.id, name: gl.name });
      }
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
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== "ENOENT") throw err;
    }

    const total = assessed.length + notAssessed.length;

    return toolResponse({
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
    });
  }
);
