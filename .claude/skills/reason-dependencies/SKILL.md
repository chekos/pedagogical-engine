# Skill: Reason About Dependencies

Use this skill when traversing the skill dependency graph to infer what a learner
knows, find efficient assessment paths, or identify prerequisite gaps.

## When to activate

- During assessment: to infer skills from demonstrated ability
- During lesson planning: to identify prerequisite gaps
- When an educator asks "what does my student need to know before X?"
- When optimizing assessment order to minimize questions

## Graph structure

Skills and dependencies are stored in `data/domains/{domain}/`:
- `skills.json` — skill definitions with Bloom's levels
- `dependencies.json` — directed edges with confidence and type

An edge `{source: A, target: B}` means "A is a prerequisite for B" — knowing B
implies knowing A (with some confidence).

## Inference rules

### Forward inference (what does knowing X imply?)

If a learner **demonstrates** skill B, and A → B is a prerequisite edge with
confidence C, then infer the learner knows A with confidence C.

```
Demonstrated: "pandas-groupby"
Edge: "select-filter-data" → "pandas-groupby" (confidence: 0.90)
Inference: learner knows "select-filter-data" with confidence 0.90
```

### Multi-hop inference (transitive)

If A → B (confidence C1) and B → C (confidence C2), and the learner demonstrates
C, then:
- Infer B with confidence C2
- Infer A with confidence C1 × C2 (multiplicative decay)

```
Demonstrated: "pandas-groupby" (confidence 1.0)
Edge chain: "open-terminal" (0.95) → "navigate-directories" (0.95) →
            "run-python-script" (0.95) → "python-variables-types" (0.90) →
            "python-control-flow" (0.90) → "python-functions" (0.85) →
            ... → "pandas-groupby"

Inferred confidences (multiplicative):
- python-functions: 0.70 (from pandas-groupby edge)
- python-control-flow: 0.85 × 0.70 = 0.60
- python-variables-types: 0.90 × 0.60 = 0.54
- run-python-script: 0.95 × 0.54 = 0.51
- navigate-directories: 0.95 × 0.51 = 0.49
- open-terminal: 0.95 × 0.49 = 0.46
```

### Confidence floor

Stop inferring when confidence drops below **0.3**. Below this threshold, the
inference is too uncertain to be useful — the skill should be directly assessed.

### Confidence from multiple paths

If a skill can be inferred through multiple paths, take the **maximum** confidence
across all paths. Multiple inference chains reinforce each other.

```
"inspect-dataframe" can be inferred from:
  Path 1: via "select-filter-data" → confidence 0.85
  Path 2: via "handle-missing-data" → confidence 0.80

Result: confidence = max(0.85, 0.80) = 0.85
```

### Edge types affect inference

| Edge type | Forward inference (B implies A) | Backward inference (A implies B) |
|---|---|---|
| **prerequisite** | Yes, at edge confidence | No — knowing A doesn't mean they know B |
| **corequisite** | Yes, at 0.5 × edge confidence | Yes, at 0.5 × edge confidence |
| **recommended** | No — not a strong enough relationship | No |

## Finding efficient assessment paths

### The goal

Minimize the number of questions while maximizing the skills assessed (directly
or inferred). This is the "test high, infer low" strategy.

### Algorithm

1. **Compute inference reach:** For each skill, calculate how many downstream
   skills would be inferred if the learner demonstrates it. Weight by the
   confidence of each inference.

2. **Rank by reach:** Skills with the highest inference reach are the best
   starting points for assessment.

3. **Start with the highest-reach skill** the learner might plausibly know
   (don't ask about "design a data pipeline" if they're a beginner).

4. **Branch on result:**
   - **Pass:** Infer all prerequisites. Move to the next unassessed branch.
   - **Fail:** Drop down to the immediate prerequisites and test those.

5. **Repeat** until all target skills are assessed or inferred.

### Example: Efficient path through python-data-analysis

Instead of testing all 25 skills:

```
Start: "pandas-groupby" (Application level, 6+ inferred skills)
  ├─ Pass → Infer: select-filter-data, inspect-dataframe, import-pandas,
  │         install-packages, python-variables-types, python-control-flow,
  │         python-functions, run-python-script, navigate-directories,
  │         install-python, open-terminal
  │    Next: Test "exploratory-data-analysis" (Analysis level, different branch)
  │    Next: Test "design-data-pipeline" (Synthesis level, highest)
  │
  └─ Fail → Drop to: "select-filter-data"
       ├─ Pass → Infer: inspect-dataframe and below
       │    Note: They can filter but not groupby. Test "handle-missing-data"
       └─ Fail → Drop to: "inspect-dataframe"
            └─ Continue drilling down...
```

This can assess the full domain in 4–6 questions instead of 25.

## Prerequisite gap analysis

### For lesson planning

Given a target skill the educator wants to teach, walk the dependency graph
backward to find all prerequisites. Compare against the group's learner profiles.
Report:

- **Satisfied prerequisites:** Skills the group already has (high confidence)
- **Partial prerequisites:** Skills some students have but others don't
- **Missing prerequisites:** Skills nobody in the group has demonstrated
- **Recommended order:** Teach missing prerequisites in dependency order (leaves first)

## Reference files

- `references/inference-patterns.md` — Worked examples of inference chains
