import {
  query,
  type Options,
  type SDKMessage,
  type Query,
} from "@anthropic-ai/claude-agent-sdk";
import fs from "fs/promises";
import path from "path";
import { pedagogyServer } from "./tools/index.js";
import { agentDefinitions } from "./agents/index.js";

// agent.ts is at src/server/ — go up 2 levels to project root
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(import.meta.dirname ?? process.cwd(), import.meta.dirname ? "../.." : ".");
const DATA_DIR = process.env.DATA_DIR || path.join(PROJECT_ROOT, "data");

const EDUCATOR_SYSTEM_PROMPT = `You are a pedagogical reasoning engine — an AI teaching partner that helps educators plan and deliver effective learning experiences. You think like an experienced teacher, not a content generator.

Core philosophy:
- Interview first, generate second. Never jump to output.
- Reason about skill structure and dependencies, not just content.
- Use Bloom's taxonomy to assess and calibrate depth.
- Leverage dependency inference to minimize redundant assessment.

You have access to custom pedagogical tools (prefixed with mcp__pedagogy__) for managing groups, querying skill graphs, generating assessments, and composing lesson plans. You also have access to built-in tools for reading and writing files.

Data conventions:
- Skill graphs: data/domains/{domain}/skills.json, dependencies.json
- Learner profiles: data/learners/{id}.md
- Groups: data/groups/{name}.md
- Assessments: data/assessments/{code}.md
- Lesson plans: data/lessons/{name}.md

Behavioral rules:
- Always read the relevant skill before performing a task
- Delegate assessment to the assessment-agent subagent when possible
- Delegate lesson composition to the lesson-agent subagent when possible
- Write learner profile updates after every assessment interaction
- Never hardcode skill definitions — always read from data/domains/`;

export interface AgentQueryOptions {
  sessionId?: string;
  resume?: string;
}

/** Create a new agent query for an educator conversation */
export async function createEducatorQuery(
  message: string,
  options: AgentQueryOptions = {}
): Promise<Query> {
  const queryOptions: Options = {
    model: "opus",
    cwd: PROJECT_ROOT,
    settingSources: ["project"],
    mcpServers: {
      pedagogy: pedagogyServer,
    },
    allowedTools: [
      "Read",
      "Write",
      "Glob",
      "Skill",
      "Task",
      "mcp__pedagogy__*",
    ],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    agents: agentDefinitions,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: EDUCATOR_SYSTEM_PROMPT,
    },
    persistSession: true,
  };

  if (options.resume) {
    queryOptions.resume = options.resume;
  }

  if (options.sessionId && !options.resume) {
    queryOptions.sessionId = options.sessionId;
  }

  return query({ prompt: message, options: queryOptions });
}

/** Create a focused assessment query for a student */
export async function createAssessmentQuery(
  assessmentCode: string,
  learnerName: string,
  message: string
): Promise<Query> {
  // Load the assessment session to get context
  const assessmentPath = path.join(
    DATA_DIR,
    "assessments",
    `${assessmentCode}.md`
  );
  let assessmentContext = "";
  try {
    await fs.access(assessmentPath);
    assessmentContext = await fs.readFile(assessmentPath, "utf-8");
  } catch {
    throw new Error(`Assessment session '${assessmentCode}' not found. Check the code and try again.`);
  }

  // Verify assessment is still active
  if (assessmentContext.includes("| **Status** | completed |")) {
    throw new Error(`Assessment session '${assessmentCode}' has already been completed.`);
  }

  const systemPrompt = `You are conducting a skill assessment for learner "${learnerName}" as part of assessment session ${assessmentCode}.

Assessment context:
${assessmentContext}

Use the assess-skills and reason-dependencies skills for methodology. Query the skill graph to understand dependencies. Update the learner's profile with results using the assess_learner tool.

Rules:
- Ask ONE question at a time
- Acknowledge what the learner shares before moving on
- Never test a skill you can confidently infer
- Record confidence levels for every skill (assessed or inferred)
- Note the Bloom's level demonstrated, not just pass/fail`;

  return query({
    prompt: `Hi, I'm ${learnerName}. ${message}`,
    options: {
      model: "sonnet",
      cwd: PROJECT_ROOT,
      settingSources: ["project"],
      mcpServers: {
        pedagogy: pedagogyServer,
      },
      allowedTools: [
        "Read",
        "Glob",
        "Skill",
        "mcp__pedagogy__assess_learner",
        "mcp__pedagogy__query_skill_graph",
      ],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      agents: agentDefinitions,
      systemPrompt,
      persistSession: false,
    },
  });
}
