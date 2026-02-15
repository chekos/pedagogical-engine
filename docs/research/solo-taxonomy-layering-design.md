# Layering SOLO Taxonomy into the Assessment Branch

**Context:** Design document for the Pedagogical Reasoning Engine
**Date:** February 15, 2026

---

## The Problem SOLO Solves

When our assessment agent evaluates a learner's response, it currently tries to determine *what Bloom's level* the learner operates at for a given skill. Can they remember it? Apply it? Analyze with it? But here's the issue: Bloom's levels describe internal cognitive processes that we can't directly observe. We're making inferences about invisible mental states from visible responses.

SOLO (Structure of Observed Learning Outcomes) flips this. Instead of asking "what kind of thinking is happening inside the learner's head?", it asks "what does the structure of their response tell us about how they've organized this knowledge?" The levels describe observable qualities of the *output*, not hypothesized qualities of the *process*.

This makes SOLO a natural fit for an AI system evaluating learner responses in conversation. The assessment agent can classify what it *sees* rather than guessing at what it can't.

---

## The Two Frameworks, Side by Side

### Bloom's Revised Taxonomy (Anderson & Krathwohl, 2001)
Classifies the *type of cognitive process* the learner engages in.

| Level | What it means | Observable? |
|-------|--------------|-------------|
| Remember | Retrieve relevant knowledge from memory | Partially — can see recall, but can't distinguish rote from understood |
| Understand | Construct meaning from information | Difficult — "understanding" is internal |
| Apply | Carry out a procedure in a given situation | Yes — can observe execution |
| Analyze | Break material into parts, determine relationships | Partially — can see the output of analysis |
| Evaluate | Make judgments based on criteria | Partially — can see the judgment, not the process |
| Create | Put elements together to form a novel whole | Yes — can observe the creation |

### SOLO Taxonomy (Biggs & Collis, 1982)
Classifies the *structural complexity* of the learner's response.

| Level | What it means | Observable? |
|-------|--------------|-------------|
| Prestructural | Response misses the point entirely; no relevant understanding | Yes — clearly visible in responses |
| Unistructural | Response addresses one relevant aspect | Yes — can count the relevant elements |
| Multistructural | Response addresses several relevant aspects independently | Yes — can see multiple elements, note lack of connection |
| Relational | Response integrates aspects into a coherent structure | Yes — can observe connections and organization |
| Extended Abstract | Response generalizes beyond the given context | Yes — can observe transfer and novel application |

The critical difference: every SOLO level is defined by what you can *see in the response*. A prestructural answer is visibly off-topic. A multistructural answer visibly lists elements without connecting them. A relational answer visibly draws connections. An extended abstract answer visibly applies the knowledge to a new context.

---

## How They Layer Together

The key insight is that Bloom's and SOLO answer different questions, and our engine needs both:

**Bloom's defines the skill graph.** When we say a skill is at the "application" level, we're describing what cognitive process a learner needs to engage in to demonstrate that skill. This is a property of the *skill itself*, not of any particular learner's response. It tells the engine what to teach and how to calibrate lesson activities.

**SOLO evaluates the learner's response during assessment.** When the assessment agent asks a question and receives a response, it classifies the *structural quality* of that response using SOLO levels. This tells the engine how deeply the learner understands the skill, regardless of what Bloom's level the skill targets.

### The Matrix

The combination creates a two-dimensional assessment:

```
                    SOLO Level of Response
                    Pre  Uni  Multi  Rel  ExtAbs
Bloom's Level  ┌────────────────────────────────┐
of Skill       │                                │
               │  Remember    ·    ✓    ✓    ✓  │
               │  Understand  ·    ·    ✓    ✓  │
               │  Apply       ·    ·    ✓    ✓  │
               │  Analyze     ·    ·    ·    ✓    ✓
               │  Evaluate    ·    ·    ·    ✓    ✓
               │  Create      ·    ·    ·    ·    ✓
               └────────────────────────────────┘
               
               · = unexpected/insufficient
               ✓ = expected/appropriate
```

