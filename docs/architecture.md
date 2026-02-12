# Architecture: Pedagogical Reasoning Engine

**Project:** AI-Native Knowledge Engine for Educators
**Builder:** chekos
**Hackathon:** Built with Opus 4.6 — Cerebral Valley × Anthropic (Feb 10–16, 2026)
**Status:** Architectural north star — the blueprint for the codebase

---

## Why the Claude Agent SDK

The Agent SDK (formerly Claude Code SDK) isn't just "Claude Code as a library." It's the most battle-tested agent harness in production — powering Claude Code, Cowork, the Xcode integration, and increasingly all of Anthropic's major agent loops for *non-coding* tasks like research, video creation, and note-taking. It provides automatic context compaction, subagents with isolated context, the Skills system for progressive disclosure, custom tools via in-process MCP servers, session management, hooks for lifecycle control, and a plugin architecture. All of this with a single `query()` call.

By deploying to a VPS with a persistent filesystem (Railway, DigitalOcean, Fly.io), we unlock the full Agent SDK feature set. Here's what it gives us:

**Subagents** — Our three reasoning branches (assessment, roster, lesson creation) become isolated subagents with their own system prompts, tool restrictions, and context windows. The main agent delegates to them and gets results back without polluting the educator's conversation context.

**Skills** — Our pedagogical reasoning patterns become Skills that Claude discovers and loads on-demand. The skill graph, Bloom's taxonomy framework, interview methodology, and lesson composition patterns live as `SKILL.md` files on the filesystem. Claude loads only what it needs, when it needs it — progressive disclosure keeps the context lean.

**Custom tools via in-process MCP** — Our pedagogical tools (`assess_learner`, `compose_lesson`, `query_group`) are defined as in-process MCP server tools using `createSdkMcpServer` and `tool()`. They run in the same process as the agent. No external servers, no HTTP overhead.

**Automatic context compaction** — Long interview conversations won't exhaust the context window. The SDK handles this transparently.

**Filesystem as working memory** — Learner profiles, group state, skill graphs, and composed lesson plans are files on disk. The agent can read and write them. No need for a separate persistence layer. This is exactly how Claude Code works — and it's why it's effective for non-coding tasks.

**Future-proofing** — Every new Agent SDK feature (plugins, agent teams, new tool types) is immediately available. We're building on the platform Anthropic is investing in most heavily, directly aligned with what Cat Wu's team is shipping.

---

## Decision record

### Stack: Claude Agent SDK (TypeScript) + Next.js frontend + persistent VPS

The system splits into two parts:

**Backend: Claude Agent SDK running on a VPS** — A Node.js server that wraps the Agent SDK. It receives messages from the frontend via WebSocket (or HTTP streaming), feeds them to the agent, and streams responses back. The agent has access to the filesystem for storing and reading learner data, skill graphs, and composed outputs. It runs with custom MCP tools, subagents, and skills configured programmatically.

**Frontend: Next.js app** — A React application providing the educator chat interface and student assessment interface. Can be hosted anywhere (Vercel, same VPS, static CDN). Communicates with the backend server via API. Handles rendering, streaming display, and the shareable assessment link flow.

### Deployment: Railway (or DigitalOcean, Fly.io)

Railway has a one-click Claude Agent SDK template. It provides a persistent filesystem, Docker support, environment variable management, and public URLs. The Agent SDK runs in a container with Node.js 22+ and the Claude Code CLI pre-installed. Learner profiles, skill graphs, and session state persist across requests on the filesystem.

For the hackathon, we can use Railway's template directly and customize it, or deploy a Docker container to any VPS.

### Data layer: Filesystem (Markdown + JSON)

This is the most significant simplification. Instead of a database or an in-memory store with seed loaders, we use the filesystem directly. The agent reads and writes files using its built-in `Read` and `Write` tools, or our custom MCP tools access them programmatically.

**Markdown files** for anything a human might read or edit: learner profiles, group definitions, assessment sessions, and lesson plans. Claude is excellent at reading and writing structured Markdown, and educators can open these files directly to review, annotate, or update them. A learner profile as Markdown is immediately legible; as JSON it's hostile.

