# Pedagogical Reasoning Engine — Complete Capabilities

> **Built in one week** with Claude Opus 4.6 + Claude Agent SDK for the Cerebral Valley × Anthropic Hackathon (Feb 10–16, 2026).
>
> *Not a chatbot with a teaching-themed system prompt. A reasoning engine that happens to reason about pedagogy.*

---

## 1. Vision & Philosophy

### North Star

A pedagogical reasoning engine — the brain behind an AI-native education platform. It reasons about teaching the way Claude Code reasons about software: by composing primitives, not by hardcoding workflows.

### Core Philosophy

| Principle | What it means |
|---|---|
| **Primitives over features** | Domain-agnostic, setting-agnostic, modality-agnostic. Works for a park naturalist, a data bootcamp, a homeschool parent, a 1:1 coach — without building features for any of them. |
| **Interview first, generate second** | Never jumps to output. Interviews the educator to understand context before composing anything. |
| **Agent-native architecture** | The educator interacts with a unified experience. Underneath, specialized agents handle distinct reasoning domains. |
| **Dependency inference** | Assess efficiently by leveraging what skills imply about other skills. One answer can infer 12+ skills. |
| **Bloom's taxonomy as calibration** | Assesses *depth* of knowledge — not just "do you know X" but "can you analyze with X, evaluate using X." |

### The Five Primitives

| # | Primitive | What it is |
|---|-----------|-----------|
| 1 | **Skills** | Atomic units of knowledge or ability. Domain-agnostic. Each has a Bloom's level (knowledge → evaluation). |
| 2 | **Dependencies** | Directed relationships between skills. If you can run a pandas groupby, you can filter data, write functions, use variables. Enables inference. |
| 3 | **Learner Profiles** | The current state of what a person knows — assessed skills + inferred skills with confidence levels. |
| 4 | **Groups** | Collections of learner profiles. Can be 1 (coaching) or 200 (online bootcamp). Same primitive. |
| 5 | **Constraints** | Environmental context: time, setting, tools, connectivity, subscriptions, language, accessibility. |

### What This Is NOT

- Not a chatbot that answers student questions
- Not a content generation tool that spits out worksheets
- Not an LMS — it doesn't host courses
- Not limited to any one subject, setting, or teaching modality

It's the reasoning layer. The pedagogical equivalent of what a terminal and file system are to Claude Code.

---

## 2. The 9 Moonshots

| # | Codename | Feature | What it does |
|---|----------|---------|-------------|
| 1 | **The Rehearsal** | Lesson Simulation | Predict friction points, timing risks, and energy drops before teaching |
| 2 | **The Colleague Who Pushes Back** | Pedagogical Disagreement | Evidence-based pushback on bad plans, citing actual student profiles |
| 3 | **The Bridge** | Cross-Domain Transfer | Skills carry across subjects — ecology analysis → data analysis reasoning |
| 4 | **The Why Behind the What** | Meta-Pedagogical Reasoning | Ask "why?" about any decision and get the actual reasoning chain |
| 5 | **The Honest Signal** | Assessment Integrity | Detect gaming, inconsistency, confidence-competence mismatches |
| 6 | **The Human Layer** | Affective Dimension | Emotional and motivational context analysis for the group |
| 7 | **The Feedback Loop** | Post-Session Debrief | Structured reflection that feeds into the wisdom layer |
| 8 | **The Thousand Teachers** | Accumulated Teaching Wisdom | Patterns from past sessions improve future plans (flywheel) |
| 9 | **The Missing Profile** | Educator Profiling | Learns your teaching style, customizes plans to your strengths |

### The Flywheel

```
Educator arrives → Interview + [6] Affective + [9] Profile
    → Assessment + [5] Integrity + [3] Cross-domain priors
    → Lesson composed + [2] Pushback + [4] Meta-reasoning + [8] Wisdom + [9] Fit
    → [1] Simulation (predict before teaching)
    → Lesson taught
    → [7] Debrief → feeds [8] Wisdom → feeds [9] Profile
    → Next session is better than the last
```

**The depth stack:** Simulation + Disagreement + Meta-reasoning = the engine doesn't just compose plans — it predicts outcomes, pushes back on bad ideas, and explains every decision.

