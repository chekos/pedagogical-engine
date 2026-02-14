import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { DATA_DIR, toolResponse } from "./shared.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

export const generateAssessmentLinkTool = tool(
  "generate_assessment_link",
  "Create a shareable assessment URL with an access code for a learner or group to self-assess.",
  {
    groupName: z.string().describe("Group slug"),
    domain: z.string().describe("Skill domain"),
    targetSkills: z
      .array(z.string())
      .optional()
      .describe(
        "Specific skills to assess. If omitted, assesses the full domain."
      ),
    learnerIds: z
      .array(z.string())
      .optional()
      .describe(
        "Specific learner IDs to assess. If omitted, assesses all group members."
      ),
    context: z
      .string()
      .optional()
      .describe(
        "Teacher-provided context for why this assessment is happening. E.g. 'Guest speaker preparing a presentation on magical realism for Mr. Sanchez's AP Spanish Lit class.' This context is shown to the assessment agent so it can tailor its conversation."
      ),
    educatorId: z
      .string()
      .optional()
      .describe(
        "ID of the educator who created/requested this assessment. Links the assessment back to the educator's profile."
      ),
    lessonContext: z
      .string()
      .optional()
      .describe(
        "What lesson or event this assessment feeds into. E.g. 'Preparing for a 90-minute guest lecture on magical realism' or 'Pre-assessment for Week 3 data visualization unit'."
      ),
  },
  async ({ groupName, domain, targetSkills, learnerIds, context, educatorId, lessonContext }) => {
    const assessmentsDir = path.join(DATA_DIR, "assessments");
    await fs.mkdir(assessmentsDir, { recursive: true });

    // Generate a short, readable access code
    const code = nanoid(8).toUpperCase();
    const now = new Date();
    const dateSlug = now.toISOString().slice(0, 10);

    const contextSection = context
      ? `\n## Assessment Context\n\n${context}\n`
      : "";

    const educatorSection = educatorId
      ? `\n## Educator\n\n${educatorId}\n`
      : "";

    const lessonContextSection = lessonContext
      ? `\n## Lesson Context\n\n${lessonContext}\n`
      : "";

    const assessmentContent = `# Assessment Session: ${code}

| Field | Value |
|---|---|
| **Code** | ${code} |
| **Group** | ${groupName} |
| **Domain** | ${domain} |
| **Created** | ${now.toISOString()} |
| **Status** | active |
${contextSection}${educatorSection}${lessonContextSection}
## Target Skills

${targetSkills && targetSkills.length > 0 ? targetSkills.map((s) => `- ${s}`).join("\n") : "_Full domain assessment_"}

## Target Learners

${learnerIds && learnerIds.length > 0 ? learnerIds.map((id) => `- ${id}`).join("\n") : "_All group members_"}

## Completed Assessments

_None yet._
`;

    const filename = `${code}.md`;
    await fs.writeFile(
      path.join(assessmentsDir, filename),
      assessmentContent,
      "utf-8"
    );

    const assessUrl = `${FRONTEND_URL}/assess/${code}`;

    return toolResponse({
      code,
      url: assessUrl,
      group: groupName,
      domain,
      targetSkills: targetSkills ?? "full_domain",
      targetLearners: learnerIds ?? "all_members",
      file: path.join(assessmentsDir, filename),
      created: now.toISOString(),
    });
  }
);
