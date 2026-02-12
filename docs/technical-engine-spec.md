# Technical Specification: Pedagogical Reasoning Engine

**Built with Opus 4.6 — Cerebral Valley × Anthropic Hackathon**
**February 10–16, 2026**

---

## System overview

The Pedagogical Reasoning Engine (PRE) is an AI-native system that composes educational experiences from five core primitives. It is domain-agnostic, setting-agnostic, and modality-agnostic — designed to work for any educator teaching anything to anyone, anywhere.

The architecture follows agent-native design principles: the engine is not a monolithic application with AI bolted on. It is a composition of specialized reasoning agents that coordinate through shared primitives.

---

## Core primitives

### 1. Skill

The atomic unit. A discrete, assessable piece of knowledge or ability.

```
Skill {
  id: unique identifier
  label: human-readable description
  domain: subject area (optional, for organization)
  bloom_level: knowledge | comprehension | application | analysis | synthesis | evaluation
  assessable: boolean (can this be directly tested?)
  dependencies: [Skill IDs]
}
```

Examples:
- "Can open a terminal" (knowledge)
- "Can navigate directories using cd" (application)
- "Can identify poison oak by leaf pattern" (application)
- "Can design a normalized database schema" (synthesis)

### 2. Dependency

A directed relationship between skills. If Skill B depends on Skill A, knowing B implies knowing A. This is the engine's power: it enables **inference** rather than exhaustive assessment.

```
Dependency {
  source: Skill ID (the prerequisite)
  target: Skill ID (the dependent skill)
  confidence: float (how certain is this inference? 0.0–1.0)
  type: prerequisite | corequisite | recommended
}
```

The dependency graph is what allows the engine to say: "If this learner can run a Python script, I can infer with high confidence that they can install Python, open a terminal, navigate directories, and understand what a script is."

### 3. Learner profile

The current state of an individual learner, represented as a subgraph of the skill dependency graph with confidence levels attached.

```
LearnerProfile {
  id: unique identifier
  name: string
  assessed_skills: [{skill_id, confidence, method, timestamp}]
  inferred_skills: [{skill_id, confidence, inference_chain}]
  constraints: [personal constraints — accessibility, language, tools available]
}
```

Assessed skills come from direct evaluation. Inferred skills come from dependency traversal. The profile is a living document that updates with every interaction.

### 4. Group

A collection of learner profiles with aggregate reasoning capabilities.

```
Group {
  id: unique identifier
  label: string (e.g., "Tuesday cohort", "Martinez family")
  members: [LearnerProfile IDs]
  context: educator's description of the group
}
```

The engine can reason about groups: aggregate skill distributions, identify common gaps, find complementary pairings, surface patterns. A group of 1 (coaching) and a group of 200 (online bootcamp) use the same primitive — the engine adapts its reasoning to scale.

### 5. Constraint

Environmental and situational context that shapes how the engine composes outputs.

```
Constraint {
  type: time | setting | tools | connectivity | subscriptions | language | accessibility | custom
  value: varies by type
  hard: boolean (must be satisfied vs. nice to have)
}
```

Examples:
- Time: 45-minute session
- Setting: outdoor park, no projector
- Tools: students need Claude Code installed
- Connectivity: intermittent Wi-Fi
- Subscriptions: requires Anthropic API key ($)
- Language: instruction in Spanish, materials in English

---

## Reasoning branches

The engine composes primitives into three output categories. Each branch is a specialized reasoning domain.

### Assessment branch

**Input:** A learner (or group) + a target skill domain
**Process:**
1. Identify the skills to assess within the domain
2. Traverse the dependency graph to find efficient assessment paths (test a high-level skill first; if they pass, infer lower dependencies)
3. Generate adaptive assessment items calibrated to Bloom's taxonomy levels
4. Update the learner profile with results and inferences

**Output:** Updated learner profile with skill map, gap analysis, and recommended next steps.

### Roster management branch

**Input:** A group of learner profiles + an educator query
**Process:**
1. Aggregate individual profiles into group-level view
2. Compute skill distributions, common gaps, outliers
3. Generate pairings based on complementary skills (pair someone strong in X with someone learning X)
4. Track progression over time across sessions

**Output:** Group dashboard, pairing recommendations, progression reports, alerts ("80% of your group is stuck on the same prerequisite").

### Lesson creation branch

**Input:** Educator's intent ("I want to teach X") + group profile + constraints
**Process:**
1. **Interview phase:** Ask the educator to scope the session — don't assume. What's the goal? Who's the audience? What setting? How much time? What do they already know?
2. **Prerequisite audit:** Cross-reference intended content against group profiles. Identify gaps. Check tool requirements, subscriptions, connectivity needs.
3. **Composition:** Build the lesson plan as a structured document:
   - Prerequisites checklist (with links and setup instructions)
   - Learning objectives mapped to Bloom's levels
   - Timed session plan with stage direction (beats, transitions, time checks)
   - Activities calibrated to group skill level
   - Contingency notes ("if students struggle with X, pivot to Y")
4. **Logistics layer:** URLs, installation guides, account requirements, physical materials needed

**Output:** A complete lesson plan — not just a curriculum outline, but a stage-directed session plan with minute-by-minute beats, logistics, prerequisites, and contingency instructions.

---

## Architecture considerations for Opus 4.6

**1M context window:** The skill dependency graph, learner profiles, group state, and lesson context can all live in a single session. No retrieval-augmented generation needed for most use cases. The engine reasons over the full state at once.

**Adaptive thinking:** Complex dependency inference and Bloom's-level assessment design benefit from deep reasoning. Simple skill lookups and roster queries can run at lower effort. The engine should leverage effort controls per operation.

**Agent teams (potential):** The three branches could run as coordinated agents — assessment agent analyzes group skills while lesson creation agent interviews the educator, with results flowing to the roster agent. This is architecturally natural but adds token cost; evaluate whether the coordination benefit justifies it for hackathon scope.

**128K output tokens:** A comprehensive lesson plan with full stage direction, prerequisites, links, and timing can be generated in a single response without truncation.

---

## Hackathon scope

**Must have:**
- Skill and dependency graph definition (at least one domain as proof of concept)
- Learner profile creation through conversational assessment
- Interview-first lesson creation flow
- Timed lesson plan output with stage direction

**Should have:**
- Dependency inference (demonstrate that assessing one skill infers others)
- Group-level reasoning (even with a small group)
- Prerequisite and logistics auditing

**Could have:**
- Agent teams orchestration across branches
- Multiple domain demonstrations
- Pairing recommendations
- Progression tracking across sessions

---

*Derived from North Star document. For changes, update North Star first.*
