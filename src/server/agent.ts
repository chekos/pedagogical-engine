import {
  query,
  type Options,
  type AgentDefinition,
  type SDKMessage,
  type Query,
} from "@anthropic-ai/claude-agent-sdk";
import fs from "fs/promises";
import path from "path";
import { pedagogyServer } from "./tools/index.js";

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const DATA_DIR = process.env.DATA_DIR || "./data";

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

/** Parse agent definition files from .claude/agents/ */
async function loadAgentDefinitions(): Promise<
  Record<string, AgentDefinition>
> {
  const agentsDir = path.join(PROJECT_ROOT, ".claude", "agents");
  const agents: Record<string, AgentDefinition> = {};

  try {
    const files = await fs.readdir(agentsDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = await fs.readFile(path.join(agentsDir, file), "utf-8");

      // Parse YAML frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!frontmatterMatch) continue;

      const frontmatter = frontmatterMatch[1];
      const body = frontmatterMatch[2].trim();

      const nameMatch = frontmatter.match(/name:\s*(.+)/);
      const descMatch = frontmatter.match(/description:\s*(.+(?:\n\s+.+)*)/);
      const modelMatch = frontmatter.match(/model:\s*(.+)/);
      const toolsMatch = frontmatter.match(/tools:\s*(.+)/);

      if (!nameMatch) continue;

      const name = nameMatch[1].trim();
      const description = descMatch
        ? descMatch[1].replace(/\n\s+/g, " ").trim()
        : `Agent: ${name}`;
      const model = modelMatch
        ? (modelMatch[1].trim() as "sonnet" | "opus" | "haiku")
        : undefined;
      const tools = toolsMatch
        ? toolsMatch[1].split(",").map((t) => t.trim())
        : undefined;

      agents[name] = {
        description,
        prompt: body,
        model,
        tools,
      };
    }
  } catch {
    console.log("[agent] No agent definitions found in .claude/agents/");
  }

  return agents;
}

export interface AgentQueryOptions {
  sessionId?: string;
  resume?: string;
}

/** Create a new agent query for an educator conversation */
export async function createEducatorQuery(
  message: string,
  options: AgentQueryOptions = {}
): Promise<Query> {
  const agents = await loadAgentDefinitions();

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
    agents,
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
  const agents = await loadAgentDefinitions();

  // Load the assessment session to get context
  const assessmentPath = path.join(
    DATA_DIR,
    "assessments",
    `${assessmentCode}.md`
  );
  let assessmentContext = "";
  try {
    assessmentContext = await fs.readFile(assessmentPath, "utf-8");
  } catch {
    throw new Error(`Assessment session '${assessmentCode}' not found`);
  }

  const assessmentPrompt = `You are conducting a skill assessment for learner "${learnerName}" as part of assessment session ${assessmentCode}.

Assessment context:
${assessmentContext}

Use the assess-skills and reason-dependencies skills for methodology. Query the skill graph to understand dependencies. Update the learner's profile with results using the assess_learner tool.

The learner's message: ${message}`;

  return query({
    prompt: assessmentPrompt,
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
      agents,
      systemPrompt: assessmentPrompt,
      persistSession: false,
    },
  });
}