**JSON files** only for data that tools need to traverse programmatically: skill graph definitions and dependency edges. `query_skill_graph` needs to perform operations like "find all prerequisites of skill X" which requires parsing a directed graph. JSON is the right format for structured graph data.

This isn't a hack — it's the Agent SDK's design philosophy. Give the agent a computer. Files are the universal interface.

---

## Repository structure

```
pedagogical-engine/
│
├── CLAUDE.md                          # Agent memory — philosophy, architectural rules, behavior
├── README.md                          # Project overview for judges / GitHub
├── package.json
├── tsconfig.json
├── Dockerfile                         # Container definition for deployment
├── .env                               # ANTHROPIC_API_KEY (not committed)
│
├── docs/                              # Strategic documents
│   ├── north-star.md                  # Source of truth — philosophy, primitives, branches
│   ├── technical-engine-spec.md       # Data structures and reasoning branch specs
│   ├── product-description.md         # Educator-facing pitch
│   ├── project-brief.md              # Quick reference for pitches and demos
│   └── architecture.md               # This document
│
├── .claude/                           # Agent SDK configuration
│   │
│   ├── skills/                        # Skills — pedagogical reasoning patterns
│   │   ├── interview-educator/
│   │   │   ├── SKILL.md              # Interview methodology, what to ask, when to stop
│   │   │   └── templates/
│   │   │       └── interview-checklist.md  # Required fields and probe questions
│   │   │
│   │   ├── assess-skills/
│   │   │   ├── SKILL.md              # Assessment strategy — Bloom's taxonomy, dependency inference
│   │   │   └── references/
│   │   │       └── blooms-taxonomy.md # Bloom's levels with examples and question patterns
│   │   │
│   │   ├── compose-lesson/
│   │   │   ├── SKILL.md              # Lesson composition — structure, timing, stage direction
│   │   │   └── templates/
│   │   │       └── lesson-plan-template.md  # Output format with sections
│   │   │
│   │   └── reason-dependencies/
│   │       ├── SKILL.md              # Dependency graph traversal and inference logic
│   │       └── references/
│   │           └── inference-patterns.md  # How to infer skills from demonstrated ability
│   │
│   └── agents/                        # Subagent definitions (filesystem-based)
│       ├── assessment-agent.md        # Focused on evaluating learner skills
│       ├── roster-agent.md            # Focused on group reasoning and management
│       └── lesson-agent.md            # Focused on composing lesson plans
│
├── data/                              # Persistent data (filesystem-backed)
│   ├── domains/                       # Skill graph definitions
│   │   └── python-data-analysis/
│   │       ├── skills.json            # Skill definitions with Bloom's levels
│   │       └── dependencies.json      # Directed dependency edges
│   │
│   ├── groups/                        # Group definitions as Markdown (created by agent)
│   │   └── .gitkeep
│   │
│   ├── learners/                      # Individual learner profiles as Markdown (created by agent)
│   │   └── .gitkeep
│   │
│   ├── assessments/                   # Active assessment sessions as Markdown (created by agent)
│   │   └── .gitkeep
│   │
│   └── lessons/                       # Composed lesson plans as Markdown (created by agent)
│       └── .gitkeep
│
├── src/
│   ├── server/                        # Backend — Agent SDK server
│   │   ├── index.ts                   # Express/Fastify server — WebSocket + HTTP endpoints
│   │   ├── agent.ts                   # Agent SDK configuration — tools, subagents, permissions
│   │   ├── tools/                     # Custom MCP tools (in-process)
│   │   │   ├── index.ts              # createSdkMcpServer with all pedagogical tools
│   │   │   ├── load-roster.ts         # Read/create group and learner profiles from filesystem
│   │   │   ├── assess-learner.ts      # Trigger/manage assessment for a specific learner
│   │   │   ├── generate-assessment-link.ts  # Create shareable URL + access code
│   │   │   ├── check-assessment-status.ts   # Check if all assessments are complete
│   │   │   ├── query-group.ts         # Aggregate group skill distributions and gaps
│   │   │   ├── query-skill-graph.ts   # Traverse dependency graph, find prerequisites
│   │   │   ├── audit-prerequisites.ts # Check prerequisites, tools, logistics for a lesson
│   │   │   └── compose-lesson-plan.ts # Generate lesson plan and write to filesystem
│   │   │
│   │   └── sessions/                  # Session management
│   │       └── manager.ts             # Map educator sessions to Agent SDK sessions
│   │
│   └── frontend/                      # Next.js app (can be separate repo or monorepo)
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx               # Landing page
│       │   ├── teach/
│       │   │   └── page.tsx           # Educator chat interface
│       │   └── assess/
│       │       └── [code]/
│       │           └── page.tsx       # Student assessment interface
│       ├── components/
│       │   ├── chat/
│       │   │   ├── chat-interface.tsx  # Streaming chat with WebSocket connection
│       │   │   ├── message-bubble.tsx
│       │   │   └── tool-result.tsx     # Rich rendering of lesson plans, assessments
│       │   ├── lesson-plan/
│       │   │   └── lesson-plan-view.tsx
│       │   └── assessment/
│       │       ├── code-entry.tsx
│       │       └── assessment-chat.tsx
│       └── lib/
│           └── api.ts                 # WebSocket/HTTP client for backend
│
└── public/                            # Static assets for frontend
```