**The flywheel:** Debrief → Wisdom → Educator Profile = every session taught makes the next one better.

**The integrity chain:** Assessment Integrity + Cross-Domain Transfer = smarter, faster, harder-to-game assessments.

---

## 3. Complete Tool Inventory (37 MCP Tools)

### Core Pedagogy Tools (28)

| Tool | What it does | Powers |
|------|-------------|--------|
| `load_roster` | Load or create groups and learner profiles | Core |
| `query_skill_graph` | BFS/DFS traversal, dependency inference, Bloom's filtering | Core |
| `generate_assessment_link` | Create assessment sessions with shareable codes | Core |
| `check_assessment_status` | Scan group profiles for assessment completion | Core |
| `query_group` | Aggregate skill distributions, identify gaps, suggest pairings | Core |
| `audit_prerequisites` | Cross-reference lesson needs against group profiles | Core |
| `compose_lesson_plan` | Orchestrate graph + profiles + constraints into lesson markdown | Core |
| `assess_learner` | Update profiles with results, run dependency inference | Core |
| `create_domain` | Create a new skill domain from scratch | Domain Builder |
| `update_domain` | Update an existing domain's skills and dependencies | Domain Builder |
| `compose_curriculum` | Compose a multi-session curriculum plan | Curriculum |
| `advance_curriculum` | Advance curriculum state after a session | Curriculum |
| `simulate_lesson` | Predict friction, timing risks, energy drops per section | Moonshot 1 |
| `analyze_tensions` | Evidence-based pushback on suboptimal plans | Moonshot 2 |
| `analyze_cross_domain_transfer` | Bloom's alignment + cognitive operation matching across domains | Moonshot 3 |
| `explain_pedagogical_reasoning` | Retrieve stored traces, compose evidence-based explanations | Moonshot 4 |
| `store_reasoning_traces` | Store structured decision traces during lesson composition | Moonshot 4 |
| `analyze_meta_pedagogical_patterns` | Detect educator question patterns, surface teaching moments | Moonshot 4 |
| `analyze_assessment_integrity` | Detect gaming, inconsistency, confidence-competence mismatches | Moonshot 5 |
| `analyze_affective_context` | Emotional and motivational context for a group | Moonshot 6 |
| `process_debrief` | Structured post-session reflection feeding wisdom layer | Moonshot 7 |
| `query_teaching_wisdom` | Retrieve accumulated teaching notes filtered by skill/type/confidence | Moonshot 8 |
| `analyze_teaching_patterns` | Scan debriefs for recurring timing, engagement, confusion patterns | Moonshot 8 |
| `add_teaching_note` | Add educator-direct teaching notes with high confidence | Moonshot 8 |
| `load_educator_profile` | Load teaching profile (style, strengths, timing patterns) | Moonshot 9 |
| `update_educator_profile` | Create/update educator profile from signals and preferences | Moonshot 9 |
| `analyze_educator_context` | Generate lesson-specific customization based on educator profile | Moonshot 9 |
| `report_assessment_progress` | Report assessment progress updates to the educator | Assessment UX |

### Google Workspace Tools (9)

| Tool | What it does |
|------|-------------|
| `check_google_connection` | Check whether Google account is connected |
| `request_google_connection` | Request OAuth connection; frontend renders inline connect card |
| `export_lesson_to_docs` | Export lesson plan to formatted Google Doc |
| `export_lesson_to_slides` | Export lesson plan to Google Slides presentation |
| `import_roster_from_sheets` | Import student names from a Google Sheet |
| `export_assessments_to_sheets` | Export group skill matrix to Google Sheet |
| `list_drive_files` | List files from Google Drive with optional query/mimeType filter |
| `share_document` | Share a Google Drive file with email addresses |
| `sync_with_classroom` | List Google Classroom courses or import students |

---

## 4. Agent Skills (10)

### Pedagogical Skills (6)

