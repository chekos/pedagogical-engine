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
import { queryTeachingWisdomTool } from "./query-teaching-wisdom.js";
import { analyzeTeachingPatternsTool } from "./analyze-teaching-patterns.js";
import { addTeachingNoteTool } from "./add-teaching-note.js";
import { loadEducatorProfileTool } from "./load-educator-profile.js";
import { updateEducatorProfileTool } from "./update-educator-profile.js";
import { analyzeEducatorContextTool } from "./analyze-educator-context.js";
import { analyzeCrossDomainTransferTool } from "./analyze-cross-domain-transfer.js";
import { explainReasoningTool, storeReasoningTracesTool } from "./explain-reasoning.js";
import { analyzeMetaPedagogicalPatternsTool } from "./analyze-meta-pedagogical-patterns.js";
import { reportAssessmentProgressTool } from "./report-assessment-progress.js";
import { googleCheckConnectionTool } from "./google-check-connection.js";
import { googleRequestConnectionTool } from "./google-request-connection.js";
import { googleExportLessonToDocsTool } from "./google-export-lesson-to-docs.js";
import { googleImportRosterTool } from "./google-import-roster.js";
import { googleExportAssessmentsTool } from "./google-export-assessments.js";
import { googleListDriveTool } from "./google-list-drive.js";
import { googleShareDocumentTool } from "./google-share-document.js";
import { googleSyncClassroomTool } from "./google-sync-classroom.js";
import { googleExportLessonToSlidesTool } from "./google-export-lesson-to-slides.js";

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
    queryTeachingWisdomTool,
    analyzeTeachingPatternsTool,
    addTeachingNoteTool,
    loadEducatorProfileTool,
    updateEducatorProfileTool,
    analyzeEducatorContextTool,
    analyzeCrossDomainTransferTool,
    explainReasoningTool,
    storeReasoningTracesTool,
    analyzeMetaPedagogicalPatternsTool,
    reportAssessmentProgressTool,
    googleCheckConnectionTool,
    googleRequestConnectionTool,
    googleExportLessonToDocsTool,
    googleImportRosterTool,
    googleExportAssessmentsTool,
    googleListDriveTool,
    googleShareDocumentTool,
    googleSyncClassroomTool,
    googleExportLessonToSlidesTool,
  ],
});
