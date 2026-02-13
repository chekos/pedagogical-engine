# Pedagogical Engine

**An AI teaching partner that reasons about pedagogy — then argues with you about it.**

Built with Claude Opus 4.6 and the Claude Agent SDK for the Cerebral Valley x Anthropic Hackathon (Feb 2026).

---

## The story

If a student can run a pandas groupby, they probably already know how to filter data, declare variables, and open a terminal. Test the high-level skill, infer the rest. That's dependency inference, and it makes assessment 3-5x faster.

That was the starting point. Then things got weird.

The engine learned to simulate lessons before they happen — running friction analysis against actual student profiles. It'll tell you that Sofia will get stuck at minute 22 because her data cleaning skills are at Remember level, not Apply.

Then it learned to argue. Ask for a 30-minute lecture for beginners and it'll tell you why that's a bad idea, citing Marcus's skill gaps and Alex's prerequisite holes. Not generic warnings. Your students, your data.

Then it learned to explain itself. "Why did you pair Marcus with Sofia?" returns the actual reasoning chain — the skill graph traversal, the Bloom's level comparison, the alternatives it considered and rejected.

Then it started remembering. After each session, it debriefs with the educator and extracts patterns. 18 sessions in, it knows hands-on exercises run 3 minutes over for evening cohorts.

27 MCP tools. 4 domains. Educator profiling. Cross-domain skill transfer. All built in a week.