| Skill | What reasoning it encapsulates |
|-------|-------------------------------|
| **interview-educator** | How to interview an educator — required fields, probe questions, stopping conditions. Never jump to generation. |
| **assess-skills** | Bloom's taxonomy calibration, adaptive branching, dependency inference. Includes Bloom's reference with question patterns per level. |
| **compose-lesson** | Lesson composition methodology — output structure, stage direction style, timing beats, group calibration, contingency planning. Includes lesson plan template. |
| **reason-dependencies** | Graph traversal logic, inference rules, confidence decay for multi-hop, efficient assessment path finding. Includes inference patterns reference. |
| **debrief-session** | Post-session reflection methodology — extracting timing patterns, confusion points, success patterns. Feeds into wisdom + educator profiles. |
| **sequence-curriculum** | Multi-session curriculum design — spiral curriculum, spaced repetition, interleaving, prerequisite chains, pace estimation. |

### Office Export Skills (4)

| Skill | What it does |
|-------|-------------|
| **docx** | Create, read, edit Word documents (.docx) with formatting |
| **pptx** | Create, parse, edit PowerPoint presentations (.pptx) |
| **xlsx** | Create, read, edit spreadsheets (.xlsx, .csv, .tsv) |
| **pdf** | Read, extract, merge, split, create PDF files |

The agent uses Office skills to create .docx/.pptx/.xlsx files, then uploads to Google Drive via export tools (auto-converts to native Google format).

---

## 5. Subagents (3)

| Subagent | Model | When it's delegated to | Key tools |
|----------|-------|----------------------|-----------|
| **assessment-agent** | Sonnet | Evaluating learner skills through adaptive questioning. Uses Bloom's taxonomy + dependency inference + integrity strategies. | `assess_learner`, `query_skill_graph`, `analyze_assessment_integrity` |
| **roster-agent** | Sonnet | Group-level reasoning — aggregate skills, identify gaps, recommend pairings, surface patterns. | `query_group`, `query_skill_graph`, `analyze_affective_context` |
| **lesson-agent** | Opus | Composing complete stage-directed lesson plans. Loads full skill graph, all profiles, constraints, teaching wisdom, educator profile. | `query_skill_graph`, `audit_prerequisites`, `compose_lesson_plan`, `analyze_tensions`, `analyze_affective_context`, `query_teaching_wisdom`, `load_educator_profile`, `analyze_educator_context` |

Each subagent gets its own isolated context window, system prompt, and tool restrictions. The educator's conversation stays clean.

---

## 6. Frontend Experiences (24 Routes)

| Route | Experience | Key features |
|-------|-----------|-------------|
| `/` | Landing page | Hero with educator/student/dashboard CTAs |
| `/teach` | Educator chat | WebSocket streaming, rich tool results, markdown rendering, interactive AskUserQuestion cards, progress indicator with elapsed time, voice input (Web Speech API), optional TTS readback |
| `/teach/live/[lesson-id]` | Live teaching companion | Voice-first mobile interface, timed sections, "you are here" tracking, session timer with progress bar, feedback buttons per section, large mic button, quick-ask suggestions |
| `/assess/[code]` | Student assessment | Code entry + HTTP assessment chat |
| `/assess/share` | Assessment sharing | Generate links + embed codes |
| `/assess/embed/[code]` | Embeddable assessment widget | Self-contained iframe, postMessage API (started/progress/completed/error) |
| `/assess/embed-demo` | Embed demo | Live preview, code snippets, event log |
| `/assess/integrity` | Assessment integrity | Gaming detection and consistency analysis |
| `/dashboard` | Skill analytics | Interactive React Flow DAG with learner overlay, auto-cycle demo mode, group heatmap, Bloom's radar chart, common gaps, pairing suggestions, learner summary cards |
| `/domains` | Domain marketplace | Browse 4 domains with Bloom's distribution bars, create custom domains |
| `/lessons` | Lesson plans list | Browse, export PDF, debrief, simulate, go live |
| `/lessons/[id]` | Lesson plan detail | Full lesson plan view with export buttons |
| `/simulate` | Lesson simulation index | Pick a lesson to simulate |
| `/simulate/[id]` | Simulation results | Section-by-section friction, per-learner struggle points, timing risk, energy curve |
| `/disagree` | Pedagogical disagreement | Tension analysis with evidence, alternative suggestions |
| `/transfer` | Cross-domain transfer | Learner selector, source/target domains, readiness score, transfer bridges visualization |
| `/meta` | Meta-pedagogical reasoning | Decision type filters, expandable trace cards, evidence breakdown, pedagogical principles grid |
| `/wisdom` | Teaching wisdom | Stats overview, flywheel callout, teaching notes (filterable), cross-skill patterns, confidence bars |
| `/profile` | Educator profiles | Style distribution chart, strengths, growth areas, timing patterns, side-by-side comparison |
| `/debrief/[lesson-id]` | Post-session debrief | Structured reflection interface |
| `/onboarding` | Google Workspace onboarding | 3-step OAuth connect wizard with benefit cards |
| `/onboarding/callback` | OAuth callback | Handles success/error with localStorage signaling |

