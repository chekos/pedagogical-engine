import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import { DATA_DIR, safePath } from "./shared.js";

export const advanceCurriculumTool = tool(
  "advance_curriculum",
  "After a session is taught, update the curriculum based on educator feedback. Adjusts remaining sessions — compresses if group moved fast, adds remediation if they struggled. Marks the completed session and rewrites the curriculum file.",
  {
    curriculumSlug: z.string().describe("Curriculum file slug (without .md extension), e.g. 'python-data-analysis-6-week'"),
    completedSession: z.number().int().min(1).describe("Session number that was just completed"),
    outcome: z.enum(["ahead", "on_track", "behind", "struggled"]).describe("How the session went relative to plan"),
    notes: z.string().optional().describe("Educator's notes on what happened — what worked, what didn't, specific observations"),
    skillsConfirmed: z.array(z.string()).optional().describe("Skill IDs the group demonstrably acquired in this session"),
    skillsStruggled: z.array(z.string()).optional().describe("Skill IDs the group struggled with"),
  },
  async ({
    curriculumSlug,
    completedSession,
    outcome,
    notes,
    skillsConfirmed,
    skillsStruggled,
  }) => {
    // Sanitize slug to prevent path traversal
    const safeSlug = curriculumSlug.replace(/[^a-z0-9-]/g, "-").replace(/^-|-$/g, "");
    if (!safeSlug) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: "Invalid curriculum slug" }),
          },
        ],
        isError: true,
      };
    }
    const filePath = safePath(DATA_DIR, "curricula", `${safeSlug}.md`);

    let content: string;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Curriculum file not found: ${safeSlug}.md` }),
          },
        ],
        isError: true,
      };
    }

    // Parse current status
    const sessionRegex = /### Session (\d+):/g;
    const sessionNumbers: number[] = [];
    let match;
    while ((match = sessionRegex.exec(content)) !== null) {
      sessionNumbers.push(parseInt(match[1]));
    }

    const totalSessions = sessionNumbers.length;
    if (completedSession > totalSessions) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Session ${completedSession} does not exist in this curriculum (${totalSessions} sessions total)` }),
          },
        ],
        isError: true,
      };
    }

    // Update the status field
    content = content.replace(
      /\| \*\*Status\*\* \| .+? \|/,
      `| **Status** | active (session ${completedSession}/${totalSessions} completed) |`
    );

    // Mark the completed session
    const sessionHeader = `### Session ${completedSession}:`;
    const sessionIdx = content.indexOf(sessionHeader);
    if (sessionIdx !== -1) {
      // Find the milestone line for this session
      const milestoneRegex = new RegExp(
        `(### Session ${completedSession}:[\\s\\S]*?\\*\\*Milestone:\\*\\*)([^\\n]*)`,
        "m"
      );
      const milestoneMatch = content.match(milestoneRegex);
      if (milestoneMatch) {
        const originalMilestone = milestoneMatch[0];
        const updatedMilestone = originalMilestone + `\n\n**Session ${completedSession} Report:**\n- **Outcome:** ${outcome}\n- **Skills confirmed:** ${(skillsConfirmed || []).join(", ") || "none recorded"}\n- **Skills struggled:** ${(skillsStruggled || []).join(", ") || "none"}\n- **Notes:** ${notes || "none"}`;
        content = content.replace(originalMilestone, updatedMilestone);
      }
    }

    // Generate adjustment recommendations
    const adjustments: string[] = [];
    const remainingSessions = totalSessions - completedSession;

    switch (outcome) {
      case "ahead":
        adjustments.push(
          `Group completed Session ${completedSession} ahead of schedule.`,
          "Recommendation: Compress review segments in upcoming sessions.",
          "Consider pulling forward skills from later sessions to fill available time.",
          remainingSessions > 2
            ? "Could potentially finish the curriculum one session early."
            : "Use extra time for deeper practice at higher Bloom's levels."
        );
        break;

      case "on_track":
        adjustments.push(
          `Session ${completedSession} went as planned.`,
          "No curriculum adjustments needed.",
          "Continue with the planned sequence."
        );
        break;

      case "behind":
        adjustments.push(
          `Group fell slightly behind in Session ${completedSession}.`,
          "Recommendation: Extend review at the start of the next session to 8–10 minutes.",
        );
        if (skillsStruggled && skillsStruggled.length > 0) {
          adjustments.push(
            `Skills that need reinforcement: ${skillsStruggled.join(", ")}`,
            "Consider adding scaffolding activities for these skills in the next session."
          );
        }
        if (remainingSessions >= 2) {
          adjustments.push("If the next session also falls behind, consider deferring the lowest-priority skills.");
        }
        break;

      case "struggled":
        adjustments.push(
          `Group struggled significantly in Session ${completedSession}.`,
          "Recommendation: Add a remediation focus to the next session.",
        );
        if (skillsStruggled && skillsStruggled.length > 0) {
          adjustments.push(
            `Priority remediation skills: ${skillsStruggled.join(", ")}`,
            "Next session should open with 15–20 minutes of guided practice on these skills."
          );
        }
        if (remainingSessions >= 3) {
          adjustments.push(
            "Consider inserting a full remediation session and pushing remaining content back.",
            "Defer the least critical target skills to keep the schedule feasible."
          );
        } else {
          adjustments.push(
            "With limited sessions remaining, focus on the most critical prerequisite skills.",
            "Advanced target skills may need to be deferred to a follow-up curriculum."
          );
        }
        break;
    }

    // Append adjustment log to the end of the document
    const adjustmentSection = `\n## Session ${completedSession} Adjustment Log\n\n**Date:** ${new Date().toISOString()}\n**Outcome:** ${outcome}\n\n${adjustments.map((a) => `- ${a}`).join("\n")}\n`;

    content += adjustmentSection;

    // Write updated curriculum
    await fs.writeFile(filePath, content, "utf-8");

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              curriculumSlug,
              completedSession,
              totalSessions,
              remainingSessions,
              outcome,
              adjustments,
              skillsConfirmed: skillsConfirmed || [],
              skillsStruggled: skillsStruggled || [],
              notes: notes || "",
              file: filePath,
              message: `Curriculum updated. Session ${completedSession}/${totalSessions} marked as ${outcome}.${
                outcome === "struggled"
                  ? " Remediation recommendations added."
                  : outcome === "ahead"
                  ? " Compression recommendations added."
                  : ""
              }`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
