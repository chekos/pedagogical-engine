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

## What's built (as of Session 7 — Feb 12, 2026)

### Backend (src/server/)
- Express + WebSocket server on port 3000
- Agent SDK integration with Opus 4.6 for educator conversations, Sonnet for assessments
- 8 custom MCP tools via `createSdkMcpServer`:
  - `load_roster` — load or create groups and learner profiles
  - `query_skill_graph` — BFS/DFS traversal, dependency inference, Bloom's level filtering
  - `generate_assessment_link` — create assessment sessions with shareable codes
  - `check_assessment_status` — scan group profiles for assessment completion
  - `query_group` — aggregate skill distributions, identify gaps, suggest pairings
  - `audit_prerequisites` — cross-reference lesson needs against group profiles
  - `compose_lesson_plan` — orchestrate graph + profiles + constraints into lesson markdown
  - `assess_learner` — update profiles with assessment results, run dependency inference
- Session management with WebSocket connection mapping
- Graceful shutdown, periodic session cleanup

### Frontend (src/frontend/)
- Next.js 16 with App Router, Turbopack, Tailwind CSS v4 (CSS-native @theme config)
- Landing page (/) — hero with educator/student/dashboard CTAs
- Educator chat (/teach) — WebSocket streaming with rich tool result rendering
  - Markdown rendering via react-markdown + remark-gfm (GFM tables, code blocks, bold, lists, etc.)
  - Interactive AskUserQuestion cards (selectable options with submit, replaces raw JSON)
  - Persistent progress indicator with elapsed time counter and stage-aware labels
  - Voice input via Web Speech API — mic button with recording state animation
  - Optional TTS readback of assistant responses (toggle in input area)
- Live teaching companion (/teach/live/[lesson-id]) — voice-first mobile interface
  - Loads parsed lesson plan with timed sections and "you are here" tracking
  - Session timer with progress bar and time-remaining warnings
  - Horizontal section cards with feedback buttons (went well / struggled / skipped)
  - Large mic button as primary input — auto-sends voice, auto-speaks responses
  - Quick-ask suggestions for common teaching needs
  - Connects to /ws/live WebSocket with sectionContext
- Student assessment (/assess/[code]) — code entry + HTTP assessment chat
- Embeddable assessment widget (/assess/embed/[code]) — self-contained iframe version
  - No navigation, no header/footer — just the assessment conversation
  - Responsive sizing, works at any width/height
  - postMessage API: assessment:started, assessment:progress, assessment:completed, assessment:error
  - Embed demo page (/assess/embed-demo) with live preview, code snippets, and event log
  - Embed code generation integrated into share page (/assess/share)
- Skill analytics dashboard (/dashboard) — two views:
  - Dependency graph: interactive React Flow DAG with learner overlay, auto-cycle demo mode
  - Group dashboard: heatmap, Bloom's radar chart, common gaps analysis, pairing suggestions, learner summary cards
- Custom theme with light/dark mode via CSS variables

### Pedagogical brain (.claude/skills/, .claude/agents/)
- 4 SKILL.md files: interview-educator, assess-skills, compose-lesson, reason-dependencies
- 3 subagent definitions: assessment-agent, roster-agent, lesson-agent
- Reference files: Bloom's taxonomy patterns, inference rules, lesson plan template

### Demo data (data/)
- Domain: python-data-analysis (25 skills, 48 dependency edges, 6 Bloom's levels)
- Group: tuesday-cohort (5 learners with diverse skill profiles)
- Learners: Priya (advanced), Marcus (intermediate, accessibility needs), Sofia (intermediate, viz-strong), Alex (beginner), Nkechi (mixed — R expert learning Python)
- Pre-completed assessment: TUE-2026-0211

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

## Dev setup
- `npm install` from root installs all workspaces
- `npm run dev:server` — runs backend from project root (so `./data` resolves correctly)
- `npm run dev:frontend` — runs Next.js on port 3001
- Tailwind v4 config is CSS-native in `src/frontend/app/globals.css` (@theme inline) — no tailwind.config.ts

### Export system (src/server/exports/)
- PDF generation using @react-pdf/renderer (server-side, no browser required)
- 4 export types:
  - Lesson plan PDF: header, prereqs checklist, timed session plan, contingencies, logistics
  - Learner skill report PDF: skill bars, Bloom's distribution, strengths, focus areas
  - Group summary PDF: heatmap, common gaps, pairing recommendations, member overview
  - Prerequisites handout PDF: student-facing checklist for pre-session prep
- API endpoints:
  - GET /api/export/lessons — list available lesson plans
  - GET /api/export/lesson/:id — lesson plan PDF
  - GET /api/export/lesson/:id/prerequisites — prerequisites handout PDF
  - GET /api/export/learner/:id — learner skill report PDF
  - GET /api/export/group/:id — group summary report PDF
- Frontend integration:
  - ExportButton component with download, loading, and error states
  - /lessons page — browse and export all lesson plans
  - Inline export buttons in lesson plan view, dashboard header

## Current limitations
- Single domain (python-data-analysis) — multi-domain is architecturally supported but not demo'd
- Assessment flow requires the backend server running (no offline mode)
- Dashboard uses embedded demo data (not live from backend) for standalone viewing
- No persistent storage beyond filesystem — sessions lost on server restart
- No authentication — assessment codes are the only access control
