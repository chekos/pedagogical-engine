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
- Developer skills in `.claude/skills/` assist developers working on this codebase
- Agent skills in `agent-workspace/.claude/skills/` are what the in-app agent uses (pedagogical + Office export skills)
- Agent subagents in `agent-workspace/.claude/agents/` handle specialized reasoning branches
- 36 custom MCP tools in the pedagogy MCP server access data in data/
- All persistent data lives in agent-workspace/data/ as JSON and Markdown files
- Agent workspace separation: the agent SDK runs with `cwd: agent-workspace/` so it picks up agent-specific skills, not developer skills

## What's built (as of Session 12 — Feb 14, 2026)

### 9 Moonshot features
1. **Lesson simulation** — predict friction before teaching
2. **Pedagogical disagreement** — the engine pushes back on bad plans
3. **Cross-domain transfer** — skills transfer across domain boundaries
4. **Meta-pedagogical reasoning** — "why did you choose that?" with real traces
5. **Assessment integrity** — detect gaming and inconsistency
6. **Affective dimension** — emotional/motivational context analysis
7. **Post-session debrief** — structured reflection feeding the wisdom layer
8. **Accumulated teaching wisdom** — flywheel effect from session patterns
9. **Educator profiling** — personalized plans based on teaching style

### Backend (src/server/)
- Express + WebSocket server on port 3000
- Agent SDK integration with Opus 4.6 for educator conversations, Sonnet for assessments
- 36 custom MCP tools via `createSdkMcpServer`:
  - `load_roster` — load or create groups and learner profiles
  - `query_skill_graph` — BFS/DFS traversal, dependency inference, Bloom's level filtering
  - `generate_assessment_link` — create assessment sessions with shareable codes
  - `check_assessment_status` — scan group profiles for assessment completion
  - `query_group` — aggregate skill distributions, identify gaps, suggest pairings
  - `audit_prerequisites` — cross-reference lesson needs against group profiles
  - `compose_lesson_plan` — orchestrate graph + profiles + constraints into lesson markdown
  - `assess_learner` — update profiles with assessment results, run dependency inference
  - `create_domain` — create a new skill domain from scratch
  - `update_domain` — update an existing domain's skills and dependencies
  - `compose_curriculum` — compose a multi-session curriculum plan
  - `advance_curriculum` — advance curriculum state after a session
  - `simulate_lesson` — predict friction points, timing risks, and energy drops before teaching (Moonshot 1)
  - `analyze_tensions` — pedagogical disagreement: push back on suboptimal plans with evidence (Moonshot 2)
  - `analyze_assessment_integrity` — detect gaming, inconsistency, and confidence-competence mismatches (Moonshot 5)
  - `analyze_affective_context` — analyze emotional and motivational context for a group (Moonshot 6)
  - `process_debrief` — structured post-session reflection that feeds into wisdom layer (Moonshot 7)
  - `query_teaching_wisdom` — retrieve accumulated teaching notes and patterns for a domain, filtered by skill, type, confidence, and group level
  - `analyze_teaching_patterns` — scan all debriefs for a domain to detect recurring timing, engagement, confusion, and success patterns
  - `add_teaching_note` — add educator-direct teaching notes with high confidence to the domain's wisdom layer
  - `load_educator_profile` — load an educator's teaching profile (style, strengths, timing patterns) or list all profiles
  - `update_educator_profile` — create or update an educator's profile from interview signals, preferences, or debrief patterns
  - `analyze_educator_context` — generate lesson-specific customization recommendations based on educator profile + domain + skills
  - `analyze_cross_domain_transfer` — analyze skill transfer across domain boundaries using Bloom's alignment, cognitive operation matching, and dependency chain analysis
  - `explain_pedagogical_reasoning` — retrieve and compose evidence-based explanations for any decision in a lesson plan, grounded in skill graph, learner profiles, Bloom's levels, and constraints
  - `store_reasoning_traces` — store structured reasoning traces alongside lesson plans during composition, capturing what was decided, why, what alternatives were considered, and what would change the decision
  - `analyze_meta_pedagogical_patterns` — detect when an educator's questions reveal a pattern (e.g., keeps asking about timing) and surface the underlying pedagogical principle to teach
  - `check_google_connection` — check whether Google account is connected, returns status, email, and services
  - `request_google_connection` — request OAuth connection; frontend renders inline connect card
  - `export_lesson_to_docs` — export a lesson plan to a formatted Google Doc with headings, bold, lists
  - `export_lesson_to_slides` — export a lesson plan to a Google Slides presentation (one slide per section)
  - `import_roster_from_sheets` — import student names from a Google Sheet as learner profiles
  - `export_assessments_to_sheets` — export a group's skill matrix to a Google Sheet
  - `list_drive_files` — list files from Google Drive with optional query/mimeType filter
  - `share_document` — share a Google Drive file with email addresses
  - `sync_with_classroom` — list Google Classroom courses or import students from a course
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
- Teaching wisdom dashboard (/wisdom) — accumulated teaching insights per domain
  - Stats overview: sessions analyzed, total notes, patterns detected, avg confidence
  - Flywheel effect callout showing how sessions compound into better plans
  - Tabbed view: teaching notes (filterable by type, skill) and cross-skill patterns
  - Confidence bars, note type distribution chart, pattern recommendations