---

## Layer architecture

### Layer 1: Skills (.claude/skills/)

Skills are the engine's pedagogical knowledge. They encode *how to think about teaching* — not specific content, but methodology. Each skill is a directory with a `SKILL.md` that Claude loads on-demand via progressive disclosure.

**interview-educator** — How to interview an educator. What information is required (topic, audience, setting, duration, tools, constraints, prior knowledge). How to ask questions (one at a time, acknowledge what's shared, don't repeat). When to stop (all required fields populated). References an interview checklist template.

**assess-skills** — How to assess learner skills. Start with high-level questions, use dependency inference to minimize testing, calibrate to Bloom's taxonomy levels. References Bloom's taxonomy documentation with question patterns per level. How to update learner profiles based on responses.

**compose-lesson** — How to compose a lesson plan. The output structure (prerequisites, objectives, timed plan, contingencies). How to write stage direction ("by minute 14, transition or you'll lose the back half"). How to calibrate activities to the group's skill level. References the lesson plan template.

**reason-dependencies** — How to traverse and reason about the dependency graph. If a learner demonstrates skill X, what can be inferred? Confidence decay rules for multi-hop inference. How to find efficient assessment paths by testing high-level skills first.

The agent only loads a skill when it's relevant. When an educator says "let's plan a lesson," Claude reads `compose-lesson/SKILL.md`. When it needs to assess a student, it reads `assess-skills/SKILL.md`. The skill graph data and Bloom's reference docs are loaded only if the skill's instructions say to read them. This is progressive disclosure — the context window stays lean.

### Layer 2: Subagents (.claude/agents/)

The three reasoning branches become subagents. Each has its own system prompt, tool restrictions, and isolated context window.

**assessment-agent** — Specialized in evaluating learner skills. Has access to: custom MCP tools for reading learner profiles and skill graphs, the `assess-skills` and `reason-dependencies` skills. Does not have Write access to anything except learner profile JSON files. The main agent delegates assessment tasks to it and receives structured results.

```markdown
# .claude/agents/assessment-agent.md
---
name: assessment-agent
description: Evaluates learner skills through adaptive questioning using
  Bloom's taxonomy and dependency inference. Delegate to when the system
  needs to assess what a learner knows.
model: sonnet
tools: Read, Glob, Skill, mcp__pedagogy__assess_learner, mcp__pedagogy__query_skill_graph
---
You are an assessment specialist. Your job is to determine what a learner
knows through targeted, adaptive questioning.

Always start by reading the relevant skill graph and the learner's
existing profile. Use the assess-skills and reason-dependencies skills
for methodology.

Start with high-level questions. If the learner demonstrates competence,
infer downstream skills via dependency graph. If they struggle, traverse
down the chain to find where their knowledge stops.

Use Bloom's taxonomy to gauge depth — not just "do they know X" but
"can they apply X, analyze with X, evaluate using X."

Return your findings as a structured update to the learner's profile.
```

**roster-agent** — Specialized in group reasoning. Aggregates learner profiles, identifies patterns, recommends pairings, flags common gaps. Read-only access to all learner and group files.

