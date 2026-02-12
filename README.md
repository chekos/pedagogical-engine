# Pedagogical Engine

**An AI teaching partner that reasons about what your students actually know.**

Built with Claude Opus 4.6 and the Claude Agent SDK at the Cerebral Valley x Anthropic Hackathon (Feb 2026).

---

## What it does

Most AI teaching tools generate content. This one *reasons about teaching*.

The Pedagogical Engine interviews educators about their context, assesses students through adaptive questioning, maps their skills onto a dependency graph using Bloom's taxonomy, and composes stage-directed lesson plans calibrated to what the group actually knows — not what a syllabus assumes they know.

The key insight: if a student can run a pandas groupby, they probably know how to filter data, declare variables, and open a terminal. Test the high-level skill, infer the rest. This dependency inference makes assessment dramatically more efficient and the resulting lesson plans dramatically more accurate.

## How it works

```
Educator describes context → Agent interviews → Students self-assess via shareable links
                                                        ↓
              Lesson plan with stage direction ← Agent composes ← Skill graph + profiles
```

**Six-step flow:**

1. **Educator arrives** — describes their teaching context (topic, audience, duration, constraints)
2. **Agent interviews** — asks targeted questions to build a complete picture, one at a time
3. **Assessment check** — identifies who needs assessment, generates shareable assessment links
4. **Students self-assess** — adaptive questioning via Bloom's taxonomy with dependency inference
5. **Lesson plan composition** — stage-directed plan calibrated to the group's actual skill distribution
6. **Iteration** — educator requests changes, agent refines

## Architecture

```
┌──────────────────────────────────────────────────┐
│                 Next.js Frontend                  │
│  /teach (chat)  /assess/[code]  /dashboard (viz) │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          Claude Agent SDK Server            │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ Skills  │ │Subagents│ │  MCP Tools   │  │
│  │(SKILL.md│ │assess   │ │load_roster   │  │
│  │on-demand│ │roster   │ │query_graph   │  │
│  │loading) │ │lesson   │ │assess_learner│  │
│  └─────────┘ └─────────┘ │compose_plan  │  │
│                           │+ 4 more      │  │
│                           └──────────────┘  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            Filesystem (data/)               │
│  domains/ → skill graphs (JSON)             │
│  learners/ → profiles (Markdown)            │
│  groups/ → cohort data (Markdown)           │
│  lessons/ → composed plans (Markdown)       │
│  assessments/ → session records (Markdown)  │
└─────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **Claude Agent SDK** — not a wrapper around the API. The same SDK that powers Claude Code, with subagents, skills, custom MCP tools, session persistence, and context compaction.
- **Skills as progressive disclosure** — pedagogical methodology lives in `SKILL.md` files loaded on-demand. The context window stays lean.
- **Three subagents with isolated context** — assessment, roster analysis, and lesson composition each run in their own context window. The educator's conversation stays clean.
- **Filesystem as working memory** — Markdown files for anything humans read (learner profiles, lesson plans), JSON for graph data tools traverse. No database needed.
- **8 custom MCP tools** — in-process tools for skill graph traversal, dependency inference, assessment management, group analysis, and lesson composition.

## Running locally

**Prerequisites:** Node.js 22+, an Anthropic API key

```bash
# Clone and install
git clone https://github.com/chekos/pedagogical-engine
cd pedagogical-engine
npm install

# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Start the backend (port 3000)
npm run dev:server

# In another terminal, start the frontend (port 3001)
npm run dev:frontend
```

Open `http://localhost:3001` and start describing your teaching context.

The skill analytics dashboard at `/dashboard` works standalone (no backend needed) — it uses pre-seeded demo data to show the interactive dependency graph and group analysis visualizations.

## Demo flow

The repo comes with pre-seeded demo data for a realistic scenario:

**The Tuesday Evening Cohort** — 5 community college continuing education students learning Python data analysis. A deliberately messy, realistic group:

