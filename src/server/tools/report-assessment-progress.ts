import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { toolResponse } from "./shared.js";

export const reportAssessmentProgressTool = tool(
  "report_assessment_progress",
  "Report that the assessment is transitioning to a new skill area. Call once per skill transition — not for every question, just when you shift to a new topic.",
  {
    skillId: z.string().describe("The skill ID from the domain's skill graph"),
    skillLabel: z.string().describe("Human-readable label for the skill"),
  },
  async ({ skillId, skillLabel }) => {
    return toolResponse({ acknowledged: true, skillId, skillLabel });
  }
);
