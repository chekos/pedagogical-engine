import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import path from "path";
import { loadRosterTool } from "./load-roster.js";
import { querySkillGraphTool } from "./query-skill-graph.js";
import { generateAssessmentLinkTool } from "./generate-assessment-link.js";
import { checkAssessmentStatusTool } from "./check-assessment-status.js";
import { queryGroupTool } from "./query-group.js";
import { auditPrerequisitesTool } from "./audit-prerequisites.js";
import { composeLessonPlanTool } from "./compose-lesson-plan.js";
import { assessLearnerTool } from "./assess-learner.js";

// Resolve DATA_DIR relative to project root, not CWD
// tools/index.ts is at src/server/tools/ — go up 3 levels to project root
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(import.meta.dirname, "../../..");
if (!process.env.DATA_DIR) {
  process.env.DATA_DIR = path.join(PROJECT_ROOT, "data");
}

export const pedagogyServer = createSdkMcpServer({
  name: "pedagogy",
  version: "1.0.0",
  tools: [
    loadRosterTool,
    querySkillGraphTool,
    generateAssessmentLinkTool,
    checkAssessmentStatusTool,
    queryGroupTool,
    auditPrerequisitesTool,
    composeLessonPlanTool,
    assessLearnerTool,
  ],
});