| Student | Level | What makes them interesting |
|---|---|---|
| **Priya Sharma** | Advanced | Software engineer pivoting to data science. Ready for analysis-level work. |
| **Marcus Johnson** | Intermediate | 15 years of Excel. Strong data intuition, learning Python syntax. Visual impairment. |
| **Sofia Ramirez** | Intermediate | Marketing analyst. Strong at visualization, surprisingly weak on data cleaning. |
| **Alex Chen** | Beginner | Career changer from restaurant management. Motivated but needs scaffolding. |
| **Nkechi Okonkwo** | Mixed | Biology PhD with extensive R experience. Understands concepts deeply but can't write the Python. |

Try: *"I'm teaching a 90-minute workshop on data cleaning and exploration to my Tuesday evening cohort. They've had two previous sessions on Python basics."*

Watch the engine reason about the skill distribution, identify that Alex needs extra support while Priya needs stretch challenges, and compose a lesson plan with differentiated activities and minute-by-minute timing.

**Also explore the dashboard** at `/dashboard`:
- **Dependency Graph** — interactive visualization of all 25 skills with learner overlays. Select different students to see assessed (green), inferred (yellow), and unknown skills light up. Use auto-cycle mode to sweep through all learners.
- **Group Dashboard** — heatmap of skills vs. learners, Bloom's taxonomy radar chart, common gaps analysis with pairing suggestions, and per-learner summary cards with progress rings.

## What makes it different

**Dependency inference.** The skill graph isn't decoration — it's the reasoning substrate. When Priya demonstrates she can do a pandas groupby, the engine infers she can also filter data, write functions, and use variables, with confidence values that decay over multi-hop chains. This makes assessment 3-5x more efficient.

**Stage direction, not bullet points.** Lesson plans include timing beats and transition cues: *"By minute 14, if the group hasn't completed the warmup, skip the extension exercise and move directly to the main activity."* This is how experienced teachers think.

**Bloom's taxonomy as a calibration tool.** Assessment doesn't just check "does the student know X" — it gauges *at what level* they know it. Remembering that pandas exists is different from being able to evaluate when to use it vs. SQL.

**The agent thinks like a teacher.** Four Skills encode pedagogical methodology — not content, but *how to reason about teaching*. Interview patterns, assessment strategy, dependency inference logic, and lesson composition structure. The agent loads only what it needs, when it needs it.

## Why Opus 4.6

This project exercises exactly the capabilities that make Opus 4.6 distinctive:

- **Extended, multi-branch reasoning** — the agent manages three concurrent reasoning threads (assessment, roster analysis, lesson composition) across subagents with isolated context
- **Progressive disclosure via Skills** — the pedagogical methodology is loaded on-demand from the filesystem, not crammed into a system prompt
- **The Agent SDK as an operating system** — subagents, custom MCP tools, session persistence, context compaction, and filesystem access are all first-class features of the same SDK that powers Claude Code
- **Structured data + natural language** — the agent traverses JSON dependency graphs *and* writes human-readable Markdown lesson plans in the same conversation turn

This isn't a chatbot with a teaching-themed system prompt. It's a reasoning engine that happens to reason about pedagogy.

## Project structure

```
.claude/skills/     — 4 pedagogical SKILL.md files (methodology)
.claude/agents/     — 3 subagent definitions (assessment, roster, lesson)
data/domains/       — skill graphs with dependency edges (JSON)
data/learners/      — individual learner profiles (Markdown)
data/groups/        — cohort definitions and interview context (Markdown)
data/assessments/   — assessment session records (Markdown)
data/lessons/       — composed lesson plans (Markdown)
src/server/         — Agent SDK server with 8 custom MCP tools
src/frontend/       — Next.js app (chat, assessment, skill analytics dashboard)
```

---

*Built by [chekos](https://github.com/chekos) in a week with Claude Opus 4.6.*
