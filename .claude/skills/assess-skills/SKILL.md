# Skill: Assess Skills

Use this skill when evaluating what a learner or group knows. The assessment
engine uses Bloom's taxonomy to gauge depth of knowledge and dependency inference
to minimize redundant testing.

## When to activate

- A new learner needs to be assessed
- An educator asks "what do my students know?"
- Before lesson composition, to identify skill gaps
- When a learner is completing a self-assessment via the assessment link

## Assessment strategy

### Core principle: Test high, infer low

Do NOT test every skill individually. Start with higher-level skills and use the
dependency graph to infer prerequisites. If a learner can "run a pandas groupby,"
you can infer with high confidence that they can import pandas, select columns,
filter rows, write basic Python, and run a script.

### Process

1. **Load the skill graph** — Read `data/domains/{domain}/skills.json` and
   `data/domains/{domain}/dependencies.json`
2. **Load the learner profile** — Read `data/learners/{id}.md` (if exists)
3. **Identify target skills** — What does the educator want assessed? If no
   specific target, assess the full domain.
4. **Find efficient entry points** — Use the reason-dependencies skill to find
   the highest-level skills that, if demonstrated, would infer the most downstream
   skills. Start there.
5. **Ask adaptive questions** — Calibrate to Bloom's taxonomy level:
   - If they pass a high-level question, infer prerequisites and move to the
     next branch
   - If they struggle, drop down the dependency chain to find where their
     knowledge stops
6. **Record results** — Update the learner profile with assessed and inferred skills

### Bloom's taxonomy calibration

Read `references/blooms-taxonomy.md` for detailed question patterns per level.
Match your questions to the Bloom's level of the skill being assessed:

| Level | What you're testing | Question style |
|---|---|---|
| **Knowledge** | Can they recall it? | "What is...?" / "Name the..." |
| **Comprehension** | Can they explain it? | "Explain in your own words..." / "What happens when...?" |
| **Application** | Can they use it? | "Show me how you would..." / "Write code that..." |
| **Analysis** | Can they break it apart? | "Why does this happen?" / "What's different between...?" |
| **Synthesis** | Can they compose something new? | "Design a..." / "How would you build...?" |
| **Evaluation** | Can they judge and critique? | "Which approach is better and why?" / "What's wrong with...?" |

### Adaptive branching

```
Start at a mid-to-high skill in the target domain
  │
  ├─ Learner demonstrates competence
  │   ├─ Infer all prerequisite skills (via dependency graph)
  │   ├─ Mark inferred skills with confidence decay (see reason-dependencies)
  │   └─ Move to the NEXT branch (peer skill or higher skill)
  │
  └─ Learner struggles or fails
      ├─ Do NOT infer prerequisites (they might have gaps below too)
      ├─ Drop DOWN the dependency chain
      ├─ Test the immediate prerequisites of the failed skill
      └─ Continue until you find the boundary of their knowledge
```

### Dependency inference rules

When a learner demonstrates a skill, infer prerequisites using the dependency graph:

- **Direct prerequisites (1 hop):** Infer at the edge's confidence value
- **Transitive prerequisites (2+ hops):** Apply confidence decay
  (see reason-dependencies skill for decay rules)
- **Corequisites:** Infer at 0.5x the confidence (weaker relationship)
- **Recommended (not required):** Do NOT infer — these need direct assessment

### What constitutes "demonstrating" a skill

- **Knowledge/Comprehension:** Correct verbal or written explanation
- **Application:** Successfully performs the task (writes working code, executes correctly)
- **Analysis:** Correctly identifies components, relationships, or causes
- **Synthesis:** Produces a novel, working solution that combines multiple skills
- **Evaluation:** Provides reasoned judgment with supporting evidence

A partial demonstration does NOT count. If the learner gets partway but needs help,
mark the skill as `confidence: 0.4-0.6` (partial) and note what they could/couldn't do.

### Stopping conditions

Stop assessment when:

1. All target skills have been assessed or inferred
2. The learner's skill boundary has been mapped (you know where they are strong
   and where they stop)