**lesson-agent** — Specialized in composing lesson plans. Has access to all data (skill graphs, learner profiles, group data, constraints) and writes lesson plan files to `data/lessons/`. Uses the `compose-lesson` skill for methodology. Produces structured Markdown output.

When the main agent receives "I want to teach my Tuesday cohort about data cleaning," it doesn't try to do everything. It delegates to the lesson-agent, which operates in its own context window with the full skill graph and group profile loaded, without cluttering the educator's conversation.

### Layer 3: Custom MCP Tools (src/server/tools/)

These are the agent's hands. In-process MCP tools defined with `createSdkMcpServer` and `tool()` from the Agent SDK. They run in the same Node.js process as the agent — no external servers.

```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "./data";

const pedagogyServer = createSdkMcpServer({
  name: "pedagogy",
  version: "1.0.0",
  tools: [
    tool(
      "load_roster",
      "Load or create a group and its learner profiles. Returns group metadata and member profiles.",
      {
        groupName: z.string().describe("Name or identifier for the group"),
        domain: z.string().describe("Skill domain, e.g. 'python-data-analysis'"),
      },
      async ({ groupName, domain }) => {
        const groupPath = path.join(DATA_DIR, "groups", `${groupName}.json`);
        // Read or create group, load associated learner profiles
        // Return structured group data
      }
    ),

    tool(
      "query_skill_graph",
      "Query the skill dependency graph for a domain. Can find prerequisites, infer skills from demonstrated ability, or list skills at a Bloom's level.",
      {
        domain: z.string(),
        operation: z.enum(["prerequisites", "infer_from", "list_by_level", "full_graph"]),
        skillId: z.string().optional(),
        bloomLevel: z.string().optional(),
      },
      async ({ domain, operation, skillId, bloomLevel }) => {
        const graphPath = path.join(DATA_DIR, "domains", domain);
        // Load skills.json and dependencies.json
        // Perform graph operations based on operation type
      }
    ),

    tool(
      "generate_assessment_link",
      "Create a shareable assessment URL with an access code for a learner to self-assess.",
      {
        learnerId: z.string(),
        groupId: z.string(),
        domain: z.string(),
        targetSkills: z.array(z.string()).describe("Skills to assess"),
      },
      async ({ learnerId, groupId, domain, targetSkills }) => {
        // Create assessment session file in data/assessments/
        // Generate access code
        // Return URL and code
      }
    ),

    // ... additional tools: check_assessment_status, query_group,
    //     audit_prerequisites, compose_lesson_plan, assess_learner
  ],
});
```

### Layer 4: Server (src/server/)

An Express or Fastify server that bridges the frontend to the Agent SDK. It exposes:

**WebSocket endpoint** (`/ws/chat`) — For the educator chat. The frontend connects, sends messages, and receives streamed responses. The server maintains a mapping from WebSocket connections to Agent SDK sessions, enabling multi-turn conversations with session persistence.

**HTTP endpoint** (`/api/assess`) — For student assessments. Stateless per assessment — the student provides their access code, the server loads the assessment session from the filesystem, runs a focused Agent SDK query with the assessment-agent, and streams the response.

**HTTP endpoint** (`/api/status`) — Health check and session status.