A "remember"-level skill should elicit at least a unistructural response (one correct relevant element). An "analyze"-level skill should elicit at least a relational response (integrated elements showing structural understanding). When there's a mismatch — say, a relational-level response to a remember-level question — that signals the learner may have deeper understanding than the question probed, triggering the assessment agent to test higher-level skills.

---

## Practical Implementation

### Changes to the Learner Profile

The learner profile currently stores:

```json
{
  "assessed_skills": [
    {
      "skill_id": "python-run-script",
      "confidence": 0.85,
      "method": "direct_assessment",
      "timestamp": "2026-02-12T14:30:00Z"
    }
  ]
}
```

With SOLO layered in, it becomes:

```json
{
  "assessed_skills": [
    {
      "skill_id": "python-run-script",
      "confidence": 0.85,
      "bloom_target": "application",
      "solo_demonstrated": "relational",
      "method": "direct_assessment",
      "timestamp": "2026-02-12T14:30:00Z",
      "evidence_summary": "Learner explained not just how to run a script but connected it to the execution environment and file system context"
    }
  ]
}
```

Two new fields:
- `bloom_target`: what Bloom's level the skill was designed to test (comes from the skill graph)
- `solo_demonstrated`: what SOLO level the learner's response actually exhibited (comes from the assessment agent's evaluation)

When `solo_demonstrated` exceeds what's expected for the `bloom_target`, the assessment agent has a signal to skip ahead. When it falls short, the agent knows to probe prerequisites.

### Changes to the Assessment Agent

The assessment agent's system prompt and the `assess-skills` SKILL.md need to include SOLO evaluation criteria. Here's how the agent should reason about each response:

**Step 1: Ask the question** (calibrated to the skill's Bloom's level)

**Step 2: Evaluate the response's SOLO level**

The agent looks for structural markers:

- **Prestructural**: Response is irrelevant, confused, or tautological. The learner may restate the question, provide unrelated information, or demonstrate a fundamental misunderstanding.
  - *Example*: Q: "How would you handle missing values in a pandas DataFrame?" A: "I would use Python to do data analysis."

- **Unistructural**: Response addresses one relevant aspect correctly but narrowly.
  - *Example*: Q: "How would you handle missing values in a pandas DataFrame?" A: "You can use dropna() to remove them."

- **Multistructural**: Response addresses multiple relevant aspects but treats them as a list without integration.
  - *Example*: Q: "How would you handle missing values in a pandas DataFrame?" A: "You can use dropna() to remove rows, fillna() to replace them with a value, or interpolate() to estimate them."

- **Relational**: Response integrates aspects into a coherent framework, showing how elements relate to each other and to the broader context.
  - *Example*: Q: "How would you handle missing values in a pandas DataFrame?" A: "It depends on why the data is missing and what you're trying to do. If the missing data is random and you have enough rows, dropna() is fine. If the missing values are meaningful — like survey non-responses — you might want to flag them separately. For time series data, interpolation makes more sense than filling with a mean because it preserves temporal patterns."

- **Extended Abstract**: Response generalizes beyond the specific context, showing transfer to novel situations or principled reasoning.
  - *Example*: Q: "How would you handle missing values in a pandas DataFrame?" A: "The handling strategy should be driven by your analysis goals and the data-generating process. Missing data mechanisms — whether MCAR, MAR, or MNAR — determine which approaches are statistically valid. In production pipelines, you'd also want to track missingness rates as a data quality signal, not just patch them silently."

**Step 3: Record both the Bloom's target and the SOLO observed level**

**Step 4: Use the gap (or match) to decide what to assess next**

- SOLO matches or exceeds expectation → confidence is high, infer prerequisites, move to adjacent skills
- SOLO falls below expectation → probe prerequisites, the learner may have gaps in the dependency chain
- SOLO significantly exceeds expectation → the learner may be more advanced than the skill graph suggests, test higher-level skills to find their actual frontier

### Changes to the Skill Graph

Skills already have a `bloom_level` field. We add SOLO expectations:

```json
{
  "id": "pandas-handle-missing-data",
  "label": "Can handle missing values in a pandas DataFrame",
  "bloom_level": "application",
  "solo_minimum": "multistructural",
  "solo_proficient": "relational",
  "dependencies": ["pandas-read-data", "pandas-basic-operations"]
}
```

