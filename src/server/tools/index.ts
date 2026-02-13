import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { loadRosterTool } from "./load-roster.js";
import { querySkillGraphTool } from "./query-skill-graph.js";
import { generateAssessmentLinkTool } from "./generate-assessment-link.js";
import { checkAssessmentStatusTool } from "./check-assessment-status.js";
import { queryGroupTool } from "./query-group.js";
import { auditPrerequisitesTool } from "./audit-prerequisites.js";
import { composeLessonPlanTool } from "./compose-lesson-plan.js";
import { assessLearnerTool } from "./assess-learner.js";
import { createDomainTool } from "./create-domain.js";
import { updateDomainTool } from "./update-domain.js";
import { composeCurriculumTool } from "./compose-curriculum.js";
import { advanceCurriculumTool } from "./advance-curriculum.js";
import { simulateLessonTool } from "./simulate-lesson.js";
import { analyzeTensionsTool } from "./analyze-tensions.js";
import { analyzeAssessmentIntegrityTool } from "./analyze-assessment-integrity.js";
import { analyzeAffectiveContextTool } from "./analyze-affective-context.js";
import { processDebriefTool } from "./process-debrief.js";

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
    createDomainTool,
    updateDomainTool,
    composeCurriculumTool,
    advanceCurriculumTool,
    simulateLessonTool,
    analyzeTensionsTool,
    analyzeAssessmentIntegrityTool,
    analyzeAffectiveContextTool,
    processDebriefTool,
  ],
});