3. The educator has enough information to proceed
4. Time constraints require stopping (if applicable)

### Output format

Update the learner profile at `data/learners/{id}.md` with:

```markdown
## Assessed Skills
- {skill-id}: {confidence} — {method: "direct"} — {timestamp}
  - Notes: {what they demonstrated}

## Inferred Skills
- {skill-id}: {confidence} — {inference_chain: ["source-skill", "..."]}

## Skill Gaps
- {skill-id}: Not demonstrated — {notes on what was attempted}

## Recommended Next Steps
- {actionable recommendations for the educator}
```

## Assessment integrity methodology

In 2026, every student has ChatGPT in another tab. The engine designs assessments
that are inherently resistant to gaming — not through proctoring or surveillance,
but through the *nature of the questions themselves.*

The goal is never to catch cheaters. It is to design assessments where the honest
path is easier than the dishonest path, and where even a student who tries to game
the system reveals useful information about what they actually know.

Read `references/integrity-strategies.md` for full strategy details.

### Question design strategies

Every question should require synthesis, context, or chained reasoning. If a question
can be answered with a simple Google search and doesn't chain on previous context,
that's a design failure.

1. **Contextual synthesis** — Ask the student to apply the skill to their own
   situation or context. "You mentioned you're analyzing [thing they said earlier].
   How would you approach [skill] in that context?" You can't Google your own situation.

2. **Chained reasoning** — Design question sequences where each answer depends on
   the previous. "You said you'd use a left join. What happens to the rows that
   don't match? How would that affect your analysis?" Looking up answers
   independently produces inconsistencies the engine can detect.

3. **Explain-to-teach** — "How would you explain this to someone who doesn't know
   anything about it?" Tests comprehension depth beyond recall. Requires the student
   to model another person's understanding.

4. **Error diagnosis** — Present flawed reasoning or code with a subtle error.
   "What's wrong with this approach?" Tests application-level understanding — the
   student needs to actually understand the concept to spot the issue.

5. **Transfer probes** — Ask the student to apply a concept in a different context
   than the one they learned it in. "You know how to filter data in Python. If you
   had to do the same thing in a spreadsheet with no code, how would you approach it?"

### Response pattern awareness

Track these patterns (without revealing to the student) to calibrate confidence:

- **Response depth** — Is the student elaborating or giving minimal answers?
  "Yes, I'd use a left join" vs. "I'd use a left join because I want to keep all
  customers even if they haven't made a purchase, then check for nulls" — both
  correct, but different depth.

- **Consistency** — Do answers across the conversation tell a coherent story about
  the student's understanding? If they demonstrate synthesis-level understanding on
  one question but struggle with a prerequisite on the next, that's a signal.

- **Engagement patterns** — Does the student's comfort level match what you'd expect
  at their demonstrated level? Deep fluency produces confident, quick answers on
  basics and thoughtful pauses on complex topics.

### Confidence calibration from integrity signals

These patterns influence the confidence values assigned to assessed skills:

| Pattern | Confidence effect |
|---|---|
| High depth + high consistency | Full confidence (1.0x) |
| High depth + inconsistency | Reduce confidence (0.7x) — flag for educator |
| Minimal answers + consistency | Moderate confidence (0.8x) — may know more than shown |
| Minimal answers + inconsistency | Low confidence (0.5x) — flag for educator |

### When confidence is low

Never flag the student. Instead, note in the learner profile that assessment
confidence is below threshold, with a recommendation for the educator:

> "James's assessment showed some inconsistencies in the data manipulation section.
> Consider a brief in-person check before building activities on those skills."

### The assessment must still feel warm and conversational

The integrity layer shapes *what questions are asked*, not *how they're asked*.
The student should feel like they're having a helpful conversation, not being
interrogated. Use the same warm, encouraging tone from the main assessment rules.

## Reference files

- `references/blooms-taxonomy.md` — Bloom's levels with example questions per level
- `references/integrity-strategies.md` — Assessment integrity question design and response analysis