- Educator profiles page (/profile) — teaching style visualization and comparison
  - Educator selector with profile cards
  - Teaching style distribution bar chart (lecture, discussion, hands-on, socratic, project-based, demonstration)
  - Strengths with confidence bars, growth areas, content confidence by domain
  - Timing patterns (learned adjustments from debriefs)
  - Growth nudges and preferences
  - Side-by-side comparison view showing how the same lesson would differ for two educators
- Cross-domain transfer page (/transfer) — analyze skill transfer across domains
  - Learner selector, source/target domain pickers
  - Readiness banner with score and level (high/moderate/low/none)
  - Side-by-side domain comparison with Bloom's-grouped skill lists
  - Transfer bridges visualization showing source→target skill mappings with confidence
  - Color-coded by transfer type (cognitive_operation, metacognitive, structural)
- Meta-pedagogical reasoning page (/meta) — explore the "why" behind every decision
  - Lesson plan selector with trace count
  - Decision type filter cards (ordering, timing, pairing, activity choice, content depth, contingency)
  - Expandable trace cards showing decision, reasoning, evidence tags, alternatives considered, and what would change
  - Evidence breakdown by type: skill graph, learner profiles, Bloom's taxonomy, constraints, teaching wisdom, educator profile
  - Pedagogical principles reference grid
- Google Workspace onboarding (/onboarding) — 3-step OAuth connect wizard
  - Step 1: value prop with 4 benefit cards (Docs, Sheets, Classroom, Drive) + connect CTA + skip
  - Step 3: success state with connected email, service checklist, "Start planning" link
  - OAuth callback page (/onboarding/callback) handles success/error with localStorage signaling
- Inline Google connect card in chat — rendered when agent calls `request_google_connection`
  - Opens OAuth consent in popup, polls for close, checks status, sends confirmation to agent
- Google status badge in session context sidebar — polls `/api/auth/google/status`
- Custom theme with light/dark mode via CSS variables