**Tech stack:** Next.js 16 + App Router + Turbopack + Tailwind CSS v4 (CSS-native @theme)

---

## 7. API & Infrastructure

### REST Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/status` | Health check |
| GET | `/api/user` | User context |
| GET | `/api/user/greeting` | AI-generated warm greeting |
| GET | `/api/generate-group-name` | Random group name |
| GET | `/api/domains` | List all domains |
| GET | `/api/domains/:slug` | Domain details |
| GET | `/api/groups` | List all groups |
| GET | `/api/files/*` | Serve files from data directory |
| GET | `/api/assess/:code` | Get assessment session |
| POST | `/api/assess` | Submit assessment response |
| POST | `/api/assess/generate` | Generate assessment link |
| POST | `/api/assess/generate-batch` | Batch generate assessment links |
| GET | `/api/assess/status/:group/:domain` | Assessment completion status |
| GET | `/api/assess/integrity/:group/:domain` | Integrity analysis |
| GET | `/api/lessons` | List lesson plans |
| GET | `/api/lessons/:id` | Get lesson plan |
| POST | `/api/lessons/:id/feedback` | Submit section feedback |
| GET | `/api/simulate/:lessonId` | Run lesson simulation |
| POST | `/api/tensions` | Analyze pedagogical tensions |
| GET | `/api/debriefs` | List debriefs |
| GET | `/api/debriefs/:lessonId` | Get debrief |
| GET | `/api/debrief-ready/:lessonId` | Check debrief readiness |
| GET | `/api/educators` | List educator profiles |
| GET | `/api/educators/:id` | Get educator profile |
| GET | `/api/educators/:id/context` | Educator context analysis |
| GET | `/api/wisdom/:domain` | Teaching wisdom for domain |
| GET | `/api/wisdom/:domain/skills` | Skill-level wisdom |
| GET | `/api/reasoning` | List lessons with reasoning traces |
| GET | `/api/reasoning/:lessonId` | Reasoning traces for lesson |
| GET | `/api/reasoning/:lessonId/:traceId` | Specific trace |
| GET | `/api/transfer/:learnerId` | Cross-domain transfer analysis |
| GET | `/api/transfer-learners` | Learners with assessed skills |

### WebSocket Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/ws/chat` | Educator chat — streaming agent responses, session persistence, reconnection support |
| `/ws/live` | Live teaching companion — section context, real-time suggestions |

### PDF Export System (`src/server/exports/`)

Built with `@react-pdf/renderer` (server-side, no browser required).

| Export | Endpoint | What it generates |
|--------|----------|-------------------|
| Lesson Plan PDF | `GET /api/export/lesson/:id` | Header, prereqs checklist, timed session plan, contingencies, logistics |
| Prerequisites Handout | `GET /api/export/lesson/:id/prerequisites` | Student-facing checklist for pre-session prep |
| Learner Skill Report | `GET /api/export/learner/:id` | Skill bars, Bloom's distribution, strengths, focus areas |
| Group Summary | `GET /api/export/group/:id` | Heatmap, common gaps, pairing recommendations, member overview |
| Lesson list | `GET /api/export/lessons` | Available lesson plans |

### Google Workspace Integration (`src/server/google/`)

