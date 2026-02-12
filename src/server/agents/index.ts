import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { assessmentAgent } from "./assessment-agent.js";
import { lessonAgent } from "./lesson-agent.js";
import { rosterAgent } from "./roster-agent.js";

export const agentDefinitions: Record<string, AgentDefinition> = {
  "assessment-agent": assessmentAgent,
  "lesson-agent": lessonAgent,
  "roster-agent": rosterAgent,
};
