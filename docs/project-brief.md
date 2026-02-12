# Project Brief: Pedagogical Reasoning Engine

**Hackathon:** Built with Opus 4.6 — Cerebral Valley × Anthropic
**Dates:** February 10–16, 2026
**Builder:** chekos (solo)

---

## One-liner

A pedagogical reasoning engine that composes educational experiences from five primitives — the way Claude Code composes development workflows from terminal, file system, and process execution.

## The pitch (30 seconds)

I'm building the primitives layer for AI-native education. The core engine reasons about five things: skills, dependencies between skills, learner profiles, groups, and constraints. From those, it composes whatever the educator needs — adaptive assessments, group management, timed lesson plans with stage direction. It works for a classroom of 30, a coaching session of 1, or a nature walk with no Wi-Fi — because the primitives are universal.

## The pitch (2 minutes)

If you tell me you can run a Python script, I can infer you can install Python, open a terminal, navigate directories, and understand what execution means. That's dependency inference — and it's the core of what makes this engine work.

The system maps skills as atomic units and their dependencies as a directed graph. When an educator comes in and says "I want to teach Claude Code for data analysis," the engine doesn't jump to generating a lesson plan. It interviews the educator: Who are your students? What do they already know? Are you online or in-person? How much time? Do they need paid subscriptions?

Then it composes a plan from those primitives. Not just a curriculum outline — a stage-directed session plan. "By minute 14, transition to the hands-on exercise or you won't cover the debrief." It audits prerequisites, checks for tool requirements, generates pairing recommendations based on complementary skills.

The design follows the same product philosophy Cat Wu applied to Claude Code: invest in the right primitives, make it hackable, and let use cases emerge. Claude Code wasn't built for legal review or robotics — it just works there because the primitives are right. I'm doing the same for education.

## Why Opus 4.6

- **1M token context:** Hold the full skill dependency graph, learner profiles, group state, and lesson context in a single session
- **128K output:** Generate comprehensive stage-directed lesson plans without truncation
- **Adaptive thinking:** Deep reasoning for dependency inference and Bloom's-level assessment; fast for simple lookups
- **Agent teams:** Potential to parallelize assessment, roster management, and lesson creation

## Key design decisions

1. **Primitives over features** — Domain-agnostic, setting-agnostic, modality-agnostic
2. **Interview first** — Never jump to output; understand context before composing
3. **Dependency inference** — Assess efficiently by leveraging what skills imply about other skills
4. **Bloom's taxonomy integration** — Assess depth of knowledge, not just presence of knowledge

## Target users

Any educator: classroom teachers, park naturalists, online instructors, homeschool parents, 1:1 coaches, workshop facilitators, bootcamp runners.

## What this is NOT

- Not a chatbot for students
- Not a content/worksheet generator
- Not an LMS
- Not limited to any subject or setting

---

*Derived from North Star document. For changes, update North Star first.*
