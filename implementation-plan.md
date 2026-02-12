# Implementation Plan: Pedagogical Reasoning Engine

**Builder:** chekos (solo, Claude Code sessions)
**Hackathon deadline:** February 16, 2026
**Today:** February 12, 2026
**Approach:** Large autonomous Claude Code sessions. You direct, review, and course-correct. Claude Code builds.

---

## Planning philosophy

Claude Code can run independently for hours. Don't babysit — launch a session with clear intent, let it run, review the output, course-correct, repeat. The sessions below are big and autonomous. Each one produces a substantial, working piece of the system.

**Target: Fully demoable prototype by end of day Thursday.** Friday and Saturday are for the second system — stretch features, polish, rehearsal, and making the demo *impressive* rather than just functional.

---

## Pre-step: Set up the repo and add strategic docs (you, manually)

Before opening Claude Code, create the repo and add the five strategic documents. Claude Code won't have access to your Claude Project — these files need to be on disk.

```bash
mkdir pedagogical-engine
cd pedagogical-engine
git init
mkdir docs
```

Copy/paste these five files into `docs/`:
- `north-star.md`
- `architecture.md`
- `technical-engine-spec.md`
- `product-description.md`
- `project-brief.md`

Then open Claude Code:

```bash
claude
```

---

## Session 1: Full scaffold + skill graph + pedagogical skills

**Goal:** Everything that isn't application code. The repo skeleton, the CLAUDE.md, the proof-of-concept domain data, and all four SKILL.md methodology files with their references and templates. When this session ends, the agent's "brain" is complete — it knows how to think about teaching.

**What to tell Claude Code:**

> Read all five documents in docs/. These are the strategic foundation for this project.
>
> Do three things in order:
>
> 1. **Scaffold the repo** based on docs/architecture.md. Full directory tree, package.json with workspaces, tsconfig, Dockerfile, .env.example. Write the CLAUDE.md file using the content specified in the architecture doc's CLAUDE.md section.
>
> 2. **Create the proof-of-concept skill domain.** Build a "python-data-analysis" domain in data/domains/python-data-analysis/. Define 20–25 skills spanning all six Bloom's taxonomy levels — from "can open a terminal" up to "can design an end-to-end data pipeline." Define dependency edges with confidence values. Make the graph rich enough to demonstrate meaningful inference chains (e.g., "can run a pandas groupby" implies 5+ downstream skills). Follow the Skill and Dependency schemas in docs/technical-engine-spec.md.
>
> 3. **Write all four pedagogical SKILL.md files** in .claude/skills/ with their reference files and templates:
>    - interview-educator: methodology, required fields, question patterns, stopping conditions. Include templates/interview-checklist.md.
>    - assess-skills: Bloom's taxonomy calibration, adaptive branching, dependency inference for efficient assessment. Include references/blooms-taxonomy.md with question patterns per level.
>    - compose-lesson: output structure, stage direction style, timing beats, calibration to group skill levels, contingency planning. Include templates/lesson-plan-template.md.
>    - reason-dependencies: graph traversal logic, inference rules, confidence decay for multi-hop, efficient assessment path finding. Include references/inference-patterns.md.
>
> Also write the three subagent definitions in .claude/agents/ (assessment-agent.md, roster-agent.md, lesson-agent.md) following the format in the architecture doc.

**Outputs:**
- Complete repo skeleton
- `CLAUDE.md`
- `data/domains/python-data-analysis/skills.json` + `dependencies.json`
- 4 SKILL.md files + 4 reference/template files
- 3 subagent definition files
- Initial git commit

**Duration:** Let it run. Review when done. Expect ~30–45 min of autonomous work, then 15 min of your review.

---

## Session 2: Complete backend — MCP tools + server + agent configuration

**Goal:** The entire backend in one session. All 8 custom MCP tools, the Express/WebSocket server, the Agent SDK configuration, session management. When this session ends, you can send a message to the backend and get an intelligent response from the pedagogical agent.

**What to tell Claude Code:**

