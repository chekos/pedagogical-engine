import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { loadRosterTool } from "./load-roster.js";
import { querySkillGraphTool } from "./query-skill-graph.js";
import { generateAssessmentLinkTool } from "./generate-assessment-link.js";
import { checkAssessmentStatusTool } from "./check-assessment-status.js";
import { queryGroupTool } from "./query-group.js";
import { auditPrerequisitesTool } from "./audit-prerequisites.js";
import { composeLessonPlanTool } from "./compose-lesson-plan.js";
import { assessLearnerTool } from "./assess-learner.js";

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