| Component | What it does |
|-----------|-------------|
| `auth.ts` | OAuth2 client management with `googleapis` npm package |
| `router.ts` | Express routes: `/status`, `/start`, `/callback`, `/disconnect` |
| `drive.ts` | List files, upload with Office→Google conversion, share with permissions, read sheets |
| `classroom.ts` | List courses, import students |
| `GoogleAuthManager` | Singleton: OAuth2 client, token persistence at `data/auth/google-tokens.json`, 60s cache, CSRF state validation, auto-refresh |

**AI-native export pattern:** Agent uses Office skills (docx/pptx/xlsx) → uploads to Drive → auto-converts to native Google format.

### Session Management (`src/server/sessions/manager.ts`)

- Maps WebSocket connections to Agent SDK sessions for multi-turn conversations
- Session persistence across reconnections
- Periodic session cleanup
- Graceful shutdown
- Context extraction: accumulates group, domain, constraints, learners, skills discussed

### Additional Server Components

| Component | Purpose |
|-----------|---------|
| `context-extractor.ts` | Reads tool_use inputs from assistant messages to build session context |
| `tool-labels.ts` | AI-generated creative progress labels for all 28 pedagogy tools (Haiku at startup) |

---

## 8. Data Architecture

All persistent data lives in `agent-workspace/data/` — accessible to both the agent (relative `data/` from its cwd) and server code (via `DATA_DIR`).

| Data type | Path | Format | Why this format |
|-----------|------|--------|----------------|
| Skill graphs | `data/domains/{domain}/skills.json` | JSON | Programmatic graph traversal |
| Dependencies | `data/domains/{domain}/dependencies.json` | JSON | Directed graph operations |
| Teaching notes (structured) | `data/domains/{domain}/teaching-notes.json` | JSON | Filtering, confidence scoring |
| Teaching notes (readable) | `data/domains/{domain}/teaching-notes.md` | Markdown | Appended by debriefs |
| Learner profiles | `data/learners/{id}.md` | Markdown | Human-readable, educator-editable |
| Groups | `data/groups/{name}.md` | Markdown | Human-readable |
| Assessments | `data/assessments/{code}.md` | Markdown | Human-readable |
| Lesson plans | `data/lessons/{name}.md` | Markdown | Human-readable |
| Educator profiles | `data/educators/{id}.json` | JSON | Style distributions, timing patterns |
| Reasoning traces | `data/reasoning-traces/{lesson-id}.json` | JSON | Decision traces with evidence chains |
| Meta-pedagogical questions | `data/meta-pedagogical/{educator-id}-questions.json` | JSON | Question pattern tracking |
| Google OAuth tokens | `data/auth/google-tokens.json` | JSON | Auto-refreshed, gitignored |

### Demo Data (4 Domains)

| Domain | Skills | Dependencies | Bloom's Levels |
|--------|--------|-------------|---------------|
| python-data-analysis | 25 | 48 | All 6 |
| farm-science | — | — | — |
| outdoor-ecology | — | — | — |
| culinary-fundamentals | — | — | — |

### Demo Learners (Tuesday Cohort)

| Learner | Level | Notable |
|---------|-------|---------|
| Priya Sharma | Advanced | Software engineer pivoting to data science |
| Marcus Johnson | Intermediate | 15 years Excel, visual impairment |
| Sofia Ramirez | Intermediate | Strong visualization, weak data cleaning |
| Alex Chen | Beginner | Career changer, needs scaffolding |
| Nkechi Okonkwo | Mixed | Biology PhD, deep R experience, learning Python |

### Demo Educators

| Educator | Style | Key traits |
|----------|-------|-----------|
| Dr. Sarah Chen | Lecture/hands-on | Expert content knowledge, structured, prefers specific alternatives |
| Marcus Rodriguez | Hands-on/discussion | Intermediate content, high-energy facilitator, prefers open-ended pivots |

### Educator Profile Schema

Teaching style distribution (lecture, discussion, hands_on, socratic, project_based, demonstration), strengths with confidence, growth areas, content confidence per domain, preferences (lesson_start, group_work_comfort, pacing, contingency_preference), timing patterns (per-activity-type adjustments from debriefs), growth nudges.

### Teaching Wisdom Data

24 teaching notes + 5 cross-skill patterns for python-data-analysis (simulating 23 sessions). 7 note types: timing, success_pattern, confusion_point, failure_pattern, activity_recommendation, group_composition, accessibility.