> Read CLAUDE.md and docs/architecture.md for context. Build the complete backend.
>
> **Custom MCP tools** (src/server/tools/): Implement all pedagogical tools using createSdkMcpServer and tool() from the Agent SDK. Every tool reads/writes JSON in data/. Use zod for validation, nanoid for IDs.
>
> Tools to implement:
> - load_roster: Read or create group JSON + associated learner profiles
> - query_skill_graph: Load domain graph, support operations: prerequisites, infer_from, list_by_level, full_graph. Implement actual graph traversal — BFS/DFS for dependency chains, confidence decay for multi-hop inference.
> - generate_assessment_link: Create assessment session in data/assessments/, generate access code, return URL
> - check_assessment_status: Scan learner profiles for a group, report who's been assessed and who hasn't
> - query_group: Aggregate skill distributions across group members, identify common gaps, suggest pairings
> - audit_prerequisites: Cross-reference lesson requirements against group profiles + constraints, flag gaps and logistics needs
> - compose_lesson_plan: Orchestrate skill graph + profiles + constraints into structured markdown, write to data/lessons/
> - assess_learner: Update learner profile with assessment results, run dependency inference to update inferred skills
>
> **Server** (src/server/): Express + ws. WebSocket at /ws/chat for educator conversations. HTTP POST at /api/assess for student assessments. Health check at /api/status. Configure Agent SDK with: opus model, project settingSources, bypassPermissions, all custom tools + built-in tools (Read, Write, Glob, Skill, Task), subagent definitions loaded from .claude/agents/.
>
> **Session management** (src/server/sessions/): Map WebSocket connections to Agent SDK sessions for multi-turn conversations.
>
> Make sure the server actually starts and can handle a basic conversation. Test it.

**Outputs:**
- `src/server/tools/index.ts` + all individual tool files
- `src/server/index.ts` (Express + WebSocket server)
- `src/server/agent.ts` (Agent SDK config)
- `src/server/sessions/manager.ts`
- Server starts without errors, can receive and respond to messages

**Duration:** This is the big one. Let Claude Code run autonomously — expect 60–90 min. Review, fix issues, possibly re-run for corrections.

---

## Session 3: Complete frontend — educator chat + student assessment + landing page

**Goal:** The entire Next.js frontend in one session. Educator chat with streaming and rich tool result rendering. Student assessment interface. Landing page. When this session ends, the full golden path is UI-complete.

**What to tell Claude Code:**

> Read CLAUDE.md and docs/architecture.md. Build the complete Next.js frontend.
>
> **Landing page** (/): Clean, compelling. Brief description of what the system does. Two paths: "I'm an educator" → /teach, "I'm a student" → /assess. Keep it simple but professional.
>
> **Educator chat** (/teach): WebSocket connection to the backend at /ws/chat. Stream messages in real-time. Render different message types:
> - Regular text as chat bubbles
> - Tool results (lesson plans, assessment status, group summaries, skill graphs) as rich, formatted components — not raw JSON
> - Lesson plans should render with clear sections, timing, and visual hierarchy
> - Show a subtle indicator when the agent is using tools
>
> **Student assessment** (/assess/[code]): Code entry screen. Once entered, connects to backend assessment endpoint. Simple, focused chat interface — just the assessment conversation. Show progress/status.
>
> **Design direction:** Clean, modern, functional. Think Linear or Notion aesthetics — not flashy, but polished enough that judges see craft. Dark mode friendly. Good typography. Responsive.
>
> Wire up all the connections to the backend. Handle WebSocket reconnection, loading states, error states.

**Outputs:**
- `src/frontend/app/layout.tsx`, `page.tsx` (landing)
- `src/frontend/app/teach/page.tsx` (educator chat)
- `src/frontend/app/assess/[code]/page.tsx` (student assessment)
- `src/frontend/components/` — chat interface, message rendering, tool result components, assessment UI
- `src/frontend/lib/api.ts` — WebSocket client

**Duration:** 45–60 min autonomous, then review.

---

## Session 4: Integration, golden path testing, and demo data

**Goal:** Everything works end-to-end. The golden path demo runs smoothly. Realistic demo data is seeded. README is judge-ready.

**What to tell Claude Code:**

> Let's get everything running end-to-end and prepare for demo.
>
> 1. **Start the system and test the golden path.** Fix any integration issues — WebSocket connections, tool permissions, skill loading, streaming, rendering. Walk through:
>    - Educator arrives, describes a 90-minute Python data analysis workshop for their Tuesday evening cohort
>    - Agent interviews about context (setting, tools, prior knowledge, constraints)
>    - Agent checks assessment status, generates shareable assessment links
>    - Student completes assessment via link
>    - Agent composes full lesson plan with stage direction
>    - Educator requests changes, agent iterates
>
> 2. **Seed demo data.** Create a realistic "tuesday-cohort" group with 4–5 pre-built learner profiles at different skill levels. Include a mix: one advanced student, two intermediate, one beginner, one with gaps in unexpected places. Pre-populate some assessment results so the lesson plan composition has rich data to work with.
>
> 3. **Write the README.** Project title, one-liner, what it does, how to run it, architecture overview (brief), screenshots or demo flow description, what makes it different, why Opus 4.6. Written for hackathon judges — concise, compelling, technically credible.
>
> 4. **Error handling and edge cases.** Make sure the system handles: WebSocket disconnects gracefully, missing data files, assessment links that don't exist, empty groups.

