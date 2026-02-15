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

## 13. Emergence: The Platform Gets Smarter When Models Do

The most important capability isn't a tool or a feature — it's **emergence**.

The engine is designed as a set of primitives (skills, dependencies, learner profiles, groups, constraints) + powerful tools (37 MCP tools, Office skills, filesystem access). What happens when you give those primitives to Opus 4.6 is *more than the sum of the parts*.

### The Slides Example

When asked to create presentation slides for an AP Spanish Literature lesson on Magical Realism, the agent:

1. Created the slides using the pptx skill
2. **Autonomously initiated Visual QA** — exported slides to PDF to visually inspect them
3. Iterated on the design based on what it saw
4. Made the slides **visually on-theme with Magical Realism** — the topic itself influenced the aesthetic choices
5. No tool was built for "make slides match the pedagogical theme." The agent *reasoned* its way there.

### What This Means

- **The platform is a capability amplifier, not a capability ceiling.** As models improve, every tool in the system becomes more powerful — without changing a line of code.
- **Behaviors we didn't design for emerge naturally.** Visual QA, thematic design choices, cross-referencing learner profiles during lesson simulation — these aren't hardcoded workflows. They're emergent from giving a reasoning model the right primitives.
- **The 37 tools are a floor, not a ceiling.** The agent combines them in ways we haven't imagined yet. Every model generation unlocks new combinations.
- **This is the Agent SDK thesis in action.** Claude Code works for Mars rovers and knitting machines because the primitives are right. The Pedagogical Engine works for AP Spanish Lit slides and outdoor ecology field trips for the same reason.

### Designed for Emergence

Key architectural choices that enable emergence:

| Choice | Why it enables emergence |
|--------|------------------------|
| Filesystem as working memory | Agent can create, read, and iterate on artifacts without us predicting what artifacts it'll need |
| Skills as progressive disclosure | Agent loads reasoning patterns on-demand, combining them in novel ways |
| Markdown for human-readable data | Agent can read and reason about its own outputs naturally |
| No hardcoded workflows | The agent decides the order of operations based on context |
| Office export skills (docx/pptx/xlsx/pdf) | Agent can create *any* document type and visually QA its own work |
| Subagents with isolated context | Agent can delegate and parallelize reasoning branches we didn't anticipate |

**The question isn't "what can this engine do?" — it's "what will it do next?"**

### The LibreOffice Example (Extended)

The full chain of emergent behavior during slide creation:

1. Agent was asked to create presentation slides for a Magical Realism lesson
2. Used the pptx skill to generate the .pptx file
3. Realized it couldn't visually verify the output — **suggested installing LibreOffice**
4. Installed LibreOffice (`brew install --cask libreoffice`)
5. **Wrote a Python script** to convert .pptx → PDF for visual inspection
6. Installed missing Python packages needed for the conversion
7. Ran the export, visually inspected the PDF
8. Iterated on the slides based on what it saw
9. Applied a visual aesthetic matching the Magical Realism theme

**No tool, no skill, no instruction existed for any of steps 3-9.** The agent composed this entire workflow from first principles because it had the right primitives: filesystem access, a shell, and the ability to reason about quality.

This is what "primitives over features" means in practice.

## Undocumented Capabilities Found

### From Strategy (a): Tool Implementation Deep Scan — 2026-02-14

1. **Path Traversal Protection** — `src/server/tools/shared.ts:safePath()`
   Resolves paths and verifies they stay within the expected base directory, preventing `../` attacks. All filesystem-touching tools use this.

2. **Domain Graph Limits** — `src/server/tools/domain-utils.ts`
   Hard limits: MAX_SKILLS=500, MAX_EDGES=2000 per domain. Enforced via Zod schema validation in create/update domain tools.