---

## 9. Design System & UX Direction

### Visual Identity

| Element | Choice |
|---------|--------|
| Heading font | Source Serif 4 (bookish, pedagogical gravity) |
| Body font | DM Sans |
| Monospace | IBM Plex Mono |
| Light background | Warm papery tones (`#faf9f7`, `#f5f3f0`) |
| Dark background | Deep near-black (`#0a0a0b`) |
| Signature colors | Bloom's taxonomy spectrum — 6 colors representing depth of knowledge, used as visual brand |
| Theme system | Light/dark via CSS variables, Tailwind CSS v4 (CSS-native @theme) |

### Design Philosophy: "The Thoughtful Colleague"

- **Not clinical** — data should feel like insight, not measurement
- **Not playful** — professional tool for professionals, not education tech infantile design
- **Not minimal to the point of emptiness** — warm authority
- **The right feeling:** Like a well-organized notebook from someone who thinks deeply. Notion, Linear, Arc, Readwise aesthetics.

### "Places Not Products" Research

Based on Lucas Crespo's article (Every), the frontend was evaluated and designed to feel like a **place you want to inhabit**, not just a tool you use:

- **Define the feeling, not features** — emotional intent drives design
- **Give the internet texture** — tactile, handcrafted materiality
- **Every surface is the product** — atmospheric consistency throughout

**Reference sites studied:** cora.computer, writewithspiral.com, brilliant.org, mathigon.org, linear.app, are.na, cosmos.so, pi.ai, poolsuite.net, ncase.me

### Key Micro-interactions

- Progress indicator with elapsed time counter and stage-aware labels
- AI-generated creative tool labels at startup (Haiku generates playful education-themed progress messages)
- Interactive AskUserQuestion cards (selectable options with submit)
- Voice input with recording state animation
- Optional TTS readback toggle
- Auto-cycle demo mode on skill graph
- Session context sidebar showing what the engine "knows"
- Inline Google connect card in chat (popup OAuth, polls for close)

---

## 10. Architecture Decisions

| Decision | Why |
|----------|-----|
| **Claude Agent SDK** | The most battle-tested agent harness in production. Powers Claude Code, Cowork, Xcode integration. Provides subagents, skills, MCP tools, session management, context compaction, hooks — all with a single `query()` call. |
| **Filesystem over database** | Agent already has Read/Write/Glob tools. Markdown is readable by both agents and educators. No separate persistence layer needed. JSON only for programmatic graph traversal. |
| **Subagents over nested API calls** | True isolated context windows, own system prompts, own tool restrictions. Assessment-agent holds the full skill graph without polluting the educator's conversation. |
| **Skills over prompt files** | Progressive disclosure — Claude loads only what's needed. Discoverable, reusable, domain-agnostic. Standard that works across Claude Code, API, and other tools. |
| **Opus for main + lesson composition, Sonnet for assessment** | Opus for deep reasoning (lesson plans, educator conversations). Sonnet for faster, more focused work (assessment, roster analysis). |
| **VPS over serverless** | Agent SDK needs persistent process with filesystem access. |
| **Markdown for humans, JSON for machines** | Learner profiles, lessons, groups = Markdown (educator can open and edit). Skill graphs, dependencies, teaching notes = JSON (tools need to traverse programmatically). |
| **Agent workspace separation** | Agent SDK runs with `cwd: agent-workspace/` — picks up agent-specific skills, not developer skills. Clean separation. |
| **AI-native Google export** | Agent creates Office files (docx/pptx/xlsx) via skills, then uploads to Drive with auto-conversion. More flexible than building Google API wrappers for every format. |
| **In-process MCP tools** | `createSdkMcpServer` + `tool()` — same Node.js process as the agent. No external servers, no HTTP overhead. |

---

## 11. Demo Narrative (3-Minute Script)

### ACT 1: The Graph (0:00–0:40)
Open on `/graph/python-data-analysis` — 25 nodes, 48 edges. Trigger cascade demo: Priya answers ONE question about pandas groupby → engine infers 12 skills. Click between Priya (mostly green) and Alex (mostly gray). *"One question did the work of twelve."*