**Outputs:**
- Working end-to-end golden path
- `data/groups/tuesday-cohort.json` + 4–5 learner profiles
- `README.md` (judge-ready)
- Bug fixes from integration testing

**Duration:** 90–120 min. This is where you're most actively involved — testing, catching issues, directing fixes.

---

## Session 5: Stretch — make it impressive

**Goal:** Go beyond functional. This session is about the features and polish that make judges say "wow" rather than "that works."

**What to tell Claude Code (pick based on time and energy):**

### Stretch A: Live dependency visualization
> Build a React component that visualizes the skill dependency graph as an interactive node graph. When the agent assesses a learner, nodes light up in real-time showing what's been confirmed, what's been inferred, and what's unknown. Use d3 or a similar library. Integrate it into the educator chat as a tool result component.

### Stretch B: Group comparison dashboard
> Build a component that shows the group's aggregate skill profile as a heatmap or radar chart. Highlight common gaps, show the distribution across Bloom's levels. Make it obvious at a glance where the group is strong and where they need work.

### Stretch C: Multi-domain demonstration
> Create a second skill domain — something completely different from Python data analysis. Maybe "outdoor ecology" (for the park naturalist pitch) or "culinary techniques" (for the homeschool parent pitch). Demonstrate that the same engine, same primitives, same reasoning works across domains by running a demo in each.

### Stretch D: Assessment in action
> Record or prepare a live walkthrough of the student assessment flow. Show the adaptive questioning — student answers a high-level question correctly, agent skips 5 prerequisite questions via inference. Student struggles, agent drills down. Make the dependency inference *visible* and impressive.

### Stretch E: Lesson plan export
> Export composed lesson plans as beautifully formatted PDFs or printable documents. An educator should be able to print the lesson plan and walk into their classroom with it.

**Duration:** Variable. Pick 1–2 that will have the most demo impact.

---

## Session 6: Demo rehearsal and final polish

**Goal:** The demo is rehearsed, the system is stable, everything is committed and deployed.

**What to tell Claude Code:**

> Final pass. Review the entire codebase for: any console errors, any unhandled edge cases in the demo flow, any UI rough edges. Make sure the deployment (Railway or wherever) is working. Update CLAUDE.md with the final state of the system. Make sure every file is committed.

**Also (you, not Claude Code):**
- Rehearse the demo 2–3 times
- Know exactly which questions to type as the educator to show the system's strengths
- Have a backup plan if the live demo hits issues (pre-recorded video, screenshots)
- Time it — know how long each section takes

**Duration:** 30–60 min Claude Code, plus your own rehearsal time.

---

## Timeline

| Day | Sessions | What's done by end of day |
|-----|----------|--------------------------|
| **Wed Feb 12** (tonight) | Pre-step + Sessions 1–3 | Brain + backend + frontend all built |
| **Thu Feb 13** | Session 4 | Full prototype working end-to-end |
| **Thu Feb 13** (evening) | Session 5 | Stretch features started |
| **Fri Feb 14** | Session 5 (continued) | Stretch features polished |
| **Sat Feb 15** | Session 6 | Deployed, rehearsed, ready |
| **Sun Feb 16** | Demo day | Don't touch code |

**Aggressive target:** Sessions 1–3 tonight, Session 4 first thing Thursday morning. Core prototype done by Thursday lunch. The rest is making it impressive.

---

## If things go sideways

The absolute minimum demo is Sessions 1, 2, 3, 4. That gives you:
- A pedagogical agent that interviews educators
- Skill dependency reasoning with real graph data
- Lesson plan composition with stage direction
- A clean UI to demo it in

Everything else is gravy. The core pitch — "an AI that thinks like a teacher, not a content generator" — lands with just those four sessions working.

---

*This plan assumes the Claude Agent SDK architecture as specified in architecture.md. Adjust if stack changes.*