- `solo_minimum`: The minimum SOLO level that counts as "passing" for this skill. For an application-level skill, we'd expect at least multistructural (can name multiple approaches).
- `solo_proficient`: The SOLO level that indicates solid understanding. For an application-level skill, relational (can connect approaches to contexts) signals proficiency.

This gives the assessment agent clear criteria: below `solo_minimum` means the skill isn't met; between `solo_minimum` and `solo_proficient` means partial understanding; at or above `solo_proficient` means solid.

---

## Changes to the Lesson Composition

SOLO levels in the learner profiles give the lesson agent richer information for composing activities:

**For learners at unistructural/multistructural levels**: Design activities that require connecting ideas. Pair these learners with relational-level peers. Use scaffolded exercises that explicitly ask "how does X relate to Y?"

**For learners at relational level**: Design activities that push toward transfer and generalization. Ask "when would you NOT use this approach?" or "how would this apply in a different domain?"

**For mixed groups**: The SOLO distribution tells the lesson agent where the group's understanding is structurally thin. If most learners are multistructural on a key skill — they know the parts but not the connections — the lesson should emphasize integration activities rather than introducing more parts.

---

## What This Looks Like in Practice

### Scenario: Assessing a Tuesday Cohort on Data Cleaning

The assessment agent works through the cohort. For the skill "handle missing data in pandas" (Bloom's: application), it asks each learner how they'd approach missing values in a dataset.

**Learner A** responds with a list of three pandas functions. The agent classifies this as **multistructural** — multiple relevant elements, no integration. Meets `solo_minimum` (multistructural), doesn't reach `solo_proficient` (relational). Confidence: 0.6. The agent records this and moves on — no need to test prerequisites since the minimum is met, but the learner isn't proficient.

**Learner B** responds by connecting the choice of method to the type of missing data and the analysis goal. The agent classifies this as **relational**. Meets `solo_proficient`. Confidence: 0.9. The agent infers prerequisites with high confidence and skips ahead to test more advanced skills.

**Learner C** responds with something irrelevant about installing pandas. The agent classifies this as **prestructural**. Below `solo_minimum`. Confidence: 0.1. The agent traverses *down* the dependency chain — tests "basic pandas operations" and "reading data into pandas" to find where understanding actually begins.

When the lesson agent composes the session plan, it sees:
- Learner A: multistructural on data cleaning (knows the tools, hasn't integrated when to use which)
- Learner B: relational on data cleaning (solid, ready for advanced topics)
- Learner C: prestructural on data cleaning (needs prerequisite work)

The lesson plan can now include a differentiated activity: Learner B works on a messy real-world dataset independently. Learners A and C are paired — A has the vocabulary that C needs, and the act of explaining *why* to choose one approach over another will push A from multistructural toward relational. The lesson agent notes in the stage direction: "By minute 20, check that the A-C pair has moved past listing functions to discussing trade-offs."

---

## Summary of Changes

| Component | Current (Bloom's only) | With SOLO Layered In |
|-----------|----------------------|---------------------|
| Skill definition | `bloom_level` field | Add `solo_minimum` and `solo_proficient` |
| Learner profile | `confidence` per skill | Add `solo_demonstrated` and `evidence_summary` |
| Assessment agent | Classifies by Bloom's level | Also classifies response structure by SOLO |
| Assessment strategy | "Can they do X?" (binary + Bloom's depth) | "How is their understanding of X structured?" (SOLO quality) |
| Lesson composition | Calibrate to Bloom's level | Also calibrate activities to SOLO distribution |
| Pairing recommendations | Based on skill gaps | Also based on SOLO level complementarity |
| Dependency inference | "Passed = infer prerequisites" | "SOLO level determines inference confidence" |

The beauty of this layering is that it's additive, not replacement. Bloom's continues to do what it does well — define what kind of thinking a skill requires. SOLO adds what Bloom's can't do well — evaluate the quality of a learner's actual response based on observable structural characteristics. Together, they give the engine a two-dimensional view of every learner's understanding.

---

*Design document. For integration into technical-engine-spec.md and the assess-skills SKILL.md.*