*— [chekos](https://github.com/chekos)*

---

## What it does

Most AI teaching tools generate content. This one reasons about teaching — and then reasons about its own reasoning.

**Core engine:** educator interviews, adaptive assessment (Bloom's taxonomy + dependency inference), stage-directed lesson plans with per-student differentiation, skill graph traversal across 4 domains.

**On top of that:**

- Lesson simulation — predict friction, timing risks, and energy drops before you teach
- Pedagogical disagreement — the engine pushes back on bad plans, citing your students' actual profiles
- Cross-domain transfer — a biology PhD's analysis skills partially predict data science readiness
- Meta-pedagogical reasoning — ask "why?" about any decision and get the actual reasoning chain
- Assessment integrity — detect gaming, inconsistency, and confidence-competence mismatches
- Affective dimension — emotional and motivational context for the group
- Post-session debrief — structured reflection that feeds back into the wisdom layer
- Accumulated teaching wisdom — patterns from past sessions improve future plans
- Educator profiling — learns your teaching style and customizes plans to your strengths

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Next.js Frontend                       │
│  /teach  /simulate  /disagree  /transfer  /meta  /wisdom │
│  /assess  /dashboard  /profile  /debrief  /domains       │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│              Claude Agent SDK Server                      │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────────────┐ │
│  │  Skills  │ │Subagents │ │     27 MCP Tools          │ │
│  │(SKILL.md │ │assess    │ │ load_roster               │ │
│  │on-demand │ │roster    │ │ query_skill_graph          │ │
│  │loading)  │ │lesson    │ │ assess_learner             │ │
│  └──────────┘ └──────────┘ │ compose_lesson_plan        │ │
│                             │ simulate_lesson            │ │
│                             │ analyze_tensions           │ │
│                             │ analyze_cross_domain       │ │
│                             │ explain_reasoning          │ │
│                             │ process_debrief            │ │
│                             │ query_teaching_wisdom      │ │
│                             │ load_educator_profile      │ │
│                             │ + 16 more                  │ │
│                             └───────────────────────────┘ │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                 Filesystem (data/)                         │
│  domains/        → 4 skill graphs + teaching notes (JSON) │
│  learners/       → profiles (Markdown)                    │
│  groups/         → cohort data (Markdown)                 │
│  lessons/        → composed plans (Markdown)              │
│  assessments/    → session records (Markdown)             │
│  educators/      → teaching style profiles (JSON)         │
│  reasoning-traces/ → decision traces (JSON)               │
└──────────────────────────────────────────────────────────┘
```

**Why this architecture:**

- **Claude Agent SDK** — the same SDK that powers Claude Code. Subagents, skills, MCP tools, session persistence, context compaction.
- **Skills as progressive disclosure** — pedagogical methodology in `SKILL.md` files, loaded on-demand. Context window stays lean.
- **Three subagents with isolated context** — assessment, roster analysis, and lesson composition each get their own context window.
- **Filesystem as working memory** — Markdown for what humans read, JSON for what tools traverse. No database.
- **27 MCP tools** — skill graph traversal, dependency inference, lesson simulation, pedagogical disagreement, assessment integrity, cross-domain transfer, teaching wisdom, educator profiling, meta-pedagogical reasoning, debrief processing.

## What makes it different

**Dependency inference.** The skill graph is the reasoning substrate. When Priya demonstrates she can do a pandas groupby, the engine infers she can also filter data, write functions, and use variables, with confidence decaying over multi-hop chains. Assessment becomes 3-5x faster.

**It pushes back.** Ask for something pedagogically unsound and it won't comply — it'll cite your students' profiles and explain why a different approach would work better.

**It simulates before you teach.** Lesson simulation runs your plan against the group's profiles and flags where timing blows up, where beginners get lost, and where advanced students disengage.

**It explains itself.** Every decision is traced: which graph paths were traversed, which profiles consulted, what alternatives were rejected. Ask "why?" and get the actual reasoning, not a post-hoc justification.

**It gets smarter.** Debriefs extract timing patterns, confusion points, and success patterns. After enough sessions, it knows your Tuesday cohort needs +3 minutes on hands-on exercises.

**It knows you.** Educator profiling learns your teaching style and customizes plans to your strengths while occasionally nudging you to grow.

**Stage direction, not bullet points.** Lesson plans include timing beats: *"By minute 14, if the group hasn't completed the warmup, skip the extension and move to the main activity."*

**Bloom's as calibration.** Assessment gauges at what *level* a student knows something. Remembering that pandas exists is different from evaluating when to use it vs. SQL.

## Running locally

**Prerequisites:** Node.js 22+, an Anthropic API key

```bash
git clone https://github.com/chekos/pedagogical-engine
cd pedagogical-engine
npm install

export ANTHROPIC_API_KEY=your-key-here

# Start the backend (port 3000)
npm run dev:server

# In another terminal, start the frontend (port 3001)
npm run dev:frontend
```

Open `http://localhost:3001` and start describing your teaching context.

## Demo flow

The repo comes with pre-seeded data across 4 domains: **python-data-analysis**, **farm-science**, **outdoor-ecology**, and **culinary-fundamentals**.

### 🎯 Best demo paths

**1. The Disagreement Demo** (most impressive)
> Go to `/disagree`. Ask the engine to plan a 20-minute advanced lecture on machine learning for the Tuesday cohort. Watch it push back — citing Alex's beginner-level profile, the skill gaps in the group, and why a hands-on approach would work better. This is the "wow" moment.

**2. The Simulation Demo**
> Go to `/simulate`. Pick a lesson plan and watch the engine predict friction points: "Sofia will struggle at minute 22 when data cleaning comes up — her assessed level is Remember, not Apply." See timing risk analysis and energy curve predictions before teaching.

**3. The Full Teaching Flow**
> Start at `/teach`. Say: *"I'm teaching a 90-minute workshop on data cleaning to my Tuesday evening cohort."* Watch the engine reason about skill distributions, compose a differentiated plan, then ask "why did you pair Marcus with Sofia?" to see meta-pedagogical reasoning in action.

**4. The Wisdom Flywheel**
> Visit `/wisdom` to see accumulated teaching patterns from 23+ simulated sessions. Then `/profile` to compare how the same lesson looks for two different educators.

**5. Cross-Domain Transfer**
> Visit `/transfer`. Select Maya Whitehawk (outdoor-ecology expert) and see how her evaluation-level ecology skills predict partial readiness for python-data-analysis — but only the cognitive frameworks, not the syntax.

### The Tuesday Evening Cohort

| Student | Level | What makes them interesting |
|---|---|---|
| **Priya Sharma** | Advanced | Software engineer pivoting to data science |
| **Marcus Johnson** | Intermediate | 15 years of Excel, visual impairment |
| **Sofia Ramirez** | Intermediate | Strong at visualization, weak on data cleaning |
| **Alex Chen** | Beginner | Career changer, needs scaffolding |
| **Nkechi Okonkwo** | Mixed | Biology PhD, deep R experience, learning Python |

**Explore the dashboard** at `/dashboard` for interactive skill graph visualization with learner overlays, group heatmaps, and pairing suggestions.

## Why Opus 4.6

The moonshot features require reasoning chains that span skill graphs, learner profiles, Bloom's taxonomy, teaching wisdom, and educator preferences at the same time. Lesson simulation alone means predicting friction across 5 learners × 25 skills × 6 Bloom's levels.

Pedagogical disagreement is where it gets hard: the engine has to figure out *why* a plan is suboptimal, build a counter-argument from evidence, and propose alternatives — all in one turn. Meta-pedagogical explanation retrieves stored reasoning traces and composes natural-language answers that reference specific students by name and cite specific graph paths.

The Agent SDK handles the rest: subagents with isolated context, 27 MCP tools, session persistence, context compaction, on-demand skill loading from the filesystem.

Not a chatbot with a teaching-themed system prompt. A reasoning engine that happens to reason about pedagogy.

## Project structure

```
.claude/skills/        — 4 pedagogical SKILL.md files (methodology)
.claude/agents/        — 3 subagent definitions (assessment, roster, lesson)
data/domains/          — 4 skill graphs + teaching notes (JSON)
  python-data-analysis/  — 25 skills, 48 deps, teaching-notes.json
  farm-science/          — domain graph + notes
  outdoor-ecology/       — domain graph + notes
  culinary-fundamentals/ — domain graph + notes
data/learners/         — individual learner profiles (Markdown)
data/groups/           — cohort definitions (Markdown)
data/assessments/      — assessment session records (Markdown)
data/lessons/          — composed lesson plans (Markdown)
data/educators/        — teaching style profiles (JSON)
data/reasoning-traces/ — decision traces with evidence chains (JSON)
src/server/            — Agent SDK server with 27 custom MCP tools
src/server/exports/    — PDF generation (lesson plans, reports, handouts)
src/frontend/          — Next.js app with 20 pages
```

### Frontend routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/teach` | Educator chat (WebSocket streaming) |
| `/teach/live/[id]` | Voice-first live teaching companion |
| `/assess/[code]` | Student assessment |
| `/assess/share` | Assessment link generator |
| `/assess/integrity` | Assessment integrity analysis |
| `/dashboard` | Skill graph + group analytics |
| `/domains` | Browse all 4 domains |
| `/graph/[domain]` | Domain-specific skill graph |
| `/lessons` | Browse & export lesson plans |
| `/simulate` | Lesson simulation (predict friction) |
| `/disagree` | Pedagogical disagreement |
| `/transfer` | Cross-domain skill transfer |
| `/meta` | Meta-pedagogical reasoning explorer |
| `/wisdom` | Accumulated teaching wisdom |
| `/profile` | Educator style profiles |
| `/debrief/[id]` | Post-session debrief |

---

*Built by [chekos](https://github.com/chekos) in a week with Claude Opus 4.6.*
