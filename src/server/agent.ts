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

/** Create a live companion query for real-time teaching support */
export async function createLiveCompanionQuery(
  message: string,
  lessonId: string,
  options: AgentQueryOptions & { sectionContext?: string } = {}
): Promise<Query> {
  // Load the lesson plan
  let lessonContent = "";
  let groupContent = "";

  if (lessonId) {
    const lessonPath = path.join(DATA_DIR, "lessons", `${lessonId}.md`);
    try {
      lessonContent = await fs.readFile(lessonPath, "utf-8");
    } catch {
      // Lesson not found — still provide support
    }

    // Try to extract group name from lesson and load group profile
    const groupMatch = lessonContent.match(/\*\*Prepared for:\*\*\s*(.+)/);
    if (groupMatch) {
      const groupName = groupMatch[1].trim().toLowerCase().replace(/\s+/g, "-");
      const groupPath = path.join(DATA_DIR, "groups", `${groupName}.md`);
      try {
        groupContent = await fs.readFile(groupPath, "utf-8");
      } catch { /* no group file */ }
    }
  }

  const sectionInfo = options.sectionContext
    ? `\n\nCurrent section context:\n${options.sectionContext}`
    : "";

  const systemPrompt = `You are a real-time teaching companion. The educator is CURRENTLY in front of their class and needs immediate, actionable help. You are their co-teacher whispering in their ear.

CRITICAL RULES:
- Be EXTREMELY concise. The educator is reading this on a phone while teaching.
- Use bullet points, not paragraphs.
- Lead with the action: what to DO, not background explanation.
- Never say "I'd suggest..." — just say what to do.
- If asked for an alternative activity, give ONE specific activity with exact timing.
- If students are struggling, give a concrete intervention, not theory.

You have full context of the lesson plan and the group:

=== LESSON PLAN ===
${lessonContent || "(No lesson plan loaded)"}

=== GROUP PROFILE ===
${groupContent || "(No group profile loaded)"}
${sectionInfo}

When the educator asks a question:
1. Ground your answer in the specific lesson plan, student profiles, and skill graph
2. Reference students by name when relevant
3. Give time-aware suggestions ("You have X minutes left — try this...")
4. For emergency pivots, provide a complete activity with timing, materials, and expected outcome`;

  const queryOptions: Options = {
    model: "sonnet", // Fast responses for real-time use
    cwd: PROJECT_ROOT,
    settingSources: ["project"],
    mcpServers: {
      pedagogy: pedagogyServer,
    },
    allowedTools: [
      "Read",
      "Glob",
      "mcp__pedagogy__query_skill_graph",
      "mcp__pedagogy__query_group",
    ],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    systemPrompt,
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