The server configures the Agent SDK with:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: educatorMessage,
  options: {
    model: "opus",
    systemPrompt: EDUCATOR_SYSTEM_PROMPT,
    cwd: DATA_DIR,
    settingSources: ["project"],  // Load skills and agents from .claude/
    mcpServers: {
      pedagogy: pedagogyServer,   // In-process custom tools
    },
    allowedTools: [
      "Read", "Write", "Glob", "Skill", "Task",  // Built-in tools
      "mcp__pedagogy__*",                          // All custom pedagogical tools
    ],
    permissionMode: "bypassPermissions",  // Server-side, no human approval needed
    agents: {
      "assessment-agent": assessmentAgentDef,
      "roster-agent": rosterAgentDef,
      "lesson-agent": lessonAgentDef,
    },
  },
})) {
  // Stream messages to frontend via WebSocket
}
```

### Layer 5: Frontend (src/frontend/)

A Next.js app with two surfaces. Can be deployed to Vercel (free tier), the same VPS, or any static hosting.

**Educator workspace** (`/teach`) — Chat interface connected to the backend via WebSocket. Renders streamed responses including rich tool results (lesson plans, assessment status, group summaries). The educator types naturally; the agent handles the rest.

**Student assessment** (`/assess/[code]`) — Simpler interface. Student enters access code, gets connected to the assessment-agent's endpoint, and completes a focused skill assessment conversation.

The frontend is intentionally thin. All intelligence is in the backend. If you replaced the React frontend with a terminal client, a Slack bot, or a Discord bot, nothing on the backend would change.

---

## Data flow: The golden path

Same six-step flow as the v1 architecture, but now the mechanics leverage the Agent SDK fully.

### Step 1: Educator arrives, loads roster

Educator message: *"I'm teaching a 90-minute workshop on data analysis with Python to my Tuesday evening cohort."*

The main agent calls `mcp__pedagogy__load_roster` → reads/creates `data/groups/tuesday-cohort.md` and associated learner profiles in `data/learners/`. Returns structured data to the conversation.

### Step 2: Interview

The main agent reads the `interview-educator` skill (progressive disclosure: SKILL.md loaded, then interview checklist template). Asks targeted questions. Captures responses. Builds constraint set.

The agent writes interview results to `data/groups/tuesday-cohort.md` as it goes — constraints, topic, setting, duration. The filesystem is the working memory.

### Step 3: Assessment check

Agent calls `mcp__pedagogy__check_assessment_status` → scans learner profiles, identifies who needs assessment. Presents options: educator provides info verbally, or agent calls `mcp__pedagogy__generate_assessment_link` → creates `data/assessments/TUE-2026-0212.md` → returns shareable URL.

### Step 4: Student assessment

Student visits `/assess/TUE-2026-0212`, enters code. Frontend connects to backend assessment endpoint. Backend runs a focused query with the **assessment-agent** subagent, which:
- Reads the assessment session file from filesystem
- Loads the `assess-skills` and `reason-dependencies` skills
- Queries the skill graph via `mcp__pedagogy__query_skill_graph`
- Conducts adaptive interview
- Writes results to `data/learners/{learner-id}.md`

The subagent runs in its own context window — the educator's conversation is untouched.

### Step 5: Lesson plan composition

Educator is notified assessments are complete. Agent delegates to the **lesson-agent** subagent, which:
- Reads the group profile, all learner profiles, skill graph, and constraints
- Loads the `compose-lesson` skill
- Calls `mcp__pedagogy__audit_prerequisites` to check feasibility
- Composes the full lesson plan
- Writes it to `data/lessons/tuesday-2026-02-12.md`
- Returns the structured plan to the main agent

The main agent presents the lesson plan in the educator's conversation as a rich component.

### Step 6: Iteration

Educator asks for changes. The main agent can either modify the plan directly (it can Read/Write the lesson file) or delegate back to the lesson-agent for significant recomposition.

---

## What the Agent SDK provides out of the box

| Capability | How it works |
|---|---|
| Context compaction | Automatic — long conversations won't exhaust the context window |
| Subagents with isolated context | `agents` option + `Task` tool — branches get their own context windows |
| Progressive disclosure of knowledge | Skills system — Claude loads only what's needed, when it's needed |
| Filesystem as working memory | Built-in Read/Write/Glob tools — no separate persistence layer |
| Session management | Built-in with resume capability — multi-turn conversations across requests |
| Custom tools | In-process MCP server with `createSdkMcpServer` and `tool()` |
| Lifecycle hooks | Pre/post tool use hooks for logging, validation, and control |
| Future features | Automatic — plugins, agent teams, new tools arrive as SDK updates |

---

## Key technical decisions

### Why subagents instead of nested API calls

A common pattern for multi-branch reasoning is to have tools make their own API calls to the model with specialized prompts. The Agent SDK gives us something better: true subagents with isolated context windows, their own system prompts, their own tool restrictions, and proper session management. The assessment-agent can hold a full skill graph in its context without the educator ever seeing it. The lesson-agent can reason through 8 learner profiles simultaneously without polluting the main conversation.

### Why Skills instead of prompt files

A traditional approach would put prompts in TypeScript files as exported strings. Skills are strictly better: they use progressive disclosure (Claude loads only what's needed), they can include reference files and scripts, they're discoverable by the agent automatically, and they follow an open standard that works across Claude Code, the API, and other tools.

Our pedagogical methodology — interview patterns, Bloom's taxonomy framework, dependency inference logic, lesson composition structure — fits the Skills model perfectly. These are reusable, domain-agnostic patterns that Claude should load on-demand based on what the task requires.

### Why filesystem over database

The Agent SDK is designed around filesystem access. The agent already has Read, Write, and Glob tools. Learner profiles as Markdown files, lesson plans as Markdown files — this is natural for both the agent and the educator to work with. Educators can open a learner profile in any text editor, read it, and update it. Adding a database would mean building a custom MCP tool for every query, losing the agent's ability to browse and discover data, adding deployment complexity, and making the data opaque to humans. For a hackathon demo (and honestly for an early-stage product), filesystem-backed Markdown + JSON is the right call.

### Why VPS over serverless

The Agent SDK needs a persistent process with filesystem access. Railway gives us this with minimal setup. The tradeoff is we lose Vercel's zero-config frontend deployment, but we can still host the Next.js frontend on Vercel and point it at the Railway backend — or serve everything from Railway. For a hackathon, having one box that runs everything is simpler than managing two deployment targets.

---

## CLAUDE.md content

The `CLAUDE.md` file serves as the agent's persistent memory across sessions:

```markdown
# Pedagogical Reasoning Engine

