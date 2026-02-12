# North Star: Pedagogical Reasoning Engine

**Project:** AI-Native Knowledge Engine for Educators
**Builder:** chekos
**Hackathon:** Built with Opus 4.6 — Cerebral Valley × Anthropic (Feb 10–16, 2026)
**Status:** Active build

---

## What I'm building

A pedagogical reasoning engine — the brain behind an AI-native education platform. It reasons about teaching the way Claude Code reasons about software: by composing primitives, not by hardcoding workflows.

The engine doesn't know what a "classroom" is. It knows skills, dependencies, learners, groups, and constraints. Everything else — lesson plans, assessments, pairings, timed session plans — is composed from those primitives based on the educator's context.

## Core philosophy

**Primitives over features.** Claude Code works for Mars rovers, knitting machines, and legal review because the team invested in the right primitives (terminal, file system, process execution) and let use cases emerge. I'm doing the same for education: building at the primitive layer so the engine works for a naturalist in a park, a data science bootcamp online, a homeschool parent, and a 1:1 coaching session — without building specific features for any of them.

**Interview first, generate second.** The system never jumps to output. It interviews the educator to understand context — who are the students, what do they already know, what are the constraints (time, tools, subscriptions, connectivity, setting) — before it composes anything. This is the "docs to demos" philosophy applied to pedagogy.

**Agent-native architecture.** The system is designed around Dan Shipper's agent-native principles. The educator doesn't think about agents. They interact with a unified experience. But underneath, specialized agents handle distinct reasoning domains.

## The five primitives

1. **Skills** — Atomic units of knowledge or ability. "Can run a Python script." "Understands what a directory is." "Can identify native plants by leaf shape." Skills are domain-agnostic.

2. **Dependencies** — Directed relationships between skills. If you can run a Python script, I can infer: you can install Python, you can open a terminal, you know what a terminal is, you can navigate directories, you understand that a script is something you execute. Dependencies allow the engine to *deduce* what a learner knows without testing everything.

3. **Learner profiles** — The current state of what a person knows. Built through assessment, observation, or inference via dependencies. A learner profile is a graph of skills with confidence levels.

4. **Groups** — Collections of learner profiles. The engine can reason about the group: aggregate skill gaps, complementary strengths, optimal pairings. A "group" could be a classroom of 30, a cohort of 200 in an online bootcamp, a family of 3 homeschooling, or a single coaching client (group of 1).

5. **Constraints** — Environmental and situational context. Time available, online vs. in-person, tools required, subscriptions needed, internet connectivity, physical setting, language, accessibility needs. Constraints shape how the engine composes outputs.

## Three reasoning branches

The engine composes primitives into three categories of output:

### Assessment
- Determine what a learner or group knows
- Use Bloom's taxonomy to assess depth (not just "do you know X" but "can you apply X, can you analyze X")
- Leverage dependency inference to minimize redundant testing
- Generate adaptive assessments that branch based on responses

### Roster & group management
- Maintain learner profiles over time
- Track skill progression across sessions
- Identify optimal pairings based on complementary skills
- Surface group-level patterns ("80% of your students are stuck at the same dependency")
- Works for any educator: classroom teacher, park naturalist, online instructor, 1:1 coach

### Lesson creation
- Interview the educator first: What are you teaching? Who's the audience? What's the setting? How much time?
- Audit prerequisites: What do students need before this session? What tools, accounts, installations?
- Generate the full plan: not just curriculum outline but a stage-directed session with timing beats ("by minute 14, transition to X or you won't have time for Y")
- Include logistics: links, setup instructions, subscription requirements, connectivity needs
- Adapt to setting: an in-person park lesson looks different from a Zoom workshop looks different from an async online module

## What Opus 4.6 enables

- **1M token context window:** Can hold an entire curriculum, full student history, and the skill dependency graph in a single session. No chunking, no retrieval workarounds.
- **128K output tokens:** Can generate comprehensive lesson plans with full stage direction in a single response.
- **Adaptive thinking:** The engine can reason deeply on complex skill dependency inference while being fast on straightforward assessments.
- **Agent teams (research preview):** Potential to parallelize the three branches — assessment agent, roster agent, lesson creation agent — coordinating through shared context.

## What success looks like at the hackathon

A functional prototype that demonstrates the engine's core reasoning. An educator should be able to:

1. Tell the system what they want to teach
2. Get interviewed about their context (students, setting, constraints)
3. Receive a composed output that feels like it was built by someone who thinks like a teacher

The judges (including Cat Wu) favor **functional prototypes over extensive documentation** and evaluate on **technical innovation, implementation quality, and potential impact**.

## What this is NOT

- Not a chatbot that answers student questions
- Not a content generation tool that spits out worksheets
- Not an LMS (learning management system) — it doesn't host courses
- Not limited to any one subject, setting, or teaching modality

It's the reasoning layer. The brain. The pedagogical equivalent of what a terminal and file system are to Claude Code.

---

*Last updated: February 11, 2026*