3. **Full Graph Validation Suite** — `src/server/tools/domain-utils.ts:validateDomain()`
   Six validation checks run on every domain create/update: (a) duplicate skill IDs, (b) dangling edge references, (c) self-loops, (d) circular dependency detection via DFS with stack-based path tracking, (e) Bloom's level regression warnings (prerequisite at higher Bloom's than dependent), (f) graph flatness detection (all skills at same Bloom's level).

4. **Orphan & Unreachable Skill Detection** — `src/server/tools/domain-utils.ts`
   Finds skills with no connections (orphans) and skills unreachable from any root via BFS. Reported as warnings during domain validation.

5. **Domain Manifest System** — `src/server/tools/domain-utils.ts:buildManifest()`
   Every domain gets a `manifest.json` with: display name, slug, version, description, author, license, tags, audience metadata (level/ages/setting), icon, color for UI theming, featured flag, and auto-computed stats. Existing manifests preserve all fields on update, only refreshing stats + timestamp.

6. **Three Edge Types** — `src/server/tools/domain-utils.ts:EdgeSchema`
   Dependencies support three types: `prerequisite` (default), `corequisite`, and `recommended`. Only prerequisites are used for BFS traversal and inference; corequisites and recommended are metadata for the agent.

7. **Max-Confidence Path Inference** — `src/server/tools/query-skill-graph.ts:inferFromDemonstration()`
   When multiple paths exist between skills, the inference engine uses the max-confidence path (not first-found). Returns full inference path for transparency.

8. **Assessment Code Generation via nanoid** — `src/server/tools/generate-assessment-link.ts`
   Assessment codes are 8-character uppercase nanoid strings. Assessment sessions support optional `context`, `educatorId`, and `lessonContext` fields that get passed to the assessment agent for tailored conversation.

9. **Observational Evidence Discounting in Debriefs** — `src/server/tools/process-debrief.ts`
   Profile updates from debriefs are tagged as `observational` with confidence changes capped at ±0.3 (vs assessment evidence). Six observation types: struggled, succeeded, helped_others, disengaged, breakthrough, other.

10. **Assessment Integrity Scoring Model** — `src/server/tools/analyze-assessment-integrity.ts`
    Weighted formula: `(avgDepth/3 × 0.4) + (consistencyScore × 0.35) + (engagementScore × 0.25)`. Per-skill modifiers include bonuses for: personal context usage (+0.05), chained reasoning (+0.05), self-correction (+0.10), appropriate uncertainty (+0.05). Inconsistency penalties: minor (-0.1), notable (-0.2), significant (-0.35), floored at 0.3.

11. **Cross-Domain Transfer Confidence Model Details** — `src/server/tools/analyze-cross-domain-transfer.ts`
    Skill "generality" computed as `0.4 × depthScore + 0.6 × bloomScore` where depthScore = transitive prerequisites / (graph size × 0.5). Skills with generality < 0.2 are excluded from transfer. Cognitive operation keyword matching boosts transfer by 1.3×. Both-high-order skills boost by 1.2×. Bloom's distance multipliers: exact=1.0, adjacent=0.6, two_apart=0.3, distant=0.0.

12. **Canonical Learner Profile Parser** — `src/server/tools/shared.ts:parseLearnerProfile()`
    Single canonical parser for markdown learner profiles used across all tools. Parses assessed skills, inferred skills, and affective profiles (confidence + social dynamics) from structured markdown.

13. **report_assessment_progress Tool** — `src/server/tools/report-assessment-progress.ts`
    A lightweight signaling tool that the assessment agent calls during skill transitions. Returns only `{ acknowledged: true }` — its real purpose is to trigger frontend progress UI updates via the tool result stream.

### From Strategy (b): Server Architecture Deep Scan — 2026-02-14

14. **AI-Generated Personalized Greetings** — `src/server/index.ts:GET /api/user/greeting`
    On app open, calls Claude Haiku 4.5 with the educator's profile, recent lessons, domains, and latest debrief to generate a contextual welcome message. Falls back to time-of-day greeting if no API key or generation fails. The greeting references specific names, topics, and recent work — like a colleague who remembers what you were working on.

15. **AI-Generated Group Names** — `src/server/index.ts:GET /api/generate-group-name`
    Generates creative two-word cohort names (e.g. "autumn-coders") via Claude Haiku. Falls back to random adjective-noun combos from hardcoded lists if API unavailable. Cohort naming is never boring.

16. **WebSocket Session Reconnection** — `src/server/index.ts:wss "connection"`
    Educator chat WebSocket supports reconnection via `?sessionId=...` query param. On reconnect, replays accumulated `session_context` so the sidebar repopulates without data loss. Disconnected sessions are kept (not destroyed) for reconnection.

17. **Live Teaching Companion WebSocket** — `src/server/index.ts:wssLive, /ws/live`
    A separate WebSocket endpoint (`/ws/live`) for real-time teaching assistance during active lessons. Accepts `?lessonId=xxx` to scope the companion to a specific lesson plan. Distinct from the educator chat — this is mid-lesson support.

18. **Real-Time Session Context Extraction** — `src/server/index.ts + context-extractor.ts`
    Every tool_use block from the agent triggers `extractSessionContext()` which builds an optimistic sidebar state (current domain, group, skills, lesson). On tool failure, a `PostToolUseFailure` hook re-extracts context excluding failed tools — self-correcting optimistic UI.

19. **Creative Tool Labels System** — `src/server/index.ts + tool-labels.ts`
    On startup, `warmToolLabels()` generates creative/humanized names for MCP tools. These labels are sent to the frontend on WebSocket connection and used in the UI instead of raw tool names like `mcp__pedagogy__compose_lesson_plan`.

20. **File Creation Detection & Download Pipeline** — `src/server/index.ts:postToolUseHook`
    A PostToolUse hook detects when the agent creates files (.docx, .pptx, .xlsx, .pdf) via Write or Bash tools, and emits `file_created` WebSocket events with download URLs. Also detects Google export tool results and emits upload events with Google Drive URLs. Frontend gets real-time file notifications.

21. **Secure Agent-Workspace File Server** — `src/server/index.ts:GET /api/files/*`
    Serves downloadable files from `agent-workspace/` with path traversal protection and extension allowlist (.docx, .pptx, .xlsx, .pdf only). Files created by the agent become immediately downloadable via the frontend.

22. **Domain Plugin Architecture** — `src/server/index.ts:GET /api/domains`
    Domains are self-contained plugin directories with: `skills.json`, `dependencies.json`, `manifest.json`, `SKILL.md` (teaching methodology), and `sample-learners/`. The API computes a `pluginCompleteness` score showing which files exist. Domains are sorted featured-first, then by skill count.

23. **Batch Assessment Link Generation** — `src/server/index.ts:POST /api/assess/generate-batch`
    Generates individual assessment links for every member of a group in one call. Each learner gets their own nanoid code and personalized assessment file. Returns a list with per-learner URLs including embeddable versions.

24. **Assessment Integrity Dashboard API** — `src/server/index.ts:GET /api/assess/integrity/:groupName/:domain`
    A dedicated endpoint that aggregates integrity data across all learners in a group: integrity levels (high/moderate/low), modifiers, flagged skills, and whether integrity-adjusted confidence values exist. Returns group-level summary stats for educator dashboards.

25. **Learner Name Input Validation** — `src/server/index.ts:POST /api/assess`
    Assessment learner names are validated with: max 50 chars, letters/spaces/hyphens/apostrophes only. Prevents prompt injection through learner name fields.

26. **Assessment Session Persistence** — `src/server/index.ts:assessmentSessions Map`
    In-memory map tracks `code:learnerName → sessionId` so returning students resume their assessment conversation rather than starting over. The assessment agent sees full conversation history.

27. **Live Session Feedback Logging** — `src/server/index.ts:POST /api/lessons/:id/feedback`
    During live teaching, section-by-section feedback (rating, notes, elapsed time) is appended to JSONL log files in `live-sessions/`. Each entry is timestamped. This feeds the debrief and wisdom flywheel.

28. **Lesson Simulation & Tension Analysis HTTP APIs** — `src/server/index.ts:GET /api/simulate/:lessonId, POST /api/tensions`
    Simulation and tension analysis are exposed as REST endpoints (not just MCP tools), allowing the frontend to trigger them directly with smart defaults — auto-extracting domain/group from lesson metadata if not provided.

29. **Cross-Domain Transfer Learner Discovery** — `src/server/index.ts:GET /api/transfer-learners`
    Lists all learners who have assessed skills (skillCount > 0) across any domain, enabling the frontend to populate transfer analysis dropdowns without requiring the educator to know learner IDs.

30. **Debrief Readiness Check** — `src/server/index.ts:GET /api/debrief-ready/:lessonId`
    Pre-flight check that returns whether a lesson exists, whether it already has a debrief, and parsed section data needed for the debrief form. Prevents duplicate debriefs and streamlines the post-session workflow.

31. **Educator Context Analysis API** — `src/server/index.ts:GET /api/educators/:id/context`
    Returns an educator's top teaching styles (ranked by percentage), domain-specific expertise level, strengths, growth areas, timing patterns, and preferences — scoped to a specific domain/skill set. Used to customize lesson plans to the educator's strengths.

32. **Streaming Text Deltas** — `src/server/index.ts:stream_event handling`
    The WebSocket forwards `content_block_delta` events from Claude's streaming API as `stream_delta` messages, enabling character-by-character text rendering in the frontend. Real-time typing effect.

33. **Session Manager with Periodic Cleanup** — `src/server/index.ts + sessions/manager.ts`
    Sessions are managed with create/touch/disconnect/remove lifecycle. A 15-minute cleanup interval removes stale sessions. Graceful shutdown (SIGTERM/SIGINT) closes all sessions and WebSocket servers with a 5-second force-exit timeout.

34. **Google OAuth Token Persistence** — `src/server/index.ts startup`
    Google OAuth tokens are loaded from disk on server startup (`googleAuth.loadTokens()`), so educators don't need to re-authenticate after server restarts.

### From Strategy (c): Agent Configuration Deep Scan — 2026-02-14

35. **4th Subagent: Curriculum Agent** — `src/server/agents/curriculum-agent.ts`
    Undocumented subagent using Opus model. Designs multi-session curricula with spiral revisitation (skills appear 3× at increasing Bloom's depth), spaced repetition (review extends if session gap > 3 days), dependency-first ordering, and pace calibration based on group skill levels. Has access to `compose_curriculum`, `advance_curriculum`, and `compose_lesson_plan` tools. CAPABILITIES.md lists only 3 subagents — there are actually 4.

36. **Live Companion Model & Tool Restrictions** — `src/server/agent.ts:createLiveCompanionQuery()`
    Live teaching companion uses Sonnet (not Opus) for fast responses and is restricted to read-only tools: `Read`, `Glob`, `query_skill_graph`, `query_group`, `analyze_affective_context`. Auto-extracts group profile from lesson metadata. System prompt enforces extreme brevity ("reading on a phone while teaching").

37. **Standalone Assessment Query with 5 Integrity Strategies** — `src/server/agent.ts:createAssessmentQuery()`
    Assessment sessions run as independent agent queries (not subagent delegation) with an elaborate system prompt embedding 5 anti-gaming question design strategies: contextual synthesis, chained reasoning, explain-to-teach, error diagnosis, and transfer probes. Also includes silent pattern tracking instructions (response depth 1-3, consistency, engagement quality).

38. **User Identity System (data/user.md)** — `src/server/agent.ts:EDUCATOR_SYSTEM_PROMPT`
    On every new session, the main agent checks for `data/user.md`. If missing, conducts a first-meeting interview ("two colleagues meeting over coffee") and creates both the user file and an educator profile. If present, reads silently and uses the educator's name/context naturally without announcing it.

39. **Export File Organization & Manifest** — `src/server/agent.ts:EDUCATOR_SYSTEM_PROMPT`
    Agent is instructed to save exports in organized subdirectories under `data/exports/` and maintain a manifest at `data/exports/manifest.md` logging every created file with path, type, title, date, and Google Drive URL. Prevents workspace clutter from dozens of exports.

40. **Assessment Completion Guard** — `src/server/agent.ts:createAssessmentQuery()`
    Before starting an assessment, checks if the session markdown contains `| **Status** | completed |` and throws an error if so. Prevents learners from re-taking completed assessments.

41. **Domain Manifest Context in Assessments** — `src/server/agent.ts:createAssessmentQuery()`
    Assessment queries load the domain's `manifest.json` (audience age range, setting, description) and inject it into the system prompt so the assessment agent calibrates tone and language to the audience (e.g., ages 14-18 get different phrasing than adult professionals).

42. **Curriculum Agent Pedagogy: Spiral Revisitation Model** — `src/server/agents/curriculum-agent.ts`
    Embedded in the curriculum agent's prompt: skills appear 3 times at increasing depth (1st: knowledge/comprehension, 2nd: application, 3rd: analysis/synthesis). Spaced repetition rule: if gap between sessions > 3 days, extend review period. Pace estimation: 12-15 min per new skill if most have prerequisites.

43. **Claude Code Preset System Prompt** — `src/server/agent.ts:createEducatorQuery()`
    The main educator agent uses `systemPrompt: { type: "preset", preset: "claude_code", append: ... }` — meaning it inherits the full Claude Code system prompt (filesystem, bash, skills, etc.) with the pedagogical prompt appended. This is why the agent can install software, write scripts, and reason about code natively.

44. **Affective-Aware Pairing in Educator Prompt** — `src/server/agent.ts:EDUCATOR_SYSTEM_PROMPT`
    The main agent is explicitly instructed to factor both skill complementarity AND social dynamics into pairing decisions, with example phrasing: "I paired Sofia with Nkechi because their skills complement each other and you mentioned they have good rapport."

45. **"Once is Advice, Twice is Nagging" Pushback Rule** — `src/server/agent.ts:EDUCATOR_SYSTEM_PROMPT`
    Explicit behavioral constraint: the agent pushes back on pedagogically unsound plans ONCE with evidence, then defers. Categories where pushback is forbidden: style preferences, domain content choices, interpersonal dynamics, and previously overridden points.

### From Strategy (d): Frontend Components Deep Scan — 2026-02-14

46. **Speech-to-Text Voice Input with 3-State Recording UI** — `src/frontend/components/chat/voice-mic-button.tsx + hooks/use-speech-recognition.ts`
    Full voice input system using Web Speech API with three states: idle (mic icon), listening (animated waveform bars + timer + interim transcript preview), paused (pause/resume controls). Recording bar shows elapsed time, live interim transcription, and pause/resume/stop buttons. Not just "click to record" — a proper recording studio UX.

47. **Text-to-Speech Response Readback** — `src/frontend/components/chat/chat-interface.tsx + hooks/use-speech-synthesis.ts`
    Optional TTS toggle that reads assistant responses aloud using Web Speech Synthesis API (rate 1.05×). Queues the final response text and speaks after the result is complete. Toggle button in the input area. Stops speaking when user starts recording.

48. **Session State Persistence via localStorage** — `src/frontend/components/chat/chat-interface.tsx:saveSessionState/loadSessionState`
    Chat messages, creative tool labels, and created files are persisted to localStorage keyed by sessionId. On reconnect (via `?session=` URL param), the UI restores full conversation history from localStorage before the WebSocket reconnects. Includes `pruneOldSessions(10)` to cap stored sessions.

49. **Programmatic Message Sending from UI Cards** — `src/frontend/components/chat/chat-interface.tsx:sendProgrammaticMessage()`
    AskUserQuestion cards, GoogleConnect cards, and starter prompts can inject messages into the chat without user typing. This enables structured data collection via interactive UI cards that feed back into the agent conversation.

50. **Interactive Skill Graph on Landing Page** — `src/frontend/components/landing/skill-graph.tsx`
    SVG skill graph with spring physics: nodes are draggable, connected nodes pull along via BFS-based force propagation (pull decays with depth). On release, nodes spring back with damped oscillation. Nodes are color-coded by Bloom's level. Uses requestAnimationFrame for smooth 60fps animation. Touch-enabled (`touchAction: none`).

51. **QR Code Generation for Assessment Links** — `src/frontend/components/assessment/qr-code.tsx`
    Client-side QR code generation via the `qrcode` npm library rendered to canvas. Used in assessment sharing — educators can display QR codes for students to scan with phones instead of typing assessment codes.

52. **Embeddable Assessment Widget with postMessage API** — `src/frontend/components/assessment/embed-assessment-chat.tsx`
    Minimal assessment chat designed for iframe embedding. Sends structured events to parent window via `postMessage`: `assessment:started`, `assessment:progress` (with covered/total), `assessment:completed` (with message count), `assessment:error`. Source identifier: `"pedagogical-engine"`. Enables LMS integration without navigation.

53. **Real-Time Skill Coverage Tracking in Assessment UI** — `src/frontend/components/assessment/assessment-chat.tsx`
    Assessment chat tracks which skill areas have been covered in real-time via `coveredSkillLabels` Map from the hook. Shows animated skill pills (covered=green checkmark, current=pulsing accent dot, upcoming=gray). On completion, renders a "Skill Map" visualization dividing skills into "What you know" vs "What you'll work on next".

54. **Contextual Loading Duration Messages** — `src/frontend/components/assessment/assessment-chat.tsx + embed-assessment-chat.tsx`
    Loading indicator shows progressive messages based on how long the agent has been thinking: "Thinking..." (<8s), "Still working..." (8-20s), "Saving your results — almost done!" (>20s). Prevents user anxiety during long assessment saves.

55. **Bloom's Taxonomy Color-Coded Tool Results** — `src/frontend/components/chat/tool-result.tsx`
    Every tool result card has a colored top border mapped to Bloom's taxonomy levels by tool category: data loading=Remember, querying=Understand, assessment=Apply, analysis=Analyze, auditing=Evaluate, composition=Create. Unknown tools get auto-categorized by verb prefix (load→Remember, compose→Create, etc.).

56. **Interactive Group Dashboard with 4 Visualization Tabs** — `src/frontend/components/visualizations/group-dashboard.tsx`
    Full analytics dashboard embedded in tool results: (a) Skill Heatmap with hover tooltips showing assessed/inferred status per learner×skill, (b) Bloom's Distribution with radar chart + bar chart side-by-side, (c) Common Gaps with auto-computed pairing suggestions based on complementary skill coverage (complementScore > 1.5), (d) Learner Overview with progress rings showing assessed/inferred/unknown breakdown. All rendered client-side with dark theme.

57. **Live Dependency Graph with Inference Cascade Animation** — `src/frontend/components/visualizations/live-dependency-graph.tsx`
    ReactFlow-based interactive DAG with: node sizing by Bloom's level (evaluation nodes 1.25× bigger than knowledge), cascade animation when inference propagates (150ms stagger per depth), edge tooltips showing confidence + type, group overlay pie charts on nodes, click-to-inspect skill detail panel showing prerequisites + per-learner status. Includes `computeInferenceCascade()` function for BFS inference with max-confidence-path and 0.85 decay per hop.

58. **Lesson Plan Inline Viewer with Timeline Bar** — `src/frontend/components/lesson-plan/lesson-plan-view.tsx`
    Lesson plans rendered as collapsible cards with: parsed section headers (title + timing), color-coded timeline bar showing proportional section durations, per-section color strips (8 rotating colors), total duration calculation, and inline PDF/Prerequisites export buttons. Markdown parser extracts timing from headers like "## Activity Name (15 min)".

59. **Bloom's-Aware Navigation with Color Wayfinding** — `src/frontend/components/ui/nav-bar.tsx`
    Every navigation section is mapped to a Bloom's taxonomy color (Teach=Understand, Dashboard=Evaluate, Lessons=Apply, etc.). Active page shows its Bloom color on the link text + a colored dot indicator. The "Explore" dropdown reveals 6 advanced features (Simulate, Wisdom, Educators, Meta, Disagree, Transfer) each with their own Bloom dot. Dark/light theme toggle included.

60. **Google Account Status Badge with Auto-Refresh** — `src/frontend/components/chat/session-context-sidebar.tsx:GoogleStatusBadge`
    Session sidebar shows Google connection status (email or "Not connected"), checked on mount and every 60 seconds. Also re-checks when the OAuth popup signals completion via localStorage, ensuring instant status update after connecting.

61. **File Card System with Dual Download Paths** — `src/frontend/components/chat/file-card.tsx`
    Created files show as inline cards with type-specific icons (doc=blue, slides=yellow, sheet=green, pdf=red). Two download paths: local file download (always available via `/api/files/*`) and "Open in Google" link (when uploaded). Includes copy-to-clipboard for Google URLs. Compact variant for sidebar display.

62. **Adaptive Welcome Screen (First-Time vs Returning)** — `src/frontend/components/chat/chat-interface.tsx`
    Landing state differentiates between new and returning educators. New users see onboarding copy ("Nice to meet you") with 2 starter prompts. Returning users see AI-generated personalized greeting (from Haiku) with 3 contextual starter prompts color-coded by Bloom level. Greeting includes subtext referencing recent work.

63. **Client-Side Session Context Extraction** — `src/frontend/components/chat/chat-interface.tsx:extractContext()`
    Fallback context extraction when server doesn't provide `session_context` events. Parses tool inputs from every `mcp__pedagogy__*` tool to accumulate: domain, groupName, lessonId, skillIds, learnerNames (from members arrays), constraints (duration + text). Also detects lesson file paths from Read/Write tools.

### From Strategy (e): Google Integration Deep Scan — 2026-02-15

64. **Lazy OAuth2 Client Initialization** — `src/server/google/auth.ts:ensureClient()`
    OAuth2 client is created on first use, not at import time. If `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` are missing, logs a warning but doesn't crash — Google integration degrades gracefully. All other features continue working.

65. **Auto Token Merge on Refresh** — `src/server/google/auth.ts:client.on("tokens")`
    When Google refreshes an access token, the `tokens` event handler merges new tokens with existing disk tokens (preserving the refresh_token when only the access_token changes). Prevents the common bug where a token refresh overwrites the refresh_token with `undefined`.

66. **CSRF State with 10-Minute Expiry** — `src/server/google/auth.ts:generateAuthUrl()`
    Each OAuth flow generates a `crypto.randomUUID()` state parameter stored in an in-memory Map. States expire after 10 minutes and are cleaned up on each new auth URL generation. Callback validates and deletes the state in one step — replay-proof.

67. **Best-Effort Credential Revocation on Disconnect** — `src/server/google/auth.ts:disconnect()`
    Disconnect doesn't just delete local tokens — it also calls `revokeCredentials()` to invalidate them server-side at Google. Wrapped in `.catch(() => {})` because revocation may fail if tokens are already expired. Belt-and-suspenders security.

68. **6 OAuth Scopes Requested** — `src/server/google/auth.ts:SCOPES`
    Specifically: `documents`, `spreadsheets`, `drive.file`, `drive.readonly`, `classroom.rosters.readonly`, `userinfo.email`. Uses `drive.file` (app-created files only) instead of full `drive` scope — principle of least privilege.

69. **Drive Query Injection Prevention** — `src/server/google/drive.ts:listFiles()`
    Search queries escape single quotes (`query.replace(/'/g, "\\'")`) before embedding in Drive API `q` parameter. Prevents query injection through file search.

70. **File Share with Email Notification** — `src/server/google/drive.ts:shareFile()`
    `sendNotificationEmail: true` on file sharing — recipients get a Google notification email. Supports `reader`, `writer`, and `commenter` roles. Simple but important for the educator→student sharing workflow.

71. **Classroom Active-Only Course Filter** — `src/server/google/classroom.ts:listCourses()`
    Only returns courses with `courseState: "ACTIVE"` — filters out archived/provisioned/declined courses. Prevents educators from accidentally importing students from old classes. Caps at 30 courses, 100 students per course per page.

### From Strategy (f): PDF Export System Deep Scan — 2026-02-15

72. **Hyphenation Disabled in PDF Rendering** — `src/server/exports/shared-styles.tsx`
    Custom `Font.registerHyphenationCallback` returns words unsplit, preventing awkward mid-word breaks in all generated PDFs. Small detail, big readability impact.

73. **Lesson Plan Markdown Parser with 7 Section Extractors** — `src/server/exports/data-parsers.ts`
    Dedicated regex parsers for: metadata table fields (bold + non-bold variants), numbered learning objectives, checkbox prerequisite skills, tool requirements tables, timed sections (supports both range `0:00-0:15` and duration `15 min` formats), `### If` contingency patterns, and logistics tables. Each handles missing sections gracefully with empty defaults.

74. **Prerequisites Handout: Student-Facing Tone & Bloom's Stripping** — `src/server/exports/prerequisites-pdf.tsx`
    Generates a learner-facing (not educator-facing) handout with encouraging language: "Don't worry! Come to the session early and we will help you get set up." Strips Bloom's level annotations from objectives via regex before displaying to students.

75. **Group PDF: Server-Side Peer Pairing Algorithm** — `src/server/exports/group-pdf.tsx`
    Computes complementary skill pairings by finding learner pairs where one is strong (≥0.7) in skills the other lacks, generating human-readable rationale strings. This is computed at PDF render time (server-side), separate from the frontend dashboard pairing logic.

76. **Group PDF: Numeric Confidence Heatmap Cells** — `src/server/exports/group-pdf.tsx`
    Renders learner×skill matrix with color-coded cells using opacity scaling (`0.3 + confidence × 0.7`) and single-digit scores (0-10) inside each 16×16px cell. Empty cells render as gray. Caps at 18 skills to prevent page overflow.

77. **Learner PDF: Prerequisite-Aware Focus Recommendations** — `src/server/exports/learner-pdf.tsx`
    "Recommended Focus Areas" filters domain skill gaps to only those whose ALL prerequisites are met at ≥0.5 confidence. Shows top 5. This is prerequisite-aware next-step recommendation, not just gap listing.

78. **Learner PDF: Three-Card Summary with Color Thresholds** — `src/server/exports/learner-pdf.tsx`
    Summary cards show: Skills Assessed (count vs domain total), Skills Inferred (via dependency inference), and Coverage % with color thresholds (≥60%=green, ≥30%=yellow, <30%=red). Coverage computed as known skills / total domain skills.

79. **PDF Lesson List API Endpoint** — `src/server/exports/router.tsx:GET /api/export/lessons`
    Returns all available lesson plan IDs (`.md` files in lessons directory). Enables frontend to populate lesson selection dropdowns for export without hardcoding lesson names.