## Identity
You are a pedagogical reasoning engine — an AI teaching partner that helps
educators plan and deliver effective learning experiences. You think like
an experienced teacher, not a content generator.

## Core philosophy
- Interview first, generate second. Never jump to output.
- Reason about skill structure and dependencies, not just content.
- Use Bloom's taxonomy to assess and calibrate depth.
- Leverage dependency inference to minimize redundant assessment.

## Architecture
- Skills in .claude/skills/ encode your pedagogical methodology
- Subagents in .claude/agents/ handle specialized reasoning branches
- Custom tools in the pedagogy MCP server access data in data/
- All persistent data lives in data/ as JSON and Markdown files

## Data conventions
- Skill graphs: data/domains/{domain}/skills.json, dependencies.json (JSON — programmatic traversal)
- Learner profiles: data/learners/{id}.md (Markdown — human-readable, educator-editable)
- Groups: data/groups/{name}.md (Markdown — human-readable)
- Assessments: data/assessments/{code}.md (Markdown — human-readable)
- Lesson plans: data/lessons/{name}.md (Markdown — human-readable)

## Behavioral rules
- Always read the relevant skill before performing a task
- Delegate assessment to the assessment-agent subagent
- Delegate lesson composition to the lesson-agent subagent
- Write learner profile updates after every assessment interaction
- Never hardcode skill definitions — always read from data/domains/
```

---

## Dependencies

**Backend (Agent SDK server):**
```json
{
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest",
    "express": "^4",
    "ws": "^8",
    "zod": "^3",
    "nanoid": "^5"
  }
}
```

**Frontend (Next.js app):**
```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19"
  }
}
```

Or combine into workspaces if monorepo.

---

## Deployment (hackathon quick-start)

**Option A: Railway one-click**
1. Fork the Railway Claude Agent SDK template
2. Add our repo's `.claude/`, `data/`, and `src/server/`
3. Set `ANTHROPIC_API_KEY` environment variable
4. Deploy frontend to Vercel pointing at Railway URL

**Option B: Docker on any VPS**
```dockerfile
FROM node:22-alpine
RUN npm install -g @anthropic-ai/claude-code
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "src/server/index.js"]
```

---

## What this document does NOT cover

- UI/UX design specifics
- Skill content (the actual SKILL.md text — written during build)
- Skill graph content (specific skills for proof-of-concept domain)
- WebSocket protocol details between frontend and backend
- Production security hardening (sandbox configuration, network isolation)

These are all downstream. Build the skeleton, then fill it in.

---

*Derived from North Star document. For changes that affect philosophy or primitives, update North Star first.*
*Last updated: February 12, 2026*
