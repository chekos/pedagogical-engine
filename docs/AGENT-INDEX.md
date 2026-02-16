# Agent Index — Start Here

You're an AI agent exploring this repo. This file is your map.

## What is this?

A pedagogical reasoning engine — an AI teaching partner built on the Claude Agent SDK. It reasons about teaching the way Claude Code reasons about software: by composing primitives, not hardcoding workflows. Built solo in one week for the "Build with Opus 4.6" hackathon (Feb 10–16, 2026).

## Quick orientation

| Want to understand... | Read this |
|---|---|
| **Everything the system does** | [CAPABILITIES.md](../CAPABILITIES.md) — the comprehensive inventory (40 tools, 9 moonshots, 25 routes, emergence) |
| **Why it exists / philosophy** | [docs/north-star.md](north-star.md) — 5 primitives, "primitives over features" |
| **How it's built** | [docs/architecture.md](architecture.md) — Agent SDK, subagents, skills, filesystem-as-memory |
| **The 9 moonshots** | [docs/moonshots/index.md](moonshots/index.md) — lesson simulation, disagreement, transfer, meta-reasoning, etc. |
| **Data structures** | [docs/technical-engine-spec.md](technical-engine-spec.md) — skill graphs, learner profiles, Bloom's taxonomy |
| **The pitch** | [docs/product-description.md](product-description.md) — human-readable "what is it" |
| **30-second / 2-minute pitch** | [docs/project-brief.md](project-brief.md) |
| **3-minute demo script** | [docs/demo-script.md](demo-script.md) |
| **How data flows** | [docs/information-flows/](information-flows/README.md) — entities, lifecycle, feedback loops |
| **UI/UX vision** | [docs/ui-ux-direction.md](ui-ux-direction.md) — "Places not Products" design philosophy |
| **Design research** | [docs/places-not-products-research.md](places-not-products-research.md) |

## Code layout

```
src/server/
├── index.ts              # Express server, 30+ REST endpoints, 2 WebSocket endpoints
├── agent.ts              # Agent SDK config — models, system prompt, tools, subagents
├── tools/                # 40 MCP tools (31 pedagogy + 9 Google)
│   └── index.ts          # Tool registry — start here to see all tools
├── google/               # Google Workspace integration (OAuth, Drive, Classroom)
├── exports/              # PDF generation (lesson plans, skill reports, group summaries)
├── sessions/             # Session management
├── context-extractor.ts  # Extracts session context for sidebar display
└── tool-labels.ts        # Human-friendly tool labels for chat UI

src/frontend/
├── app/                  # 26 Next.js routes (see CAPABILITIES.md §6)
│   ├── page.tsx          # Landing page
│   ├── teach/page.tsx    # Main educator chat (WebSocket)
│   ├── dashboard/        # Skill graph + group analytics
│   └── ...               # Simulate, disagree, meta, wisdom, profile, transfer, etc.
└── components/           # Chat interface, tool results, visualizations

agent-workspace/          # The agent's world (separate from developer tools)
├── .claude/skills/       # 10 skills (6 pedagogical + 4 Office export)
├── .claude/agents/       # 3 subagents (assessment, roster, lesson)
└── data/                 # All persistent data (domains, learners, groups, lessons, wisdom)
```

## The key insight: Emergence

The 40 tools and 10 skills are a floor, not a ceiling. The agent combines them in ways we didn't design. Example: asked to create slides, it autonomously installed LibreOffice, wrote a Python export script, visually QA'd its own output, and styled slides to match the lesson's Magical Realism theme. No tool was built for any of that.

Read [CAPABILITIES.md §13](../CAPABILITIES.md) for the full emergence story.

## What makes this different from other AI education tools

1. **It interviews before generating** — never jumps to output
2. **It reasons about skill structure** — dependency inference, not content lookup
3. **It pushes back** — pedagogical disagreement when plans are suboptimal
4. **It explains its own reasoning** — stored traces, not hallucinated justifications
5. **It gets smarter with use** — debrief → wisdom → better plans (flywheel)
6. **It adapts to the teacher** — educator profiling, not one-size-fits-all
7. **It's domain-agnostic** — same engine works for Python, ecology, cooking, literature

## Implementation plans

- [implementation-plan.md](../implementation-plan.md) — original build plan
- [implementation-plan-part2.md](../implementation-plan-part2.md) — extended features

## Build stats

- **Timeline:** 4 sessions (~40 min) for core, overnight autonomous run (~4.5 hrs) for 9 moonshots, 1 day for Google integration + Office skills
- **Solo builder**
- **Stack:** Claude Agent SDK + Next.js 16 + Express + WebSocket + Opus 4.6