### ACT 2: The Plan (0:40–1:20)
Navigate to `/lessons` — show stage-directed timing beats. Then `/simulate` — predict Sofia struggles at minute 22, Marcus's section runs over. Timeline with learner lanes.

### ACT 3: The Brain (1:20–2:00)
`/disagree` — ask for something unreasonable, watch it push back citing specific students. `/meta` — expand a reasoning trace showing the actual decision chain.

### ACT 4: The Flywheel (2:00–2:30)
Quick montage: `/wisdom` (23 sessions of accumulated patterns), `/profile` (same lesson, two teachers, two different plans), `/transfer` (ecology PhD → data science readiness).

### ACT 5: The Close (2:30–3:00)
Back to the graph, auto-cycle mode. *"37 custom tools. 4 domains. 3 subagents. Built in a week with Opus 4.6 and the Agent SDK."*

*"Most AI teaching tools generate content. This one reasons about teaching — and then reasons about its own reasoning."*

---

## 12. What's NOT in CLAUDE.md

Items found in other docs that CLAUDE.md doesn't fully cover:

| Topic | Where it lives | What CLAUDE.md is missing |
|-------|---------------|--------------------------|
| **The five primitives as a formal framework** | `north-star.md` | CLAUDE.md mentions them implicitly but doesn't list the five primitives with their schemas |
| **"Primitives over features" — the Claude Code analogy** | `north-star.md`, `project-brief.md` | The explicit analogy to Claude Code's terminal/filesystem/process primitives |
| **Three reasoning branches** | `technical-engine-spec.md` | The assessment/roster/lesson branches are implied but not named as the three branches |
| **6 Bloom's taxonomy levels** | `technical-engine-spec.md` | knowledge, comprehension, application, analysis, synthesis, evaluation — not listed |
| **Data structure schemas** | `technical-engine-spec.md` | Formal Skill, Dependency, LearnerProfile, Group, Constraint schemas |
| **Places Not Products design philosophy** | `places-not-products-research.md`, `frontend-places-not-products-review.md` | The three-font system, warm papery backgrounds, and design principles |
| **UI/UX session-by-session redesign plan** | `ui-ux-direction.md` | 6 user journeys to test, screen-by-screen direction |
| **6 pedagogical principles for meta-teaching** | `meta-pedagogical-layer.md` (in moonshots) | Bloom's & activity ordering, evidence-based timing, skill-complementary pairing, content depth by expertise, contingency design, session energy management |
| **Transfer confidence model** | `cross-domain-transfer.md` (in moonshots) | Base rate 0.35, cap at 0.55, three transfer types |
| **7 teaching note types** | Listed in CLAUDE.md but not elaborated | timing, success_pattern, confusion_point, failure_pattern, activity_recommendation, group_composition, accessibility |
| **Tool labels system** | `tool-labels.ts` | AI-generated creative progress labels using Haiku at startup |
| **Context extractor** | `context-extractor.ts` | Accumulates group/domain/constraints/learners/skills from tool_use inputs |
| **Information flows documentation** | `docs/information-flows/` | Entity relationships, feedback loops, lifecycle diagrams |
| **Implementation parallelization strategy** | `implementation-plan-part2.md` | 12 workstreams across 3 tiers, all parallelizable |
| **Embeddable assessment postMessage API** | CLAUDE.md covers it but the 4 event types are buried | `assessment:started`, `assessment:progress`, `assessment:completed`, `assessment:error` |

---

## By the Numbers

| Metric | Count |
|--------|-------|
| MCP tools | 37 (28 pedagogy + 9 Google) |
| Agent skills | 10 (6 pedagogical + 4 Office export) |
| Subagents | 3 |
| Frontend routes | 24 |
| REST API endpoints | 30+ |
| WebSocket endpoints | 2 |
| PDF export types | 4 |
| Skill domains | 4 |
| Demo learners | 5 |
| Demo educators | 2 |
| Moonshot features | 9 (all implemented) |
| Teaching wisdom notes seeded | 24 |
| Cross-skill patterns seeded | 5 |
| Reasoning traces seeded | 8 |
| Build time | 1 week |
