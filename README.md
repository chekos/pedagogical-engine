# Pedagogical Engine

**An AI teaching partner that reasons about pedagogy — then argues with you about it.**

Built with Claude Opus 4.6 and the Claude Agent SDK at the Cerebral Valley x Anthropic Hackathon (Feb 2026).

---

## The story

It started with a simple insight: if a student can run a pandas groupby, they probably already know how to filter data, declare variables, and open a terminal. Test the high-level skill, infer the rest. That's **dependency inference** — and it makes assessment 3-5x faster.

Then things got interesting.

We taught the engine to **simulate lessons before they happen** — predicting where students will get stuck, where timing will blow up, where the energy will drop. It runs friction analysis on your plan before a single student walks in.

Then we gave it the ability to **push back**. Ask for a 30-minute lecture for beginners and the engine will tell you why that's a bad idea — citing your students' actual skill profiles, not generic advice. It's pedagogical disagreement, grounded in evidence.

Then it learned to **explain itself**. Ask "why did you put the hands-on exercise before the lecture?" and it retrieves its reasoning traces — the specific learner profiles, skill graph paths, and Bloom's levels that drove the decision. Not a hallucinated justification. The actual reasoning chain.

Then it started **getting smarter**. After each teaching session, it debriefs with the educator, extracts patterns, and feeds them back into future plans. 18 sessions later, it knows that hands-on exercises consistently run 3 minutes over for evening cohorts.

Now it does all of this — across 4 domains, with educator-specific profiling, cross-domain skill transfer, affective context analysis, and assessment integrity checking — powered by 27 custom MCP tools.

**Built by [chekos](https://github.com/chekos) in a week.**

---

## What it does

Most AI teaching tools generate content. This one *reasons about teaching* — and then reasons about its own reasoning.

### Core engine
- **Educator interviews** — structured conversation to understand context, constraints, and goals
- **Adaptive assessment** — Bloom's taxonomy-calibrated questioning with dependency inference
- **Lesson composition** — stage-directed plans with minute-by-minute timing, differentiated for each student
- **Skill graph traversal** — 4 domains, each with skills, dependencies, and Bloom's levels

### Moonshot features (built overnight)
- 🎭 **Lesson simulation** — predict friction points, timing risks, and energy drops *before* you teach
- ⚔️ **Pedagogical disagreement** — the engine pushes back on bad plans, citing evidence from student profiles
- 🌉 **Cross-domain transfer** — a biology PhD's analysis skills partially predict data science readiness
- 🧠 **Meta-pedagogical reasoning** — ask "why?" about any decision and get the actual reasoning chain
- 📊 **Assessment integrity** — detect gaming, inconsistency, and confidence-competence mismatches
- 💚 **Affective dimension** — analyze emotional and motivational context for the group
- 📝 **Post-session debrief** — structured reflection that feeds back into the wisdom layer
- 📚 **Accumulated teaching wisdom** — patterns from past sessions improve future plans (flywheel effect)
- 👤 **Educator profiling** — learns your teaching style and customizes plans to your strengths

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

**Key architectural decisions:**

- **Claude Agent SDK** — not a wrapper around the API. The same SDK that powers Claude Code, with subagents, skills, custom MCP tools, session persistence, and context compaction.
- **Skills as progressive disclosure** — pedagogical methodology lives in `SKILL.md` files loaded on-demand. The context window stays lean.
- **Three subagents with isolated context** — assessment, roster analysis, and lesson composition each run in their own context window.
- **Filesystem as working memory** — Markdown for human-readable artifacts, JSON for graph data and structured traces. No database needed.
- **27 custom MCP tools** — in-process tools spanning skill graph traversal, dependency inference, lesson simulation, pedagogical disagreement, assessment integrity, cross-domain transfer, teaching wisdom, educator profiling, meta-pedagogical reasoning, and debrief processing.

## What makes it different

**Dependency inference.** The skill graph isn't decoration — it's the reasoning substrate. When Priya demonstrates she can do a pandas groupby, the engine infers she can also filter data, write functions, and use variables, with confidence values that decay over multi-hop chains. Assessment becomes 3-5x more efficient.

**The engine pushes back.** Ask for something pedagogically unsound and it won't just comply — it'll cite your students' profiles and explain why a different approach would work better. This is pedagogical disagreement, not generic warnings.

**Predict friction before teaching.** Lesson simulation runs your plan through the group's skill profiles and flags where timing will blow up, where beginners will get lost, and where advanced students will disengage — before you walk into the room.

**It explains itself.** Every major decision in a lesson plan is traced: which skill graph paths were traversed, which learner profiles were consulted, what alternatives were considered and rejected. Ask "why?" and get the real reasoning, not a post-hoc rationalization.

**It gets smarter.** Post-session debriefs extract timing patterns, confusion points, and success patterns. After enough sessions, the engine knows that your Tuesday cohort needs +3 minutes on hands-on exercises. This accumulated wisdom feeds into every future plan.

**It knows you.** Educator profiling learns your teaching style — discussion-heavy or lecture-focused, structured or improvisational — and customizes plans to your strengths while occasionally nudging you to grow.

**Stage direction, not bullet points.** Lesson plans include timing beats: *"By minute 14, if the group hasn't completed the warmup, skip the extension and move directly to the main activity."*

**Bloom's taxonomy as calibration.** Assessment gauges *at what level* a student knows something. Remembering that pandas exists is different from evaluating when to use it vs. SQL.

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

This project exercises exactly the capabilities that make Opus 4.6 distinctive:

- **Deep, multi-branch reasoning** — the moonshot features require reasoning chains that span skill graphs, learner profiles, Bloom's taxonomy, teaching wisdom, and educator preferences *simultaneously*. Lesson simulation alone requires predicting friction across 5 learners × 25 skills × 6 Bloom's levels.
- **Pedagogical disagreement** — the engine must reason about *why* a plan is suboptimal, construct a counter-argument grounded in evidence, and propose alternatives. This requires the kind of sustained, multi-step reasoning Opus 4.6 excels at.
- **Meta-pedagogical explanation** — retrieving reasoning traces and composing natural-language explanations that reference specific students, skills, and alternatives demands deep contextual reasoning.
- **Progressive disclosure via Skills** — pedagogical methodology loaded on-demand from the filesystem, not crammed into a system prompt
- **The Agent SDK as an operating system** — subagents, 27 custom MCP tools, session persistence, context compaction, and filesystem access are all first-class features

This isn't a chatbot with a teaching-themed system prompt. It's a reasoning engine that happens to reason about pedagogy.

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