### Meta-pedagogical layer (Moonshot 4)
- Decision tracing: every major decision in a lesson plan is tagged with its reasoning chain
  - Which primitives drove the decision (skill graph, learner profiles, Bloom's taxonomy, constraints, teaching wisdom, educator profile)
  - What alternatives were considered and why they were rejected
  - What would need to change for the decision to go differently
- Reasoning traces stored as structured JSON in `data/reasoning-traces/{lesson-id}.json`
- On-demand explanation: when an educator asks "why?" about any part of a plan, the engine retrieves stored traces and composes natural, evidence-grounded explanations
  - References specific learner profiles by name
  - Cites dependency chains in the skill graph
  - Names Bloom's taxonomy levels and group vs. activity comparisons
  - Mentions alternatives considered and why they were rejected
- Pedagogical teaching moments: when an educator's questions reveal a pattern (keeps asking about the same type of decision), the engine recognizes the pattern and offers to teach the underlying principle
  - 6 built-in pedagogical principles: Bloom's & activity ordering, evidence-based timing, skill-complementary pairing, content depth by expertise, contingency design, session energy management
  - Question pattern tracking per educator
  - Natural, non-condescending framing: "You've been asking about timing decisions. There's a framework I use for this. Want me to walk you through it?"
- MCP tools:
  - `explain_pedagogical_reasoning` — retrieve stored reasoning traces and construct evidence-based explanations
  - `store_reasoning_traces` — store reasoning traces during/after lesson composition
  - `analyze_meta_pedagogical_patterns` — detect question patterns and surface teaching moments
- API endpoints:
  - GET /api/reasoning — list lessons with reasoning traces
  - GET /api/reasoning/:lessonId — get all reasoning traces for a lesson
  - GET /api/reasoning/:lessonId/:traceId — get a specific reasoning trace
- Demo data: 8 reasoning traces for the basic-plotting-with-matplotlib lesson plan, covering all 6 decision types
- Compose-lesson SKILL.md updated with reasoning trace generation methodology

### Lesson simulation layer (Moonshot 1)
- Pre-teaching friction analysis: run a lesson plan through the group's skill profiles before teaching
- Predicts timing risks, energy drops, and engagement issues per section
- Per-learner friction points: identifies where specific students will struggle based on skill gaps
- Generates timing risk scores and suggested adjustments
- MCP tool: `simulate_lesson`
- Frontend: `/simulate` and `/simulate/[id]` pages with section-by-section friction visualization

### Pedagogical disagreement layer (Moonshot 2)
- Evidence-based pushback: when an educator requests something pedagogically suboptimal, the engine disagrees
- Cites specific learner profiles, skill gaps, and Bloom's levels in its counter-arguments
- Tension types: timing constraints, skill mismatches, activity-audience misalignment, scope issues
- Not generic warnings — grounded in the actual group's data
- MCP tool: `analyze_tensions`
- Frontend: `/disagree` page with tension cards and alternative suggestions

### Assessment integrity layer (Moonshot 5)
- Detects gaming patterns: suspiciously fast responses, inconsistent skill demonstrations
- Confidence-competence mismatch detection: high self-reported confidence with low demonstrated skill
- Cross-question consistency analysis
- MCP tool: `analyze_assessment_integrity`
- Frontend: `/assess/integrity` page

### Affective dimension layer (Moonshot 6)
- Analyzes emotional and motivational context for the group
- Considers factors: time of day, session history, group dynamics, individual stressors
- Feeds into lesson composition for pacing and activity selection
- MCP tool: `analyze_affective_context`

### Post-session debrief layer (Moonshot 7)
- Structured post-teaching reflection: what worked, what didn't, what surprised
- Extracts timing patterns, confusion points, success patterns
- Feeds observations into the teaching wisdom layer (Moonshot 8) as teaching notes
- Updates educator profiles (Moonshot 9) with timing adjustments
- MCP tool: `process_debrief`
- Frontend: `/debrief/[lesson-id]` page
- Demo data: pre-seeded debriefs available

### Cross-domain transfer layer (Moonshot 3)
- Cross-domain inference: when a learner has assessed skills in one domain, predict partial readiness in another
  - Uses Bloom's taxonomy alignment — same level transfers better than different levels
  - Cognitive operation similarity — "analyze X" in one domain maps to "analyze Y" in another
  - Dependency chain position — higher-order skills (many prereqs) transfer more than foundational skills
  - Confidence decay — base rate 0.35, significantly lower than within-domain inference (0.85+)
  - Confidence cap at 0.55 — cross-domain transfer never claims high confidence
- Transfer types: cognitive_operation (shared verbs), metacognitive (both high-order), structural (Bloom's match)
- Assessment optimization: use transfer predictions to start assessment at a higher level, saving time
- Clearly labeled in output: transfers are hypotheses, not conclusions
- Demo: Maya Whitehawk (outdoor-ecology, 16 skills up to evaluation) → python-data-analysis
  - Her analysis/synthesis/evaluation ecology skills predict partial readiness for data analysis reasoning
  - Domain-specific skills (terminal, pandas) don't transfer — only cognitive frameworks do
- MCP tool: `analyze_cross_domain_transfer` — full analysis with confidence model
- API endpoints:
  - GET /api/transfer/:learnerId?source=X&target=Y — run transfer analysis
  - GET /api/transfer-learners — list learners with assessed skills

### Educator profiling layer (Moonshot 9)
- Educator profiles: structured teaching style data at `data/educators/{id}.json`
  - Teaching style distribution: lecture, discussion, hands_on, socratic, project_based, demonstration (percentages sum to ~1.0)
  - Strengths with confidence scores: content_expertise, facilitation, improvisation, group_management, rapport_building, time_management, structured_explanation
  - Growth areas with notes
  - Content confidence per domain: expert, proficient, intermediate, novice
  - Preferences: lesson_start, group_work_comfort, pacing, contingency_preference
  - Timing patterns: per-activity-type minute adjustments learned from debriefs
  - Growth nudges: suggestions the engine may include in plans to expand the educator's range
- Profile building happens naturally from three sources:
  1. Interview signals — captured during first conversation
  2. Explicit preferences — 2-3 questions woven into conversation
  3. Debrief patterns — updated after each post-session debrief
- Lesson composition integration: when composing plans, the engine loads the educator profile and:
  - Weights activities toward the educator's preferred styles
  - Adjusts content scaffolding depth based on domain expertise (expert gets bullet points, novice gets full talking points)
  - Pre-calibrates timing for known patterns (if they always run +5 min on hands-on, shorten those sections)
  - Matches contingency style (improvisers get open-ended pivots, structuralists get specific alternatives)
  - Occasionally includes a growth nudge with extra scaffolding
- Demo data: two contrasting educator profiles
  - Dr. Sarah Chen: lecture/hands-on style, expert content knowledge, structured approach, prefers specific alternatives
  - Marcus Rodriguez: hands-on/discussion style, intermediate content knowledge, high-energy facilitator, prefers open-ended pivots
- API endpoints:
  - GET /api/educators — list all educator profiles
  - GET /api/educators/:id — get specific educator profile
  - GET /api/educators/:id/context — get educator context analysis for a lesson

### Teaching wisdom layer (Moonshot 8)
- Accumulated teaching notes: structured observations from post-session debriefs
  - 7 note types: timing, success_pattern, confusion_point, failure_pattern, activity_recommendation, group_composition, accessibility
  - Confidence scoring based on session count confirmation
  - Context-aware filtering (group level, setting, group size)
- Cross-skill patterns: engine detects recurring patterns across debriefs
  - Timing overruns, engagement drops, confusion clusters, success correlations, group composition effects
  - Patterns include actionable recommendations
- Lesson composition integration: when composing plans, the engine queries teaching wisdom and:
  - Adjusts timing based on historical patterns
  - Recommends activities that have worked for similar groups
  - Warns about common confusion points proactively
  - Cites evidence: "Based on 18 previous sessions, I've allocated 20 min instead of 15"
- Educator contribution: direct teaching note addition via add_teaching_note tool
- Seed data: 24 teaching notes + 5 cross-skill patterns for python-data-analysis domain (simulating 23 sessions)

### Agent workspace (agent-workspace/)
- Dedicated workspace for the in-app agent (separate from developer tools in root `.claude/`)
- `agent-workspace/.claude/skills/` — 10 skills:
  - Pedagogical: interview-educator, assess-skills, compose-lesson, reason-dependencies, debrief-session, sequence-curriculum
  - Office export: docx, pptx, xlsx, pdf (from anthropics/skills repo)
- `agent-workspace/.claude/agents/` — 3 subagent definitions: assessment-agent, roster-agent, lesson-agent
- The agent uses Office skills to create .docx/.pptx/.xlsx files, then uploads to Google Drive via export tools (auto-converts to native Google format)

### Developer skills (.claude/skills/)
- Skills for developers working on the codebase (not loaded by the in-app agent)
- Reference files: Bloom's taxonomy patterns, inference rules, lesson plan template

### Demo data (agent-workspace/data/)
- Domain: python-data-analysis (25 skills, 48 dependency edges, 6 Bloom's levels)
- Group: tuesday-cohort (5 learners with diverse skill profiles)
- Learners: Priya (advanced), Marcus (intermediate, accessibility needs), Sofia (intermediate, viz-strong), Alex (beginner), Nkechi (mixed — R expert learning Python)
- Pre-completed assessment: TUE-2026-0211
- Educators: Dr. Sarah Chen (lecture/structured expert), Marcus Rodriguez (hands-on facilitator) — contrasting profiles for same-lesson comparison demo

## Data conventions
All persistent data lives in `agent-workspace/data/` — accessible to both the agent (relative `data/` from its cwd) and server code (via `DATA_DIR`).
- Skill graphs: data/domains/{domain}/skills.json, dependencies.json (JSON — programmatic traversal)
- Learner profiles: data/learners/{id}.md (Markdown — human-readable, educator-editable)
- Groups: data/groups/{name}.md (Markdown — human-readable)
- Assessments: data/assessments/{code}.md (Markdown — human-readable)
- Lesson plans: data/lessons/{name}.md (Markdown — human-readable)
- Teaching wisdom: data/domains/{domain}/teaching-notes.json (JSON — structured notes and patterns)
- Teaching notes (human-readable): data/domains/{domain}/teaching-notes.md (Markdown — appended by debriefs)
- Educator profiles: data/educators/{id}.json (JSON — teaching style, strengths, timing patterns)
- Reasoning traces: data/reasoning-traces/{lesson-id}.json (JSON — decision traces with evidence chains)
- Meta-pedagogical question history: data/meta-pedagogical/{educator-id}-questions.json (JSON — question patterns for teaching moments)
- Google OAuth tokens: data/auth/google-tokens.json (JSON — auto-refreshed, gitignored)

## Behavioral rules
- Always read the relevant skill before performing a task
- Delegate assessment to the assessment-agent subagent
- Delegate lesson composition to the lesson-agent subagent
- Write learner profile updates after every assessment interaction
- Query teaching wisdom before composing lesson plans — cite adjustments to the educator
- Load educator profile before composing lesson plans — customize activity types, content depth, timing, and contingency style to the educator
- When a learner has profiles in multiple domains, analyze cross-domain transfer before assessment — use transfer predictions to start at a higher level
- After composing a lesson plan, generate and store reasoning traces for every major decision — traces capture evidence, alternatives, and conditions for changing the decision
- When an educator asks "why" about a plan decision, use explain_pedagogical_reasoning to retrieve traces and compose specific, evidence-grounded explanations
- When an educator's questions show a pattern, use analyze_meta_pedagogical_patterns to detect it and offer to teach the underlying pedagogical principle
- When an educator wants to export, share, or import from Google, call check_google_connection first; if not connected, call request_google_connection before proceeding
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

### Google Workspace integration (src/server/google/)
- OAuth2 authentication with `googleapis` npm package (in-process, no external binary)
- `GoogleAuthManager` singleton: OAuth2 client, token persistence, 60s cache, CSRF state validation
- Tokens stored at `data/auth/google-tokens.json`, auto-refreshed and persisted
- Express router at `/api/auth/google` with `/status`, `/start`, `/callback`, `/disconnect` endpoints
- Google API wrappers (minimal — document creation handled by agent skills):
  - `drive.ts` — list files, upload with Office→Google conversion, share with permissions, read sheets
  - `classroom.ts` — list courses and import students
  - `auth.ts` — OAuth2 client management
  - `router.ts` — Express routes for auth flow
- AI-native export pattern: agent uses Office skills (docx, pptx, xlsx) to create files, then calls upload tools which auto-convert to native Google Docs/Slides/Sheets format
- 9 MCP tools for Google operations (all check connection first, return error if not connected)
- Agent system prompt instructs: check_google_connection → request_google_connection → proceed
- Frontend: inline connect card in chat, onboarding wizard at `/onboarding`
- Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

## Current limitations
- 4 domains (python-data-analysis, farm-science, outdoor-ecology, culinary-fundamentals) — extensible to more
- Assessment flow requires the backend server running (no offline mode)
- Dashboard uses embedded demo data (not live from backend) for standalone viewing
- No persistent storage beyond filesystem — sessions lost on server restart
- No authentication — assessment codes are the only access control
