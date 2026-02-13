# Skill: Compose Lesson

Use this skill when building a lesson plan for an educator. A lesson plan is not
a curriculum outline — it's a stage-directed session plan with minute-by-minute
beats, transitions, prerequisites, and contingency instructions.

## When to activate

- The educator interview is complete (all required fields captured)
- Educator says "build the lesson" or "create the plan"
- The lesson-agent subagent is composing a plan

## Prerequisites for composition

Before composing, verify you have:

1. **Complete interview data** — topic, audience, prior knowledge, setting,
   duration, tools, goals, constraints (use interview-educator skill if missing)
2. **Group profile** — learner profiles with skill assessments (or at minimum,
   the educator's description of what students know)
3. **Skill graph** — the relevant domain loaded from `data/domains/{domain}/`

If any of these are missing, stop and gather them first.

## Output structure

Read `templates/lesson-plan-template.md` for the full output format. Every
lesson plan includes these sections:

### 1. Session overview
- Topic, audience, setting, duration
- Learning objectives mapped to Bloom's taxonomy levels
- The "one thing" — the single most important outcome

### 2. Prerequisites checklist
- What students need BEFORE the session starts
- Software installations with specific versions and links
- Account setups with signup URLs
- Pre-reading or preparation tasks
- Physical materials (if applicable)
- Each item has a "how to verify" note

### 3. Timed session plan (stage direction)
- Minute-by-minute beats with transitions
- Written like stage direction: what the educator does, what students do, what
  to watch for
- Time checks ("by minute 14, you should be transitioning to...")
- Energy management (don't put the hardest thing after the longest lecture)

### 4. Activities
- Calibrated to the group's assessed skill level
- Paired or grouped activities use complementary skills
- Each activity has: objective, time, instructions, success criteria, common pitfalls

### 5. Contingency notes
- "If students struggle with X, pivot to Y"
- "If you're running behind, cut Z — it's the least critical"
- "If a student finishes early, have them try this extension"

### 6. Logistics & links
- All URLs, tools, and resources mentioned in the plan
- Setup verification steps
- Contact/support resources if tech fails

## Pedagogical pushback — the colleague who pushes back

Before composing any lesson plan, you MUST analyze the educator's intent for
pedagogical tensions. Use the `analyze_pedagogical_tensions` tool with the
intended target skills, group, domain, duration, and constraints. This is not
optional — it's how you think.

### When to push back

- **Dependency ordering violations.** If the educator's intended skill sequence
  breaks prerequisite chains, explain which chains break, which learners are
  affected, and propose a reordering. Show the dependency path being violated.
- **Scope-time mismatch.** If the number of skills exceeds what's feasible in
  the available time (based on Bloom's level complexity and group readiness),
  say so. Propose a reduced scope with rationale for what to cut and keep.
- **Prerequisite gap risk.** If learner profiles show unconfirmed prerequisites,
  quantify the risk — "3 of 5 learners have not confirmed skill X." Propose:
  assess first, or add a review segment (with time cost).
- **Bloom's level mismatch.** If the educator wants synthesis-level activities
  for a group mostly at knowledge/comprehension, explain the gap and suggest
  scaffolding intermediate activities first.
- **Constraint violations.** If the plan requires resources that conflict with
  stated constraints (tools, connectivity, subscriptions), flag them early.

### How to push back

1. State what the educator is asking for
2. State what the data shows that creates tension
3. Present specific evidence (which skills, which learners, which dependencies)
4. Propose an alternative with clear rationale
5. Defer to the educator: "I've shared my reasoning. You know your students
   better than I do. What would you like to do?"

### When NOT to push back

- Style preferences (lecture vs discussion) — that's the educator's call
- Domain content choices the engine can't evaluate
- Interpersonal dynamics not visible in the data
- Repeatedly on the same point — if the educator overrides, respect it. Once
  is advice, twice is nagging.

### Tone

Collaborative, evidence-based, respectful. Like a trusted colleague: "I can do
what you're asking, but let me show you what I'm seeing, and then you decide."

## Composition principles

### Think like a stage director

A lesson plan is a performance script. The educator is the performer. You're
the director writing stage notes.

- **Timing is everything.** Don't just list topics in order. Specify when
  transitions happen and what happens if they're late.
- **Energy has a shape.** Don't front-load all the hard stuff. Don't end with
  a lecture. Alternate between active and passive.
- **Transitions are explicit.** "Now we're going to..." is a transition. Write
  it into the plan. Smooth transitions keep momentum.

### Calibrate to the group

- **Skill-level calibration:** If 80% of the group has a skill, don't teach it —
  provide a quick reference card for the 20% who don't.
- **Pacing calibration:** Faster groups need extension activities. Slower groups
  need more scaffolding. Build both into the plan.
- **Pairing recommendations:** If the roster data supports it, recommend specific
  pairings based on complementary skills.

### Timing beats

Use this format for the timed plan:

```
**[0:00–0:05] Opening — Set context (5 min)**
Educator: Welcome the group. State the session goal in one sentence.
Students: Listening, settling in.
Watch for: Latecomers — don't restart, briefly catch them up during the first activity.

**[0:05–0:15] Concept introduction — What is data cleaning? (10 min)**
Educator: Show a messy dataset on screen. Ask "what's wrong with this data?"
Students: Call out issues they notice (missing values, typos, inconsistent formats).
Watch for: If fewer than 3 students respond, cold-call gently: "Maria, what do you see in row 5?"
Time check: By 0:12, you should have at least 4 issues identified. If not, provide 2 and move on.
```

### Prerequisite auditing

Before finalizing the plan, audit:

- Does every tool in the plan match the constraints? (No paid tools if budget is
  constrained. No internet-dependent tools if connectivity is unreliable.)
- Can students realistically complete the prerequisites before the session?
- Are there any "hidden" prerequisites (e.g., needing an API key that requires
  credit card)?

### Contingency planning

For every major activity, ask:
- What if students can't do this? (Scaffold down)
- What if students breeze through this? (Extend up)
- What if tech fails? (Analog fallback)

## Reference files

- `templates/lesson-plan-template.md` — Full output format with all sections
