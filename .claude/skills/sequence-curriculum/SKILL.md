# Skill: Sequence Curriculum

Use this skill when building a multi-session curriculum for an educator. A curriculum
is not a list of topics — it's a dependency-aware learning journey that distributes
skills across sessions, manages pacing, and adapts based on learner progress.

## When to activate

- Educator wants to plan multiple sessions: "I have 6 sessions over 3 weeks"
- Educator asks for a curriculum, course plan, or session sequence
- The curriculum-agent subagent is composing a multi-session plan

## Prerequisites for curriculum design

Before sequencing, verify you have:

1. **Complete group profile** — group file with interview context, constraints, and
   member list with skill assessments
2. **Skill graph** — the relevant domain loaded from `data/domains/{domain}/`
3. **Session parameters** — number of sessions, duration per session, frequency
4. **Learning objectives** — target skills or Bloom's level the educator wants to reach

If any of these are missing, stop and gather them first.

## Curriculum design methodology

### 1. Critical path analysis

Map target skills onto the dependency graph. The critical path is the longest
chain of prerequisites from the group's current level to the target skills.

- Identify which skills the group already has (assessed or inferred above 0.6)
- Identify which skills are missing — these form the teaching frontier
- Trace dependency chains from missing skills back to the group's current level
- The longest chain determines the minimum number of sessions needed

### 2. Skill clustering

Group skills into teachable clusters — skills that share prerequisites and
Bloom's level, and can be taught in the same session.

**Clustering rules:**
- Skills in the same cluster should share at least one prerequisite
- A cluster should span at most two adjacent Bloom's levels
- A single session should cover 2–4 new skills (depending on duration and level)
- Skills that are each other's prerequisites cannot be in the same cluster

### 3. Session distribution

Distribute skill clusters across sessions respecting:

**Hard constraints:**
- Prerequisites must be taught before dependents (never teach B before A if A -> B)
- Session duration limits (account for opening, closing, transitions — only 60–70%
  of session time is actual instruction)

**Soft constraints:**
- Lower Bloom's levels first, higher later (knowledge -> comprehension -> application -> analysis -> synthesis -> evaluation)
- Balance difficulty across sessions — don't front-load all the hard material
- Leave room for review and practice, not just new content

### 4. Spiral curriculum approach

Don't teach a skill once and move on. Revisit skills at increasing depth:

- **Session N:** Introduce skill at knowledge/comprehension level
- **Session N+1:** Apply skill in a guided exercise (application level)
- **Session N+2:** Integrate skill with others in a complex task (analysis/synthesis)

This means a skill may appear in multiple sessions at different Bloom's levels.
Track which level was targeted in each session.

### 5. Spaced repetition

Space the revisits:

- If a session introduces Skill A, the next session should open with a 5-minute
  review of Skill A before moving to new material
- If the gap between sessions is more than 3 days, add a longer review segment
- Critical prerequisites should be reviewed in at least 2 subsequent sessions

### 6. Interleaving

Don't teach all related skills back-to-back. Interleave different skill types
within a session to improve retention:

- Alternate between conceptual skills and practical skills
- Alternate between individual work and group work
- After a difficult new concept, follow with practice on a recently learned skill

### 7. Pace estimation

Estimate time per skill based on group level:

| Group skill level | Time per new skill (60-min session) | Time per new skill (90-min session) |
|---|---|---|
| Most of group has prerequisites | 12–15 min | 15–20 min |
| Mixed — some have prerequisites, some don't | 18–22 min | 22–28 min |
| Most of group lacks prerequisites | 25–30 min | 30–40 min |

**Adjustments:**
- Hands-on/applied skills take 1.5x longer than conceptual skills
- If accessibility accommodations are needed, add 10–15% buffer
- First session of a sequence needs extra time for orientation (5–10 min)

### 8. Cross-session connectors

Every session except the first should open with a connector to the previous session:

```
**[0:00–0:05] Opening — Connect to last session (5 min)**
Educator: "Last time, we learned [X]. Quick check: can someone tell me [review question]?"
Students: Brief recall exercise (cold call 2–3 students).
Watch for: If most students can't recall, extend this to 8 min with a quick pair-share.
```

Every session except the last should close with a preview:

```
**[closing] Preview — What's next (2 min)**
Educator: "Next time, we'll build on [today's skill] to learn [next skill].
Between now and then, try [optional low-stakes practice suggestion]."
```

## Output structure

A curriculum document includes:

### 1. Curriculum overview
- Title, group, domain, total sessions, total duration
- Overall learning objectives mapped to target skills and Bloom's levels
- Progression summary: "From [current level] to [target level] in [N] sessions"

### 2. Progression map
- Visual or tabular representation of skills mapped across sessions
- Dependency arrows showing why skills are ordered as they are
- Bloom's level progression across the sequence

### 3. Session-by-session plans
For each session:
- Session number, title, date (if known)
- Target skills for this session
- Bloom's level focus
- Prerequisites (should be satisfied by prior sessions)
- Cross-session connector (review of prior session)
- Brief session outline (detailed lesson plans are composed separately)
- Milestone checkpoint: "By the end of this session, students should be able to..."
- Status: planned / in-progress / completed / needs-remediation

### 4. Milestone checkpoints
- After each session, define what the group should be able to do
- These form the assessment criteria for advance_curriculum

### 5. Adaptation notes
- What to do if the group is ahead of schedule
- What to do if the group falls behind
- Which sessions can be compressed vs which are critical
- Which skills are "nice to have" vs "must have"

## Curriculum storage

Write curriculum documents to `data/curricula/{slug}.md` where slug is derived
from the group name and domain.

## Rules

- Always read the skill graph before designing a curriculum
- Always read all learner profiles to understand the group's starting point
- Never design a curriculum that violates dependency ordering
- Every session must have at least one clear milestone checkpoint
- Include "what to cut" notes for every session — educators always run short on time
- If the number of sessions is insufficient for the target skills, say so explicitly
  and recommend either reducing scope or adding sessions
